
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, Sparkles, Loader2, CheckSquare, Square, 
  Microscope, Info, Check, Zap, AlertCircle, Volume2,
  ShieldCheck, Plus, Mic, Edit3, ClipboardList, Activity, 
  Brain, Bot, X, FileSearch, RefreshCw, List, AlertOctagon, 
  ChevronDown, Layers, Search, FlaskConical, Scan, Database
} from 'lucide-react';
import { Investigation, Patient } from '../../../types';
import { 
  sushrutInvestigationRecommendationStream, 
  speakText, 
} from '../../../geminiService';
import { approveClinicalContentGuarded, runAI } from '../../Shared/AppEventToast';
import AdvancedInvestigationIntelligence from './AdvancedInvestigationIntelligence';

interface InvestigationsTabProps {
  patient: Patient;
  onOrder: (id: string, tests: Investigation[]) => void;
  aiState: { status: string };
  onAnalyze: () => void;
  onUpdateInvestigation?: (patientId: string, invId: string, updates: Partial<Investigation>) => void;
  latestSynthesis?: string;
  clinicalAnalysisResult?: {
    summary?: string;
    differentials?: { name: string; probability: number }[];
    investigations?: any[];
  };
}

const InvestigationsTab: React.FC<InvestigationsTabProps> = ({ 
  patient, 
  onOrder, 
  aiState, 
  latestSynthesis,
  clinicalAnalysisResult
}) => {
  const [selectedInvs, setSelectedInvs] = useState<string[]>([]);
  const [activeReasoningId, setActiveReasoningId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');
  const [invAiResult, setInvAiResult] = useState({ text: '', status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (latestSynthesis && invAiResult.status === 'idle') {
      runInvestigationAi(selectedLevel);
    }
  }, [latestSynthesis, patient.id]);

  const runInvestigationAi = async (level: 'V1' | 'V2' | 'V3', append: boolean = false) => {
    setSelectedLevel(level);
    await runAI("susruta", async () => {
      if (!append) {
        setInvAiResult({ text: '', status: 'loading' });
        setIsApproved(false);
        setSelectedInvs([]);
        setActiveReasoningId(null);
      } else {
        setInvAiResult(prev => ({ ...prev, status: 'loading' }));
      }

      const stream = sushrutInvestigationRecommendationStream({ 
        patient, 
        level, 
        context: `${latestSynthesis} ${append ? 'CRITICAL REQUEST: Expand diagnostic net significantly. Include RARE clinical markers, specialized imaging, and differentials-specific forensic tests that might be missed.' : ''}` 
      });
      let fullText = append ? invAiResult.text : "";
      
      for await (const chunk of stream) {
        fullText += chunk;
        setInvAiResult(prev => ({ ...prev, text: fullText }));
      }
      setInvAiResult(prev => ({ ...prev, status: 'done' }));
    }, () => {
      setInvAiResult(prev => ({ ...prev, status: 'error' }));
    });
  };

  const { suggestedItems, possibleCauses } = useMemo(() => {
    const items: any[] = [];
    const causes: string[] = [];
    
    if (invAiResult.text) {
      // Extract possible causes
      const causeSection = invAiResult.text.split(/POSSIBLE CAUSES|DIFFERENTIALS|CULPRITS/i)[1]?.split(/ITEM|INVESTIGATION|INVESTIGATIONS/i)[0];
      if (causeSection) {
        const matches = causeSection.split(/\n|,/).map(s => s.replace(/^[*\-\d.\s]+/, '').trim()).filter(s => s.length > 3);
        causes.push(...matches.slice(0, 10)); // Capture up to 10 causes for visibility
      }

      const rawSections = invAiResult.text.split(/ITEM\s*:/i).filter(s => s.trim());
      rawSections.forEach((s, idx) => {
        const lines = s.split('\n').map(l => l.trim()).filter(l => l);
        const nameRaw = lines[0] || "Unknown Test";
        const name = nameRaw.replace(/^[*\-\s]+/, '').replace(/\*\*/g, '').trim();
        if (!name || name.length < 2) return;

        const findValue = (marker: string) => {
          const regex = new RegExp(`${marker}\\s*:\\s*([^]*?)(?=\\n\\w|$)`, 'i');
          const match = s.match(regex);
          return match ? match[1].replace(/\*\*/g, '').trim() : '';
        };

        const utility = parseInt(s.match(/Utility\s*%\s*:\s*(\d+)/i)?.[1] || '75');
        const priority = (s.match(/Priority\s*:\s*(\w+)/i)?.[1] || 'Routine') as any;
        
        const isRadiology = name.toLowerCase().includes('ct') || name.toLowerCase().includes('mri') || name.toLowerCase().includes('usg') || name.toLowerCase().includes('x-ray') || name.toLowerCase().includes('scan') || name.toLowerCase().includes('imaging');

        items.push({ 
          id: `AI-${name.replace(/\s+/g, '')}-${idx}`, 
          name: name.toUpperCase(), 
          utilityScore: utility, 
          priority, 
          type: isRadiology ? 'RADIOLOGY' : 'LAB',
          price: isRadiology ? 2500 : 500,
          reasoning: { 
            why: findValue("Rationale") || 'Indicated for diagnostic clarity per clinical synthesis.',
            ruleIn: findValue("Rule In").split(/,|\n/).map(x => x.trim()).filter(x => x && x.length > 2),
            ruleOut: findValue("Rule Out").split(/,|\n/).map(x => x.trim()).filter(x => x && x.length > 2),
            probabilityImpact: findValue("Clinical Probability Impact") || 'Significant reduction in diagnostic uncertainty.'
          } 
        });
      });
    }
    return { suggestedItems: items, possibleCauses: causes };
  }, [invAiResult.text]);

  const filteredItems = useMemo(() => {
    return suggestedItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.reasoning.why.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suggestedItems, searchTerm]);

  const toggleInvSelection = (id: string) => {
    setSelectedInvs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedInvs.length === suggestedItems.length) {
      setSelectedInvs([]);
    } else {
      setSelectedInvs(suggestedItems.map(i => i.id));
    }
  };

  const handleDispatch = (target: 'LAB' | 'RADIOLOGY' | 'WARD') => {
    const selectedObjects = suggestedItems.filter(i => selectedInvs.includes(i.id));
    if (selectedObjects.length === 0) return;

    if (!isApproved) {
      if (approveClinicalContentGuarded()) {
        setIsApproved(true);
      } else {
        return;
      }
    }

    const investigations: Investigation[] = selectedObjects.map(item => ({
      id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      test_id: item.id,
      name: item.name,
      type: item.type,
      priority: item.priority,
      price: item.price,
      payment_status: 'PENDING',
      result_status: 'LOCKED',
      expectedTurnaround: item.priority === 'Stat' ? '2h' : '6h',
      orderedBy: 'Dr. Murali'
    }));

    onOrder(patient.id, investigations);
    speakText(`Dispatched ${investigations.length} items to ${target.toLowerCase()} node. Ingress finalized.`, "Zephyr");
    setSelectedInvs([]);
    setIsApproved(false);
  };

  const allSelected = suggestedItems.length > 0 && selectedInvs.length === suggestedItems.length;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-40 font-['Inter']">
      
      {/* 🧬 HEADER HUD */}
      <div className="bg-[#111827] border border-indigo-500/20 rounded-[50px] p-10 shadow-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[5s]"><Microscope size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-xl">
                 <Activity size={32} />
              </div>
              <div>
                 <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Diagnostic Intelligence</h3>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2 italic">Institutional Ingress v6.5 • Exhaustive Mode</p>
              </div>
           </div>
           
           <div className="flex flex-wrap items-center gap-6">
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                 <input 
                    type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search test registry..." 
                    className="bg-black/40 border border-gray-800 rounded-2xl pl-10 pr-4 py-2.5 text-[10px] font-black text-white outline-none focus:border-indigo-500 w-48 shadow-inner"
                 />
              </div>
              <div className="flex items-center gap-3 bg-black/40 p-2 rounded-[25px] border border-white/5 shadow-2xl">
                {['V1', 'V2', 'V3'].map((lvl) => (
                  <button 
                    key={lvl} 
                    onClick={() => runInvestigationAi(lvl as any)}
                    className={`px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl && invAiResult.status !== 'idle' ? 'bg-indigo-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleSelectAll}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 italic ${allSelected ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-white/5 text-gray-500 border-white/10 hover:text-white'}`}
              >
                {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                {allSelected ? 'Unselect All' : 'Select All'}
              </button>
           </div>
        </div>
      </div>

      {/* 🧬 POSSIBLE CAUSES / DIFFERENTIALS GRID */}
      {possibleCauses.length > 0 && (
        <div className="bg-[#0a0f18] border border-amber-500/20 rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-left-4">
           <div className="flex items-center gap-4 mb-6 px-2">
              <AlertOctagon size={20} className="text-amber-500 animate-pulse" />
              <h4 className="text-[11px] font-black text-white uppercase italic tracking-widest">Potential Clinical Culprits Under Investigation</h4>
           </div>
           <div className="flex flex-wrap gap-3">
              {possibleCauses.map((cause, idx) => (
                <div key={idx} className="px-6 py-3 bg-amber-600/5 border border-amber-500/10 rounded-2xl flex items-center gap-3 group hover:border-amber-500/40 transition-all">
                   <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                   <span className="text-xs font-black text-amber-200 uppercase italic tracking-tight">{cause}</span>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 🧪 INVESTIGATION CARDS GRID - THE HERO LIST */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-4">
              <List size={20} className="text-indigo-500" />
              <h4 className="text-[11px] font-black text-white uppercase italic tracking-widest">Diagnostic Pathway Matrix</h4>
           </div>
        </div>

        {invAiResult.status === 'loading' && !invAiResult.text ? (
           <div className="py-32 flex flex-col items-center gap-8 opacity-40">
              <Loader2 size={64} className="animate-spin text-indigo-500" />
              <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse text-white">Synthesizing Diagnostic Net...</p>
           </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
               <div 
                 key={item.id} 
                 className={`group p-8 rounded-[45px] border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[480px] shadow-2xl ${selectedInvs.includes(item.id) ? 'bg-indigo-600/10 border-indigo-500/40 scale-[1.02]' : 'bg-[#0a0f18] border-gray-800 hover:border-indigo-500/20 shadow-inner'}`}
                 onClick={() => toggleInvSelection(item.id)}
               >
                  <div className="flex justify-between items-start relative z-10">
                     <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border transition-all ${item.type === 'RADIOLOGY' ? 'bg-blue-600/20 text-blue-400' : 'bg-pink-600/20 text-pink-400'} group-hover:scale-110 shadow-lg`}>
                        {item.type === 'RADIOLOGY' ? <Scan size={24}/> : <FlaskConical size={24}/>}
                     </div>
                     <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${item.priority === 'Stat' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}>{item.priority}</span>
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">₹{item.price}</span>
                     </div>
                  </div>

                  <div className="relative z-10 mt-6 flex-1 flex flex-col">
                     <h4 className="text-xl font-black text-white uppercase italic tracking-tight group-hover:text-indigo-400 transition-colors leading-none">{item.name}</h4>
                     
                     <div className="mt-6 space-y-4 flex-1">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Rationale</p>
                           <p className="text-[11px] text-slate-300 italic leading-relaxed line-clamp-3">"{item.reasoning.why}"</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
                              <p className="text-[8px] font-black text-emerald-500 uppercase mb-1 italic flex items-center gap-1"><Check size={10}/> Rule In</p>
                              <div className="flex flex-col gap-1">
                                 {item.reasoning.ruleIn.slice(0, 2).map((r: string, i: number) => <span key={i} className="text-[7px] font-bold text-emerald-400 uppercase truncate max-w-full">▪ {r}</span>)}
                              </div>
                           </div>
                           <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-2xl">
                              <p className="text-[8px] font-black text-red-500 uppercase mb-1 italic flex items-center gap-1"><X size={10}/> Rule Out</p>
                              <div className="flex flex-col gap-1">
                                 {item.reasoning.ruleOut.slice(0, 2).map((r: string, i: number) => <span key={i} className="text-[7px] font-bold text-red-400 uppercase truncate max-w-full">▪ {r}</span>)}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3 mt-6 px-2">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Utility</p>
                        <div className="flex-1 h-1 bg-gray-900 rounded-full overflow-hidden shadow-inner">
                           <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_8px_indigo]" style={{ width: `${item.utilityScore}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 italic">{item.utilityScore}%</span>
                     </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-white/5 relative z-10 flex items-center justify-between">
                     <button 
                       onClick={(e) => { e.stopPropagation(); setActiveReasoningId(item.id); }}
                       className="flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-300 transition-all italic group/btn"
                     >
                        <Brain size={14} className="group-hover/btn:scale-110 transition-transform" /> 
                        Logic Trace
                     </button>
                     <div className={`p-2 rounded-lg transition-all ${selectedInvs.includes(item.id) ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-gray-900 text-gray-700 border border-white/5'}`}>
                        {selectedInvs.includes(item.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                     </div>
                  </div>

                  {/* 🧠 LOGIC TRACE PANEL */}
                  {activeReasoningId === item.id && (
                    <div className="absolute inset-0 bg-[#0a0f18] z-30 p-8 flex flex-col animate-in slide-in-from-top-4 duration-500 overflow-y-auto custom-scrollbar">
                       <div className="flex justify-between items-center mb-8">
                          <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic flex items-center gap-3"><Brain size={16}/> Forensic Logic</h5>
                          <button onClick={(e) => { e.stopPropagation(); setActiveReasoningId(null); }} className="p-2 hover:bg-white/5 rounded-lg text-gray-600 hover:text-white transition-all"><X size={24}/></button>
                       </div>
                       <div className="space-y-8">
                          <div className="space-y-3">
                             <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic border-l-2 border-indigo-500 pl-3">Clinical Justification</p>
                             <p className="text-sm text-slate-300 italic font-medium leading-relaxed">"{item.reasoning.why}"</p>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="p-5 bg-emerald-950/20 border border-emerald-500/20 rounded-[30px] shadow-inner">
                                <p className="text-[8px] font-black text-emerald-500 uppercase mb-4 italic flex items-center gap-2"><Check size={12}/> Rule In Potential</p>
                                <div className="flex flex-col gap-2">
                                   {item.reasoning.ruleIn.map((r: string, i: number) => <span key={i} className="text-[10px] font-bold text-emerald-400/80 uppercase truncate">▪ {r}</span>)}
                                </div>
                             </div>
                             <div className="p-5 bg-red-950/20 border border-red-500/20 rounded-[30px] shadow-inner">
                                <p className="text-[8px] font-black text-red-500 uppercase mb-4 italic flex items-center gap-2"><X size={12}/> Rule Out Potential</p>
                                <div className="flex flex-col gap-2">
                                   {item.reasoning.ruleOut.map((r: string, i: number) => <span key={i} className="text-[10px] font-bold text-red-400/80 uppercase truncate">▪ {r}</span>)}
                                </div>
                             </div>
                          </div>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); setActiveReasoningId(null); }}
                         className="mt-auto w-full py-4 bg-white/5 border border-white/10 text-gray-500 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:text-white hover:bg-white/10 transition-all active:scale-95 italic"
                       >
                         [ Return to Matrix ]
                       </button>
                    </div>
                  )}
               </div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center opacity-10 flex flex-col items-center gap-8 border-4 border-dashed border-white/5 rounded-[60px]">
             <Microscope size={120} className="text-gray-700" />
             <p className="text-xl font-black uppercase tracking-widest italic">Awaiting Pathological Pulse</p>
             <button onClick={() => runInvestigationAi(selectedLevel)} className="mt-8 px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 shadow-xl transition-all italic">Run AI Engine</button>
          </div>
        )}
      </div>

      {/* 🚀 LOAD MORE / FORENSIC EXPAND BUTTON */}
      {suggestedItems.length > 0 && (
         <div className="py-20 flex justify-center animate-in slide-in-from-bottom-4">
            <button 
              onClick={() => runInvestigationAi(selectedLevel, true)}
              disabled={invAiResult.status === 'loading'}
              className="px-20 py-8 bg-[#0a0f18] border-2 border-indigo-500/30 hover:border-indigo-400 text-white rounded-[50px] font-black uppercase text-sm tracking-[0.4em] shadow-[0_20px_80px_rgba(79,70,229,0.2)] transition-all active:scale-95 italic flex items-center gap-8 group"
            >
               {invAiResult.status === 'loading' ? <Loader2 size={32} className="animate-spin text-indigo-500" /> : <Layers size={32} className="group-hover:scale-110 transition-transform" />}
               <span>[ REQUEST RARE & FORENSIC INVESTIGATIONS ]</span>
            </button>
         </div>
      )}

      {/* 🔬 ADVANCED INVESTIGATION INTELLIGENCE LAYER - ALWAYS LAST */}
      <div className="pt-20 border-t border-white/5">
         <AdvancedInvestigationIntelligence patient={patient} />
      </div>

      {/* 🏁 DISPATCH PANEL */}
      {selectedInvs.length > 0 && (
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-8">
            <div className="bg-[#111827]/95 backdrop-blur-3xl border-2 border-indigo-500/30 p-8 rounded-[60px] shadow-[0_50px_150px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center justify-between gap-10 ring-1 ring-white/10 animate-in slide-in-from-bottom-10 duration-700">
               <div className="flex items-center gap-8">
                  <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-3xl transition-all duration-700 ${isApproved ? 'bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-indigo-600 text-white animate-pulse'}`}>
                     {isApproved ? <ShieldCheck size={40} /> : <Zap size={40} />}
                  </div>
                  <div>
                     <p className={`text-[10px] font-black uppercase tracking-[0.6em] mb-2 ${isApproved ? 'text-emerald-500' : 'text-indigo-400'}`}>
                        {isApproved ? 'Institutional Authorization Secured' : 'Action Authorization Pending'}
                     </p>
                     <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedInvs.length} Items Selected</h4>
                  </div>
               </div>

               <div className="flex flex-wrap justify-center gap-4">
                  {!isApproved ? (
                     <button 
                        onClick={() => { if(approveClinicalContentGuarded()) setIsApproved(true); }}
                        className="px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 italic border border-white/10"
                     >
                        [ AUTHORIZE DISPATCH ]
                     </button>
                  ) : (
                    <div className="flex gap-4 animate-in zoom-in-95 duration-500">
                       <button 
                         onClick={() => handleDispatch('LAB')}
                         className="px-8 py-5 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95"
                       >
                          <FlaskConical size={18} /> Dispatch Lab
                       </button>
                       <button 
                         onClick={() => handleDispatch('RADIOLOGY')}
                         className="px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95"
                       >
                          <Scan size={18} /> Dispatch Radiology
                       </button>
                       <button onClick={() => { setSelectedInvs([]); setIsApproved(false); }} className="p-5 bg-white/5 hover:bg-red-600/20 text-gray-500 hover:text-red-500 rounded-2xl transition-all border border-white/5"><X size={20}/></button>
                    </div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* SAFETY FOOTER */}
      <div className="p-10 bg-[#0a0f18] border border-white/5 rounded-[60px] flex items-start gap-10 shadow-inner opacity-60">
          <div className="w-16 h-16 rounded-[24px] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shrink-0 shadow-3xl animate-pulse">
             <ShieldCheck size={36} />
          </div>
          <div className="space-y-3">
             <p className="text-base font-black text-white uppercase italic tracking-tight leading-relaxed text-left">
                GOVERNANCE NODE: THE DIAGNOSTIC PATHWAY MATRIX UTILIZES EXHAUSTIVE LOGIC TO ENSURE NO DIFFERENTIAL IS MISSED. RARE AND FORENSIC MARKERS ARE SUGGESTED BASED ON SYMPTOM LATENCY AND CLINICAL CONTEXT. FINAL AUTHORIZATION RESIDES WITH THE CONSULTANT NODE.
             </p>
          </div>
      </div>
    </div>
  );
};

export default InvestigationsTab;

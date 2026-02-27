
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Pill, Loader2, ShieldCheck, Info, Zap, X, CheckSquare, Square, 
  Stethoscope, Building, RefreshCw, Microscope, HeartPulse, 
  ZapOff, Sparkles, CheckCircle2, ChevronRight, Volume2, Plus, 
  TrendingUp, Activity, List, AlertOctagon, ArrowUpRight,
  Brain
} from 'lucide-react';
import { Patient, Medication } from '../../../types';
import { sushrutMedicationOptionsStream, speakText } from '../../../geminiService';
import { approveClinicalContentGuarded, runAI } from '../../Shared/AppEventToast';
import { protectionService } from '../../../utils/protectionLogic';

interface MedicationTabProps {
  patient: Patient;
  latestAnalysis?: string;
}

const MedicationTab: React.FC<MedicationTabProps> = ({ patient, latestAnalysis = "" }) => {
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [stopSignal, setStopSignal] = useState(false);
  const [optionsResult, setOptionsResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' });
  const [activeReasoningId, setActiveReasoningId] = useState<string | null>(null);

  const runOptionsScan = async (append: boolean = false) => {
    await runAI("susruta", async () => {
      if (!append) {
        setOptionsResult({ text: "", status: 'loading' });
        setSelectedMeds([]);
        setIsApproved(false);
      }
      setStopSignal(false);
      
      const stream = sushrutMedicationOptionsStream({ 
        patient, 
        diagnosis: latestAnalysis || patient.chiefComplaint,
        comorbidities: patient.healthSnapshot?.knownConditions || "None",
        requestMore: append
      });
      
      let fullText = append ? optionsResult.text : "";
      for await (const chunk of stream) {
        if (stopSignal) break;
        fullText += chunk;
        setOptionsResult(prev => ({ ...prev, text: fullText }));
      }
      setOptionsResult(prev => ({ ...prev, status: 'done' }));
    }, () => {
      setOptionsResult(prev => ({ ...prev, status: 'done' }));
    });
  };

  useEffect(() => {
    if (latestAnalysis && optionsResult.status === 'idle') runOptionsScan();
  }, [latestAnalysis, patient.id]);

  const suggestedMeds = useMemo(() => {
    const list: any[] = [];
    if (optionsResult.text) {
      const sections = optionsResult.text.split(/ITEM\s*:/i).filter(s => s.trim());
      sections.forEach((s, idx) => {
        const lines = s.split('\n').map(l => l.trim()).filter(l => l);
        const name = lines[0]?.replace(/^[*\-\s]+/, '').replace(/\*\*/g, '').trim();
        if (!name || name.length < 2) return;

        const findValue = (marker: string) => {
          const regex = new RegExp(`${marker}\\s*[:(]?.*?[:)]?\\s*:\\s*([^]*?)(?=\\n\\w|$)`, 'i');
          const match = s.match(regex);
          return match ? match[1].replace(/\*\*/g, '').trim() : '';
        };

        const isSymptomatic = s.toLowerCase().includes('symptomatic') || s.toLowerCase().includes('sympathetic');

        list.push({
          id: `MED-AI-${idx}`,
          name: name.toUpperCase(),
          category: isSymptomatic ? 'SYMPTOMATIC' : 'THERAPEUTIC',
          reason: findValue("REASON") || findValue("RATIONALE") || 'Indicated for clinical management.',
          solution: findValue("SOLUTION") || findValue("GOAL") || 'Stabilization of clinical markers.',
          dose: findValue("DOSE") || 'As per standard protocol.',
          isStat: name.toLowerCase().includes('injection') || name.toLowerCase().includes('iv') || s.toLowerCase().includes('urgent') || s.toLowerCase().includes('stat')
        });
      });
    }
    return list;
  }, [optionsResult.text]);

  const toggleMedSelection = (id: string) => {
    setSelectedMeds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDispatch = () => {
    const selectedObjects = suggestedMeds.filter(m => selectedMeds.includes(m.id));
    if (selectedObjects.length === 0) return;

    if (!isApproved) {
      if (approveClinicalContentGuarded()) {
        setIsApproved(true);
      } else {
        return;
      }
    }

    protectionService.createPharmacyOrder(
      patient.id,
      patient.name,
      selectedObjects.map(m => ({ name: m.name, dose: m.dose, qty: 1 })),
      "DOCTOR_NODE",
      selectedObjects.some(m => m.isStat) ? "STAT" : "ROUTINE"
    );

    speakText(`Therapeutic plan for ${patient.name} dispatched to pharmacy registry.`, "Zephyr");
    setSelectedMeds([]);
    setIsApproved(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-48 font-['Inter']">
      
      {/* 🧬 THERAPEUTIC REGISTRY HUD */}
      <div className="bg-[#111827] border border-indigo-500/20 rounded-[50px] p-10 shadow-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[5s]"><Pill size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10 border-b border-white/5 pb-8">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-xl">
                 <Pill size={32} />
              </div>
              <div>
                 <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Therapeutic Release</h3>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2 italic">Institutional Formulary v7.5 • Susruta Logic Active</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <button 
                onClick={() => runOptionsScan()}
                className="p-3 bg-white/5 hover:bg-indigo-600 rounded-xl transition-all border border-white/10 text-gray-500 hover:text-white"
              >
                <RefreshCw size={20} className={optionsResult.status === 'loading' ? 'animate-spin' : ''} />
              </button>
              <div className="px-6 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                 Target: {patient.chiefComplaint}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 relative z-10">
           <div className="space-y-2">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2 italic">Clinical Goal Synthesis</p>
              <div className="p-6 bg-black/40 rounded-[35px] border border-white/5 shadow-inner">
                 <p className="text-sm text-slate-300 italic leading-relaxed">
                    "Primary objective: Stabilization of clinical markers and symptom resolution for {patient.chiefComplaint}."
                 </p>
              </div>
           </div>
           <div className="flex items-center justify-center">
              <button 
                onClick={() => runOptionsScan(true)}
                className="flex items-center gap-3 text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-all italic border-b border-cyan-500/30 pb-1"
              >
                <Plus size={14}/> Request Deeper Therapeutic Search
              </button>
           </div>
        </div>
      </div>

      {/* 💊 MEDICATION CARDS GRID */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-2">
           <List size={20} className="text-indigo-500" />
           <h4 className="text-[11px] font-black text-white uppercase italic tracking-widest">Available Therapeutic Options</h4>
        </div>

        {optionsResult.status === 'loading' && !optionsResult.text ? (
           <div className="py-32 flex flex-col items-center gap-8 opacity-40">
              <Loader2 size={64} className="animate-spin text-indigo-500" />
              <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse text-white">Synthesizing Pharmacology Nodes...</p>
           </div>
        ) : suggestedMeds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedMeds.map(med => (
               <div 
                 key={med.id} 
                 className={`group p-8 rounded-[45px] border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[460px] shadow-2xl ${selectedMeds.includes(med.id) ? 'bg-indigo-600/10 border-indigo-500/40 scale-[1.02]' : 'bg-[#0a0f18] border-gray-800 hover:border-indigo-500/20 shadow-inner'}`}
                 onClick={() => toggleMedSelection(med.id)}
               >
                  <div className="flex justify-between items-start relative z-10">
                     <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border transition-all ${med.category === 'THERAPEUTIC' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-amber-600/20 text-amber-400'} group-hover:scale-110 shadow-lg`}>
                        <Pill size={24}/>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${med.isStat ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}>{med.isStat ? 'STAT' : 'ROUTINE'}</span>
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">{med.category}</span>
                     </div>
                  </div>

                  <div className="relative z-10 mt-6 flex-1 flex flex-col">
                     <h4 className="text-xl font-black text-white uppercase italic tracking-tight group-hover:text-indigo-400 transition-colors leading-none">{med.name}</h4>
                     
                     <div className="mt-6 space-y-6 flex-1">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic border-l-2 border-indigo-500 pl-3">Rationale (Molecular)</p>
                           <p className="text-[12px] text-slate-300 italic leading-relaxed line-clamp-3">"{med.reason}"</p>
                        </div>

                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic border-l-2 border-emerald-500 pl-3">Dose Guideline</p>
                           <p className="text-sm font-black text-emerald-400 italic">{med.dose}</p>
                        </div>
                     </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-white/5 relative z-10 flex items-center justify-between">
                     <button 
                       onClick={(e) => { e.stopPropagation(); setActiveReasoningId(med.id); }}
                       className="flex items-center gap-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-300 transition-all italic group/btn"
                     >
                        <Brain size={14} className="group-hover/btn:scale-110 transition-transform" /> 
                        Logic Trace
                     </button>
                     <div className={`p-2 rounded-lg transition-all ${selectedMeds.includes(med.id) ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-gray-900 text-gray-700 border border-white/5'}`}>
                        {selectedMeds.includes(med.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                     </div>
                  </div>

                  {/* 🧠 LOGIC TRACE PANEL */}
                  {activeReasoningId === med.id && (
                    <div className="absolute inset-0 bg-[#0a0f18] z-30 p-8 flex flex-col animate-in slide-in-from-top-4 duration-500 overflow-y-auto custom-scrollbar">
                       <div className="flex justify-between items-center mb-8">
                          <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic flex items-center gap-3"><Brain size={16}/> Therapeutic Logic</h5>
                          <button onClick={(e) => { e.stopPropagation(); setActiveReasoningId(null); }} className="p-2 hover:bg-white/5 rounded-lg text-gray-600 hover:text-white transition-all"><X size={24}/></button>
                       </div>
                       <div className="space-y-8">
                          <div className="space-y-3">
                             <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic border-l-2 border-indigo-500 pl-3">Mechanism of Action</p>
                             <p className="text-sm text-slate-300 italic font-medium leading-relaxed">"{med.reason}"</p>
                          </div>
                          <div className="space-y-3">
                             <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic border-l-2 border-emerald-500 pl-3">Clinical Goal</p>
                             <p className="text-sm text-emerald-100 italic font-medium leading-relaxed">"{med.solution}"</p>
                          </div>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); setActiveReasoningId(null); }}
                         className="mt-auto w-full py-4 bg-white/5 border border-white/10 text-gray-500 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:text-white hover:bg-white/10 transition-all active:scale-95 italic"
                       >
                         [ Back to Formulary ]
                       </button>
                    </div>
                  )}
               </div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center opacity-10 flex flex-col items-center gap-8 border-4 border-dashed border-white/5 rounded-[60px]">
             <Pill size={120} className="text-gray-700" />
             <p className="text-xl font-black uppercase tracking-widest italic">Awaiting Therapeutic Synthesis</p>
             <button onClick={() => runOptionsScan()} className="mt-8 px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 shadow-xl transition-all italic">Initiate Options Scan</button>
          </div>
        )}
      </div>

      {/* 🔬 ADVANCED INTELLIGENCE NODE - MOVED TO BOTTOM */}
      <div className="pt-20 border-t border-white/5 space-y-8">
         <div className="flex items-center gap-4 px-2">
            <Sparkles size={20} className="text-cyan-500" />
            <h4 className="text-[11px] font-black text-white uppercase italic tracking-widest">Advanced Pharmacology Intelligence (Raw Synthesis)</h4>
         </div>
         <div className="bg-[#0a0f18] border border-indigo-500/10 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.01] pointer-events-none rotate-12"><Activity size={400} /></div>
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
               <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${optionsResult.status === 'loading' ? 'bg-cyan-500 animate-ping' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] italic">Forensic Reasoning Node Active</span>
               </div>
               {optionsResult.status === 'loading' && (
                 <button onClick={() => setStopSignal(true)} className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 animate-pulse transition-all active:scale-95"><ZapOff size={14}/> HALT ENGINE</button>
               )}
            </div>
            <div className="text-lg text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering drop-shadow-md">
               {optionsResult.text || (optionsResult.status === 'loading' ? 'Synthesizing forensic therapeutic pathway...' : 'Initialize options scan to view detailed reasoning.')}
            </div>
         </div>
      </div>

      {/* 🏁 DISPATCH PANEL */}
      {selectedMeds.length > 0 && (
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
                     <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedMeds.length} Medications Selected</h4>
                  </div>
               </div>

               <div className="flex gap-4">
                  {!isApproved ? (
                     <button 
                        onClick={() => { if(approveClinicalContentGuarded()) setIsApproved(true); }}
                        className="px-14 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 italic border border-white/10"
                     >
                        [ AUTHORIZE THERAPY ]
                     </button>
                  ) : (
                    <div className="flex gap-4 animate-in zoom-in-95 duration-500">
                       <button 
                         onClick={handleDispatch}
                         className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-4 transition-all active:scale-95 italic border border-white/10"
                       >
                          <ArrowUpRight size={20} /> [ DISPATCH TO PHARMACY ]
                       </button>
                       <button onClick={() => { setSelectedMeds([]); setIsApproved(false); }} className="p-6 bg-white/5 hover:bg-red-600/20 text-gray-500 hover:text-red-500 rounded-3xl transition-all border border-white/5"><X size={24}/></button>
                    </div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* CORE SAFETY FOOTER */}
      <div className="p-10 bg-[#0a0f18] border border-white/5 rounded-[60px] flex items-start gap-10 shadow-inner opacity-60">
          <div className="w-16 h-16 rounded-[24px] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shrink-0 shadow-3xl animate-pulse">
             <ShieldCheck size={36} />
          </div>
          <div className="space-y-3">
             <p className="text-base font-black text-white uppercase italic tracking-tight leading-relaxed text-left">
                THERAPEUTIC GOVERNANCE DISCLAIMER: AI MEDICATION SUGGESTIONS ARE ADVISORY ONLY. ALL PRESCRIPTIONS MUST BE AUTHORIZED BY THE TREATING CONSULTANT NODE. DOSAGES, CONTRAINDICATIONS, AND DRUG INTERACTIONS MUST BE INDEPENDENTLY VERIFIED BEFORE DISPENSING.
             </p>
          </div>
      </div>
    </div>
  );
};

export default MedicationTab;

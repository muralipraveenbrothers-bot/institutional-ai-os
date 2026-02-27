import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, Sparkles, Loader2, Pill, Activity, ShieldCheck, 
  ChevronRight, Volume2, Target, Info, AlertTriangle, Scale, Brain,
  Zap, ArrowRight, ListChecks, CheckCircle2, AlertCircle, TrendingUp,
  RefreshCw, BookOpen, Layers
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutMedicalManagementStream, speakText } from '../../../geminiService';
import { approveClinicalContentGuarded, runAI, manualModeMessage } from '../../Shared/AppEventToast';

interface MedicalMgmtProps {
  patient: Patient;
  latestAnalysis?: string;
  aiResult: { rawResponse: string, status: string };
  onInitiateMgmt: (params: any) => void;
}

const MedicalManagementPlanningTab: React.FC<MedicalMgmtProps> = ({ patient, latestAnalysis, aiResult, onInitiateMgmt }) => {
  const [diagnosis, setDiagnosis] = useState(patient.chiefComplaint || "");
  const [comorbidities, setComorbidities] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [localSynthesis, setLocalSynthesis] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });

  const handleRun = async () => {
    setLocalSynthesis({ text: "", status: 'loading' });
    setIsAuthorized(false);
    
    await runAI("susruta", async () => {
      try {
        const stream = sushrutMedicalManagementStream({ 
          patient, 
          diagnosis, 
          level: selectedLevel, 
          comorbidities: comorbidities.length > 0 ? comorbidities : [patient.healthSnapshot?.knownConditions || 'None']
        });
        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          setLocalSynthesis(prev => ({ ...prev, text: fullText }));
        }
        setLocalSynthesis(prev => ({ ...prev, status: 'done' }));
      } catch (err) {
        setLocalSynthesis(prev => ({ ...prev, status: 'error' }));
      }
    }, () => {
      setLocalSynthesis(prev => ({ ...prev, status: 'error' }));
      manualModeMessage("Medical Management Synthesis");
    });
  };

  const parsedSections = useMemo(() => {
    if (!localSynthesis.text) return {};
    const sections: Record<string, string> = {};
    const markers = [
      'FIRST-LINE THERAPY', 'SECOND-LINE OPTIONS', 'NEW EVIDENCE THERAPIES',
      'ADVERSE-EFFECT MITIGATION', 'RENAL/HEPATIC ADJUSTMENTS', 'MONITORING PARAMETERS'
    ];
    
    markers.forEach((m, idx) => {
      const start = localSynthesis.text.indexOf(m + ":");
      if (start === -1) return;
      let end = localSynthesis.text.length;
      for (const nextM of markers.slice(idx + 1)) {
        const pos = localSynthesis.text.indexOf(nextM + ":");
        if (pos !== -1 && pos < end) end = pos;
      }
      sections[m] = localSynthesis.text.substring(start + m.length + 1, end).trim();
    });
    return sections;
  }, [localSynthesis.text]);

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* 🧬 CONFIG HUD - ADD-ONLY EXTENSION */}
      <div className="bg-[#111827] border border-indigo-500/20 rounded-[50px] p-10 shadow-3xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Target size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
                <ClipboardCheck size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest leading-none">Medical Management Deck</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Evidence-Based Non-Surgical Intelligence</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 bg-[#0a0f18] p-2 rounded-2xl border border-white/5 shadow-2xl">
              {['V1', 'V2', 'V3'].map((lvl) => (
                <button 
                  key={lvl} 
                  onClick={() => setSelectedLevel(lvl as any)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl ? 'bg-indigo-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-gray-400'}`}
                >
                   {lvl} {lvl === 'V1' ? 'BASIC' : lvl === 'V2' ? 'STANDARD' : 'ADVANCED'}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Working Diagnosis for Synthesis</label>
              <input 
                value={diagnosis} 
                onChange={e => setDiagnosis(e.target.value)} 
                placeholder="Enter clinical focus (e.g. Community Acquired Pneumonia)..." 
                className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-indigo-500 shadow-inner" 
              />
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 italic">Active Comorbid Risk Context</label>
              <div className="flex flex-wrap gap-2">
                 {['Diabetes', 'HTN', 'Renal Impairment', 'Hepatic Stress', 'CAD', 'COPD'].map(c => (
                   <button 
                    key={c}
                    onClick={() => setComorbidities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${comorbidities.includes(c) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-[#111827] text-gray-500 border border-gray-800'}`}
                   >
                     {c}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <button 
          onClick={handleRun} 
          disabled={localSynthesis.status === 'loading' || !diagnosis} 
          className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-4 italic border border-white/10"
        >
          {localSynthesis.status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} fill="currentColor" />} 
          [ {localSynthesis.status === 'loading' ? 'SYNCHRONIZING THERAPEUTIC NODE...' : 'INITIATE MANAGEMENT SYNTHESIS'} ]
        </button>
      </div>

      {/* 🚀 DYNAMIC SYNTHESIS OUTPUT - ADD-ONLY */}
      {(localSynthesis.text || localSynthesis.status === 'loading') && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT: PRIMARY THERAPY (8/12) */}
              <div className="lg:col-span-8 space-y-8">
                 <div className="bg-[#0a0f18] border border-indigo-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-6"><BookOpen size={300} /></div>
                    
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                       <div className="flex items-center gap-6">
                          <div className={`w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_indigo] ${localSynthesis.status === 'loading' ? 'animate-ping' : ''}`} />
                          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Therapeutic Roadmap</h3>
                       </div>
                       {localSynthesis.status === 'done' && (
                         <button onClick={() => speakText(localSynthesis.text)} className="p-4 bg-indigo-600/10 text-indigo-500 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-xl group"><Volume2 size={24} className="group-hover:scale-110 transition-transform"/></button>
                       )}
                    </div>

                    <div className="space-y-10 relative z-10">
                       {localSynthesis.status === 'loading' && !localSynthesis.text ? (
                          <div className="py-20 flex flex-col items-center gap-6 opacity-40">
                             <Loader2 size={48} className="animate-spin text-indigo-500" />
                             <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Auditing Clinical Streams...</p>
                          </div>
                       ) : (
                          <div className="space-y-12">
                             {parsedSections['FIRST-LINE THERAPY'] && (
                               <div className="animate-in fade-in slide-in-from-bottom-2">
                                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-3 italic"><CheckCircle2 size={16}/> Standard First-Line Protocol</h4>
                                  <div className="bg-emerald-600/5 p-8 rounded-[32px] border border-emerald-500/20 text-lg text-slate-200 italic leading-relaxed whitespace-pre-wrap font-mono shadow-inner">
                                     {parsedSections['FIRST-LINE THERAPY']}
                                  </div>
                               </div>
                             )}

                             {parsedSections['SECOND-LINE OPTIONS'] && (
                               <div className="animate-in fade-in slide-in-from-bottom-2 delay-100">
                                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-3 italic"><Layers size={16}/> Second-Line & Salvage Logic</h4>
                                  <div className="bg-amber-600/5 p-8 rounded-[32px] border border-amber-500/20 text-sm text-slate-300 italic leading-relaxed whitespace-pre-wrap font-mono shadow-inner">
                                     {parsedSections['SECOND-LINE OPTIONS']}
                                  </div>
                               </div>
                             )}

                             {parsedSections['NEW EVIDENCE THERAPIES'] && (
                               <div className="animate-in fade-in slide-in-from-bottom-2 delay-200">
                                  <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4 flex items-center gap-3 italic"><Sparkles size={16}/> Emerging Evidence Node</h4>
                                  <div className="bg-cyan-600/5 p-8 rounded-[32px] border border-cyan-500/20 text-sm text-slate-300 italic leading-relaxed whitespace-pre-wrap font-mono shadow-inner">
                                     {parsedSections['NEW EVIDENCE THERAPIES']}
                                  </div>
                               </div>
                             )}
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* RIGHT: SAFETY & MONITORING (4/12) */}
              <div className="lg:col-span-4 space-y-8">
                 {/* Safety Adjustments */}
                 <div className="bg-red-950/10 border border-red-500/20 p-10 rounded-[50px] shadow-3xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.05]"><AlertTriangle size={120} /></div>
                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest italic flex items-center gap-3"><AlertCircle size={16} /> Safety & Adjustments</h4>
                    
                    <div className="space-y-6 relative z-10">
                       <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Renal / Hepatic Safe-Dose</p>
                          <p className="text-xs text-slate-300 italic leading-relaxed">{parsedSections['RENAL/HEPATIC ADJUSTMENTS'] || "Calculating clearance nodes..."}</p>
                       </div>
                       <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Side Effect Mitigation</p>
                          <p className="text-xs text-slate-300 italic leading-relaxed">{parsedSections['ADVERSE-EFFECT MITIGATION'] || "Monitoring for toxic patterns..."}</p>
                       </div>
                    </div>
                 </div>

                 {/* Monitoring Checklist */}
                 <div className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[50px] shadow-3xl space-y-8">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-3"><ListChecks size={18}/> Monitoring Pulse</h4>
                    <div className="space-y-4">
                       <div className="p-6 bg-[#0a0f18] rounded-3xl border border-gray-800 shadow-inner">
                          <p className="text-xs text-slate-400 italic leading-relaxed font-medium">
                             {parsedSections['MONITORING PARAMETERS'] || "Awaiting physiological tracking node..."}
                          </p>
                       </div>
                       <div className="flex items-center gap-3 text-[9px] font-black text-indigo-500 uppercase italic bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                          <CheckCircle2 size={12} /> Institutional Benchmarks Active
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* FINAL AUTHORIZATION NODE */}
           {localSynthesis.status === 'done' && (
              <div className={`p-14 rounded-[70px] border-2 transition-all duration-1000 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-4xl ${isAuthorized ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-indigo-600/5 border-indigo-500/20'}`}>
                 <div className="flex items-center gap-10">
                    <div className={`w-28 h-28 rounded-[40px] flex items-center justify-center shadow-3xl ${isAuthorized ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white animate-pulse'}`}>
                       {isAuthorized ? <ShieldCheck size={64} /> : <Zap size={64} />}
                    </div>
                    <div className="text-left">
                       <p className={`text-[13px] font-black uppercase tracking-[0.6em] mb-4 ${isAuthorized ? 'text-emerald-500' : 'text-indigo-400'}`}>
                          {isAuthorized ? 'Institutional Protocol Locked' : 'Consultant Verification Required'}
                       </p>
                       <h4 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                          {isAuthorized ? 'Management Path Locked' : 'Authorize Protocol'}
                       </h4>
                    </div>
                 </div>
                 <button 
                   onClick={() => { if(approveClinicalContentGuarded()) setIsAuthorized(true); }}
                   disabled={isAuthorized}
                   className="px-24 py-9 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-[50px] font-black uppercase text-base tracking-[0.4em] shadow-[0_30px_80px_rgba(16,185,129,0.3)] transition-all active:scale-95 italic border-2 border-white/10 flex items-center gap-8"
                 >
                    {isAuthorized ? 'PROTOCOL SECURED' : 'AUTHORIZE & COMMIT'}
                 </button>
              </div>
           )}
        </div>
      )}

      {/* CORE SAFETY FOOTER */}
      <div className="p-10 bg-[#0a0f18] border border-indigo-500/10 rounded-[60px] flex items-start gap-10 shadow-inner opacity-60">
          <div className="w-16 h-16 rounded-[24px] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shrink-0 shadow-2xl">
             <Info size={32} />
          </div>
          <div className="space-y-3">
             <p className="text-base font-black text-white uppercase italic tracking-tight leading-relaxed">
                Management Planning Disclosure: SUSHRUT Medical Management node provides evidence-based strategy suggestions. All drug choices, dosages, and titration must be physically verified and authorized by the treating consultant. 
             </p>
             <div className="flex items-center gap-6">
                <p className="text-[10px] text-indigo-500/60 font-black uppercase tracking-widest italic">Verification ID: med-mgmt-v6.5 • Evidence Node: LOCKED</p>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             </div>
          </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default MedicalManagementPlanningTab;
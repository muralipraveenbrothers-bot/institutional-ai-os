import React, { useMemo, useState } from 'react';
import { Microscope, Sparkles, Loader2, ShieldCheck, Activity, AlertTriangle, TrendingUp, Info, Book, Target } from 'lucide-react';
import { Patient } from '../../../types';
import { speakText } from '../../../geminiService';

interface OncoMDTProps {
  patient: Patient;
  aiResult: { rawResponse: string, status: string };
  onInitiateOncology: (params: { diagnosis: string, stage: string, status: string, priorTreatments: string[] }) => void;
}

const OncologyMDTBoard: React.FC<OncoMDTProps> = ({ patient, aiResult, onInitiateOncology }) => {
  const [diagnosis, setDiagnosis] = useState("");
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("Newly Diagnosed");

  const handleRun = () => {
    onInitiateOncology({
      diagnosis,
      stage,
      status,
      priorTreatments: ["Chemo cycle 1 (pending)", "Surgery (planned)"]
    });
  };

  const parsedData = useMemo(() => {
    if (!aiResult.rawResponse || !aiResult.rawResponse.includes('MDT_SUMMARY:')) return null;
    const data: any = { summary: "", guidelines: "", trials: "", comparison: "" };
    aiResult.rawResponse.split('\n').forEach(line => {
      if (line.includes('MDT_SUMMARY:')) data.summary = line.replace('MDT_SUMMARY:', '').trim();
      if (line.includes('GUIDELINE_AWARENESS:')) data.guidelines = line.replace('GUIDELINE_AWARENESS:', '').trim();
      if (line.includes('TRIAL_AWARENESS:')) data.trials = line.replace('TRIAL_AWARENESS:', '').trim();
      if (line.includes('OUTCOME_COMPARISON:')) data.comparison = line.replace('OUTCOME_COMPARISON:', '').trim();
    });
    return data;
  }, [aiResult.rawResponse]);

  return (
    <div className="bg-[#0f172a] border border-purple-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Microscope size={300} /></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-purple-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <Microscope size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Oncology MDT Board</h3>
               <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mt-1 italic">Tumor Board Support | Guideline Sync | Non-Directive</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <input 
              placeholder="Primary Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
              className="bg-black/40 border border-gray-800 rounded-xl px-4 py-2 text-[10px] font-black text-white w-40"
            />
            <input 
              placeholder="Stage (e.g. T2N1)" value={stage} onChange={e => setStage(e.target.value)}
              className="bg-black/40 border border-gray-800 rounded-xl px-4 py-2 text-[10px] font-black text-white w-24"
            />
            <button 
              onClick={handleRun}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl"
            >
              Sync Node
            </button>
         </div>
      </div>

      {aiResult.status === 'loading' ? (
        <div className="py-20 flex flex-col items-center gap-6 opacity-40">
           <Loader2 size={48} className="animate-spin text-purple-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em]">Scanning Global Oncology Guideline Streams...</p>
        </div>
      ) : parsedData ? (
        <div className="space-y-12 relative z-10">
           <div className="bg-[#111827] border border-white/5 p-10 rounded-[50px] shadow-inner space-y-6">
              <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-3"><Target size={16}/> Case Synthesis</h4>
              <p className="text-lg text-slate-300 italic font-medium leading-relaxed">"{parsedData.summary}"</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] space-y-6">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3"><Book size={16}/> Guideline Awareness</h4>
                 <p className="text-sm text-slate-400 italic leading-relaxed">{parsedData.guidelines}</p>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] space-y-6">
                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3"><TrendingUp size={16}/> Outcome Comparison</h4>
                 <p className="text-sm text-slate-400 italic leading-relaxed">{parsedData.comparison}</p>
              </div>
           </div>

           <div className="bg-indigo-950/10 border border-indigo-500/20 p-8 rounded-[40px] flex items-center gap-6">
              <Sparkles size={24} className="text-indigo-400 shrink-0" />
              <div>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Clinical Trial Awareness (Informational)</p>
                 <p className="text-sm text-slate-300 italic mt-1">{parsedData.trials}</p>
              </div>
           </div>

           <div className="flex justify-center pt-4">
              <button onClick={() => speakText(aiResult.rawResponse)} className="px-10 py-5 bg-purple-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-4 italic active:scale-95 transition-all">
                 [ Audio Board Briefing ]
              </button>
           </div>
        </div>
      ) : (
        <div className="py-20 text-center opacity-10 flex flex-col items-center gap-6">
           <Microscope size={100} />
           <p className="text-sm font-black uppercase tracking-widest">Assemble Tumor Board Parameters</p>
        </div>
      )}

      <div className="mt-10 p-8 bg-purple-950/10 border border-purple-500/10 rounded-[40px] flex items-start gap-6 opacity-60">
          <Info className="text-purple-400 shrink-0" size={24} />
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-relaxed">
                MDT Advisory: AI oncology nodes provide guideline context and aggregate outcome benchmarks to support multi-disciplinary discussions. Final treatment decisions reside exclusively with the tumor board.
             </p>
             <p className="text-[8px] text-purple-500/40 font-bold uppercase tracking-widest italic">Sushrut-Onco Node v1.0 • MDT Sync Secured</p>
          </div>
      </div>
    </div>
  );
};

export default OncologyMDTBoard;
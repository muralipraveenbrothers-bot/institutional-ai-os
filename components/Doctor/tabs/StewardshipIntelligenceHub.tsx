
import React, { useState, useMemo } from 'react';
import { 
  Pill, Sparkles, Loader2, ShieldCheck, Volume2, Target, AlertTriangle, 
  Activity, Zap, Info, TrendingUp, Microscope, RefreshCw, CheckCircle2
} from 'lucide-react';
import { Patient } from '../../../types';
// Fix: Corrected misspelled function name
import { sushrutAntimicrobialStewardshipStream, speakText } from '../../../geminiService';

interface StewardshipProps {
  patient: Patient;
  currentMeds: string[];
  cultureResults: string;
}

const StewardshipIntelligenceHub: React.FC<StewardshipProps> = ({ patient, currentMeds, cultureResults }) => {
  const [intel, setIntel] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });

  const runAnalysis = async () => {
    setIntel({ text: "", status: 'loading' });
    try {
      // Fix: Updated function call to the correct exported member
      const stream = sushrutAntimicrobialStewardshipStream({ patient, currentMeds, cultureResults });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setIntel(prev => ({ ...prev, text: fullText }));
      }
      setIntel(prev => ({ ...prev, status: 'done' }));
    } catch (err) {
      setIntel(prev => ({ ...prev, status: 'error' }));
    }
  };

  return (
    <div className="bg-[#0a0f18] border border-emerald-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Microscope size={300} /></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <Pill size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Antibiotic Stewardship IQ</h3>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic">Rational Pharmacy | Resistance Aware | Non-Restrictive</p>
            </div>
         </div>
         <button 
           onClick={runAnalysis}
           className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl flex items-center gap-3 transition-all hover:bg-emerald-500"
         >
           {intel.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
           Analyze Therapy Node
         </button>
      </div>

      {intel.status === 'loading' ? (
        <div className="py-20 flex flex-col items-center gap-6 opacity-40">
           <Loader2 size={48} className="animate-spin text-emerald-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em]">Auditing Resistance Patterns...</p>
        </div>
      ) : intel.text ? (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-[#111827] p-10 rounded-[50px] border border-white/5 shadow-inner">
              <div className="prose prose-invert max-w-none text-lg text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                 {intel.text}
              </div>
           </div>

           <div className="flex justify-center gap-6">
              <button onClick={() => speakText(intel.text)} className="px-10 py-5 bg-emerald-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-4 italic active:scale-95 transition-all">
                 <Volume2 size={20} /> Hear Rational Review
              </button>
           </div>
        </div>
      ) : (
        <div className="py-32 text-center opacity-10 flex flex-col items-center gap-6 grayscale">
           <Microscope size={80} />
           <p className="text-sm font-black uppercase tracking-widest">Therapeutic Ledger Idle</p>
        </div>
      )}

      <div className="mt-10 p-8 bg-emerald-950/10 border border-emerald-500/10 rounded-[40px] flex items-start gap-6 opacity-60">
          <Info className="text-emerald-400 shrink-0" size={24} />
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-relaxed">
                Stewardship Node: AI promotes rational utilization and de-escalation possibilities. Awareness only - no automatic stops or restrictors active. Final choice remains with doctor.
             </p>
             <p className="text-[8px] text-emerald-500/40 font-bold uppercase tracking-widest italic">Verification: antibiotic-stwd-v1 • Resistance Trend: Active</p>
          </div>
      </div>
    </div>
  );
};

export default StewardshipIntelligenceHub;

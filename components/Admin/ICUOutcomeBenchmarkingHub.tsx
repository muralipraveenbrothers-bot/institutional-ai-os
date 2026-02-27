
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Activity, TrendingUp, TrendingDown, ShieldCheck, 
  Target, Bot, Loader2, RefreshCw, Info, CheckCircle2, LayoutGrid
} from 'lucide-react';
import { sushrutICUOutcomeBenchmarkingStream } from '../../geminiService';

const ICUOutcomeBenchmarkingHub: React.FC = () => {
  const [intel, setIntel] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });

  const unitData = {
    mortality: "0.8% (Target < 1.0%)",
    avgLOS: "4.2 Days (Target < 3.5 Days)",
    ventDays: "Aggregate: 220 hrs",
    sepsisSuccess: "92%",
    readmitRate: "4% (Target < 5%)"
  };

  const runBenchmark = async () => {
    setIntel({ text: "", status: 'loading' });
    try {
      const stream = sushrutICUOutcomeBenchmarkingStream({ unitData });
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
    <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-10 shadow-3xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><BarChart3 size={300} /></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <Activity size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">ICU Outcome Benchmarking</h3>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">Institutional Quality Improvement | Non-Punitive | Aggregate Metrics</p>
            </div>
         </div>
         <button 
           onClick={runBenchmark}
           className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl flex items-center gap-3"
         >
           {intel.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
           Run Metric Synthesis
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12 relative z-10">
         {Object.entries(unitData).map(([key, val]) => (
            <div key={key} className="bg-[#0a0f18] border border-gray-800 p-6 rounded-3xl group hover:border-indigo-500/20 transition-all flex flex-col justify-between h-[120px]">
               <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest italic">{key.replace(/([A-Z])/g, ' $1')}</p>
               <p className="text-xl font-black text-white italic mt-2 uppercase">{val}</p>
            </div>
         ))}
      </div>

      {intel.status === 'loading' ? (
        <div className="py-20 flex flex-col items-center gap-6 opacity-40">
           <Loader2 size={48} className="animate-spin text-indigo-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em]">Benchmarking vs Past Performance...</p>
        </div>
      ) : intel.text ? (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-[#0a0f18] p-10 rounded-[50px] border border-white/5 shadow-inner">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-8 border-b border-white/5 pb-4 flex items-center gap-3"><Bot size={16} /> Strategic Quality Brief</h4>
              <div className="prose prose-invert max-w-none text-lg text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                 {intel.text}
              </div>
           </div>
        </div>
      ) : (
        <div className="py-24 text-center opacity-10 flex flex-col items-center gap-6 grayscale">
           <LayoutGrid size={100} />
           <p className="text-sm font-black uppercase tracking-widest">Quality Pulse Ledger Standing By</p>
        </div>
      )}

      <div className="mt-10 p-8 bg-indigo-900/10 border border-indigo-500/10 rounded-[40px] flex items-start gap-6 opacity-60">
          <Info className="text-indigo-400 shrink-0" size={24} />
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-relaxed">
                Benchmarking Disclosure: AI identifies aggregate systemic patterns to support quality improvement meetings. No doctor-level scoring or punitive tracking is enabled. Purely for internal excellence optimization.
             </p>
             <p className="text-[8px] text-indigo-500/40 font-bold uppercase tracking-widest italic">Verification: quality-bench-v1 • Data Status: DE-IDENTIFIED</p>
          </div>
      </div>
    </div>
  );
};

export default ICUOutcomeBenchmarkingHub;

import React, { useMemo } from 'react';
import { Bug, Sparkles, Loader2, ShieldCheck, Activity, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Patient } from '../../../types';
import { speakText } from '../../../geminiService';

interface SepsisHubProps {
  patient: Patient;
  vitals: any;
  aiResult: { rawResponse: string, status: string };
  onInitiateSepsis: (params: { labs?: any }) => void;
}

const SepsisIntelligenceHub: React.FC<SepsisHubProps> = ({ patient, vitals, aiResult, onInitiateSepsis }) => {
  
  const parseParts = (line: string, marker: string) => {
    try {
      const payload = line?.replace(marker, "") || "";
      const segments = payload.split('|').map(p => p.trim());
      const obj: any = {};
      segments.forEach(seg => {
        const splitPos = seg.indexOf(':');
        if (splitPos !== -1) {
          const k = seg.substring(0, splitPos).trim().toUpperCase();
          const v = seg.substring(splitPos + 1).trim();
          if (k) obj[k] = v;
        }
      });
      return obj;
    } catch (e) { return null; }
  };

  const parsedData = useMemo(() => {
    if (!aiResult.rawResponse || !aiResult.rawResponse.includes('SEPSIS_RISK:')) return null;
    const data: any = { risk: {}, organ: "", perfusion: "", advisory: "", vigilance: "" };
    aiResult.rawResponse.split('\n').forEach(line => {
      if (line.includes('SEPSIS_RISK:')) data.risk = parseParts(line, 'SEPSIS_RISK:');
      if (line.includes('ORGAN_DYSFUNCTION:')) data.organ = line.replace('ORGAN_DYSFUNCTION:', '').trim();
      if (line.includes('PERFUSION_AWARENESS:')) data.perfusion = line.replace('PERFUSION_AWARENESS:', '').trim();
      if (line.includes('ADVISORY:')) data.advisory = line.replace('ADVISORY:', '').trim();
      if (line.includes('VIGILANCE:')) data.vigilance = line.replace('VIGILANCE:', '').trim();
    });
    return data;
  }, [aiResult.rawResponse]);

  return (
    <div className="bg-[#0f172a] border border-red-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Bug size={300} /></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <Bug size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Sepsis EWS Node</h3>
               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 italic">Early Warning Intelligence | Non-Diagnostic Advisory</p>
            </div>
         </div>
         <button 
           onClick={() => onInitiateSepsis({})}
           disabled={aiResult.status === 'loading'}
           className="px-8 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl flex items-center gap-3 transition-all hover:bg-red-500"
         >
           {aiResult.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
           Run Risk Synthesis
         </button>
      </div>

      {aiResult.status === 'loading' ? (
        <div className="py-20 flex flex-col items-center gap-6 opacity-40">
           <Loader2 size={48} className="animate-spin text-red-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em]">Scanning Institutional Probability Lattices...</p>
        </div>
      ) : parsedData ? (
        <div className="space-y-12 relative z-10">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[200px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Risk Stratification</p>
                 <div className="flex items-center justify-between">
                    <span className={`text-4xl font-black italic uppercase ${parsedData.risk?.['0'] === 'Low' ? 'text-emerald-500' : parsedData.risk?.['0'] === 'Moderate' ? 'text-amber-500' : 'text-red-500'}`}>{parsedData.risk?.['0'] || 'Pending'}</span>
                    {parsedData.risk?.TREND === 'Worsening' ? <TrendingUp size={24} className="text-red-500" /> : <TrendingDown size={24} className="text-emerald-500" />}
                 </div>
                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-2 italic">Trend: {parsedData.risk?.TREND || 'Stable'}</p>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[200px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Organ Dysfunction Radar</p>
                 <div className="flex items-center gap-3">
                    <Activity size={18} className="text-indigo-400" />
                    <p className="text-xs text-slate-300 font-medium italic">{parsedData.organ}</p>
                 </div>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[200px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Perfusion Status</p>
                 <p className="text-sm text-slate-300 italic font-medium leading-relaxed">{parsedData.perfusion}</p>
              </div>
           </div>

           <div className="bg-[#0a0f18] p-10 rounded-[50px] border border-white/5 space-y-6 shadow-3xl">
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-3"><AlertTriangle size={16}/> High Vigilance Protocol</h4>
              <p className="text-sm text-slate-300 italic font-medium leading-relaxed">"{parsedData.vigilance}"</p>
           </div>

           <div className="bg-[#111827] p-8 rounded-[40px] border border-white/5 italic text-slate-400 text-sm">
              <p>"{parsedData.advisory}"</p>
           </div>

           <div className="flex justify-center pt-4">
              <button onClick={() => speakText(aiResult.rawResponse)} className="px-10 py-5 bg-red-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-4 italic active:scale-95 transition-all border border-white/10">
                 [ Hear EWS Synthesis ]
              </button>
           </div>
        </div>
      ) : (
        <div className="py-20 text-center opacity-10 flex flex-col items-center gap-6">
           <Bug size={100} />
           <p className="text-sm font-black uppercase tracking-widest">Awaiting Physiological Pulse</p>
        </div>
      )}

      <div className="mt-10 p-8 bg-red-950/10 border border-red-500/10 rounded-[40px] flex items-start gap-6 opacity-60">
          <Info className="text-red-400 shrink-0" size={24} />
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-relaxed">
                Sepsis EWS Advisory: AI nodes provide safety context and pattern awareness. This is NOT a diagnostic label. All interventions must be clinician-authorized.
             </p>
             <p className="text-[8px] text-red-500/40 font-bold uppercase tracking-widest italic">Sushrut-Sepsis Node v1.0 • Institutional Safety Kernel Locked</p>
          </div>
      </div>
    </div>
  );
};

export default SepsisIntelligenceHub;
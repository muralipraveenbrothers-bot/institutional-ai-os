import React, { useMemo } from 'react';
import { Droplet, Sparkles, Loader2, ShieldCheck, Activity, AlertTriangle, TrendingUp, TrendingDown, Info, Pill } from 'lucide-react';
import { Patient } from '../../../types';
import { speakText } from '../../../geminiService';

interface RenalHubProps {
  patient: Patient;
  aiResult: { rawResponse: string, status: string };
  onInitiateRenal: (params: { creatinineHistory: any[], urineOutput: string, medications: string[] }) => void;
}

const RenalIntelligenceHub: React.FC<RenalHubProps> = ({ patient, aiResult, onInitiateRenal }) => {
  
  const handleRun = () => {
    onInitiateRenal({
      creatinineHistory: [1.1, 1.3, 1.2], // Mocked history
      urineOutput: "35ml/hr", // Mocked current
      medications: (patient.medications || []).map(m => m.name || "Unknown")
    });
  };

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
    if (!aiResult.rawResponse || !aiResult.rawResponse.includes('AKI_RISK:')) return null;
    const data: any = { risk: {}, trend: "", radar: "", advisory: "" };
    aiResult.rawResponse.split('\n').forEach(line => {
      if (line.includes('AKI_RISK:')) data.risk = parseParts(line, 'AKI_RISK:');
      if (line.includes('RENAL_TREND:')) data.trend = line.replace('RENAL_TREND:', '').trim();
      if (line.includes('NEPHROTOXIC_RADAR:')) data.radar = line.replace('NEPHROTOXIC_RADAR:', '').trim();
      if (line.includes('ADVISORY:')) data.advisory = line.replace('ADVISORY:', '').trim();
    });
    return data;
  }, [aiResult.rawResponse]);

  return (
    <div className="bg-[#0f172a] border border-blue-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Droplet size={300} /></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <Droplet size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Renal Safety Node</h3>
               <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 italic">AKI Vigilance | Nephrotoxic Awareness | Safety Advisory</p>
            </div>
         </div>
         <button 
           onClick={handleRun}
           disabled={aiResult.status === 'loading'}
           className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl flex items-center gap-3 transition-all hover:bg-blue-500"
         >
           {aiResult.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
           Run Renal Audit
         </button>
      </div>

      {aiResult.status === 'loading' ? (
        <div className="py-20 flex flex-col items-center gap-6 opacity-40">
           <Loader2 size={48} className="animate-spin text-blue-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em]">Modeling Creatinine Kinetics...</p>
        </div>
      ) : parsedData ? (
        <div className="space-y-12 relative z-10">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[200px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">AKI Risk Profile</p>
                 <div className="flex items-center justify-between">
                    <span className={`text-4xl font-black italic uppercase ${parsedData.risk?.['0'] === 'Low' ? 'text-emerald-500' : parsedData.risk?.['0'] === 'Moderate' ? 'text-amber-500' : 'text-red-500'}`}>{parsedData.risk?.['0'] || 'Evaluating'}</span>
                 </div>
                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-2 italic">KDIGO stage: {parsedData.risk?.STAGE || 'Unknown'}</p>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[200px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Filtration Trend</p>
                 <div className="flex items-center gap-3">
                    <Activity size={18} className="text-blue-400" />
                    <p className="text-xs text-slate-300 font-medium italic">{parsedData.trend}</p>
                 </div>
              </div>

              <div className="bg-amber-950/10 border border-amber-500/20 p-8 rounded-[40px] flex flex-col justify-between h-[200px] shadow-inner">
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Nephrotoxic Radar</p>
                 <div className="flex items-center gap-3">
                    <Pill size={18} className="text-amber-500" />
                    <p className="text-xs text-slate-300 font-medium italic">{parsedData.radar}</p>
                 </div>
              </div>
           </div>

           <div className="bg-[#0a0f18] p-10 rounded-[50px] border border-white/5 space-y-6 shadow-3xl">
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3"><Droplet size={16}/> Therapeutic Nudge</h4>
              <p className="text-sm text-slate-300 italic font-medium leading-relaxed">"{parsedData.advisory}"</p>
           </div>

           <div className="flex justify-center pt-4">
              <button onClick={() => speakText(aiResult.rawResponse)} className="px-10 py-5 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-4 italic active:scale-95 transition-all border border-white/10">
                 [ Explain Renal Status ]
              </button>
           </div>
        </div>
      ) : (
        <div className="py-20 text-center opacity-10 flex flex-col items-center gap-6">
           <Droplet size={100} />
           <p className="text-sm font-black uppercase tracking-widest">Awaiting Creatinine Nodes</p>
        </div>
      )}

      <div className="mt-10 p-8 bg-blue-950/10 border border-blue-500/10 rounded-[40px] flex items-start gap-6 opacity-60">
          <Info className="text-blue-400 shrink-0" size={24} />
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-relaxed">
                Renal IQ Advisory: AI nodes provide safety context on renal function trends. Awareness only - no automatic dosing changes enabled. All fluid and drug modifications must be human-authorized.
             </p>
             <p className="text-[8px] text-blue-500/40 font-bold uppercase tracking-widest italic">Sushrut-Renal Node v1.0 • Kid-Safe Guard Active</p>
          </div>
      </div>
    </div>
  );
};

export default RenalIntelligenceHub;
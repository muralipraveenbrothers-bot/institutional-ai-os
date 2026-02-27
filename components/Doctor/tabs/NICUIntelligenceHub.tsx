import React, { useState, useMemo } from 'react';
import { 
  Baby, Sparkles, Loader2, ShieldCheck, Volume2, Target, AlertTriangle, 
  Activity, Zap, Info, TrendingUp, Droplets, Thermometer, Siren
} from 'lucide-react';
import { Patient } from '../../../types';
import { speakText } from '../../../geminiService';

interface NICUProps {
  patient: Patient;
  vitals: any;
  aiResult: { rawResponse: string, status: string };
  onInitiateNICU: (params: { gestation: string, weight: string, level: 'V1' | 'V2' | 'V3' }) => void;
}

const NICUIntelligenceHub: React.FC<NICUProps> = ({ patient, vitals, aiResult, onInitiateNICU }) => {
  const [gestation, setGestation] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');

  const handleRun = () => {
    onInitiateNICU({ gestation, weight, level: selectedLevel });
  };

  const parseParts = (line: string, marker: string) => {
    try {
      const payload = line?.replace(marker, "") || "";
      const segments = payload.split('|').map(p => p.trim());
      const obj: any = {};
      segments.forEach(seg => {
        const splitPos = seg.indexOf(':');
        if (splitPos !== -1) {
          const k = seg.substring(0, splitPos).trim().toLowerCase();
          const v = seg.substring(splitPos + 1).trim();
          if (k) obj[k] = v;
        }
      });
      return obj;
    } catch (e) { return null; }
  };

  const parsedData = useMemo(() => {
    if (!aiResult.rawResponse || !aiResult.rawResponse.includes('NICU_')) return null;
    const data: any = { status: {}, resp: {}, sepsis: {}, nutrition: {}, vigilance: "" };
    aiResult.rawResponse.split('\n').forEach(line => {
      if (line.includes('NICU_STATUS:')) data.status = parseParts(line, 'NICU_STATUS:');
      if (line.includes('NICU_RESP:')) data.resp = parseParts(line, 'NICU_RESP:');
      if (line.includes('NICU_SEPSIS_RISK:')) data.sepsis = parseParts(line, 'NICU_SEPSIS_RISK:');
      if (line.includes('NICU_NUTRITION:')) data.nutrition = line.replace('NICU_NUTRITION:', '').trim();
      if (line.includes('NICU_VIGILANCE:')) data.vigilance = line.replace('NICU_VIGILANCE:', '').trim();
    });
    return data;
  }, [aiResult.rawResponse]);

  return (
    <div className="bg-[#0f172a] border border-pink-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Baby size={300} /></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-pink-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <Baby size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Neonatal Intelligence Hub</h3>
               <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-1 italic">VLBW Aware | Preterm Safety | Read-Only Advisory</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <input 
              placeholder="Gestation (wks)" value={gestation} onChange={e => setGestation(e.target.value)}
              className="bg-black/40 border border-gray-800 rounded-xl px-4 py-2 text-[10px] font-black text-white w-32"
            />
            <input 
              placeholder="Weight (g)" value={weight} onChange={e => setWeight(e.target.value)}
              className="bg-black/40 border border-gray-800 rounded-xl px-4 py-2 text-[10px] font-black text-white w-32"
            />
            <button 
              onClick={handleRun}
              className="px-6 py-2 bg-pink-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl"
            >
              Initialize Node
            </button>
         </div>
      </div>

      {aiResult.status === 'loading' ? (
        <div className="py-20 flex flex-col items-center gap-6 opacity-40">
           <Loader2 size={48} className="animate-spin text-pink-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em]">Scanning Neonatal Streams...</p>
        </div>
      ) : parsedData ? (
        <div className="space-y-12 relative z-10">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[200px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Vigilance State</p>
                 <div className="flex items-center justify-between">
                    <span className={`text-4xl font-black italic uppercase ${parsedData.status?.['0'] === 'Stable' ? 'text-emerald-500' : 'text-red-500'}`}>{parsedData.status?.['0'] || 'Evaluating'}</span>
                 </div>
                 <p className="text-[11px] text-slate-400 italic leading-relaxed">{parsedData.status?.MSG}</p>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[200px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Infection Probability</p>
                 <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-indigo-400 italic uppercase">Sepsis: {parsedData.sepsis?.['0'] || 'Unknown'}</span>
                    <TrendingUp size={18} className="text-indigo-500" />
                 </div>
                 <p className="text-[11px] text-slate-400 italic leading-relaxed">{parsedData.sepsis?.WHY}</p>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[200px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Respiratory Pulse</p>
                 <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white italic uppercase">{parsedData.resp?.['0'] || '---'}</span>
                    <span className="text-[10px] font-bold text-emerald-500">{parsedData.resp?.TREND || 'Stable'}</span>
                 </div>
                 <div className="h-1 bg-gray-900 rounded-full mt-2"><div className="h-full bg-emerald-500 w-[70%]" /></div>
              </div>
           </div>

           <div className="bg-[#0a0f18] p-10 rounded-[50px] border border-white/5 space-y-6 shadow-3xl">
              <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-3"><AlertTriangle size={16}/> High Vigilance Protocol</h4>
              <p className="text-sm text-slate-300 italic font-medium leading-relaxed">"{parsedData.vigilance}"</p>
           </div>

           <div className="flex justify-center pt-4">
              <button onClick={() => speakText(aiResult.rawResponse)} className="px-10 py-5 bg-pink-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-4 italic active:scale-95 transition-all border border-white/10">
                 <Volume2 size={20} /> [ Explain Neonatal Status ]
              </button>
           </div>
        </div>
      ) : (
        <div className="py-20 text-center opacity-10 flex flex-col items-center gap-6">
           <Baby size={100} />
           <p className="text-sm font-black uppercase tracking-widest">Awaiting Neonatal Parameters</p>
        </div>
      )}

      <div className="mt-10 p-8 bg-pink-950/10 border border-pink-500/10 rounded-[40px] flex items-start gap-6 opacity-60">
          <Info className="text-pink-400 shrink-0" size={24} />
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-relaxed">
                NICU Advisory: AI nodes provide safety context and growth awareness. NO dosing or feeding automation enabled. All care paths must be neonatologist-authorized.
             </p>
             <p className="text-[8px] text-pink-500/40 font-bold uppercase tracking-widest italic">Sushrut-NICU Node v1.0 • Safety Integrity Locked</p>
          </div>
      </div>
    </div>
  );
};

export default NICUIntelligenceHub;
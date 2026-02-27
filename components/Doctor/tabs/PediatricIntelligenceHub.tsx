
import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Activity, TrendingUp, AlertTriangle, Scale, Target, 
  Loader2, Sparkles, Volume2, Clock, Microscope, 
  Droplets, ShieldCheck, HeartPulse, Baby, Info, AlertCircle
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutPediatricIntelligenceStream, speakText } from '../../../geminiService';

interface PediatricHubProps {
  patient: Patient;
  complaint: string;
  age: string;
  weight: string;
  vitals: any;
}

const PediatricIntelligenceHub: React.FC<PediatricHubProps> = ({ patient, complaint, age, weight, vitals }) => {
  const [intelResult, setIntelResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');

  const runIntelligenceScan = async (level: 'V1' | 'V2' | 'V3' = selectedLevel) => {
    setSelectedLevel(level);
    setIntelResult({ text: "", status: 'loading' });
    try {
      const stream = sushrutPediatricIntelligenceStream({ patient, complaint, age, weight, vitals, level });
      let fullText = "";
      for await (const chunk of stream) { fullText += chunk; setIntelResult(prev => ({ ...prev, text: fullText })); }
      setIntelResult(prev => ({ ...prev, status: 'done' }));
    } catch (err) { setIntelResult(prev => ({ ...prev, status: 'error' })); }
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
    if (!intelResult.text) return null;
    const data: any = { v1: {}, v2: {}, v3: {}, outcome: {} };
    const lines = intelResult.text.split('\n');
    lines.forEach(line => {
      if (line.includes('PD_V1:')) data.v1 = parseParts(line, 'PD_V1:');
      else if (line.includes('PD_V2:')) data.v2 = parseParts(line, 'PD_V2:');
      else if (line.includes('PD_V3:')) data.v3 = parseParts(line, 'PD_V3:');
      else if (line.includes('PD_OUTCOME:')) data.outcome = parseParts(line, 'PD_OUTCOME:');
    });
    return data;
  }, [intelResult.text]);

  return (
    <div className="bg-[#05070a] border border-pink-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700 mt-10">
      {/* HUD HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-pink-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl"><Baby size={32} /></div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Pediatric IQ Node</h3>
               <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-1 italic">Age/Weight Specific | PAT-Aligned | Clinical Advisory</p>
            </div>
         </div>
         <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[30px] border border-pink-500/20 shadow-2xl">
            {['V1', 'V2', 'V3'].map((lvl) => (
              <button 
                key={lvl} 
                onClick={() => runIntelligenceScan(lvl as any)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl && intelResult.status !== 'idle' ? 'bg-pink-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
              >
                {lvl} {lvl === 'V1' ? 'ASSESS' : lvl === 'V2' ? 'DANGER' : 'SPECIFIC'}
              </button>
            ))}
         </div>
      </div>

      {intelResult.status === 'loading' ? (
        <div className="py-32 flex flex-col items-center gap-8 opacity-40">
           <Loader2 size={64} className="animate-spin text-pink-500" />
           <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse text-pink-100">Modeling Pediatric Dynamics...</p>
        </div>
      ) : intelResult.status === 'idle' ? (
        <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-8 select-none">
           <Activity size={120} />
           <button onClick={() => runIntelligenceScan()} className="px-14 py-6 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-sm hover:bg-pink-600 hover:text-white transition-all">Initialize Pediatric Node</button>
        </div>
      ) : (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-6 duration-700">
           
           {/* RED FLAGS / MUST-NOT-MISS PANEL */}
           <div className="bg-red-950/20 border-2 border-red-500/30 p-8 rounded-[40px] flex flex-col md:flex-row items-center gap-8 animate-pulse">
              <div className="w-16 h-16 bg-red-600 rounded-[20px] flex items-center justify-center text-white shrink-0 shadow-2xl">
                 <AlertCircle size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                 <p className="text-red-500 font-black uppercase text-[10px] tracking-widest mb-1">Module 2: Must-Not-Miss Red Flags</p>
                 <p className="text-white font-bold text-lg italic leading-tight">
                    {parsedData?.v2?.DANGER_PATTERN || "Assess for: Lethargy, Poor feeding, Cyanosis, Nasal flaring, and Grunting."}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-[220px] bg-pink-600/10 border-pink-500/20 shadow-pink-500/10`}>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">V1: Rapid PAT</p>
                    <div className={`w-3 h-3 rounded-full bg-pink-500 animate-pulse shadow-[0_0_10px_pink]`}/>
                 </div>
                 <div>
                    <p className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">{parsedData?.v1?.ASSESSMENT || 'Scanning...'}</p>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">Vitals: {parsedData?.v1?.VITAL_CHECK}</p>
                 </div>
              </div>

              {/* WEIGHT-BASED REMINDERS */}
              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-inner relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform"><Scale size={80}/></div>
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Weight-Based Awareness</p>
                 <div>
                    <p className="text-sm font-black text-indigo-400 italic uppercase">Ref: {weight || '---'} KG</p>
                    <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Standard Fluid Node</p>
                       <p className="text-[11px] text-slate-300 italic leading-relaxed">Consider 4-2-1 rule for maintenance. Fluid bolus at 20ml/kg if shock signs detected.</p>
                    </div>
                 </div>
              </div>

              <div className="bg-pink-900/5 border border-pink-500/20 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-3xl">
                 <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest italic">V3: Safety Pulse</p>
                 <div className="space-y-4">
                    <p className="text-sm text-slate-200 font-medium italic leading-relaxed">{parsedData?.v3?.AGE_SPECIFIC || "Target age-appropriate developmental markers."}</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-pink-400 uppercase tracking-widest bg-pink-950/40 p-2 rounded-lg">
                       <AlertTriangle size={10} /> Respiratory: {parsedData?.v3?.FLUID || 'Monitor for retractions'}
                    </div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 space-y-6">
                 <div className="bg-[#0a0f18] border border-white/5 p-8 rounded-[50px] shadow-2xl space-y-8">
                    <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-4 italic"><Clock size={18} /> Indicators</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-2">Stability</p>
                          <p className="text-[10px] text-slate-300 italic">{parsedData?.outcome?.GOOD || 'Nominal'}</p>
                       </div>
                       <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-2">Escalation</p>
                          <p className="text-[10px] text-slate-300 italic">{parsedData?.outcome?.BAD || 'Pending'}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="lg:col-span-7">
                 <div className="bg-[#111827] border border-pink-500/10 rounded-[60px] p-10 shadow-3xl h-full flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6"><TrendingUp size={18} className="text-pink-500" /><h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Intelligence Summary</h4></div>
                    <div className="prose prose-invert max-w-none text-xl text-slate-300 italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">{intelResult.text}</div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col items-center gap-10 pt-6">
              <button onClick={() => speakText(intelResult.text)} className="px-24 py-10 bg-pink-600 hover:bg-pink-500 text-white rounded-[50px] font-black uppercase text-xl tracking-[0.4em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 border-white/10 italic group">
                <Volume2 size={36} className="group-hover:scale-110" /> [ Explain Pediatric Status ]
              </button>
              <div className="p-8 bg-indigo-950/10 border border-indigo-500/10 rounded-[50px] flex items-start gap-8 shadow-inner opacity-70 w-full">
                 <Info size={28} className="text-indigo-400 shrink-0" />
                 <p className="text-[10px] font-black text-white uppercase italic tracking-widest leading-relaxed">
                   Institutional Advisory: All pediatric dosing and clinical paths must be verified by the consultant. AI signals are read-only reminders of standard protocol. No auto-orders enabled.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PediatricIntelligenceHub;

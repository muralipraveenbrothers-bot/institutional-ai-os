import React, { useState, useMemo, useEffect } from 'react';
import { 
  Skull, Sparkles, Loader2, ShieldCheck, Volume2, Target, AlertTriangle, 
  Activity, Zap, Info, TrendingUp, HeartPulse, Droplets, Brain, 
  Thermometer, CheckCircle2, Siren, HelpCircle, RefreshCw, Clock, 
  ShieldAlert, UserCheck, Scale, AlertCircle, Gavel, Waves
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutEnvenomationIntelligenceStream, speakText } from '../../../geminiService';

interface EnvenomationHubProps {
  patient: Patient;
  exposure: string;
  vitals: any;
}

const EnvenomationIntelligenceHub: React.FC<EnvenomationHubProps> = ({ patient, exposure, vitals }) => {
  const [intelResult, setIntelResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');

  const runIntelligenceScan = async (level: 'V1' | 'V2' | 'V3' = selectedLevel) => {
    setSelectedLevel(level);
    setIntelResult({ text: "", status: 'loading' });
    try {
      const stream = sushrutEnvenomationIntelligenceStream({ patient, exposure, vitals, level });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setIntelResult(prev => ({ ...prev, text: fullText }));
      }
      setIntelResult(prev => ({ ...prev, status: 'done' }));
    } catch (err) {
      setIntelResult(prev => ({ ...prev, status: 'error' }));
    }
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
    const data: any = { v1: {}, v2: {}, v3: {}, timing: {}, outcome: {} };
    const lines = intelResult.text.split('\n');
    lines.forEach(line => {
      if (line.includes('EV_V1:')) data.v1 = parseParts(line, 'EV_V1:');
      else if (line.includes('EV_V2:')) data.v2 = parseParts(line, 'EV_V2:');
      else if (line.includes('EV_V3:')) data.v3 = parseParts(line, 'EV_V3:');
      else if (line.includes('EV_TIMING:')) data.timing = parseParts(line, 'EV_TIMING:');
      else if (line.includes('EV_OUTCOME:')) data.outcome = parseParts(line, 'EV_OUTCOME:');
    });
    return data;
  }, [intelResult.text]);

  const handleExplain = () => {
    if (intelResult.text) {
      speakText(intelResult.text, 'Zephyr');
    }
  };

  return (
    <div className="bg-[#05070a] border border-red-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700 mt-10">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12"><Skull size={300} /></div>
      
      {/* HEADER HUB */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <Waves size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Envenomation Intelligence</h3>
               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 italic">Snakebite | Scorpion | Time-Critical | Outcome-focused</p>
            </div>
         </div>
         <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[30px] border border-red-500/20 shadow-2xl">
            {['V1', 'V2', 'V3'].map((lvl) => (
              <button 
                key={lvl} 
                onClick={() => runIntelligenceScan(lvl as any)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl && intelResult.status !== 'idle' ? 'bg-red-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
              >
                {lvl} {lvl === 'V1' ? 'RAPID' : lvl === 'V2' ? 'PATTERN' : 'SPECIFIC'}
              </button>
            ))}
         </div>
      </div>

      {intelResult.status === 'loading' ? (
        <div className="py-32 flex flex-col items-center gap-8 opacity-40">
           <Loader2 size={64} className="animate-spin text-red-500" />
           <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse text-red-100">Modeling Toxicokinetics...</p>
        </div>
      ) : intelResult.status === 'idle' ? (
        <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-8 select-none">
           <Skull size={120} />
           <button onClick={() => runIntelligenceScan()} className="px-14 py-6 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-sm hover:bg-red-600 hover:text-white transition-all">Initialize Envenomation Node</button>
        </div>
      ) : (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-6 duration-700">
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-[220px] ${parsedData?.v1?.BITE_PATTERN === 'High-risk' ? 'bg-red-600/10 border-red-500/20' : 'bg-emerald-600/10 border-emerald-500/20 shadow-emerald-500/10'}`}>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">V1: Rapid Resus</p>
                    <div className={`w-3 h-3 rounded-full ${parsedData?.v1?.BITE_PATTERN === 'High-risk' ? 'bg-red-500 animate-pulse shadow-[0_0_10px_red]' : 'bg-emerald-500'}`} />
                 </div>
                 <div>
                    <p className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">{parsedData?.v1?.BITE_PATTERN || 'Scanning...'}</p>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">"{parsedData?.v1?.RESUS_MSG}"</p>
                 </div>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">V2: Suspected Pattern</p>
                 <div>
                    <p className="text-xl font-black text-indigo-400 italic uppercase tracking-tight leading-tight">{parsedData?.v2?.SUSPECTED_PATTERN || 'Undifferentiated'}</p>
                    <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Anatomical Correlation</p>
                       <p className="text-[11px] text-slate-300 italic leading-relaxed">{parsedData?.v2?.RATIONALE}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-red-900/5 border border-red-500/20 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-3xl">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">V3: {exposure}</p>
                    <Siren size={18} className="text-red-500 animate-pulse" />
                 </div>
                 <div className="space-y-4">
                    <p className="text-sm text-slate-200 font-medium italic leading-relaxed">
                       {parsedData?.v3?.SPECIFIC_RISK}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-red-400 uppercase tracking-widest bg-red-950/40 p-2 rounded-lg">
                       <AlertCircle size={10} /> Radar: {parsedData?.v3?.COMPLICATION_ALERT}
                    </div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 space-y-6">
                 <div className="bg-[#0a0f18] border border-white/5 p-8 rounded-[50px] shadow-2xl space-y-8">
                    <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-4 italic">
                       <Clock size={18} /> ASV Timing Awareness
                    </h4>
                    <div className="space-y-6">
                       <div className="flex items-center justify-between p-5 bg-black/20 rounded-[28px] border border-white/5 group hover:bg-cyan-600/5 transition-all">
                          <div className="flex flex-col">
                             <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">ASV Window</span>
                             <span className="text-xs font-bold text-gray-300 uppercase italic">Early/Delayed</span>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic ${parsedData?.timing?.ASV_WINDOW === 'Early' ? 'bg-emerald-600/10 text-emerald-500' : 'bg-red-600/10 text-red-500'}`}>
                             {parsedData?.timing?.ASV_WINDOW || 'Pending'}
                          </span>
                       </div>
                       <p className="text-[11px] text-slate-400 font-medium italic text-center">"{parsedData?.timing?.MSG}"</p>
                    </div>
                 </div>

                 <div className="bg-indigo-950/10 border border-indigo-500/20 p-8 rounded-[50px] shadow-inner space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-3">
                       <TrendingUp size={16} /> Prognostic Indicators
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-2">Good Trend</p>
                          <p className="text-[10px] text-slate-300 italic">{parsedData?.outcome?.GOOD}</p>
                       </div>
                       <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-2">Bad Trend</p>
                          <p className="text-[10px] text-slate-300 italic">{parsedData?.outcome?.BAD}</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-7 flex flex-col h-full">
                 <div className="bg-[#111827] border border-red-500/10 rounded-[60px] p-10 shadow-3xl space-y-10 relative overflow-hidden flex flex-col flex-1">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none rotate-6"><Brain size={300}/></div>
                    <div className="flex items-center gap-4 relative z-10">
                       <Target size={18} className="text-red-500" />
                       <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Intelligence Narrative</h4>
                    </div>
                    <div className="prose prose-invert max-w-none text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering flex-1 relative z-10">
                       {intelResult.text}
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col items-center gap-10 pt-6">
              <button 
                onClick={handleExplain}
                className="px-24 py-10 bg-red-600 hover:bg-red-500 text-white rounded-[50px] font-black uppercase text-xl tracking-[0.4em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 border-white/10 italic group"
              >
                <Volume2 size={36} className="group-hover:scale-110" /> [ Explain Envenomation Status ]
              </button>
              
              <div className="p-8 bg-red-950/10 border border-red-500/10 rounded-[50px] flex items-start gap-8 shadow-inner opacity-70 w-full">
                 <div className="w-14 h-14 rounded-[22px] bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/10 shrink-0">
                    <ShieldAlert size={28} />
                 </div>
                 <div className="space-y-2">
                    <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                       Institutional Advisory: VENOM-PRO AI supports recognition and risk stratification. AI never orders ASV doses. ABCs always override AI logic. Final authority resides with the treating physician.
                    </p>
                    <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-widest italic">Module: venom-pro-v1 • Pattern-Sync: ACTIVE</p>
                 </div>
              </div>
           </div>

        </div>
      )}
    </div>
  );
};

export default EnvenomationIntelligenceHub;

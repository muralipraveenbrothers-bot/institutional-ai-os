import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wind, Sparkles, Loader2, ShieldCheck, Volume2, Target, AlertTriangle, 
  Activity, Zap, Info, TrendingUp, HeartPulse, Droplets, Brain, 
  Thermometer, CheckCircle2, Siren, HelpCircle, RefreshCw,
  ShieldAlert, ZapOff, Scale, Clock
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutICUVentIntelligenceStream, speakText } from '../../../geminiService';

interface ICUVentIntelligenceHubProps {
  patient: Patient;
  settings: any;
  vitals: any;
}

const ICUVentIntelligenceHub: React.FC<ICUVentIntelligenceHubProps> = ({ patient, settings, vitals }) => {
  const [intelResult, setIntelResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');

  const runIntelligenceScan = async (level: 'V1' | 'V2' | 'V3' = selectedLevel) => {
    setSelectedLevel(level);
    setIntelResult({ text: "", status: 'loading' });
    try {
      const stream = sushrutICUVentIntelligenceStream({ patient, settings, vitals, level });
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
    const data: any = { v1: {}, v2: {}, v3: {}, alerts: [], outcome: {}, phase: {}, lung: {}, o2: {}, risk: {}, wean: {} };
    const lines = intelResult.text.split('\n');
    lines.forEach(line => {
      if (line.includes('VI_PHASE:')) data.phase = parseParts(line, 'VI_PHASE:');
      else if (line.includes('VI_LUNG_PROTECTION:')) data.lung = parseParts(line, 'VI_LUNG_PROTECTION:');
      else if (line.includes('VI_O2_TREND:')) data.o2 = parseParts(line, 'VI_O2_TREND:');
      else if (line.includes('VI_RISK:')) data.risk = parseParts(line, 'VI_RISK:');
      else if (line.includes('VI_WEAN_READY:')) data.wean = parseParts(line, 'VI_WEAN_READY:');
      else if (line.includes('VI_ALERT:')) data.alerts.push(parseParts(line, 'VI_ALERT:'));
    });
    return data;
  }, [intelResult.text]);

  const handleExplain = () => {
    if (intelResult.text) {
      speakText(intelResult.text, 'Zephyr');
    }
  };

  return (
    <div className="bg-[#0a0f18] border border-cyan-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12"><Wind size={300} /></div>
      
      {/* HEADER HUB */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-cyan-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <Zap size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Ventilator Ultra-Intel V2</h3>
               <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-1 italic">Vessel-Safe | Lung-Protective | Read-Only Advisory</p>
            </div>
         </div>
         <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[30px] border border-cyan-500/20 shadow-2xl">
            {['V1', 'V2', 'V3'].map((lvl) => (
              <button 
                key={lvl} 
                onClick={() => runIntelligenceScan(lvl as any)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl && intelResult.status !== 'idle' ? 'bg-cyan-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
              >
                {lvl} {lvl === 'V1' ? 'SAFETY' : lvl === 'V2' ? 'V2 ULTRA' : 'DETAILED'}
              </button>
            ))}
         </div>
      </div>

      {intelResult.status === 'loading' ? (
        <div className="py-32 flex flex-col items-center gap-8 opacity-40">
           <Loader2 size={64} className="animate-spin text-cyan-500" />
           <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse">Synchronizing Pulmonary V2 Layer...</p>
        </div>
      ) : intelResult.status === 'idle' ? (
        <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-8 select-none">
           <Wind size={120} />
           <button onClick={() => runIntelligenceScan()} className="px-14 py-6 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-sm hover:bg-cyan-600 hover:text-white transition-all">Initialize Ultra-Power Mode</button>
        </div>
      ) : (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-6 duration-700">
           
           {/* Section 1: Phase & Protection Monitoring */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-[220px] bg-cyan-950/10 border-cyan-500/20 shadow-inner`}>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Phase Awareness</p>
                    {/* Fixed: Added missing Clock import from lucide-react */}
                    <Clock size={18} className="text-cyan-500" />
                 </div>
                 <div>
                    <p className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{parsedData?.phase?.['0'] || 'Scanning...'}</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-4 leading-relaxed italic">"{parsedData?.phase?.MSG}"</p>
                 </div>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Lung Protection Index</p>
                 <div>
                    <p className={`text-xl font-black italic uppercase ${parsedData?.lung?.['0'] === 'Safe' ? 'text-emerald-500' : 'text-amber-500'}`}>{parsedData?.lung?.['0'] || 'Monitoring'}</p>
                    <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Protocol Sync</p>
                       <p className="text-[11px] text-slate-300 italic mt-1 leading-relaxed">{parsedData?.lung?.MSG}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-3xl">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Oxygenation Pulse</p>
                    <TrendingUp size={18} className={parsedData?.o2?.['0'] === 'Improving' ? "text-emerald-500" : "text-amber-500"} />
                 </div>
                 <div className="space-y-4">
                    <p className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{parsedData?.o2?.['0']}</p>
                    <p className="text-sm text-slate-200 font-medium italic leading-relaxed">
                       {parsedData?.o2?.MSG}
                    </p>
                 </div>
              </div>
           </div>

           {/* Section 2: Associated Risks & Weaning Readiness */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-red-950/10 border border-red-500/20 p-10 rounded-[50px] shadow-3xl space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><ShieldAlert size={100}/></div>
                 <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-4 italic"><AlertTriangle size={16} className="animate-pulse" /> Ventilator Risk Radar</h4>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <span className="text-2xl font-black text-white uppercase italic">{parsedData?.risk?.['0'] || 'Monitoring'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">"{parsedData?.risk?.MSG}"</p>
                 </div>
              </div>

              <div className="bg-emerald-950/10 border border-emerald-500/20 p-10 rounded-[50px] shadow-3xl space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><CheckCircle2 size={100}/></div>
                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-4 italic"><TrendingUp size={16}/> Weaning Advisory Signal</h4>
                 <div className="flex items-end justify-between">
                    <div className="space-y-1">
                       <p className="text-2xl font-black text-white uppercase italic">{parsedData?.wean?.['0'] || '---'} Readiness</p>
                       <p className="text-[11px] text-slate-300 italic leading-relaxed">"{parsedData?.wean?.MSG}"</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Explain & Narrative */}
           <div className="bg-[#0a0f18] p-10 rounded-[60px] border border-cyan-500/10 shadow-inner relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-8 opacity-[0.01] rotate-6"><Brain size={300}/></div>
              <div className="flex items-center gap-4 mb-8">
                 <Target size={18} className="text-cyan-500" />
                 <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">V2 Comprehensive Narrative (Read-Only)</h4>
              </div>
              <div className="prose prose-invert max-w-none text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                 {intelResult.text}
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
                 <button 
                    onClick={handleExplain}
                    className="px-14 py-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[40px] font-black uppercase text-xs tracking-[0.4em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-5 border border-white/10 italic"
                 >
                    <Volume2 size={28} /> [ Explain V2 Synthesis ]
                 </button>
              </div>
           </div>

           {/* Safety Footer */}
           <div className="p-8 bg-cyan-900/10 border border-cyan-500/10 rounded-[50px] flex items-start gap-8 shadow-inner opacity-70">
              <div className="w-14 h-14 rounded-[22px] bg-cyan-600/10 flex items-center justify-center text-cyan-500 border border-cyan-500/10 shrink-0">
                 <ShieldCheck size={28} />
              </div>
              <div className="space-y-2">
                 <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                    Module A Status: ADVISORY SIGNAL ONLY. This ultra-intelligence node does not control or prescribe ventilator settings. Intensivist oversight is mandatory for any protocol change.
                 </p>
                 <p className="text-[10px] text-cyan-500/60 font-bold uppercase tracking-widest italic">Validation Node: vent-ultra-v2 • Safety Integrity: LOCKED</p>
              </div>
           </div>

        </div>
      )}
    </div>
  );
};

export default ICUVentIntelligenceHub;
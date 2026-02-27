
import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Activity, TrendingUp, AlertTriangle, Scale, Target, 
  Loader2, Sparkles, Volume2, Target as Crosshair, Clock, Microscope, 
  Droplets, ShieldCheck, HeartPulse, Zap, Siren
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutStrokeIntelligenceStream, speakText } from '../../../geminiService';

interface StrokeHubProps {
  patient: Patient;
  deficit: string;
  onset: string;
  vitals: any;
}

const StrokeIntelligenceHub: React.FC<StrokeHubProps> = ({ patient, deficit, onset, vitals }) => {
  const [intelResult, setIntelResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');

  const runIntelligenceScan = async (level: 'V1' | 'V2' | 'V3' = selectedLevel) => {
    setSelectedLevel(level);
    setIntelResult({ text: "", status: 'loading' });
    try {
      const stream = sushrutStrokeIntelligenceStream({ patient, deficit, onset, vitals, level });
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
      if (line.includes('SN_V1:')) data.v1 = parseParts(line, 'SN_V1:');
      else if (line.includes('SN_V2:')) data.v2 = parseParts(line, 'SN_V2:');
      else if (line.includes('SN_V3:')) data.v3 = parseParts(line, 'SN_V3:');
      else if (line.includes('SN_OUTCOME:')) data.outcome = parseParts(line, 'SN_OUTCOME:');
    });
    return data;
  }, [intelResult.text]);

  return (
    <div className="bg-[#05070a] border border-indigo-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700 mt-10">
      {/* HEADER HUB */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl"><Activity size={32} /></div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Stroke Intelligence Hub</h3>
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 italic">Time-critical Window Monitoring | Large Vessel Awareness | Airway Safety</p>
            </div>
         </div>
         <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[30px] border border-indigo-500/20 shadow-2xl">
            {['V1', 'V2', 'V3'].map((lvl) => (
              <button 
                key={lvl} 
                onClick={() => runIntelligenceScan(lvl as any)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl && intelResult.status !== 'idle' ? 'bg-indigo-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
              >
                {lvl} {lvl === 'V1' ? 'RAPID' : lvl === 'V2' ? 'PATTERN' : 'WINDOW'}
              </button>
            ))}
         </div>
      </div>

      {intelResult.status === 'loading' ? (
        <div className="py-32 flex flex-col items-center gap-8 opacity-40">
           <Loader2 size={64} className="animate-spin text-indigo-500" />
           <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse text-indigo-100">Synchronizing Neuro Lattice...</p>
        </div>
      ) : intelResult.status === 'idle' ? (
        <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-8 select-none">
           <Zap size={120} />
           <button onClick={() => runIntelligenceScan()} className="px-14 py-6 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-sm hover:bg-indigo-600 hover:text-white transition-all">Initialize Neuro Node</button>
        </div>
      ) : (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-6 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-[220px] bg-indigo-600/10 border-indigo-500/20 shadow-indigo-500/10`}>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">V1: Deficit Synthesis</p>
                    <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_indigo]" />
                 </div>
                 <div>
                    <p className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">{parsedData?.v1?.NEURO_SYNTHESIS || 'Scanning...'}</p>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">GCS: {parsedData?.v1?.GCS_TREND}</p>
                 </div>
              </div>
              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">V2: Stroke Pattern</p>
                 <div>
                    <p className="text-xl font-black text-indigo-400 italic uppercase tracking-tight leading-tight">{parsedData?.v2?.STROKE_PATTERN || 'Undifferentiated'}</p>
                    <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Critical Alert</p>
                       <p className="text-[11px] text-slate-300 italic leading-relaxed">{parsedData?.v2?.ALERT}</p>
                    </div>
                 </div>
              </div>
              <div className="bg-indigo-900/5 border border-indigo-500/20 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-3xl">
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">V3: Window IQ</p>
                 <div className="space-y-4">
                    <p className="text-sm text-slate-200 font-medium italic leading-relaxed">{parsedData?.v3?.WINDOW_IQ}</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/40 p-2 rounded-lg">
                       <Siren size={10} /> Safety: {parsedData?.v3?.SAFETY}
                    </div>
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 space-y-6">
                 <div className="bg-[#0a0f18] border border-white/5 p-8 rounded-[50px] shadow-2xl space-y-8">
                    <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-4 italic"><Clock size={18} /> Outcome Indicators</h4>
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
              <div className="lg:col-span-7">
                 <div className="bg-[#111827] border border-indigo-500/10 rounded-[60px] p-10 shadow-3xl h-full flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6"><TrendingUp size={18} className="text-indigo-500" /><h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Neuro Narrative</h4></div>
                    <div className="prose prose-invert max-w-none text-xl text-slate-300 italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">{intelResult.text}</div>
                 </div>
              </div>
           </div>
           <div className="flex flex-col items-center gap-10 pt-6">
              <button onClick={() => speakText(intelResult.text)} className="px-24 py-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[50px] font-black uppercase text-xl tracking-[0.4em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 border-white/10 italic group">
                <Volume2 size={36} className="group-hover:scale-110" /> [ Explain Neuro Status ]
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default StrokeIntelligenceHub;

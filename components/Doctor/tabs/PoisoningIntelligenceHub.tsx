import React, { useState, useMemo, useEffect } from 'react';
import { 
  Skull, Sparkles, Loader2, ShieldCheck, Volume2, Target, AlertTriangle, 
  Activity, Zap, Info, TrendingUp, HeartPulse, Droplets, Brain, 
  Thermometer, CheckCircle2, Siren, HelpCircle, RefreshCw, Clock, 
  ShieldAlert, UserCheck, Scale, AlertCircle, Gavel
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutPoisoningIntelligenceStream, speakText } from '../../../geminiService';

interface PoisoningIntelligenceHubProps {
  patient: Patient;
  toxin: string;
  vitals: any;
}

const PoisoningIntelligenceHub: React.FC<PoisoningIntelligenceHubProps> = ({ patient, toxin, vitals }) => {
  const [intelResult, setIntelResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');

  const runIntelligenceScan = async (level: 'V1' | 'V2' | 'V3' = selectedLevel) => {
    setSelectedLevel(level);
    setIntelResult({ text: "", status: 'loading' });
    try {
      const stream = sushrutPoisoningIntelligenceStream({ patient, toxin, vitals, level });
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
    const data: any = { v1: {}, v2: {}, v3: {}, alerts: [], outcome: {}, toxidrome: {}, window: {}, organ: {}, stabilization: {}, trend: {} };
    const lines = intelResult.text.split('\n');
    lines.forEach(line => {
      if (line.includes('PI_TOXIDROME:')) data.toxidrome = parseParts(line, 'PI_TOXIDROME:');
      else if (line.includes('PI_WINDOW:')) data.window = parseParts(line, 'PI_WINDOW:');
      else if (line.includes('PI_ORGAN_RISK:')) data.organ = parseParts(line, 'PI_ORGAN_RISK:');
      else if (line.includes('PI_STABILIZATION:')) data.stabilization = parseParts(line, 'PI_STABILIZATION:');
      else if (line.includes('PI_TREND:')) data.trend = parseParts(line, 'PI_TREND:');
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
               <Zap size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Poisoning Deep Intelligence</h3>
               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 italic">Toxidrome Recognition | Golden Windows | Situational Awareness</p>
            </div>
         </div>
         <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[30px] border border-red-500/20 shadow-2xl">
            {['V1', 'V2', 'V3'].map((lvl) => (
              <button 
                key={lvl} 
                onClick={() => runIntelligenceScan(lvl as any)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl && intelResult.status !== 'idle' ? 'bg-red-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
              >
                {lvl} {lvl === 'V1' ? 'RAPID' : lvl === 'V2' ? 'DEEP INTEL' : 'FULL AUDIT'}
              </button>
            ))}
         </div>
      </div>

      {intelResult.status === 'loading' ? (
        <div className="py-32 flex flex-col items-center gap-8 opacity-40">
           <Loader2 size={64} className="animate-spin text-red-500" />
           <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse">Scanning Deep Toxicological Nodes...</p>
        </div>
      ) : intelResult.status === 'idle' ? (
        <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-8 select-none">
           <Skull size={120} />
           <button onClick={() => runIntelligenceScan()} className="px-14 py-6 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-sm hover:bg-red-600 hover:text-white transition-all">Initialize Deep Discovery</button>
        </div>
      ) : (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-6 duration-700">
           
           {/* Section 1: Toxidrome & Golden Window */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-[220px] bg-red-950/10 border-red-500/20 shadow-inner`}>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Toxidrome Recognition</p>
                    <Activity size={18} className="text-red-500" />
                 </div>
                 <div>
                    <p className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{parsedData?.toxidrome?.['0'] || 'Evaluating...'}</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-4 leading-relaxed italic">"{parsedData?.toxidrome?.MSG}"</p>
                 </div>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Golden Window Relevance</p>
                 <div>
                    <p className={`text-xl font-black italic uppercase ${parsedData?.window?.['0'] === 'Early' ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`}>{parsedData?.window?.['0'] || 'Monitoring'}</p>
                    <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Time-Critical Node</p>
                       <p className="text-[11px] text-slate-300 italic mt-1 leading-relaxed">{parsedData?.window?.MSG}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-3xl">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Organ Risk Focus</p>
                    <ShieldAlert size={18} className="text-indigo-500" />
                 </div>
                 <div className="space-y-4">
                    <p className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{parsedData?.organ?.['0']}</p>
                    <p className="text-sm text-slate-200 font-medium italic leading-relaxed">
                       {parsedData?.organ?.MSG}
                    </p>
                 </div>
              </div>
           </div>

           {/* Section 2: Stabilization & Trends */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-[#0a0f18] p-10 rounded-[60px] border border-red-500/10 shadow-inner relative overflow-hidden flex flex-col justify-center">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.01] rotate-6"><Brain size={300}/></div>
                 <div className="flex items-center gap-4 mb-8">
                    <Target size={18} className="text-red-500" />
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Stabilization & Rationale (Read-Only)</h4>
                 </div>
                 <div className="prose prose-invert max-w-none text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                    {intelResult.text}
                 </div>
                 <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
                    <button 
                       onClick={handleExplain}
                       className="px-14 py-6 bg-red-600 hover:bg-red-500 text-white rounded-[40px] font-black uppercase text-xs tracking-[0.4em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-5 border border-white/10 italic"
                    >
                       <Volume2 size={28} /> [ Explain Management Status ]
                    </button>
                 </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-red-950/10 border border-red-500/20 p-8 rounded-[50px] shadow-3xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><TrendingUp size={100}/></div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Clinical Trend Signal</p>
                       <p className="text-2xl font-black text-white italic uppercase tracking-tighter">{parsedData?.trend?.['0'] || 'Monitoring'}</p>
                    </div>
                    <div className="p-5 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Early Indicators</p>
                       <p className="text-sm text-slate-300 italic leading-relaxed font-medium">"{parsedData?.trend?.MSG}"</p>
                    </div>
                 </div>

                 <div className="bg-amber-600/5 border border-amber-500/20 p-8 rounded-[50px] shadow-inner space-y-4">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-3"><Activity size={16}/> ABCDE REMINDER</h4>
                    <p className="text-sm text-slate-300 font-bold italic leading-relaxed">"{parsedData?.stabilization?.MSG || 'Prioritize airway protection and circulation access.'}"</p>
                 </div>
              </div>
           </div>

           {/* Safety Footer */}
           <div className="p-8 bg-red-900/10 border border-red-500/10 rounded-[50px] flex items-start gap-8 shadow-inner opacity-70">
              <div className="w-14 h-14 rounded-[22px] bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/10 shrink-0">
                 <ShieldCheck size={28} />
              </div>
              <div className="space-y-2">
                 <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                    Module B Status: ADVISORY SIGNAL ONLY. Poisoning Management Deep Intelligence provides situational awareness reminders. AI does not order antidotes or prescribe dosing. Clinical judgment is the final protocol authority.
                 </p>
                 <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-widest italic">Validation Node: tox-deep-v3 • Medico-Legal Sync: LOCKED</p>
              </div>
           </div>

        </div>
      )}
    </div>
  );
};

export default PoisoningIntelligenceHub;
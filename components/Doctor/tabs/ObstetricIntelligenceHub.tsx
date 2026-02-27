
import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Activity, TrendingUp, AlertTriangle, Scale, Target, 
  Loader2, Sparkles, Volume2, Clock, Microscope, 
  Droplets, ShieldCheck, HeartPulse, Heart, Info, AlertCircle
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutObstetricIntelligenceStream, speakText } from '../../../geminiService';

interface ObstetricHubProps {
  patient: Patient;
  complaint: string;
  gestation: string;
  vitals: any;
}

const ObstetricIntelligenceHub: React.FC<ObstetricHubProps> = ({ patient, complaint, gestation, vitals }) => {
  const [intelResult, setIntelResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');

  const runIntelligenceScan = async (level: 'V1' | 'V2' | 'V3' = selectedLevel) => {
    setSelectedLevel(level);
    setIntelResult({ text: "", status: 'loading' });
    try {
      const stream = sushrutObstetricIntelligenceStream({ patient, complaint, gestation, vitals, level });
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
      if (line.includes('OB_V1:')) data.v1 = parseParts(line, 'OB_V1:');
      else if (line.includes('OB_V2:')) data.v2 = parseParts(line, 'OB_V2:');
      else if (line.includes('OB_V3:')) data.v3 = parseParts(line, 'OB_V3:');
      else if (line.includes('OB_OUTCOME:')) data.outcome = parseParts(line, 'OB_OUTCOME:');
    });
    return data;
  }, [intelResult.text]);

  return (
    <div className="bg-[#05070a] border border-rose-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700 mt-10">
      {/* HUD HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl"><Heart size={32} /></div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Obstetric Intelligence Hub</h3>
               <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1 italic">Maternal-Fetal Aware | Two-Life Protocol | Clinical Advisory</p>
            </div>
         </div>
         <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[30px] border border-rose-500/20 shadow-2xl">
            {['V1', 'V2', 'V3'].map((lvl) => (
              <button 
                key={lvl} 
                onClick={() => runIntelligenceScan(lvl as any)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl && intelResult.status !== 'idle' ? 'bg-rose-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
              >
                {lvl} {lvl === 'V1' ? 'MATERNAL' : lvl === 'V2' ? 'EMERGENCY' : 'ESCALATION'}
              </button>
            ))}
         </div>
      </div>

      {intelResult.status === 'loading' ? (
        <div className="py-32 flex flex-col items-center gap-8 opacity-40">
           <Loader2 size={64} className="animate-spin text-rose-500" />
           <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse text-rose-100">Synchronizing Obstetric Lattice...</p>
        </div>
      ) : intelResult.status === 'idle' ? (
        <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-8 select-none">
           <HeartPulse size={120} />
           <button onClick={() => runIntelligenceScan()} className="px-14 py-6 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-sm hover:bg-rose-600 hover:text-white transition-all">Initialize Obstetric Node</button>
        </div>
      ) : (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-6 duration-700">
           
           {/* HIGH-RISK MARKERS PANEL */}
           <div className="bg-rose-950/20 border-2 border-rose-500/30 p-8 rounded-[40px] flex flex-col md:flex-row items-center gap-8 animate-pulse">
              <div className="w-16 h-16 bg-rose-600 rounded-[20px] flex items-center justify-center text-white shrink-0 shadow-2xl">
                 <AlertCircle size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                 <p className="text-rose-500 font-black uppercase text-[10px] tracking-widest mb-1">Module 2: High-Risk Pregnancy Markers</p>
                 <p className="text-white font-bold text-lg italic leading-tight">
                    {parsedData?.v2?.ALERT || "Assess for: BP > 140/90, Severe headache, Visual changes, Right upper quadrant pain, and Fetal movement changes."}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-[220px] bg-rose-600/10 border-rose-500/20 shadow-rose-500/10`}>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">V1: Maternal Stability</p>
                    <div className={`w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rose]`} />
                 </div>
                 <div>
                    <p className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">{parsedData?.v1?.MATERNAL_STAB || 'Scanning...'}</p>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">Focus: {parsedData?.v1?.FETAL_AWARE || 'Fetal HR Monitoring'}</p>
                 </div>
              </div>

              {/* FETAL SAFETY REMINDERS */}
              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-inner relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform"><Heart size={80}/></div>
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Fetal Safety Node</p>
                 <div>
                    <p className="text-sm font-black text-rose-400 italic uppercase">Gestation: {gestation || '---'} Weeks</p>
                    <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Safety Checklist</p>
                       <p className="text-[11px] text-slate-300 italic leading-relaxed">Confirm fetal kick counts. Continuous CTG recommended if induction node is active.</p>
                    </div>
                 </div>
              </div>

              <div className="bg-rose-900/5 border border-rose-500/20 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-3xl">
                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">V3: Escalation Node</p>
                 <div className="space-y-4">
                    <p className="text-sm text-slate-200 font-medium italic leading-relaxed">{parsedData?.v3?.ESCALATION || 'Monitor for placental abruption or eclampsia signals.'}</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-950/40 p-2 rounded-lg">
                       <Clock size={10} /> Threshold: {parsedData?.v3?.TIMING || 'Action within 30m if BP critical'}
                    </div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 space-y-6">
                 <div className="bg-[#0a0f18] border border-white/5 p-8 rounded-[50px] shadow-2xl space-y-8">
                    <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-4 italic"><Clock size={18} /> Clinical Indicators</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-2">Two-Life Stability</p>
                          <p className="text-[10px] text-slate-300 italic">{parsedData?.outcome?.GOOD || 'Synced'}</p>
                       </div>
                       <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-2">Danger Trend</p>
                          <p className="text-[10px] text-slate-300 italic">{parsedData?.outcome?.BAD || 'None'}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="lg:col-span-7">
                 <div className="bg-[#111827] border border-rose-500/10 rounded-[60px] p-10 shadow-3xl h-full flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6"><TrendingUp size={18} className="text-rose-500" /><h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Obstetric Narrative</h4></div>
                    <div className="prose prose-invert max-w-none text-xl text-slate-300 italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">{intelResult.text}</div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col items-center gap-10 pt-6">
              <button onClick={() => speakText(intelResult.text)} className="px-24 py-10 bg-rose-600 hover:bg-rose-500 text-white rounded-[50px] font-black uppercase text-xl tracking-[0.4em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 border-white/10 italic group">
                <Volume2 size={36} className="group-hover:scale-110" /> [ Explain Obstetric Status ]
              </button>
              <div className="p-8 bg-indigo-950/10 border border-indigo-500/10 rounded-[50px] flex items-start gap-8 shadow-inner opacity-70 w-full">
                 <Info size={28} className="text-indigo-400 shrink-0" />
                 <p className="text-[10px] font-black text-white uppercase italic tracking-widest leading-relaxed">
                   Institutional Advisory: Obstetric nodes are purely assistive and based on standard guidelines. All clinical paths must be verified by the consultant. AI never replacement fetal monitoring protocols.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ObstetricIntelligenceHub;

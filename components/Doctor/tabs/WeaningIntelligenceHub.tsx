import React, { useState, useMemo, useEffect } from 'react';
import { 
  Waves, Sparkles, Loader2, ShieldCheck, Volume2, Target, AlertTriangle, 
  Activity, Zap, Info, TrendingUp, HeartPulse, Droplets, Brain, 
  CheckCircle2, Siren, HelpCircle, RefreshCw, ClipboardCheck, ListChecks,
  AlertCircle, ShieldPlus, ChevronRight, X, UserCheck
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutWeaningIntelligenceStream, speakText } from '../../../geminiService';

interface WeaningIntelligenceHubProps {
  patient: Patient;
  settings: any;
  vitals: any;
  readOnly?: boolean;
}

const WeaningIntelligenceHub: React.FC<WeaningIntelligenceHubProps> = ({ patient, settings, vitals, readOnly = false }) => {
  const [intelResult, setIntelResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');

  const runWeaningScan = async (level: 'V1' | 'V2' | 'V3' = selectedLevel) => {
    if (readOnly) return;
    setSelectedLevel(level);
    setIntelResult({ text: "", status: 'loading' });
    try {
      const stream = sushrutWeaningIntelligenceStream({ patient, settings, vitals, level });
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
    const data: any = { v1: {}, v2: {}, v3: {}, checklist: [], sbt: {}, post: {} };
    const lines = intelResult.text.split('\n');
    lines.forEach(line => {
      if (line.includes('WEAN_V1:')) data.v1 = parseParts(line, 'WEAN_V1:');
      else if (line.includes('WEAN_V2:')) data.v2 = parseParts(line, 'WEAN_V2:');
      else if (line.includes('WEAN_V3:')) data.v3 = parseParts(line, 'WEAN_V3:');
      else if (line.includes('WEAN_CHECKLIST:')) data.checklist.push(parseParts(line, 'WEAN_CHECKLIST:'));
      else if (line.includes('WEAN_SBT:')) data.sbt = parseParts(line, 'WEAN_SBT:');
      else if (line.includes('WEAN_POST:')) data.post = parseParts(line, 'WEAN_POST:');
    });
    return data;
  }, [intelResult.text]);

  const handleExplain = () => {
    if (intelResult.text) {
      speakText(intelResult.text, 'Zephyr');
    }
  };

  return (
    <div className={`bg-[#05070a] border border-emerald-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700 mt-10 ${readOnly ? 'ring-1 ring-emerald-500/5' : ''}`}>
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12"><Waves size={300} /></div>
      
      {/* HEADER HUB */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <Waves size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Weaning & Extubation Intelligence</h3>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic">Safe Liberation | Lung-Protective | Patient-Specific Advisory</p>
            </div>
         </div>
         {!readOnly && (
           <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[30px] border border-emerald-500/20 shadow-2xl">
              {['V1', 'V2', 'V3'].map((lvl) => (
                <button 
                  key={lvl} 
                  onClick={() => runWeaningScan(lvl as any)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl && intelResult.status !== 'idle' ? 'bg-emerald-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
                >
                  {lvl} {lvl === 'V1' ? 'READY' : lvl === 'V2' ? 'WORK' : 'CONDITION'}
                </button>
              ))}
           </div>
         )}
         {readOnly && (
           <div className="px-6 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-full">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">HDU Monitor View (Read-Only)</span>
           </div>
         )}
      </div>

      {intelResult.status === 'loading' ? (
        <div className="py-32 flex flex-col items-center gap-8 opacity-40">
           <Loader2 size={64} className="animate-spin text-emerald-500" />
           <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse">Analyzing Spontaneous Breath Patterns...</p>
        </div>
      ) : intelResult.status === 'idle' ? (
        <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-8 select-none">
           <Waves size={120} />
           {readOnly ? (
             <p className="text-sm font-black uppercase tracking-widest italic text-gray-500">Awaiting Intensivist Initialization...</p>
           ) : (
             <button onClick={() => runWeaningScan()} className="px-14 py-6 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-sm hover:bg-emerald-600 hover:text-white transition-all">Initialize Weaning Logic</button>
           )}
        </div>
      ) : (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-6 duration-700">
           
           {/* Section 1: Readiness Indicators */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-[220px] ${parsedData?.v1?.READINESS === 'Likely Ready' ? 'bg-emerald-600/10 border-emerald-500/20 shadow-emerald-500/10' : parsedData?.v1?.READINESS === 'Not Ready' ? 'bg-red-600/10 border-red-500/20' : 'bg-amber-600/10 border-amber-500/20'}`}>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">V1: Readiness Level</p>
                    {parsedData?.v1?.READINESS === 'Likely Ready' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-amber-500" />}
                 </div>
                 <div>
                    <p className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{parsedData?.v1?.READINESS || 'Scanning...'}</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-4 leading-relaxed italic">"{parsedData?.v1?.MSG}"</p>
                 </div>
              </div>

              <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-inner">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">V2: Work of Breathing Pulse</p>
                 <div>
                    <p className="text-xl font-black text-white italic uppercase tracking-tight">{parsedData?.v2?.PHYSIO || 'Nominal Reserve'}</p>
                    <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">WOB Advisory</p>
                       <p className="text-[11px] text-slate-300 italic mt-1 leading-relaxed">{parsedData?.v2?.ADVISORY}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[40px] flex flex-col justify-between h-[220px] shadow-3xl">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">V3: {parsedData?.v3?.CONTEXT || 'Specific Path'}</p>
                    <Siren size={18} className="text-indigo-500" />
                 </div>
                 <p className="text-sm text-slate-200 font-medium italic leading-relaxed">
                   {parsedData?.v3?.SPECIFIC_ADVICE || "Awaiting condition-specific correlation..."}
                 </p>
              </div>
           </div>

           {/* Extubation Checklist Sidebar */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-[#0a0f18] border border-white/5 p-10 rounded-[50px] shadow-2xl space-y-8">
                    <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-4 italic">
                       <ListChecks size={18} /> Extubation Risk Checklist
                    </h4>
                    <div className="space-y-4">
                       {parsedData?.checklist?.map((item: any, i: number) => (
                         <div key={i} className="flex items-center justify-between p-5 bg-black/20 rounded-[28px] border border-white/5 group hover:bg-emerald-600/5 transition-all">
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{item.ITEM}</span>
                            <span className={`text-xs font-black uppercase italic ${item.STATUS === 'Pass' ? 'text-emerald-500' : item.STATUS === 'Fail' ? 'text-red-500' : 'text-amber-500'}`}>
                               {item.STATUS}
                            </span>
                         </div>
                       ))}
                       {(!parsedData?.checklist || parsedData.checklist.length === 0) && (
                         <div className="py-10 text-center opacity-20 italic text-[10px] uppercase tracking-widest">Awaiting checklist synthesis...</div>
                       )}
                    </div>
                 </div>
              </div>

              {/* SBT & Post-Extubation Advice */}
              <div className="lg:col-span-8 space-y-8">
                 <div className="bg-[#111827] border border-indigo-500/20 p-10 rounded-[60px] shadow-3xl space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none rotate-6"><ClipboardCheck size={200}/></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-3">
                             <HeartPulse size={16} /> SBT Advisory Node
                          </h4>
                          <p className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">
                            {parsedData?.sbt?.ADVISORY || "Monitoring stability for trial consideration..."}
                          </p>
                          <div className="p-6 bg-black/40 rounded-[32px] border border-white/5">
                             <p className="text-[9px] font-black text-gray-600 uppercase mb-4 tracking-widest">Risk Factors</p>
                             <div className="text-xs text-slate-300 italic leading-relaxed whitespace-pre-wrap">
                                {parsedData?.sbt?.RISK_FACTORS || "• Standard precautions active"}
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic flex items-center gap-3">
                             <Siren size={16} /> Post-Extubation Care
                          </h4>
                          <div className="bg-cyan-600/5 p-6 rounded-[32px] border border-cyan-500/20 space-y-4 shadow-inner">
                             <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Support Node</p>
                             <p className="text-sm font-medium text-slate-200 italic">"{parsedData?.post?.SUPPORT}"</p>
                          </div>
                          <div className="bg-amber-600/5 p-6 rounded-[32px] border border-amber-500/20 space-y-4 shadow-inner">
                             <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Critical Window</p>
                             <p className="text-sm font-medium text-slate-200 italic">"{parsedData?.post?.WINDOW}"</p>
                          </div>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                       <button 
                          onClick={handleExplain}
                          className="px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[40px] font-black uppercase text-xs tracking-[0.3em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-4 border border-white/10 italic"
                       >
                          <Volume2 size={24} /> [ Explain Weaning Status ]
                       </button>
                       <div className="flex items-center gap-3 opacity-40">
                          <ShieldCheck size={16} className="text-emerald-500" />
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Protocol Sync Secured</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Safety Node Footer */}
           <div className="p-8 bg-emerald-950/10 border border-emerald-500/10 rounded-[50px] flex items-start gap-8 shadow-inner opacity-70">
              <div className="w-14 h-14 rounded-[22px] bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10 shrink-0">
                 <UserCheck size={28} />
              </div>
              <div className="space-y-2">
                 <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                    Extubation Readiness Disclaimer: AI advice is assistive and based on physiological patterns. Weaning trials or extubation MUST be conducted under the direct supervision of an Intensivist. AI never pressures timing — safety &gt; speed always.
                 </p>
                 <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest italic">Node: wean-pro-v1 • Institutional Safety Kernel: Active</p>
              </div>
           </div>

        </div>
      )}
    </div>
  );
};

export default WeaningIntelligenceHub;
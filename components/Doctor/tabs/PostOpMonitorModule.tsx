import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, Activity, TrendingUp, AlertTriangle, Scale, Pill, CheckCircle2, 
  Loader2, Sparkles, Volume2, ChevronRight, X, Clock, ClipboardList, Info, HeartPulse
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutPostOpRiskMonitorStream, speakText } from '../../../geminiService';

interface PostOpMonitorModuleProps {
  patient: Patient;
  procedure: string;
  approach: string;
}

const PostOpMonitorModule: React.FC<PostOpMonitorModuleProps> = ({ patient, procedure, approach }) => {
  const [monitorResult, setMonitorResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [showCounseling, setShowCounseling] = useState(false);

  const runMonitor = async () => {
    setMonitorResult({ text: "", status: 'loading' });
    try {
      const stream = sushrutPostOpRiskMonitorStream({ patient, procedure, approach });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setMonitorResult(prev => ({ ...prev, text: fullText }));
      }
      setMonitorResult(prev => ({ ...prev, status: 'done' }));
    } catch (err) {
      setMonitorResult(prev => ({ ...prev, status: 'error' }));
    }
  };

  const parsedData = useMemo(() => {
    if (!monitorResult.text) return null;
    const sections: Record<string, any[]> = { outcome: [], risks: [], meds: [], pathway: [], timeline: [] };
    const lines = monitorResult.text.split('\n');

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

    lines.forEach(line => {
      if (line.includes('PO_OUTCOME:')) sections.outcome.push(parseParts(line, 'PO_OUTCOME:'));
      else if (line.includes('PO_RISK:')) sections.risks.push(parseParts(line, 'PO_RISK:'));
      else if (line.includes('PO_MED_CHECK:')) sections.meds.push(parseParts(line, 'PO_MED_CHECK:'));
      else if (line.includes('PO_PATHWAY:')) sections.pathway.push(parseParts(line, 'PO_PATHWAY:'));
      else if (line.includes('PO_TIMELINE:')) sections.timeline.push(parseParts(line, 'PO_TIMELINE:'));
    });
    return sections;
  }, [monitorResult.text]);

  const handleExplain = () => {
    if (!monitorResult.text) return;
    const risks = parsedData?.risks.map(r => r.type).join(', ') || "procedure-specific risks";
    speakText(`Doctor, for ${procedure}, we are monitoring for ${risks}. Expected length of stay is ${parsedData?.outcome[0]?.los || 'standard'} days.`, 'Zephyr');
  };

  return (
    <div className="bg-[#0a0f18] border border-indigo-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12"><Activity size={300} /></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
               <ShieldAlert size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Post-Op Risk Monitor</h3>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">Evidence-based | Early warning | Outcome optimization</p>
            </div>
         </div>
         <button 
           onClick={runMonitor}
           disabled={monitorResult.status === 'loading'}
           className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3 border border-white/10 italic"
         >
            {monitorResult.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            [ Synchronize Risk Node ]
         </button>
      </div>

      {monitorResult.status === 'loading' ? (
        <div className="py-20 flex flex-col items-center gap-6 opacity-40">
           <Loader2 size={48} className="animate-spin text-indigo-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Modeling Post-Op Trajectory...</p>
        </div>
      ) : parsedData ? (
        <div className="space-y-12 relative z-10">
           
           {/* Section 1: Outcome Prediction */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {parsedData.outcome?.map((o, i) => (
                <React.Fragment key={i}>
                  <div className="bg-[#111827] border border-white/5 p-6 rounded-3xl space-y-4">
                     <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Expected Stay (LOS)</p>
                     <p className="text-3xl font-black text-white italic">{o.los || '---'}</p>
                  </div>
                  <div className="bg-[#111827] border border-white/5 p-6 rounded-3xl space-y-4">
                     <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Pain Trajectory</p>
                     <p className="text-sm font-bold text-slate-300 italic">{o.pain || 'Stable'}</p>
                  </div>
                  <div className="bg-[#111827] border border-white/5 p-6 rounded-3xl space-y-4">
                     <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Global Risk Index</p>
                     <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                           <div className={`h-full ${Number(o.risk_bar) > 7 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-1000`} style={{ width: `${(Number(o.risk_bar) || 0) * 10}%` }} />
                        </div>
                        <span className="text-xl font-black text-white italic">{o.risk_bar}/10</span>
                     </div>
                  </div>
                </React.Fragment>
              ))}
           </div>

           {/* Section 2: Risk Matrix */}
           <div className="space-y-6">
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-3 italic"><AlertTriangle size={16}/> Complication Risk Matrix</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {parsedData.risks?.map((r, i) => (
                   <div key={i} className="bg-black/40 border border-white/5 p-6 rounded-3xl space-y-3 group hover:border-red-500/30 transition-all">
                      <div className="flex justify-between items-center">
                         <p className="text-sm font-black text-white uppercase italic">{r.type}</p>
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${r.prob === 'High' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{r.prob} Risk</span>
                      </div>
                      <p className="text-[10px] text-gray-500 italic leading-relaxed group-hover:text-slate-300 transition-colors">"{r.prevent}"</p>
                   </div>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Section 4: Med Optimizer */}
              <div className="bg-amber-900/5 border border-amber-500/20 p-8 rounded-[40px] space-y-6 shadow-inner">
                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-3"><Pill size={16}/> Medication Guard</h4>
                 <div className="space-y-4">
                    {parsedData.meds?.map((m, i) => (
                      <div key={i} className="p-5 bg-[#0a0f18] rounded-2xl border border-gray-800 space-y-3">
                         <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black bg-amber-600 text-white px-2 py-0.5 rounded uppercase">{m.flag}</span>
                            <p className="text-xs font-bold text-white uppercase italic">{m.msg}</p>
                         </div>
                         <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Reco: {m.reco}</p>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Section 5: Pathway Audit */}
              <div className="bg-indigo-900/5 border border-indigo-500/20 p-8 rounded-[40px] space-y-6 shadow-inner">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-3"><ClipboardList size={16}/> Pathway Checker (ERAS)</h4>
                 <div className="space-y-3">
                    {parsedData.pathway?.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                         <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${p.status === 'Completed' ? 'bg-emerald-500' : p.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                            <span className="text-xs font-bold text-gray-300 uppercase">{p.step}</span>
                         </div>
                         <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{p.status}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Section 8: Timeline */}
           <div className="bg-[#111827] border border-white/5 p-10 rounded-[50px] space-y-8">
              <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic flex items-center gap-3"><Clock size={16}/> Longitudinal Care Timeline</h4>
              <div className="flex flex-wrap gap-4">
                 {parsedData.timeline?.map((t, i) => (
                   <div key={i} className="flex-1 min-w-[200px] bg-black/40 p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform"><Clock size={40}/></div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase mb-3 italic">Day {t.day} Protocol</p>
                      <p className="text-sm font-bold text-white uppercase italic tracking-tight">{t.priority}</p>
                   </div>
                 ))}
              </div>
           </div>

           <div className="flex justify-center gap-6 pt-6">
              <button 
                onClick={handleExplain}
                className="px-10 py-5 bg-indigo-600 text-white rounded-[32px] font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3 border border-white/10 italic"
              >
                <Volume2 size={20} /> [ Explain Possible Complications ]
              </button>
              <button 
                onClick={() => setShowCounseling(true)}
                className="px-10 py-5 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-[32px] font-black uppercase text-[10px] tracking-widest shadow-xl transition-all"
              >
                Generate Counseling Summary
              </button>
           </div>
        </div>
      ) : (
        <div className="py-20 text-center opacity-20 grayscale flex flex-col items-center gap-6">
           <HeartPulse size={80} className="text-gray-700 animate-pulse" />
           <p className="text-xs font-black uppercase tracking-[0.4em]">Awaiting clinical confirmation for risk modeling</p>
        </div>
      )}

      {showCounseling && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="bg-[#111827] border border-indigo-500/20 w-full max-w-2xl rounded-[60px] p-12 shadow-4xl relative">
              <button onClick={() => setShowCounseling(false)} className="absolute top-10 right-10 text-gray-600 hover:text-white"><X size={32}/></button>
              <div className="space-y-8">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><ClipboardList size={28}/></div>
                    <h3 className="text-2xl font-black text-white uppercase italic">Recovery Counseling</h3>
                 </div>
                 <div className="bg-[#0a0f18] p-8 rounded-[40px] border border-gray-800 max-h-[400px] overflow-y-auto custom-scrollbar italic text-slate-300 leading-relaxed">
                    {monitorResult.text || "Generating simple language summary..."}
                 </div>
                 <button className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest italic shadow-xl">Print for Patient</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PostOpMonitorModule;
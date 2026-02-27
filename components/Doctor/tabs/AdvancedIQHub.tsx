import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Activity, TrendingUp, BarChart3, Clock, 
  CheckCircle2, Scale, Target, Loader2, Sparkles, Volume2, 
  AlertTriangle, History, Info, ChevronRight, FileText,
  Building2, LineChart, Pill, Database, HeartPulse,
  TrendingDown, AlertCircle, Bot, ShieldCheck, ListChecks, Calendar,
  HeartHandshake, ClipboardCheck, ArrowUpRight, Zap, CheckSquare, Square
} from 'lucide-react';
import { Patient } from '../../../types';
import { 
  sushrutMortalitySepsisStream, 
  sushrutCostLOSOptimizationStream, 
  sushrutDischargeReadinessStream, 
  sushrutSurgicalBenchmarkingStream,
  sushrutReadmissionPreventionStream,
  speakText 
} from '../../../geminiService';
import { runAI } from '../../Shared/AppEventToast';

interface AdvancedIQHubProps {
  patient: Patient;
  vitals: any;
  procedure?: string;
}

const AdvancedIQHub: React.FC<AdvancedIQHubProps> = ({ patient, vitals, procedure = "Post-Op Recovery" }) => {
  const [activeModule, setActiveModule] = useState<'RISK' | 'LOS' | 'READY' | 'BENCH' | 'RPI'>('RISK');
  const [moduleResults, setModuleResults] = useState<Record<string, { text: string, status: string }>>({
    RISK: { text: '', status: 'idle' },
    LOS: { text: '', status: 'idle' },
    READY: { text: '', status: 'idle' },
    BENCH: { text: '', status: 'idle' },
    RPI: { text: '', status: 'idle' }
  });

  const [approvedPreventionSteps, setApprovedPreventionSteps] = useState<string[]>([]);

  const runModule = async (mod: 'RISK' | 'LOS' | 'READY' | 'BENCH' | 'RPI') => {
    setActiveModule(mod);
    await runAI("susruta", async () => {
      setModuleResults(prev => ({ ...prev, [mod]: { ...prev[mod], status: 'loading', text: '' } }));
      
      let stream;
      if (mod === 'RISK') stream = sushrutMortalitySepsisStream({ patient, vitals });
      else if (mod === 'LOS') stream = sushrutCostLOSOptimizationStream({ patient, procedure });
      else if (mod === 'READY') stream = sushrutDischargeReadinessStream({ patient });
      else if (mod === 'BENCH') stream = sushrutSurgicalBenchmarkingStream({ procedure, patient });
      else stream = sushrutReadmissionPreventionStream({ patient });

      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setModuleResults(prev => ({ ...prev, [mod]: { ...prev[mod], text: fullText } }));
      }
      // Fix: Correctly update the specific module status in the state record
      setModuleResults(prev => ({ ...prev, [mod]: { ...prev[mod], status: 'done' } }));
    }, () => {
      // Fix: Correctly update the specific module status in the state record
      setModuleResults(prev => ({ ...prev, [mod]: { ...prev[mod], status: 'error' } }));
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

  const parsedRisk = useMemo(() => {
    if (activeModule !== 'RISK' || !moduleResults.RISK.text) return null;
    const data: any = { mortality: {}, sepsis: {}, trend: '', alert: '' };
    moduleResults.RISK.text.split('\n').forEach(line => {
      if (line.includes('MORTALITY RISK:')) data.mortality = parseParts(line, 'MORTALITY RISK:');
      if (line.includes('SEPSIS RISK:')) data.sepsis = parseParts(line, 'SEPSIS RISK:');
      if (line.includes('TREND ANALYSIS:')) data.trend = line.replace('TREND ANALYSIS:', '').trim();
      if (line.includes('ADVISORY ALERT:')) data.alert = line.replace('ADVISORY ALERT:', '').trim();
    });
    return data;
  }, [moduleResults.RISK.text, activeModule]);

  const parsedLOS = useMemo(() => {
    if (activeModule !== 'LOS' || !moduleResults.LOS.text) return null;
    const data: any = { estimate: {}, drivers: [], risks: [], strategy: [] };
    moduleResults.LOS.text.split('\n').forEach(line => {
      if (line.includes('LOS_ESTIMATE:')) data.estimate = parseParts(line, 'LOS_ESTIMATE:');
    });
    return data;
  }, [moduleResults.LOS.text, activeModule]);

  const parsedRPI = useMemo(() => {
    if (activeModule !== 'RPI' || !moduleResults.RPI.text) return null;
    const data: any = { score: {}, drivers: [], prevention: [], checklist: [], followup: "", reasoning: "" };
    const lines = moduleResults.RPI.text.split('\n');
    lines.forEach(line => {
      if (line.includes('RPI_SCORE:')) data.score = parseParts(line, 'RPI_SCORE:');
      if (line.includes('RPI_DRIVERS:')) {
        const raw = line.replace('RPI_DRIVERS:', '').trim();
        data.drivers = raw.split(',').map(s => s.trim().replace(/^\[|\]$/g, ''));
      }
      if (line.includes('RPI_PREVENTION:')) data.prevention.push(parseParts(line, 'RPI_PREVENTION:'));
      if (line.includes('RPI_CHECKLIST:')) data.checklist.push(parseParts(line, 'RPI_CHECKLIST:'));
      if (line.includes('RPI_FOLLOWUP:')) data.followup = line.replace('RPI_FOLLOWUP:', '').trim();
      if (line.includes('RPI_REASONING:')) data.reasoning = line.replace('RPI_REASONING:', '').trim();
    });
    return data;
  }, [moduleResults.RPI.text, activeModule]);

  const togglePrevention = (step: string) => {
    setApprovedPreventionSteps(prev => 
      prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]
    );
  };

  const handleExplain = () => {
    speakText(moduleResults[activeModule].text, 'Zephyr');
  };

  return (
    <div className="bg-[#0f172a] border border-slate-700 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Database size={300} /></div>
      
      {/* HUD HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
               <Target size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Advanced Clinical IQ</h3>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">V6.5 Predictive & Optimization Layer</p>
            </div>
         </div>
         <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-white/5 shadow-inner overflow-x-auto scrollbar-hide">
            {[
              { id: 'RISK', label: 'Risk Monitor', icon: ShieldAlert },
              { id: 'LOS', label: 'Cost/LOS Opt', icon: TrendingDown },
              { id: 'READY', label: 'Readiness', icon: CheckCircle2 },
              { id: 'RPI', label: 'Readmission', icon: HeartHandshake },
              { id: 'BENCH', label: 'Benchmark', icon: BarChart3 }
            ].map(m => (
              <button 
                key={m.id}
                onClick={() => { if(moduleResults[m.id].status === 'idle') runModule(m.id as any); else setActiveModule(m.id as any); }}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeModule === m.id ? 'bg-indigo-600 text-white shadow-lg italic' : 'text-slate-500 hover:text-white'}`}
              >
                 <m.icon size={14} /> {m.label}
              </button>
            ))}
         </div>
      </div>

      {/* DYNAMIC MODULE VIEW */}
      <div className="min-h-[400px] relative z-10">
         {moduleResults[activeModule].status === 'loading' ? (
            <div className="py-32 flex flex-col items-center gap-6 opacity-40">
               <Loader2 size={48} className="animate-spin text-indigo-500" />
               <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Scanning Institutional Probability Nodes...</p>
            </div>
         ) : moduleResults[activeModule].status === 'idle' ? (
            <div className="py-32 flex flex-col items-center justify-center text-center opacity-10 grayscale gap-8">
               <HeartPulse size={120} />
               <button onClick={() => runModule(activeModule)} className="px-12 py-5 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-sm hover:bg-indigo-600 hover:text-white transition-all">Initialize {activeModule} Logic</button>
            </div>
         ) : (
           <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* MODULE 1: RISK MONITOR */}
              {activeModule === 'RISK' && parsedRisk && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-red-950/10 border border-red-500/20 p-8 rounded-[40px] shadow-inner space-y-6 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><ShieldAlert size={100}/></div>
                         <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-3 italic"><AlertTriangle size={16}/> Sepsis Probability Radar</h4>
                         <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-white uppercase italic">{parsedRisk.sepsis['0'] || 'Early'}</span>
                            <div className="text-right">
                               <p className="text-[9px] text-gray-500 font-black uppercase">Risk Index</p>
                               <p className="text-2xl font-black text-red-500 italic">{parsedRisk.sepsis.SCORE || '2'}/10</p>
                            </div>
                         </div>
                         <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${(Number(parsedRisk.sepsis.SCORE) || 2) * 10}%` }} />
                         </div>
                         <p className="text-[11px] text-slate-400 italic leading-relaxed">"{parsedRisk.sepsis.WHY}"</p>
                      </div>

                      <div className="bg-indigo-950/10 border border-indigo-500/20 p-8 rounded-[40px] shadow-inner space-y-6 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><Activity size={100}/></div>
                         <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-3 italic"><TrendingUp size={16}/> Global Mortality Risk</h4>
                         <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-white uppercase italic">{parsedRisk.mortality['0'] || 'Low'}</span>
                            <div className="text-right">
                               <p className="text-[9px] text-gray-500 font-black uppercase">Risk Index</p>
                               <p className="text-2xl font-black text-indigo-500 italic">{parsedRisk.mortality.SCORE || '1'}/10</p>
                            </div>
                         </div>
                         <p className="text-[11px] text-slate-400 italic leading-relaxed">"{parsedRisk.mortality.WHY}"</p>
                      </div>
                   </div>

                   {parsedRisk.alert && (
                     <div className="bg-amber-600/10 border border-amber-500/30 p-6 rounded-[32px] flex items-center gap-6 animate-pulse">
                        <AlertCircle className="text-amber-500 shrink-0" size={24} />
                        <p className="text-sm font-black text-white uppercase italic tracking-tight">"{parsedRisk.alert}"</p>
                     </div>
                   )}
                </div>
              )}

              {/* MODULE 2: LOS OPTIMIZATION */}
              {activeModule === 'LOS' && parsedLOS && (
                <div className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[#111827] border border-white/5 p-6 rounded-3xl space-y-2">
                         <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Current Trajectory</p>
                         <p className="text-3xl font-black text-white italic">{parsedLOS.estimate.CURRENT || '---'} Days</p>
                      </div>
                      <div className="bg-[#111827] border border-emerald-500/20 p-6 rounded-3xl space-y-2">
                         <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Optimized Trajectory</p>
                         <p className="text-3xl font-black text-emerald-400 italic">{parsedLOS.estimate.OPTIMIZED || '---'} Days</p>
                      </div>
                      <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-3xl space-y-2">
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Potential Savings</p>
                         <p className="text-xl font-black text-white italic">₹ {parsedLOS.estimate.SAVINGS || '---'}</p>
                      </div>
                   </div>
                   <div className="bg-[#0a0f18] p-8 rounded-[40px] border border-slate-800 shadow-inner">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic border-b border-white/5 pb-4 flex items-center gap-3"><Clock size={14}/> optimization advisory</h4>
                      <div className="prose prose-invert max-w-none text-slate-300 italic text-sm leading-relaxed whitespace-pre-wrap font-mono">
                         {moduleResults.LOS.text}
                      </div>
                   </div>
                </div>
              )}

              {/* ADD-ON MODULE: RPI (READMISSION PREVENTION INTELLIGENCE) */}
              {activeModule === 'RPI' && parsedRPI && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Risk Score & Drivers (7/12) */}
                      <div className="lg:col-span-7 bg-[#111827] border border-indigo-500/20 p-10 rounded-[50px] shadow-3xl space-y-10 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none"><HeartHandshake size={120}/></div>
                         <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-3 italic"><ShieldCheck size={16}/> Readmission Risk Assessment</h4>
                         
                         <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                               <div className="space-y-1">
                                  <p className="text-5xl font-black text-white italic tracking-tighter">{parsedRPI.score['0'] || '---'}</p>
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{parsedRPI.score.LEVEL} 30-Day Risk</p>
                               </div>
                               <div className="text-right">
                                  <div className="flex items-center gap-2 mb-2 justify-end">
                                     <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                     <span className="text-[10px] font-black text-white italic">{parsedRPI.score.BAR_VAL}/10</span>
                                  </div>
                                  <div className="w-40 h-1.5 bg-gray-900 rounded-full overflow-hidden">
                                     <div className={`h-full ${Number(parsedRPI.score.BAR_VAL) > 7 ? 'bg-red-500' : 'bg-indigo-500'} transition-all duration-1000`} style={{ width: `${(Number(parsedRPI.score.BAR_VAL) || 0) * 10}%` }} />
                                  </div>
                               </div>
                            </div>

                            <div className="bg-black/40 p-6 rounded-[32px] border border-white/5 space-y-4">
                               <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2 italic"><AlertCircle size={12}/> Key Readmission Drivers</p>
                               <div className="flex flex-wrap gap-2">
                                  {parsedRPI.drivers.map((d: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-red-600/5 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase">{d}</span>
                                  ))}
                               </div>
                            </div>

                            {/* REASONING EXPLANATION (FIXED) */}
                            <div className="bg-[#0a0f18] p-8 rounded-[40px] border border-indigo-500/10 shadow-inner space-y-4">
                               <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 italic"><ClipboardCheck size={12}/> Institutional Reasoning Node</p>
                               <div className="prose prose-invert max-w-none text-[13px] text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono">
                                  {parsedRPI.reasoning || "Awaiting detailed probability synthesis..."}
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Checklist & Follow-up Reminders (5/12) */}
                      <div className="lg:col-span-5 bg-[#111827] border border-white/10 p-10 rounded-[50px] shadow-3xl space-y-10">
                         <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-3 italic"><ListChecks size={16}/> Discharge Alignment Matrix</h4>
                         <div className="space-y-4">
                            {parsedRPI.checklist.map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 group hover:bg-emerald-600/5 transition-all">
                                 <span className="text-xs font-bold text-gray-300 uppercase tracking-wide italic">{item.ITEM}</span>
                                 <span className={`text-lg font-black ${item.STATE === '✔' ? 'text-emerald-500' : item.STATE === 'Fail' ? 'text-amber-500' : 'text-red-500'}`}>{item.STATE}</span>
                              </div>
                            ))}
                         </div>
                         <div className="bg-indigo-900/5 p-6 rounded-[32px] border border-indigo-500/10 space-y-3">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-2"><Calendar size={12}/> AI Follow-up Logic Enabled</p>
                            <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed">"{parsedRPI.followup}"</p>
                         </div>
                      </div>
                   </div>

                   {/* Prevention Actions */}
                   <div className="bg-[#0a0f18] border border-indigo-500/10 p-10 rounded-[60px] shadow-inner space-y-8">
                      <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-3 italic"><Zap size={16}/> Recommended Prevention Protocol</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {parsedRPI.prevention.map((p: any, i: number) => (
                           <div 
                             key={i} 
                             onClick={() => togglePrevention(p.STEP)}
                             className={`p-8 rounded-[40px] border transition-all cursor-pointer group flex flex-col justify-between h-full ${approvedPreventionSteps.includes(p.STEP) ? 'bg-emerald-600/5 border-emerald-500/30' : 'bg-[#111827] border-gray-800 hover:border-indigo-500/20'}`}
                           >
                              <div className="flex items-start gap-6">
                                 <div className="shrink-0 mt-1">
                                    {approvedPreventionSteps.includes(p.STEP) ? <CheckSquare size={24} className="text-emerald-500" /> : <Square size={24} className="text-gray-700" />}
                                 </div>
                                 <div className="space-y-3">
                                    <p className="text-lg font-black text-white italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors leading-none">{p.STEP}</p>
                                    <p className="text-[11px] text-slate-400 italic leading-relaxed">"{p.RATIONALE}"</p>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {/* SHARED MODULE FOOTER: RAW OUTPUT & SPEECH */}
              {['READY', 'BENCH'].includes(activeModule) && (
                <div className="bg-[#0a0f18] p-10 rounded-[50px] border border-slate-800 shadow-inner relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none"><Sparkles size={200}/></div>
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-8 italic border-b border-white/5 pb-4 flex items-center gap-3">
                      <Bot size={16} /> SYSTEM SYNTHESIS OUTPUT
                   </h4>
                   <div className="prose prose-invert max-w-none text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                      {moduleResults[activeModule].text}
                   </div>
                </div>
              )}

              <div className="flex justify-center gap-8 pt-6">
                 <button 
                   onClick={handleExplain}
                   className="px-14 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[40px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 border border-white/10 italic"
                 >
                    <Volume2 size={24} /> [ Explain {activeModule === 'RPI' ? 'Readmission Risk' : 'Intelligence Node'} ]
                 </button>
                 <button 
                   onClick={() => runModule(activeModule)}
                   className="px-14 py-6 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-[40px] font-black uppercase text-xs tracking-widest transition-all"
                 >
                    Refresh Sync
                 </button>
              </div>
           </div>
         )}
      </div>

      {/* Fix: Changed undefined 'BalanceIcon' to 'Scale' */}
      <div className="mt-10 p-8 bg-indigo-900/10 border border-indigo-500/10 rounded-[40px] flex items-start gap-6 shadow-inner opacity-60">
          <Info className="text-indigo-400 shrink-0" size={24} />
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-relaxed">
                Advisory Protocol: AI predictive modules are purely assistive. All clinical findings must be verified by the treating consultant. No decision should be made solely based on AI scores.
             </p>
             <p className="text-[8px] text-indigo-500/40 font-bold uppercase tracking-widest italic">Advanced IQ Core v6.5 • Last Audit: {new Date().toLocaleTimeString()}</p>
          </div>
      </div>
    </div>
  );
};

export default AdvancedIQHub;
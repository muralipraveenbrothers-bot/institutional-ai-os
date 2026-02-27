
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, Brain, Activity, Target, ShieldCheck, Microscope, 
  ArrowDown, AlertTriangle, CheckCircle2, ChevronDown, 
  ChevronRight, Volume2, Loader2, Sparkles, X, Info,
  Layers, Dna, Biohazard, Orbit, FlaskConical, Pill, 
  TrendingUp, Scaling, ShieldAlert, Droplets, Thermometer,
  Wind, Clock, AlertOctagon, HeartPulse, RefreshCw
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutAdvancedInvestigationIntelligenceStream, speakText } from '../../../geminiService';

interface AdvancedInvProps {
  patient: Patient;
}

const AdvancedInvestigationIntelligence: React.FC<AdvancedInvProps> = ({ patient }) => {
  const [intel, setIntel] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' });
  
  const runAnalysis = async () => {
    setIntel({ text: "", status: 'loading' });
    try {
      const stream = sushrutAdvancedInvestigationIntelligenceStream({ patient });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setIntel(prev => ({ ...prev, text: fullText }));
      }
      setIntel(prev => ({ ...prev, status: 'done' }));
    } catch (e) {
      setIntel(prev => ({ ...prev, status: 'idle' }));
    }
  };

  useEffect(() => {
    if (intel.status === 'idle') runAnalysis();
  }, [patient.id]);

  const parsedData = useMemo(() => {
    const data: any = {
      earlyCellular: [],
      bloodMarkers: [],
      energyPathways: [],
      organMap: [],
      medLogic: [],
      disasterStrategy: []
    };

    if (intel.text) {
      const lines = intel.text.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('CELL_EVENT:')) {
          const parts = trimmed.replace('CELL_EVENT:', '').split('|').map(p => p.trim());
          if (parts.length >= 3) data.earlyCellular.push({ trigger: parts[0], mechanism: parts[1], effect: parts[2] });
        } else if (trimmed.startsWith('MARKER:')) {
          const parts = trimmed.replace('MARKER:', '').split('|').map(p => p.trim());
          if (parts.length >= 3) data.bloodMarkers.push({ name: parts[0], reason: parts[1], interpretation: parts[2] });
        } else if (trimmed.startsWith('ENERGY:')) {
          const parts = trimmed.replace('ENERGY:', '').split('|').map(p => p.trim());
          if (parts.length >= 3) data.energyPathways.push({ shift: parts[0], atp: parts[1], lactate: parts[2] });
        } else if (trimmed.startsWith('ORGAN:')) {
          const parts = trimmed.replace('ORGAN:', '').split('|').map(p => p.trim());
          if (parts.length >= 3) data.organMap.push({ organ: parts[0], dysfunction: parts[1], indicator: parts[2] });
        } else if (trimmed.startsWith('ACTION:')) {
          const parts = trimmed.replace('ACTION:', '').split('|').map(p => p.trim());
          if (parts.length >= 3) data.medLogic.push({ action: parts[0], condition: parts[1], rationale: parts[2] });
        } else if (trimmed.startsWith('STRATEGY:')) {
          const parts = trimmed.replace('STRATEGY:', '').split('|').map(p => p.trim());
          if (parts.length >= 3) data.disasterStrategy.push({ action: parts[0], avoidance: parts[1], goal: parts[2] });
        }
      });
    }
    return data;
  }, [intel.text]);

  const hasData = useMemo(() => {
    return Object.values(parsedData).some((arr: any) => arr.length > 0);
  }, [parsedData]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 py-10 font-['Inter']">
      
      {/* 🧬 HEADER: INVESTIGATION INTELLIGENCE HUB */}
      <div className="bg-gradient-to-br from-[#0a1f33] to-[#05070a] border border-indigo-500/30 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Orbit size={400} /></div>
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-16 border-b border-white/5 pb-10 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-[30px] flex items-center justify-center text-white shadow-[0_15px_45px_rgba(99,102,241,0.4)] border border-white/10">
               <Brain size={40} />
            </div>
            <div>
               <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Intelligence Deep Dive</h2>
               <p className="text-[10px] text-indigo-400 uppercase font-black mt-3 tracking-[0.6em] italic">Forensic Molecular & Systemic Mapping Node v3.0</p>
            </div>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={runAnalysis}
                className="p-5 bg-white/5 hover:bg-indigo-600 transition-all rounded-3xl border border-white/10 text-gray-500 hover:text-white shadow-2xl active:scale-95 group"
             >
                <RefreshCw size={24} className={intel.status === 'loading' ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-1000'} />
             </button>
             <button 
                onClick={() => speakText(intel.text)}
                className="p-5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-3xl border border-indigo-500/20 shadow-2xl transition-all active:scale-95"
             >
                <Volume2 size={24} />
             </button>
          </div>
        </div>

        {intel.status === 'loading' && !intel.text ? (
          <div className="py-40 flex flex-col items-center gap-12 opacity-50">
             <div className="relative">
                <Loader2 size={120} className="animate-spin text-indigo-500" />
                <div className="absolute inset-0 flex items-center justify-center"><Dna size={40} className="animate-pulse text-indigo-500" /></div>
             </div>
             <p className="text-xl font-black text-white uppercase tracking-[1.2em] animate-pulse ml-[1.2em]">Synthesizing Biological Matrix...</p>
          </div>
        ) : hasData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
             
             {/* 🔴 LEFT: SYSTEMIC PROGRESSION (8/12) */}
             <div className="lg:col-span-8 space-y-12">
                
                {/* 1. EARLY LOCAL CELLULAR EVENTS */}
                {parsedData.earlyCellular.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] italic ml-6 mb-4 flex items-center gap-4">
                        <Target size={16} className="text-indigo-500"/> Phase 1: Local Cellular Ingress
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {parsedData.earlyCellular.map((cell: any, i: number) => (
                          <div key={i} className="bg-[#111827] border border-indigo-500/10 p-8 rounded-[45px] shadow-inner space-y-4 hover:border-indigo-500/40 transition-all group">
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-black text-white uppercase italic tracking-tight group-hover:text-indigo-400 transition-colors">{cell.trigger}</span>
                                <Zap size={16} className="text-indigo-500/40 group-hover:animate-pulse" />
                            </div>
                            <p className="text-sm text-slate-400 font-medium italic">Mechanism: {cell.mechanism}</p>
                            <p className="text-[11px] text-gray-600 font-black uppercase tracking-widest leading-none pt-4 border-t border-white/5">Effect: {cell.effect}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. BLOOD MARKER CORRELATION HEATMAP */}
                {parsedData.bloodMarkers.length > 0 && (
                  <div className="bg-[#05070a] p-10 rounded-[60px] border border-white/5 shadow-inner space-y-8">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] italic mb-6 flex items-center gap-4">
                        <FlaskConical size={18}/> Phase 2: Indirect Laboratory Indicators
                    </h4>
                    <div className="space-y-4">
                        {parsedData.bloodMarkers.map((marker: any, i: number) => (
                          <div key={i} className="bg-[#111827] border border-gray-800 p-6 rounded-[35px] flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-[#0a0f18] transition-all">
                            <div className="flex items-center gap-6 flex-1">
                                <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  <TrendingUp size={24} />
                                </div>
                                <div>
                                  <p className="text-lg font-black text-white uppercase italic group-hover:text-indigo-400 transition-colors">{marker.name}</p>
                                  <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Shift Origin: {marker.reason}</p>
                                </div>
                            </div>
                            <div className="md:w-1/2 p-4 bg-black/40 rounded-3xl border border-white/5">
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Clinical Logic Node</p>
                                <p className="text-xs text-slate-300 italic font-medium leading-relaxed">"{marker.interpretation}"</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 3. ORGAN SYSTEM DYSFUNCTION MAP */}
                {parsedData.organMap.length > 0 && (
                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] italic ml-6 mb-4 flex items-center gap-4">
                        <Biohazard size={18}/> Phase 3: Systemic Multi-Organ Risk
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {parsedData.organMap.map((org: any, i: number) => (
                          <div key={i} className="bg-red-950/10 border border-red-500/20 p-8 rounded-[45px] shadow-3xl space-y-6 flex flex-col justify-between h-full group hover:bg-red-900/10 transition-all">
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                  <span className="text-xl font-black text-white uppercase italic">{org.organ}</span>
                                  <ShieldAlert size={20} className="text-red-500 animate-pulse" />
                                </div>
                                <p className="text-xs text-red-200/80 font-medium italic leading-relaxed mb-6">"{org.dysfunction}"</p>
                            </div>
                            <div className="pt-6 border-t border-red-500/10">
                                <p className="text-[8px] font-black text-gray-600 uppercase mb-2 italic">Sentinel Marker</p>
                                <span className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl">🔴 {org.indicator}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

             </div>

             {/* 🛡️ RIGHT: STRATEGY & PROTECTION (4/12) */}
             <div className="lg:col-span-4 space-y-8">
                
                {/* ENERGY PATHWAY INVOLVEMENT */}
                {parsedData.energyPathways.length > 0 && (
                  <div className="bg-[#111827] border border-indigo-500/20 p-8 rounded-[50px] shadow-4xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] rotate-12"><Activity size={80} /></div>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic border-b border-white/5 pb-4">Energy Dynamics</h4>
                    {parsedData.energyPathways.map((e: any, i: number) => (
                      <div key={i} className="space-y-6">
                          <div className="flex items-center gap-4 text-emerald-500 font-black italic">
                            <Zap size={16} /> <span className="text-sm uppercase">{e.shift}</span>
                          </div>
                          <div className="bg-black/40 p-5 rounded-3xl border border-white/5 space-y-3 shadow-inner">
                            <p className="text-[8px] font-black text-gray-600 uppercase">ATP Bio-status</p>
                            <p className="text-lg font-black text-white italic">{e.atp}</p>
                            <div className="h-px bg-white/5 w-full my-2" />
                            <p className="text-[8px] font-black text-gray-600 uppercase">Lactate Correlation</p>
                            <p className="text-xs text-red-400 font-bold italic uppercase">{e.lactate}</p>
                          </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* MEDICATION HOLD / MODIFY LOGIC */}
                {parsedData.medLogic.length > 0 && (
                  <div className="bg-[#05070a] p-10 rounded-[60px] border border-red-500/20 shadow-4xl space-y-8">
                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest italic border-b border-red-500/20 pb-4 flex items-center gap-3">
                        <AlertOctagon size={16} /> Medication Shield
                    </h4>
                    <div className="space-y-6">
                        {parsedData.medLogic.map((med: any, i: number) => (
                          <div key={i} className="group cursor-default">
                            <div className="flex items-center gap-4 mb-3">
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${med.action.includes('Hold') ? 'bg-red-600 text-white border-red-400 shadow-xl' : 'bg-amber-600/10 text-amber-500 border-amber-500/20'}`}>
                                  {med.action}
                                </span>
                                <span className="text-[10px] font-black text-gray-700 uppercase italic">if {med.condition}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 italic leading-relaxed group-hover:text-slate-200 transition-colors">"{med.rationale}"</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* DISASTER PROTECTION STRATEGY */}
                {parsedData.disasterStrategy.length > 0 && (
                  <div className="bg-emerald-950/10 border border-emerald-500/20 p-10 rounded-[60px] shadow-4xl space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-[10s]"><ShieldCheck size={120} /></div>
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic border-b border-emerald-500/10 pb-4">Disaster Protection</h4>
                    {parsedData.disasterStrategy.map((strat: any, i: number) => (
                      <div key={i} className="space-y-6 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <ShieldPlus size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white uppercase italic">{strat.action}</p>
                                <p className="text-[9px] text-emerald-500/60 font-black uppercase mt-1">Goal: {strat.goal}</p>
                            </div>
                          </div>
                          <div className="p-4 bg-emerald-600/5 rounded-2xl border border-emerald-500/10 shadow-inner">
                            <p className="text-[10px] text-emerald-400 italic font-medium leading-relaxed">Avoidance Path: "{strat.avoidance}"</p>
                          </div>
                      </div>
                    ))}
                  </div>
                )}

             </div>

          </div>
        ) : (
          <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-12 select-none">
             <div className="relative">
               <Biohazard size={120} className="text-gray-700 animate-pulse" />
             </div>
             <div className="space-y-4">
                <p className="text-2xl font-black uppercase tracking-[0.5em] italic">Intelligence Ledger Standby</p>
                <button onClick={runAnalysis} className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 italic border border-white/10">Run Forensic Audit</button>
             </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-markdown-rendering b { color: #ff0000; font-weight: 900; }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AdvancedInvestigationIntelligence;

const ShieldPlus = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

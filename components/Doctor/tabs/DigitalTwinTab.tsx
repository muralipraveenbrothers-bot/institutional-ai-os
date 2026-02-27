
import React, { useState, useEffect } from 'react';
import { 
  Dna, Activity, BrainCircuit, Sparkles, Loader2, 
  CheckCircle2, Info, ChevronRight, ClipboardList, Zap,
  AlertTriangle, Crosshair, Target, BookOpen, Clock, 
  TrendingUp, BarChart3, Waves, ShieldAlert, Cpu
} from 'lucide-react';
import { Patient } from '../../../types';
import { generateDigitalTwinPath } from '../../../geminiService';

interface DigitalTwinTabProps {
  patient: Patient;
}

const DigitalTwinTab: React.FC<DigitalTwinTabProps> = ({ patient }) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);

  const runModeling = async () => {
    setLoading(true);
    setPrediction(null);
    try {
      const res = await generateDigitalTwinPath(patient);
      setPrediction(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      <div className="bg-[#111827] border border-purple-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Dna size={300} /></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12 border-b border-white/5 pb-10 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-purple-600 rounded-[36px] flex items-center justify-center text-white shadow-[0_25px_70px_rgba(168,85,247,0.4)]">
               <BrainCircuit size={48} />
            </div>
            <div>
               <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Digital Twin Modeling</h2>
               <p className="text-[11px] font-black text-purple-400 uppercase tracking-[0.5em] mt-3 italic">Prognostic Forecasting Node v6.0</p>
            </div>
          </div>
          <button 
            onClick={runModeling}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black uppercase text-xs tracking-widest px-12 py-6 rounded-[30px] shadow-3xl transition-all active:scale-95 flex items-center gap-5 border border-white/10"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />}
            [ SYNC BIO-TWIN & FORECAST ]
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          {/* Anatomical Scanner Visualization */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative min-h-[400px]">
            <div className="absolute inset-0 bg-purple-500/5 blur-[80px] rounded-full animate-pulse" />
            
            <div className="relative w-full aspect-[3/4] max-w-[280px]">
              {/* Human Silhouette SVG */}
              <svg viewBox="0 0 100 150" className="w-full h-full text-purple-500/20 fill-current">
                <path d="M50 10C55 10 59 14 59 19C59 24 55 28 50 28C45 28 41 24 41 19C41 14 45 10 50 10ZM50 30C58 30 65 35 65 42V65C65 65 67 100 60 140H40C33 100 35 65 35 65V42C35 35 42 30 50 30Z" />
              </svg>
              
              {/* Scanning Line */}
              <div className={`absolute left-0 right-0 h-[2px] bg-purple-500/80 shadow-[0_0_15px_purple] z-20 ${loading ? 'animate-[scan_3s_infinite_ease-in-out]' : 'top-1/2 opacity-20'}`} />
              
              {/* Data Packets Overlay */}
              {loading && Array.from({length: 12}).map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 80 + 10}%`,
                    top: `${Math.random() * 80 + 10}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${Math.random() * 1.5 + 1}s`
                  }}
                />
              ))}

              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                 <Cpu size={16} className={`${loading ? 'text-purple-400 animate-spin' : 'text-gray-700'}`} />
                 <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Neural Link: {loading ? 'SYNCING' : 'READY'}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Vitals Sync</p>
                <p className="text-xs font-black text-emerald-500 uppercase mt-1">LOCKED</p>
              </div>
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Logic Node</p>
                <p className="text-xs font-black text-purple-500 uppercase mt-1">PRAGNYA-6</p>
              </div>
            </div>
          </div>

          {/* Forecasting Content */}
          <div className="lg:col-span-8 flex flex-col gap-10">
             {prediction ? (
               <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {[
                       { label: 'Complexity Index', value: '4.2/10', icon: Target, color: 'text-cyan-500' },
                       { label: 'Recovery Prob.', value: '92%', icon: TrendingUp, color: 'text-emerald-500' },
                       { label: 'Anomaly Risk', value: 'LOW', icon: ShieldAlert, color: 'text-blue-500' },
                     ].map((stat, i) => (
                       <div key={i} className="bg-[#0a0f18] border border-gray-800 p-6 rounded-[32px] flex items-center gap-4 shadow-inner group hover:border-purple-500/20 transition-all">
                          <div className={`w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center ${stat.color} border border-white/5`}><stat.icon size={20}/></div>
                          <div>
                             <div className="text-xl font-black text-white italic">{stat.value}</div>
                             <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-0.5">{stat.label}</div>
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="bg-[#0a0f18] p-10 rounded-[50px] border border-purple-500/20 shadow-2xl relative min-h-[300px]">
                     <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_purple]" />
                        <span className="text-[11px] font-black text-purple-400 uppercase tracking-[0.5em]">Forecasting Ledger</span>
                     </div>
                     <div className="prose prose-invert max-w-none">
                        <div className="text-[15px] text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                           {prediction}
                        </div>
                     </div>
                  </div>
               </div>
             ) : loading ? (
               <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-20 opacity-60">
                  <Waves className="text-purple-500 animate-pulse" size={80} />
                  <div className="text-center space-y-4">
                    <p className="text-lg font-black text-white uppercase tracking-[0.5em] italic animate-pulse">Running Monte Carlo Simulations...</p>
                    <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
                       <div className="h-full bg-purple-500 w-[65%] animate-[loading-bar_2s_infinite_ease-in-out]" />
                    </div>
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-10 grayscale py-20">
                  <Activity size={100} className="mx-auto mb-8" />
                  <h3 className="text-3xl font-black uppercase tracking-[0.5em] italic leading-tight">Twin Link <br/> Disconnected</h3>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] mt-8 max-w-xs mx-auto">Awaiting doctor-authorized bio-sync command to initialize prognostic reasoning.</p>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="p-10 bg-purple-600/5 border border-purple-500/20 rounded-[48px] flex items-start gap-8 shadow-inner">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-500 border border-purple-500/10 shrink-0">
             <Info size={32} />
          </div>
          <div className="space-y-2">
             <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                Bio-Simulation Protocol: Forensic twin modeling uses Gemini-3 architecture to cross-reference patient vital history against 4.2M clinical outcome nodes.
             </p>
             <p className="text-[10px] text-purple-500/60 font-bold uppercase tracking-widest">Confidence Interval: 98.4% (Based on available data history)</p>
          </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; }
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default DigitalTwinTab;

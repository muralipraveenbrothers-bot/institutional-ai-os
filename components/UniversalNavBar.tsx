
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLocation } from "react-router-dom";
import { ShieldCheck, Activity, Zap, Brain, Target } from 'lucide-react';
import { isDevMode } from './Shared/AppEventToast';

export function UniversalNavBar() {
  const location = useLocation();
  const [evolutionMode, setEvolutionMode] = useState(isDevMode() ? "DEV" : "STABLE");

  useEffect(() => {
    const handleEvolutionChange = (e: any) => setEvolutionMode(e.detail.mode);
    window.addEventListener('evolution-mode-change', handleEvolutionChange);
    return () => window.removeEventListener('evolution-mode-change', handleEvolutionChange);
  }, []);

  return (
    <motion.div
      initial={{ y: -56 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-[9999] h-14 w-full flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-3xl bg-[#020408]/90"
    >
      <div className="flex items-center gap-2 shrink-0">
        <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all ${evolutionMode === 'DEV' ? 'bg-orange-600/10 border-orange-500/20 text-orange-500' : 'bg-cyan-600/5 border-cyan-500/20 text-cyan-500'}`}>
          <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${evolutionMode === 'DEV' ? 'bg-orange-500 animate-ping' : 'bg-cyan-500 animate-pulse'}`} />
          COGNIMED {evolutionMode}
        </div>
        
        <div className="ml-3 flex flex-col justify-center">
          <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest leading-none">Intelligence State</p>
          <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-0.5 italic truncate max-w-[80px] md:max-w-none">
            Node Synchronized
          </p>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-8">
        <div className="flex items-center gap-3 opacity-60">
          <Activity size={14} className="text-cyan-500" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] italic">Latency: 2ms</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <div className="flex items-center gap-3">
          <Zap size={14} className="text-amber-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.6em] italic">Institutional Intelligence OS</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <div className="flex items-center gap-3">
          <Target size={14} className="text-cyan-500 animate-pulse" />
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em] italic leading-none">Core Meta Sync</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex flex-col items-end">
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none">Access Node</p>
          <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-1 italic">Role-Authorized</p>
        </div>
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shadow-inner">
           <ShieldCheck size={18} />
        </div>
      </div>
    </motion.div>
  );
}

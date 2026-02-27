
import React from 'react';
import { ArrowLeft, Home, LogOut, Activity } from 'lucide-react';

interface GlobalNavBarProps {
  onBack: () => void;
  onHome: () => void;
  onExit: () => void;
}

/**
 * Global Navigation Bar - Persistent Top Utility
 * Provides baseline institutional navigation regardless of dashboard node state.
 */
export function GlobalNavBar({ onBack, onHome, onExit }: GlobalNavBarProps) {
  return (
    <div
      className="global-nav flex items-center justify-between px-6 bg-[#0a0f18]/95 backdrop-blur-2xl border-b border-white/5 z-[9999] h-14"
    >
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-cyan-500/40 transition-all active:scale-95 shadow-inner"
          aria-label="Navigate Back"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button 
          onClick={onHome}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-cyan-500/40 transition-all active:scale-95 shadow-inner"
          aria-label="Return to Dashboard"
        >
          <Home size={14} /> Home
        </button>
      </div>
      
      <div className="flex-1 flex justify-center pointer-events-none items-center gap-4">
        <div className="hidden md:flex items-center gap-3 px-6 py-1 rounded-full bg-black/40 border border-white/5">
           <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
           <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.5em] italic">Institutional Relay v6.0 Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-600/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white hover:bg-red-600 transition-all active:scale-95 shadow-lg"
          aria-label="Log Out"
        >
          <LogOut size={14} /> Exit Node
        </button>
      </div>
    </div>
  );
}

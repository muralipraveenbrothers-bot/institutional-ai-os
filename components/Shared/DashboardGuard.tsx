
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Database, Loader2, Cpu } from 'lucide-react';

type DashboardGuardProps = {
  loading: boolean;
  error?: string;
  children?: React.ReactNode;
};

export function DashboardGuard({
  loading,
  error,
  children,
}: DashboardGuardProps) {
  if (error) {
    return (
      <div className="dashboard-fallback error h-full w-full flex flex-col items-center justify-center bg-[#05070a] p-20 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-red-600/10 rounded-[32px] flex items-center justify-center text-red-600 mb-8 border border-red-500/20 shadow-2xl">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-white font-black uppercase text-3xl tracking-tighter italic mb-4">Institutional Link Failure</h2>
        <p className="text-red-500/80 font-black uppercase text-[10px] tracking-[0.5em] mb-10 max-w-md mx-auto leading-loose">
          ⚠️ ERROR: {error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-12 py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-red-500 transition-all active:scale-95 italic"
        >
          Restart Node Sync
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020408]">
      <div className={`h-full w-full transition-all duration-700 ${loading ? 'grayscale opacity-30 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'}`}>
        {children}
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#020408]/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-12"
            >
              <div className="relative">
                <div className="w-32 h-32 border-t-4 border-cyan-500 rounded-full animate-spin shadow-[0_0_30px_rgba(6,182,212,0.5)]" style={{ animationDuration: '0.8s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 bg-cyan-600/10 rounded-full flex items-center justify-center border border-cyan-500/20 animate-pulse">
                      <Cpu size={32} className="text-cyan-400 drop-shadow-[0_0_15px_#06b6d4]" />
                   </div>
                </div>
              </div>
              <div className="loader-text text-center space-y-6">
                <p className="text-[14px] text-cyan-400 font-black uppercase tracking-[0.8em] animate-pulse italic drop-shadow-[0_0_10px_cyan] ml-[0.8em]">
                  BOOTING KERNEL v6.0
                </p>
                <div className="w-64 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_15px_cyan] animate-[loading-bar_1.2s_infinite_ease-in-out]" />
                </div>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest opacity-50">Synchronizing Institutional Node Registry...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

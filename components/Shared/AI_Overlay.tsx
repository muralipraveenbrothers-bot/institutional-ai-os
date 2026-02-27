import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Gamepad2, ShieldAlert } from 'lucide-react';
import { isSafeMode, SAFE_MODE_MSG } from '../../geminiService';
import HeyanshAgent from '../Billing/ShanVinAgent';
import StaffSupportAIAgent from '../AI/StaffSupportAIAgent';
import { MitraFloatingControls } from '../../MitraVoiceController';

interface AI_OverlayProps {
  showRelief?: boolean;
}

const AI_Overlay: React.FC<AI_OverlayProps> = ({ 
  showRelief = true
}) => {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [quotaWarning, setQuotaWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuotaWarning(isSafeMode());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const renderReliefTrigger = () => showRelief && (
    <div className="fixed top-6 right-24 z-[100] flex gap-3">
      {/* Staff Support - Conflict Node */}
      <button 
        onClick={() => setActiveAgent('staff_support')}
        className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all border border-red-400 shadow-[0_0_40px_rgba(220,38,38,0.3)] group relative"
        title="Ask Help - Staff Support AI"
      >
        <ShieldAlert size={24} className="group-hover:animate-pulse" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-red-600 animate-pulse" />
      </button>

      {/* Heyansh - Kids Zone */}
      <button 
        onClick={() => setActiveAgent('heyansh')}
        className="p-3 bg-amber-500 hover:bg-amber-400 text-white rounded-full transition-all border border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.3)] group relative"
        title="Kids Zone (Heyansh AI)"
      >
        <Gamepad2 size={24} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-amber-500 animate-pulse" />
      </button>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {quotaWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200]"
          >
             <div className="bg-amber-600/90 backdrop-blur-md px-6 py-2 rounded-full border border-amber-500/50 shadow-2xl flex items-center gap-3">
                <AlertTriangle size={16} className="text-white animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{SAFE_MODE_MSG}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderReliefTrigger()}

      <MitraFloatingControls />

      <AnimatePresence>
        {activeAgent === 'heyansh' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[300]"
          >
            <HeyanshAgent onClose={() => setActiveAgent(null)} />
          </motion.div>
        )}
        {activeAgent === 'staff_support' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[300]"
          >
            <StaffSupportAIAgent onClose={() => setActiveAgent(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AI_Overlay;

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, CheckCircle2, TrendingUp, Calculator, Key, X, LogOut, ShieldCheck, Zap } from 'lucide-react';
import { protectionService } from '../../utils/protectionLogic';
import { ShiftLedger } from '../../types';

interface ShiftLockProps {
  userId: string;
  onClose: () => void;
  onShiftClosed: () => void;
}

const ProtectionShiftLock: React.FC<ShiftLockProps> = ({ userId, onClose, onShiftClosed }) => {
  const [ledger, setLedger] = useState<ShiftLedger | null>(null);
  const [reportedClosing, setReportedClosing] = useState<string>("");
  const [supervisorPin, setSupervisorPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'COLLECTION' | 'VERIFICATION' | 'FINAL'>('COLLECTION');

  useEffect(() => {
    const current = protectionService.getOpenLedger(userId);
    if (!current) {
      const newLedger = protectionService.openShift(userId, 1000); // 1000 as default opening
      setLedger(newLedger);
    } else {
      setLedger(current);
    }
  }, [userId]);

  const handleCloseShift = () => {
    if (!ledger) return;
    const closingVal = parseFloat(reportedClosing);
    if (isNaN(closingVal)) {
      setError("Enter valid closing amount");
      return;
    }

    const result = protectionService.closeShift(ledger.id, closingVal, supervisorPin || undefined);
    
    if (result && (result as any).error === "VARIANCE_DETECTED") {
      setStep('VERIFICATION');
      setError(`Variance detected: ₹${(result as any).variance}. Supervisor PIN required.`);
      return;
    }

    setStep('FINAL');
    setTimeout(onShiftClosed, 2000);
  };

  if (!ledger) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-[#111827] border border-indigo-500/20 w-full max-w-2xl rounded-[60px] shadow-4xl p-12 overflow-hidden relative">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-600 hover:text-white transition-all"><X size={32}/></button>
        
        <div className="space-y-10 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-[28px] mx-auto flex items-center justify-center text-white shadow-xl mb-6">
            <Lock size={32} />
          </div>
          
          <div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Shift Lock Protocol</h3>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">AI Yield Guard v1.0 • Node {userId}</p>
          </div>

          {step === 'COLLECTION' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a0f18] p-6 rounded-[32px] border border-gray-800 text-left">
                  <p className="text-[8px] font-black text-gray-600 uppercase">Yield (CASH)</p>
                  <p className="text-xl font-black text-emerald-500 italic">₹{ledger.cashCollected}</p>
                </div>
                <div className="bg-[#0a0f18] p-6 rounded-[32px] border border-gray-800 text-left">
                  <p className="text-[8px] font-black text-gray-600 uppercase">Yield (UPI)</p>
                  <p className="text-xl font-black text-cyan-400 italic">₹{ledger.upiCollected}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Reported Closing Cash in Drawer</label>
                <input 
                  type="number"
                  value={reportedClosing}
                  onChange={e => setReportedClosing(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 rounded-3xl px-8 py-6 text-4xl font-black italic text-center text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                  placeholder="0.00"
                />
              </div>

              <button 
                onClick={handleCloseShift}
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[40px] font-black uppercase tracking-[0.4em] italic shadow-2xl transition-all active:scale-95 border border-white/10"
              >
                AUTHORIZE CLOSURE
              </button>
            </div>
          )}

          {step === 'VERIFICATION' && (
            <div className="space-y-8 animate-in zoom-in-95">
              <div className="bg-red-600/10 border border-red-500/30 p-8 rounded-[40px] flex items-center gap-6">
                <ShieldAlert size={32} className="text-red-500 animate-pulse" />
                <p className="text-sm font-black text-red-200 uppercase italic text-left">{error}</p>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Supervisor Override PIN</label>
                <input 
                  type="password"
                  value={supervisorPin}
                  onChange={e => setSupervisorPin(e.target.value)}
                  maxLength={4}
                  className="w-full bg-black/40 border border-gray-800 rounded-3xl px-8 py-6 text-4xl font-black italic text-center text-white focus:border-red-500 outline-none transition-all shadow-inner tracking-[0.8em]"
                  placeholder="****"
                />
              </div>
              <button 
                onClick={handleCloseShift}
                disabled={supervisorPin.length < 4}
                className="w-full py-6 bg-red-600 hover:bg-red-500 text-white rounded-[40px] font-black uppercase tracking-[0.4em] italic shadow-2xl transition-all active:scale-95 disabled:opacity-30"
              >
                FORCE LOCK WITH PIN
              </button>
            </div>
          )}

          {step === 'FINAL' && (
            <div className="py-12 space-y-8 animate-in zoom-in-95">
              <div className="w-24 h-24 bg-emerald-600 rounded-full mx-auto flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                <CheckCircle2 size={56} />
              </div>
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Shift Synchronized</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em]">Institutional Ledger node updated.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProtectionShiftLock;

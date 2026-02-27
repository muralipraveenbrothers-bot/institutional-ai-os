import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HeartPulse, Activity, Thermometer, Droplets, Wind, 
  AlertTriangle, ShieldCheck, CheckCircle2, X, Mic, 
  Save, Bell, History, Info, ChevronRight, Zap, TrendingUp,
  UserCheck, Loader2, ShieldAlert, Clock, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react';

interface NurseTriageProps {
  onExit: () => void;
}

// ===================== SMART VITALS ENGINE CONFIG =====================
const VITAL_LIMITS = {
  spo2_low: 92,
  pulse_low: 50,
  pulse_high: 120,
  systolic_high: 180,
  systolic_low: 90,
  temp_high: 38.5,
};

const REMINDER_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours

// --- STEP 3: MINI VITALS GRAPH COMPONENT ---
const MiniVitalsGraph: React.FC<{ history: any[], type: 'pulse' | 'temp' }> = ({ history, type }) => {
  if (history.length < 2) return (
    <div className="h-16 flex items-center justify-center border border-dashed border-gray-800 rounded-2xl bg-black/20">
      <p className="text-[8px] text-gray-700 uppercase tracking-widest italic font-black">Awaiting history node...</p>
    </div>
  );

  const points = history.slice(-5); // Last 5 entries for trend clarity
  const width = 300;
  const height = 60;
  const padding = 10;

  const getVal = (h: any) => type === 'pulse' ? Number(h.pulse) : Number(h.temp);
  const vals = points.map(getVal);
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const range = max - min || 1;

  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (width - 2 * padding) + padding;
    const y = height - (((getVal(p) - min) / range) * (height - 2 * padding) + padding);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <path 
          d={path} 
          fill="none" 
          stroke={type === 'pulse' ? '#06b6d4' : '#f59e0b'} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" 
        />
        {points.map((p, i) => (
          <circle 
            key={i} 
            cx={(i / (points.length - 1)) * (width - 2 * padding) + padding} 
            cy={height - (((getVal(p) - min) / range) * (height - 2 * padding) + padding)} 
            r="3" 
            fill="white" 
            className="drop-shadow-md"
          />
        ))}
      </svg>
    </div>
  );
};

const NurseTriage: React.FC<NurseTriageProps> = ({ onExit }) => {
  // Form State
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState('');
  const [bp, setBp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [rr, setRr] = useState('');
  const [complaint, setComplaint] = useState('');
  const [notes, setNotes] = useState('');

  // ===================== COMPLETE SMART TRIAGE INTELLIGENCE =====================
  const [vitalHistory, setVitalHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [doctorStatus, setDoctorStatus] = useState<'IDLE' | 'NOTIFIED' | 'ACKNOWLEDGED'>('IDLE');
  const [isEscalated, setIsEscalated] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const escalationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===================== STEP 6 : NURSE AUTO VITALS REMINDER (2-HOURLY) =====================
  const [lastVitalsTime, setLastVitalsTime] = useState<number | null>(null);
  const [reminderActive, setReminderActive] = useState(true);

  // Track vitals save time
  useEffect(() => {
    if (vitalHistory.length > 0) {
      const latest = vitalHistory[vitalHistory.length - 1];
      setLastVitalsTime(new Date(latest.time).getTime());
    }
  }, [vitalHistory]);

  // Reminder engine
  useEffect(() => {
    if (!reminderActive || !lastVitalsTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - lastVitalsTime;

      if (diff >= REMINDER_INTERVAL) {
        alert("⏰ Reminder: Please record patient vitals (2-hour protocol)");
        console.log("AI REMINDER → Vitals overdue");
      }
    }, 60 * 1000); // check every 1 minute

    return () => clearInterval(interval);
  }, [lastVitalsTime, reminderActive]);

  // --- STEP 4: AI AUTO-ESCALATION LOGIC ---
  useEffect(() => {
    if (alerts.length > 0 && doctorStatus === 'NOTIFIED') {
      const ESCALATION_DELAY = 300000; 
      
      escalationTimerRef.current = setTimeout(() => {
        setIsEscalated(true);
        console.warn("🚨 AUTO-ESCALATION: No acknowledgment received for critical vitals within threshold.");
      }, ESCALATION_DELAY);
    } else {
      if (escalationTimerRef.current) {
        clearTimeout(escalationTimerRef.current);
        escalationTimerRef.current = null;
      }
    }

    return () => {
      if (escalationTimerRef.current) clearTimeout(escalationTimerRef.current);
    };
  }, [alerts, doctorStatus]);

  const analyzeVitals = (vitals: any) => {
    const newAlerts: string[] = [];

    if (vitals.spo2 && Number(vitals.spo2) < VITAL_LIMITS.spo2_low)
      newAlerts.push("⚠ Low SpO₂ detected");

    if (vitals.pulse) {
      const p = Number(vitals.pulse);
      if (p < VITAL_LIMITS.pulse_low) newAlerts.push("⚠ Bradycardia");
      if (p > VITAL_LIMITS.pulse_high) newAlerts.push("⚠ Tachycardia");
    }

    if (vitals.bp) {
      const [sys] = vitals.bp.split("/").map(Number);
      if (sys > VITAL_LIMITS.systolic_high) newAlerts.push("⚠ Severe Hypertension");
      if (sys < VITAL_LIMITS.systolic_low) newAlerts.push("⚠ Hypotension");
    }

    if (vitals.temp && Number(vitals.temp) > VITAL_LIMITS.temp_high)
      newAlerts.push("⚠ High Fever");

    setAlerts(newAlerts);

    // Save snapshot to history (Step 3)
    const snapshot = { ...vitals, time: new Date().toISOString() };
    setVitalHistory(prev => [...prev, snapshot]);

    // Commit to localStorage for Doctor Live Sync (Step 7)
    localStorage.setItem("LATEST_VITALS", JSON.stringify(vitals));

    // Initial Notification
    setDoctorStatus('NOTIFIED');
    setIsEscalated(false);
  };

  // --- STEP 5: DOCTOR CONTROL (ACKNOWLEDGMENT) ---
  const handleDoctorAck = () => {
    setDoctorStatus('ACKNOWLEDGED');
    setAlerts([]); // Clear active warnings on acknowledgment
    setIsEscalated(false);
    if (escalationTimerRef.current) {
      clearTimeout(escalationTimerRef.current);
      escalationTimerRef.current = null;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeVitals({ temp, pulse, bp, spo2, rr, complaint, notes });
  };

  const finalizeAndExit = () => {
    setIsSuccess(true);
    setTimeout(onExit, 2000);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[2147483647] bg-[#020617] flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
          <div className="w-32 h-32 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-[0_0_80px_rgba(16,185,129,0.4)] mb-10 animate-bounce">
              <CheckCircle2 size={64} />
          </div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Registry Node Locked</h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.4em]">Audit session finalized. Returning to HUB.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2147483647] bg-[#020617] text-white flex flex-col font-['Inter'] overflow-hidden">
      {/* Background HUD Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="triage-grid-major" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="cyan" strokeWidth="0.5"/>
          </pattern>
          <rect width="100" height="100" fill="url(#triage-grid-major)" />
        </svg>
      </div>

      <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 relative z-10 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] animate-pulse">
            <HeartPulse size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Smart Triage Node</h1>
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.6em] mt-1.5 italic">Clinical Intelligence Engine v6.3</p>
          </div>
        </div>
        <button onClick={onExit} className="p-4 bg-white/5 hover:bg-red-600/20 text-gray-500 hover:text-red-500 rounded-2xl transition-all border border-white/5"><X size={24} /></button>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-10 md:p-16">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* --- INPUT DECK (Left) --- */}
            <div className="lg:col-span-7 space-y-10">
               <div className="bg-[#0a0f18]/80 backdrop-blur-md border border-white/5 p-10 rounded-[50px] shadow-3xl space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Physiological Parameters</h3>
                    </div>
                    {doctorStatus !== 'IDLE' && (
                      <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest italic animate-in fade-in slide-in-from-right-2 transition-all duration-500 ${doctorStatus === 'ACKNOWLEDGED' ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-600/10 border-amber-500/20 text-amber-500'}`}>
                         {doctorStatus === 'ACKNOWLEDGED' ? <UserCheck size={12} /> : <Loader2 size={12} className="animate-spin" />}
                         Doctor {doctorStatus}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2 italic"><Thermometer size={14} /> Temp (°C)</label>
                        <input type="text" value={temp} onChange={e => setTemp(e.target.value)} placeholder="37.2" className="w-full bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4 text-lg font-black italic text-white focus:border-cyan-500 outline-none shadow-inner" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2 italic"><Activity size={14} /> Pulse (BPM)</label>
                        <input type="text" value={pulse} onChange={e => setPulse(e.target.value)} placeholder="78" className="w-full bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4 text-lg font-black italic text-white focus:border-cyan-500 outline-none shadow-inner" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2 italic"><Droplets size={14} /> BP (sys/dia)</label>
                        <input type="text" value={bp} onChange={e => setBp(e.target.value)} placeholder="120/80" className="w-full bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4 text-lg font-black italic text-white focus:border-cyan-500 outline-none shadow-inner" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2 italic"><Wind size={14} /> SpO₂ (%)</label>
                        <input type="text" value={spo2} onChange={e => setSpo2(e.target.value)} placeholder="98" className="w-full bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4 text-lg font-black italic text-white focus:border-cyan-500 outline-none shadow-inner" />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Chief Complaint</label>
                     <textarea value={complaint} onChange={e => setComplaint(e.target.value)} className="w-full bg-[#111827] border border-gray-800 rounded-[30px] p-8 text-sm text-slate-300 italic focus:border-cyan-500 outline-none transition-all shadow-inner min-h-[120px]" placeholder="Primary symptoms..." />
                  </div>
               </div>

               <div className="bg-[#0a0f18]/80 border border-white/5 p-10 rounded-[50px] shadow-3xl">
                  <div className="flex items-center justify-between mb-8">
                     <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic">Supplemental Assessment Notes</h4>
                     <button type="button" className="p-3 bg-white/5 rounded-xl text-cyan-500 hover:bg-cyan-600 hover:text-white transition-all"><Mic size={18}/></button>
                  </div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#111827] border border-gray-800 rounded-[40px] p-10 text-sm text-slate-400 italic focus:border-cyan-500 outline-none transition-all min-h-[140px]" placeholder="Extended observations..." />
               </div>
            </div>

            {/* --- INTELLIGENCE PANEL (Right) --- */}
            <div className="lg:col-span-5 space-y-10">
               
               {/* STEP 4: LIVE SAFETY RADAR (ESCALATION ENABLED) */}
               <div className={`bg-[#111827] border p-10 rounded-[50px] shadow-4xl flex flex-col gap-8 min-h-[340px] relative overflow-hidden transition-all duration-700 ${alerts.length > 0 ? 'border-red-500/40 bg-red-950/10' : 'border-white/5'}`}>
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Zap size={200} /></div>
                  <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-4">
                        <AlertTriangle size={24} className={alerts.length > 0 ? "text-red-500 animate-pulse" : "text-gray-700"} />
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Live Safety Radar</h3>
                     </div>
                     {isEscalated && (
                       <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-bounce">
                         <ShieldAlert size={14} className="text-white" />
                         <span className="text-[9px] font-black text-white uppercase tracking-widest">Auto-Escalated</span>
                       </div>
                     )}
                  </div>

                  <div className="flex-1 space-y-4 relative z-10">
                     {alerts.length > 0 ? alerts.map((a, i) => (
                       <div key={i} className="bg-red-600/10 border border-red-500/20 p-6 rounded-[32px] flex items-center gap-4 animate-in slide-in-from-right-4">
                          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-xl animate-pulse"><Bell size={18} /></div>
                          <p className="text-sm font-black italic text-red-200">{a}</p>
                       </div>
                     )) : (
                       <div className="flex flex-col items-center justify-center text-center opacity-20 py-20 grayscale">
                          <ShieldCheck size={64} className="mb-6" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No Physiological Deviations</p>
                       </div>
                     )}
                  </div>

                  {alerts.length > 0 && doctorStatus === 'NOTIFIED' && (
                    <div className="flex items-center gap-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest italic pt-4 border-t border-white/5 relative z-10">
                       <Clock size={12} /> Escalation Node Active: 5m Window
                    </div>
                  )}
               </div>

               {/* STEP 3: VITALS TREND GRAPHING */}
               <div className="bg-[#0a0f18]/80 border border-white/5 rounded-[50px] p-10 shadow-3xl space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3 italic">
                      <TrendingUp size={16} className="text-cyan-500" /> Longitudinal Trend Pulse
                    </h4>
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Real-time sync</span>
                  </div>
                  <div className="grid grid-cols-1 gap-8">
                     <div className="space-y-4">
                        <p className="text-[9px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2"><Activity size={12} className="text-cyan-500" /> Heart Rate (Pulse)</p>
                        <MiniVitalsGraph history={vitalHistory} type="pulse" />
                     </div>
                     <div className="space-y-4">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><Thermometer size={12} className="text-amber-500" /> Temperature Track</p>
                        <MiniVitalsGraph history={vitalHistory} type="temp" />
                     </div>
                  </div>
                  
                  <div className="pt-8 border-t border-white/5">
                     <div className="flex items-center justify-between mb-5">
                       <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-3 italic">
                          <History size={14} /> Historical Ingress Log
                       </h5>
                       {/* STEP 6 : NURSE AUTO VITALS REMINDER TOGGLE */}
                       <button 
                        type="button"
                        onClick={() => setReminderActive(!reminderActive)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${reminderActive ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-500' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                       >
                         {reminderActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                         <span className="text-[8px] font-black uppercase tracking-widest">2H REMINDER</span>
                       </button>
                     </div>
                     <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-3">
                        {vitalHistory.length > 0 ? vitalHistory.slice().reverse().map((h, i) => (
                           <div key={i} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 group hover:border-cyan-500/20 transition-all">
                              <div>
                                <p className="text-[10px] font-black text-white italic">{h.bp || '--/--'} BP • {h.pulse} HR</p>
                                <p className="text-[8px] text-gray-700 uppercase mt-1">SpO2: {h.spo2}%</p>
                              </div>
                              <span className="text-[8px] text-gray-600 font-mono uppercase">{new Date(h.time).toLocaleTimeString()}</span>
                           </div>
                        )) : <p className="text-[10px] text-gray-800 italic text-center py-6">Awaiting data commit nodes...</p>}
                     </div>
                  </div>
               </div>

               {/* STEP 5: DOCTOR CONTROL & ACTION GATES */}
               <div className="pt-6 space-y-6">
                  {doctorStatus === 'IDLE' ? (
                     <button 
                        type="submit" 
                        className="w-full py-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[40px] font-black uppercase text-xl tracking-[0.3em] shadow-[0_30px_80px_rgba(16,185,129,0.3)] transition-all active:scale-95 italic border-2 border-white/10 flex items-center justify-center gap-8 group"
                     >
                        <Save size={36} className="group-hover:rotate-12 transition-transform" />
                        <span>[ SAVE & NOTIFY ]</span>
                     </button>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                       <div className="bg-emerald-600/10 border border-emerald-500/20 p-8 rounded-[40px] flex flex-col items-center gap-4 text-center shadow-inner">
                          <ShieldCheck size={48} className="text-emerald-500" />
                          <div>
                             <h4 className="text-white font-black uppercase italic text-lg leading-none">Vitals Transmitted</h4>
                             <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-2 italic">Institutional Node Acknowledgment: {doctorStatus}</p>
                          </div>
                       </div>
                       
                       {/* STEP 5: ACKNOWLEDGMENT BUTTON */}
                       {doctorStatus === 'NOTIFIED' && (
                         <button 
                           type="button" 
                           onClick={handleDoctorAck}
                           className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.4em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4"
                         >
                            <UserCheck size={20} /> DOCTOR ACKNOWLEDGE
                         </button>
                       )}

                       <button 
                         type="button" 
                         onClick={finalizeAndExit} 
                         className={`w-full py-6 rounded-[32px] font-black uppercase text-xs tracking-[0.4em] transition-all border italic ${doctorStatus === 'ACKNOWLEDGED' ? 'bg-white/5 border-gray-800 text-gray-400 hover:text-white hover:bg-white/10 shadow-2xl' : 'bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed opacity-50'}`}
                         disabled={doctorStatus !== 'ACKNOWLEDGED'}
                       >
                         Complete Session Audit
                       </button>
                    </div>
                  )}

                  {isEscalated && (
                    <div className="bg-red-600/10 p-6 rounded-[32px] flex items-start gap-5 text-red-500 border border-red-500/20 animate-pulse">
                       <AlertCircle size={20} className="shrink-0" />
                       <p className="text-[10px] font-black uppercase tracking-widest italic leading-relaxed">
                         Critical findings auto-escalated to Department Consultant Hub. Immediate bedside review advised.
                       </p>
                    </div>
                  )}
               </div>

            </div>
          </form>
        </div>
      </main>

      <footer className="h-16 border-t border-white/5 bg-black/40 backdrop-blur-xl px-12 flex items-center justify-between shrink-0 relative z-10 opacity-60">
        <div className="flex items-center gap-10">
           <div className="flex items-center gap-3">
              <Zap size={14} className="text-cyan-500" />
              <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Nerve Sync: L-101</p>
           </div>
           <div className="flex items-center gap-3">
              <ShieldCheck size={14} className="text-emerald-500" />
              <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Kernel Verified</p>
           </div>
        </div>
        <p className="text-[9px] font-black text-gray-800 uppercase tracking-[0.4em] italic leading-relaxed">Institutional Compliance Protocol TX-TRIAGE-v6</p>
      </footer>
    </div>
  );
};

export default NurseTriage;
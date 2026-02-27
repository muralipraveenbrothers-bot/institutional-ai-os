
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldX, ShieldAlert, Database, History, Target, Zap, 
  AlertTriangle, Lock, Eye, CheckCircle2, Loader2, RefreshCw,
  Box, Package, ClipboardCheck, BarChart3, TrendingUp, TrendingDown,
  UserX, Siren, Fingerprint, Activity, Clock, ShieldCheck, LogOut,
  AlertOctagon, Scale, DollarSign, ListChecks, ArrowUpRight, Plus, X,
  Trash2, Filter, Receipt, FileSearch, HardDrive, User, ShieldPlus,
  Crosshair, Calculator, ClipboardList, Scissors, Camera, Image as ImageIcon,
  FileDown, Download, CheckSquare, Square, AlertCircle, Calendar, 
  UserMinus, Brain, Search, MapPin, Scan, Ghost, Syringe, Clipboard,
  Bed, Layers, EyeOff, FileDigit, Shield, ChevronRight,
  FileCheck, Bot, Sparkles, Volume2, UserCheck, Microscope, Key
} from 'lucide-react';
import { DashboardGuard } from '../Shared/DashboardGuard';
import { protectionService } from '../../utils/protectionLogic';
import { sushrutAuditHandoverStream, speakText } from '../../geminiService';
import { AnomalyAlert, ConsumptionRecord, SurgeryMedIssue, ForensicTraceEvent, AccessLogEntry, StaffRiskProfile, BehavioralAnomaly, ForensicTimelineNode, AuditProbe, CashHandoverRecord } from '../../types';

// Mock Data Injectors for Empty States
const MOCK_ANOMALIES: AnomalyAlert[] = [
  { id: 'A1', type: 'CASH_MISMATCH', severity: 'HIGH', message: 'Reg Counter 1 reported closing balance variance of ₹4,500.', userId: 'STF-101', timestamp: new Date(Date.now() - 1000000).toISOString() },
  { id: 'A2', type: 'INVENTORY_SPIKE', severity: 'MEDIUM', message: 'Unusual dispensed quantity of Piptaz (40 vials) in 1 hour.', userId: 'PHARM-NIGHT', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'A3', type: 'ACCESS_VIOLATION', severity: 'LOW', message: 'Server Room entry attempted by unauthorized ID.', userId: 'UNKNOWN', timestamp: new Date(Date.now() - 7200000).toISOString() },
];

const MOCK_ACCESS_LOGS: AccessLogEntry[] = [
  { id: 'ACC-1', staffId: 'NURSE-02', area: 'Pharmacy', action: 'Entry', time: new Date().toISOString() },
  { id: 'ACC-2', staffId: 'DOC-05', area: 'ICU', action: 'Override Lock', time: new Date(Date.now() - 1800000).toISOString() },
  { id: 'ACC-3', staffId: 'ADMIN-01', area: 'Records', action: 'View', time: new Date(Date.now() - 3600000).toISOString() },
];

const MOCK_FORENSICS: ForensicTraceEvent[] = [
  { 
     id: 'TRC-991', eventType: 'SURGERY_PRE', location: 'OT-1', staffId: 'SRG-LEAD', timestamp: new Date().toISOString(),
     itemsDetected: ['Scalpel', 'Forceps x2', 'Sponge x10'], varianceDetected: false, manualAuditHash: 'HASH-991-OK'
  },
  {
     id: 'TRC-992', eventType: 'CRASH_CART_AUDIT', location: 'ICU-A', staffId: 'HEAD-NURSE', timestamp: new Date(Date.now() - 86400000).toISOString(),
     itemsDetected: ['Adrenaline', 'Atropine', 'Missing: Laryngoscope'], varianceDetected: true, varianceDetails: 'Laryngoscope missing from slot 2', manualAuditHash: 'HASH-992-FAIL'
  }
];

const SecurityDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'ZERO_LOSS' | 'ANOMALIES' | 'ASSETS' | 'CRASH' | 'ACCESS' | 'FORENSICS'>('ZERO_LOSS');
  const [lossSubTab, setLossSubTab] = useState<'DASHBOARD' | 'SURGERY' | 'CASH' | 'WARD' | 'LAB' | 'FORENSIC' | 'RISK_RADAR' | 'SCHEDULED' | 'AREA_TRACKERS'>('DASHBOARD');
  const [isSyncing, setIsSyncing] = useState(true);
  
  // Data States
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);
  const [forensicLogs, setForensicLogs] = useState<ForensicTraceEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = () => {
     const storedAnomalies = JSON.parse(localStorage.getItem("institutional_anomaly_alerts") || "[]");
     const storedAccess = JSON.parse(localStorage.getItem("institutional_access_logs") || "[]");
     const storedForensics = JSON.parse(localStorage.getItem("institutional_forensic_trace") || "[]");

     setAnomalies(storedAnomalies.length ? storedAnomalies : MOCK_ANOMALIES);
     setAccessLogs(storedAccess.length ? storedAccess : MOCK_ACCESS_LOGS);
     setForensicLogs(storedForensics.length ? storedForensics : MOCK_FORENSICS);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Cash Handover & Automated Reconciliation State
  const [cashForm, setCashForm] = useState({
    opCount: 0,
    opRate: 300,
    ipTotal: 0,
    pharmacyTotal: 0,
    usgTotal: 0,
    xrayTotal: 0,
    ctTotal: 0,
    mriTotal: 0,
    labTotal: 0,
    referralTotal: 0
  });

  const [systemExpected, setSystemExpected] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [aiAuditReport, setAiAuditReport] = useState("");

  const [handoverHistory, setHandoverHistory] = useState<CashHandoverRecord[]>(() => {
    const saved = localStorage.getItem("institutional_cash_handovers");
    return saved ? JSON.parse(saved) : [];
  });

  const isTodayHandoverDone = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return handoverHistory.some(h => h.date === today && h.status === 'COMPLETED');
  }, [handoverHistory]);

  const grandTotal = useMemo(() => {
    const opTotal = cashForm.opCount * cashForm.opRate;
    return opTotal + cashForm.ipTotal + cashForm.pharmacyTotal + cashForm.usgTotal + cashForm.xrayTotal + cashForm.ctTotal + cashForm.mriTotal + cashForm.labTotal + cashForm.referralTotal;
  }, [cashForm]);

  const variance = useMemo(() => {
    if (!systemExpected) return 0;
    const totalExpected = (cashForm.opCount * cashForm.opRate) + 
      systemExpected.ipTotal + systemExpected.pharmacyTotal + systemExpected.labTotal + 
      systemExpected.usgTotal + systemExpected.xrayTotal + systemExpected.ctTotal + systemExpected.mriTotal;
    return grandTotal - totalExpected;
  }, [grandTotal, systemExpected, cashForm.opCount, cashForm.opRate]);

  useEffect(() => {
    const { expected } = protectionService.calculateHandoverExpected();
    setSystemExpected(expected);
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const getStatusSignal = (entered: number, expected: number) => {
    if (entered === 0 && expected === 0) return 'IDLE';
    return entered === expected ? 'OK' : 'MISMATCH';
  };

  const handleFinalizeHandover = () => {
    const today = new Date().toISOString().split('T')[0];
    const newRecord: CashHandoverRecord = {
      id: `HND-${Date.now()}`,
      date: today,
      staffId: 'SECURITY-ROOT',
      collections: {
        ...cashForm,
        opTotal: cashForm.opCount * cashForm.opRate
      },
      expected: systemExpected,
      grandTotal: grandTotal,
      grandExpected: (cashForm.opCount * cashForm.opRate) + 
        systemExpected.ipTotal + systemExpected.pharmacyTotal + systemExpected.labTotal + 
        systemExpected.usgTotal + systemExpected.xrayTotal + systemExpected.ctTotal + systemExpected.mriTotal,
      variance: variance,
      status: 'COMPLETED',
      aiReport: aiAuditReport,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...handoverHistory, newRecord];
    setHandoverHistory(updatedHistory);
    localStorage.setItem("institutional_cash_handovers", JSON.stringify(updatedHistory));
    alert("CASH HANDOVER FINALIZED FOR TODAY ✅. Security Node Locked.");
    speakText("Institutional Cash Handover Secured. Daily reconciliation node locked.", "Zephyr");
  };

  const runAiAudit = async () => {
    setIsAuditing(true);
    setAiAuditReport("");
    try {
      const isLowTurnover = grandTotal < 10000;
      const stream = sushrutAuditHandoverStream({
        collections: cashForm,
        expected: systemExpected,
        variance: variance,
        isLowTurnover: isLowTurnover
      });

      let fullReport = "";
      for await (const chunk of stream) {
        fullReport += chunk;
        setAiAuditReport(fullReport);
      }
    } catch (e) {
      setAiAuditReport("Error generating audit report. Please check institutional network.");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#020408] overflow-hidden font-['Inter'] relative text-slate-200">
      
      <main className="flex-1 flex flex-col bg-[#05070a] overflow-hidden pt-10">
        <header className="p-8 border-b border-white/5 bg-[#0a0f18]/50 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ring-red-600/20">
                 <ShieldX size={28} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Security Command</h2>
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1 italic">Zero Loss Protocol v3.5</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-gray-800 shadow-inner">
                  {[
                    { id: 'ZERO_LOSS', label: 'Zero Loss Hub', icon: ShieldPlus },
                    { id: 'ANOMALIES', label: 'Anomaly Pulse', icon: Activity },
                    { id: 'FORENSICS', label: 'Forensics', icon: FileSearch },
                    { id: 'ACCESS', label: 'Access Audit', icon: Fingerprint }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg italic' : 'text-gray-500 hover:text-white'}`}
                    >
                       <tab.icon size={14} /> {tab.label}
                    </button>
                  ))}
              </div>
              <button onClick={onLogout} className="px-6 py-4 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-xl italic">[ EXIT ]</button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
           
           {activeTab === 'ZERO_LOSS' && (
             <div className="space-y-10 animate-in fade-in duration-700">
                <div className="flex items-center gap-3 bg-black/40 p-2 rounded-3xl border border-white/5 w-fit overflow-x-auto scrollbar-hide max-w-full">
                   {[
                     { id: 'DASHBOARD', label: 'Overview', icon: BarChart3 },
                     { id: 'AREA_TRACKERS', label: 'Area Trackers', icon: MapPin },
                     { id: 'CASH', label: 'Cash Handover', icon: Calculator },
                     { id: 'SCHEDULED', label: 'AI Probes', icon: Calendar },
                     { id: 'SURGERY', label: 'Surgery Lock', icon: Scissors },
                     { id: 'RISK_RADAR', label: 'Theft Prediction', icon: Target },
                   ].map(st => (
                     <button 
                      key={st.id} 
                      onClick={() => setLossSubTab(st.id as any)}
                      className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${lossSubTab === st.id ? 'bg-white/10 text-white shadow-inner border border-white/10' : 'text-gray-600 hover:text-gray-300'}`}
                     >
                        <st.icon size={12} /> {st.label}
                     </button>
                   ))}
                </div>

                {lossSubTab === 'CASH' && (
                  <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
                     {/* Existing Cash Handover Code (Preserved) */}
                     <div className="bg-[#111827] border border-white/5 rounded-[70px] p-12 shadow-4xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.03]"><Calculator size={300} /></div>
                      
                      <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8 relative z-10">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-emerald-600/10 rounded-[24px] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-xl"><Calculator size={32}/></div>
                           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Daily Node Reconciliation</h3>
                        </div>
                        {isTodayHandoverDone ? (
                          <div className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl animate-pulse flex items-center gap-3">
                             <CheckCircle2 size={18} /> HANDOVER DONE FOR TODAY
                          </div>
                        ) : (
                          <div className="flex gap-4">
                             <button onClick={runAiAudit} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-3 transition-all hover:bg-indigo-500 italic">
                                {isAuditing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} [ AI AUDIT & GROWTH SCRIPT ]
                             </button>
                             <div className="px-6 py-2 bg-amber-600/10 border border-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-2 animate-pulse"><AlertTriangle size={14}/> Handover Pending</div>
                          </div>
                        )}
                      </div>

                      {!isTodayHandoverDone ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                           <div className="space-y-8">
                              {/* 1. OP & IP COLLECTIONS */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {/* OP Cash Section */}
                                 <div className={`bg-[#0a0f18] p-8 rounded-[40px] border space-y-6 shadow-inner transition-all ${getStatusSignal(cashForm.opCount * cashForm.opRate, systemExpected?.opTotal) === 'MISMATCH' ? 'border-red-500/30' : 'border-emerald-500/20'}`}>
                                    <div className="flex justify-between items-center">
                                       <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-3 italic"><User size={16}/> OP Cash Handover</h4>
                                       <div className={`w-3 h-3 rounded-full ${getStatusSignal(cashForm.opCount * cashForm.opRate, systemExpected?.opTotal) === 'OK' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <div className="space-y-2">
                                          <label className="text-[8px] font-black text-gray-600 uppercase ml-2">Entered Patient Count</label>
                                          <input 
                                            type="number" value={cashForm.opCount} onChange={e => setCashForm({...cashForm, opCount: parseInt(e.target.value) || 0})}
                                            className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm font-black text-white focus:border-indigo-500 outline-none" 
                                          />
                                       </div>
                                       <div className="space-y-2 text-right">
                                          <label className="text-[8px] font-black text-gray-600 uppercase mr-2">System Recorded</label>
                                          <p className="text-xl font-black text-slate-500 italic">₹{systemExpected?.opTotal?.toLocaleString() || 0}</p>
                                       </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                       <span className="text-[9px] font-black text-gray-700 uppercase">Calculation: {cashForm.opCount} x 300</span>
                                       <span className="text-xl font-black text-white italic">₹{cashForm.opCount * cashForm.opRate}</span>
                                    </div>
                                 </div>

                                 {/* IP Cash Section */}
                                 <div className={`bg-[#0a0f18] p-8 rounded-[40px] border space-y-6 shadow-inner transition-all ${getStatusSignal(cashForm.ipTotal, systemExpected?.ipTotal) === 'MISMATCH' ? 'border-red-500/30' : 'border-emerald-500/20'}`}>
                                    <div className="flex justify-between items-center">
                                       <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3 italic"><Bed size={16}/> IP Cash Handover</h4>
                                       <div className={`w-3 h-3 rounded-full ${getStatusSignal(cashForm.ipTotal, systemExpected?.ipTotal) === 'OK' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-[8px] font-black text-gray-600 uppercase ml-2">Total IP Paid Amount</label>
                                       <input 
                                          type="number" value={cashForm.ipTotal} onChange={e => setCashForm({...cashForm, ipTotal: parseInt(e.target.value) || 0})}
                                          className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-2xl font-black text-emerald-500 outline-none focus:border-emerald-500" 
                                       />
                                       <div className="flex justify-between mt-2 text-[8px] font-black uppercase text-gray-600 italic px-2">
                                          <span>System Logged:</span>
                                          <span>₹{systemExpected?.ipTotal?.toLocaleString() || 0}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* 2. PHARMACY & LABS */}
                              <div className="bg-[#0a0f18] p-8 rounded-[40px] border border-gray-800 space-y-8 shadow-inner">
                                 <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-3 italic border-b border-white/5 pb-4"><Package size={16}/> Node Cross-Match: Pharmacy & Lab</h4>
                                 <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                       <div className="flex justify-between items-center">
                                          <label className="text-[8px] font-black text-gray-600 uppercase ml-2">Entered Pharmacy Total</label>
                                          <div className={`w-2 h-2 rounded-full ${getStatusSignal(cashForm.pharmacyTotal, systemExpected?.pharmacyTotal) === 'OK' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                       </div>
                                       <input 
                                          type="number" value={cashForm.pharmacyTotal} onChange={e => setCashForm({...cashForm, pharmacyTotal: parseInt(e.target.value) || 0})}
                                          className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-lg font-black text-white outline-none focus:border-pink-500" 
                                       />
                                       <p className="text-[8px] text-gray-700 font-bold uppercase text-center italic">Sys Total: ₹{systemExpected?.pharmacyTotal?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="space-y-4">
                                       <div className="flex justify-between items-center">
                                          <label className="text-[8px] font-black text-gray-600 uppercase ml-2">Entered Lab Total</label>
                                          <div className={`w-2 h-2 rounded-full ${getStatusSignal(cashForm.labTotal, systemExpected?.labTotal) === 'OK' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                       </div>
                                       <input 
                                          type="number" value={cashForm.labTotal} onChange={e => setCashForm({...cashForm, labTotal: parseInt(e.target.value) || 0})}
                                          className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-lg font-black text-white outline-none focus:border-pink-500" 
                                       />
                                       <p className="text-[8px] text-gray-700 font-bold uppercase text-center italic">Sys Total: ₹{systemExpected?.labTotal?.toLocaleString() || 0}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-8">
                              {/* 3. RADIOLOGY BREAKDOWN */}
                              <div className="bg-[#0a0f18] p-10 rounded-[50px] border border-gray-800 space-y-8 shadow-inner">
                                 <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3 italic border-b border-white/5 pb-4"><Scan size={16}/> Radiology Breakdown & Signal</h4>
                                 <div className="grid grid-cols-2 gap-6">
                                    {[
                                      { id: 'usgTotal', label: 'USG Scan', expected: systemExpected?.usgTotal },
                                      { id: 'xrayTotal', label: 'X-Ray Scan', expected: systemExpected?.xrayTotal },
                                      { id: 'ctTotal', label: 'CT Scan', expected: systemExpected?.ctTotal },
                                      { id: 'mriTotal', label: 'MRI Scan', expected: systemExpected?.mriTotal }
                                    ].map(r => (
                                      <div key={r.id} className="space-y-2">
                                         <div className="flex justify-between items-center px-2">
                                            <label className="text-[8px] font-black text-gray-700 uppercase">{r.label}</label>
                                            <div className={`w-1.5 h-1.5 rounded-full ${getStatusSignal((cashForm as any)[r.id], r.expected) === 'OK' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                         </div>
                                         <input 
                                            type="number" value={(cashForm as any)[r.id]} onChange={e => setCashForm({...cashForm, [r.id]: parseInt(e.target.value) || 0})}
                                            className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm font-black text-blue-400 outline-none focus:border-blue-500" 
                                         />
                                         <p className="text-[7px] text-gray-800 text-center font-bold italic">Sys: ₹{r.expected?.toLocaleString() || 0}</p>
                                      </div>
                                    ))}
                                 </div>
                              </div>

                              <div className="bg-[#0a0f18] p-8 rounded-[40px] border border-gray-800 space-y-4 shadow-inner">
                                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-3 italic"><Target size={16}/> Referral Settlements</h4>
                                 <div className="space-y-2">
                                    <label className="text-[8px] font-black text-gray-600 uppercase ml-2">Referral Money Total</label>
                                    <input 
                                       type="number" value={cashForm.referralTotal} onChange={e => setCashForm({...cashForm, referralTotal: parseInt(e.target.value) || 0})}
                                       className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-xl font-black text-amber-500 outline-none focus:border-amber-500" 
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center gap-10 animate-in zoom-in-95">
                           <div className="w-32 h-32 bg-emerald-600/10 border-4 border-emerald-500 rounded-full flex items-center justify-center text-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                              <CheckCircle2 size={64} />
                           </div>
                           <div className="text-center space-y-4">
                              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Handover Secured</h3>
                              <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-sm">Institutional node locked for {new Date().toLocaleDateString()}</p>
                           </div>
                           <button 
                             onClick={() => setHandoverHistory(prev => prev.filter(h => h.date !== new Date().toISOString().split('T')[0]))}
                             className="px-10 py-3 bg-white/5 border border-white/10 text-gray-700 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                           >
                              Force Reset Daily Handover Node
                           </button>
                        </div>
                      )}

                      {/* 🤖 AI AUDIT & GROWTH OUTPUT */}
                      {aiAuditReport && (
                        <div className="mt-12 bg-[#0a0f18] p-10 rounded-[60px] border border-indigo-500/20 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                           <div className="absolute top-0 right-0 p-8 opacity-[0.02]"><Bot size={150}/></div>
                           <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
                              <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] italic flex items-center gap-4">
                                 <Bot size={20} className="animate-bounce" /> Institutional Audit & Growth Advisory
                              </h4>
                              <button onClick={() => speakText(aiAuditReport)} className="p-3 bg-indigo-600/10 text-indigo-500 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg"><Volume2 size={20}/></button>
                           </div>
                           <div className="prose prose-invert max-w-none text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                              {aiAuditReport}
                           </div>
                        </div>
                      )}

                      {!isTodayHandoverDone && (
                        <div className="mt-12 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                           <div className="flex items-center gap-10">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Net Variance (Actual vs Expected)</p>
                                 <p className={`text-5xl font-black italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] ${variance !== 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{variance.toLocaleString()}</p>
                              </div>
                              <div className="h-14 w-px bg-white/10" />
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Aggregate Daily Yield</p>
                                 <p className="text-5xl font-black text-white italic tracking-tighter">₹{grandTotal.toLocaleString()}</p>
                              </div>
                           </div>
                           <button 
                             onClick={handleFinalizeHandover}
                             className={`px-20 py-8 rounded-[40px] font-black uppercase text-sm tracking-[0.4em] shadow-4xl transition-all active:scale-95 italic border-2 border-white/10 flex items-center gap-6 ${variance !== 0 ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                           >
                              {variance !== 0 ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
                              [ {variance !== 0 ? 'COMMIT WITH VARIANCE' : 'FINALIZE HANDOVER'} ]
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {lossSubTab === 'DASHBOARD' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="bg-[#111827] border border-white/5 p-10 rounded-[50px] shadow-3xl space-y-4">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Active Registry Nodes</p>
                        <p className="text-6xl font-black text-white italic leading-none">12</p>
                     </div>
                  </div>
                )}

                {lossSubTab === 'AREA_TRACKERS' && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                          { id: 'ZONE-A', name: 'Main Entrance', status: 'SECURE', personnel: 2, activity: 'Normal Flow' },
                          { id: 'ZONE-B', name: 'Pharmacy Storage', status: 'LOCKED', personnel: 0, activity: 'No Motion' },
                          { id: 'ZONE-C', name: 'Emergency Bay', status: 'ACTIVE', personnel: 4, activity: 'High Traffic' },
                          { id: 'ZONE-D', name: 'Server Room', status: 'RESTRICTED', personnel: 0, activity: 'Biometric Lock' },
                          { id: 'ZONE-E', name: 'Rear Exit', status: 'SECURE', personnel: 1, activity: 'Patrol Active' },
                          { id: 'ZONE-F', name: 'Admin Block', status: 'SECURE', personnel: 1, activity: 'Quiet' },
                        ].map(zone => (
                          <div key={zone.id} className="bg-[#111827] border border-white/5 p-6 rounded-[30px] shadow-xl group hover:border-indigo-500/30 transition-all relative overflow-hidden">
                             <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${zone.status === 'LOCKED' || zone.status === 'SECURE' ? 'bg-emerald-500 shadow-[0_0_8px_emerald]' : 'bg-amber-500 animate-pulse'}`} />
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{zone.status}</span>
                                </div>
                                <MapPin size={16} className="text-indigo-500" />
                             </div>
                             <h4 className="text-lg font-black text-white uppercase italic tracking-tight">{zone.name}</h4>
                             <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest relative z-10">
                                <span>{zone.personnel} Staff Active</span>
                                <span>{zone.activity}</span>
                             </div>
                             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                     </div>
                     
                     <div className="bg-[#0a0f18] p-8 rounded-[40px] border border-white/5 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20">
                              <Scan size={24} />
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-white uppercase italic">Perimeter Scan</h4>
                              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Automated visual sweep every 15 mins</p>
                           </div>
                        </div>
                        <button className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                           Trigger Manual Sweep
                        </button>
                     </div>
                  </div>
                )}
                
                {lossSubTab === 'SCHEDULED' && (
                  <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
                     <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">AI Scheduled Probes</h3>
                        <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all">
                           + Trigger Probe
                        </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                           { id: 'PROBE-001', area: 'Crash Cart A', task: 'Expiry Check', status: 'Pending' },
                           { id: 'PROBE-002', area: 'Pharmacy Shelf B', task: 'Stock Count', status: 'Pending' },
                           { id: 'PROBE-003', area: 'OT Tray 4', task: 'Instrument Audit', status: 'Completed', result: '100% Match' },
                        ].map((probe, i) => (
                           <div key={i} className="bg-[#111827] border border-white/5 p-6 rounded-[30px] shadow-lg group hover:border-indigo-500/30 transition-all">
                              <div className="flex justify-between items-start mb-4">
                                 <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${probe.status === 'Pending' ? 'bg-amber-600/10 text-amber-500' : 'bg-emerald-600/10 text-emerald-500'}`}>{probe.status}</span>
                                 <Calendar size={16} className="text-gray-600" />
                              </div>
                              <h4 className="text-lg font-black text-white uppercase italic">{probe.area}</h4>
                              <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 tracking-widest">{probe.task}</p>
                              {probe.result && <p className="text-[10px] font-black text-emerald-500 mt-3 pt-3 border-t border-white/5">{probe.result}</p>}
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {lossSubTab === 'SURGERY' && (
                  <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
                     <div className="flex items-center gap-6 mb-4">
                        <div className="w-12 h-12 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20"><Scissors size={24}/></div>
                        <div>
                           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Surgery Lock Protocol</h3>
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Material Reconciliation</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 gap-6">
                        {[
                           { id: 'SRG-101', procedure: 'Appendectomy - OT 1', issued: 10, used: 8, returned: 1, status: 'Mismatch', diff: -1 },
                           { id: 'SRG-102', procedure: 'Hernia Repair - OT 2', issued: 15, used: 15, returned: 0, status: 'Matched', diff: 0 },
                        ].map((srg, i) => (
                           <div key={i} className={`p-6 rounded-[35px] border flex justify-between items-center ${srg.status === 'Mismatch' ? 'bg-red-950/10 border-red-500/30' : 'bg-[#111827] border-white/5'}`}>
                              <div>
                                 <h4 className="text-lg font-black text-white uppercase italic">{srg.procedure}</h4>
                                 <div className="flex gap-4 mt-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                    <span>Issued: {srg.issued}</span>
                                    <span>Used: {srg.used}</span>
                                    <span>Returned: {srg.returned}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={`text-xl font-black italic ${srg.status === 'Mismatch' ? 'text-red-500' : 'text-emerald-500'}`}>{srg.status}</p>
                                 {srg.diff !== 0 && <p className="text-[10px] font-black text-red-400 mt-1 uppercase tracking-widest">Variance: {srg.diff}</p>}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {lossSubTab === 'RISK_RADAR' && (
                  <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
                     <div className="flex items-center gap-6 mb-4">
                        <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20"><Target size={24}/></div>
                        <div>
                           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Theft Prediction Radar</h3>
                           <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">High Variance Behaviors</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                           { id: '102', name: 'Staff ID 102', role: 'Nurse', risk: 'High', flag: 'High Variance Frequency' },
                           { id: 'PHARM-N', name: 'Pharmacy Night Shift', role: 'Unit', risk: 'Critical', flag: 'Access Anomalies' },
                           { id: '105', name: 'Staff ID 105', role: 'Billing', risk: 'Moderate', flag: 'Cash Mismatch Trend' },
                        ].map((risk, i) => (
                           <div key={i} className="bg-[#111827] border border-red-500/20 p-6 rounded-[30px] shadow-lg relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform"><UserMinus size={80}/></div>
                              <div className="relative z-10">
                                 <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${risk.risk === 'Critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-600/20 text-orange-500'}`}>{risk.risk} Risk</span>
                                    <UserCheck size={16} className="text-gray-600"/>
                                 </div>
                                 <h4 className="text-lg font-black text-white uppercase italic">{risk.name}</h4>
                                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{risk.role}</p>
                                 <p className="text-[10px] font-black text-red-400 mt-4 pt-4 border-t border-white/5">{risk.flag}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
           )}

           {activeTab === 'ANOMALIES' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#111827] border border-red-500/20 p-8 rounded-[40px] shadow-xl">
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Total Anomalies</p>
                     <p className="text-5xl font-black text-white italic mt-2">{anomalies.length}</p>
                  </div>
                  <div className="bg-[#111827] border border-amber-500/20 p-8 rounded-[40px] shadow-xl">
                     <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">High Severity</p>
                     <p className="text-5xl font-black text-white italic mt-2">{anomalies.filter(a => a.severity === 'HIGH').length}</p>
                  </div>
                  <div className="bg-[#111827] border border-emerald-500/20 p-8 rounded-[40px] shadow-xl">
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Resolved</p>
                     <p className="text-5xl font-black text-white italic mt-2">0</p>
                  </div>
               </div>

               <div className="bg-[#111827] border border-white/5 rounded-[50px] p-10 shadow-3xl space-y-6">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter border-b border-white/5 pb-4 flex items-center gap-3">
                     <Activity size={20} className="text-red-500"/> Live Anomaly Feed
                  </h3>
                  <div className="space-y-4">
                     {anomalies.length > 0 ? anomalies.map((alert, i) => (
                       <div key={i} className={`p-6 rounded-[32px] border flex items-start gap-5 ${alert.severity === 'HIGH' ? 'bg-red-950/20 border-red-500/30' : 'bg-amber-950/10 border-amber-500/20'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === 'HIGH' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'}`}>
                             {alert.severity === 'HIGH' ? <AlertOctagon size={18}/> : <AlertTriangle size={18}/>}
                          </div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${alert.severity === 'HIGH' ? 'bg-red-600/20 text-red-400' : 'bg-amber-600/20 text-amber-400'}`}>{alert.severity}</span>
                                <span className="text-[9px] font-black text-gray-500 uppercase">{new Date(alert.timestamp).toLocaleString()}</span>
                             </div>
                             <p className="text-sm font-bold text-white italic">{alert.type}</p>
                             <p className="text-[11px] text-slate-400 mt-1 italic">"{alert.message}"</p>
                             <p className="text-[9px] text-gray-600 font-black uppercase mt-2 tracking-widest">User ID: {alert.userId}</p>
                          </div>
                       </div>
                     )) : (
                       <div className="py-10 text-center opacity-20">
                          <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500"/>
                          <p className="text-[10px] font-black uppercase tracking-widest">No Active Anomalies</p>
                       </div>
                     )}
                  </div>
               </div>
             </div>
           )}

           {activeTab === 'FORENSICS' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Forensic Timeline</h3>
                  <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                     <input 
                       type="text" placeholder="Search Trace ID..." 
                       value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                       className="bg-[#0a0f18] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-[10px] font-black text-white w-64 focus:border-indigo-500 outline-none"
                     />
                  </div>
               </div>

               <div className="relative border-l-2 border-white/10 ml-6 space-y-10 pl-10 py-4">
                  {forensicLogs.length > 0 ? forensicLogs.map((trace, i) => (
                    <div key={i} className="relative group">
                       <div className={`absolute -left-[50px] w-5 h-5 rounded-full border-4 border-[#05070a] ${trace.varianceDetected ? 'bg-red-500' : 'bg-emerald-500'}`} />
                       <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] shadow-xl group-hover:border-indigo-500/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trace.eventType.includes('SURGERY') ? 'bg-blue-600/10 text-blue-500' : 'bg-purple-600/10 text-purple-500'}`}>
                                   {trace.eventType.includes('SURGERY') ? <Scissors size={18}/> : <Package size={18}/>}
                                </div>
                                <div>
                                   <p className="text-sm font-black text-white uppercase italic">{trace.eventType.replace('_', ' ')}</p>
                                   <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{trace.location} • {new Date(trace.timestamp).toLocaleString()}</p>
                                </div>
                             </div>
                             <span className="text-[8px] font-mono text-gray-700 bg-black/40 px-3 py-1 rounded-lg border border-white/5">{trace.manualAuditHash}</span>
                          </div>
                          
                          {trace.varianceDetected && (
                            <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-2xl mb-4 flex items-center gap-3">
                               <AlertTriangle size={14} className="text-red-500"/>
                               <p className="text-[10px] font-bold text-red-200 italic">Variance: {trace.varianceDetails}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <p className="text-[8px] font-black text-gray-600 uppercase mb-2">Items Logged</p>
                                <div className="flex flex-wrap gap-2">
                                   {trace.itemsDetected.map((item, j) => (
                                     <span key={j} className="text-[9px] text-slate-400 bg-white/5 px-2 py-1 rounded">{item}</span>
                                   ))}
                                </div>
                             </div>
                             {/* Placeholder for images if real URLs existed */}
                             <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center justify-center text-gray-600 gap-2">
                                <ImageIcon size={14} />
                                <span className="text-[8px] font-black uppercase">Evidence Secured</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center opacity-20 ml-[-40px]">
                       <FileSearch size={64} className="mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No Forensic Events Logged</p>
                    </div>
                  )}
               </div>
             </div>
           )}

           {activeTab === 'ACCESS' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-[#111827] border border-indigo-500/20 p-8 rounded-[40px] shadow-xl">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Total Access Events</p>
                      <p className="text-5xl font-black text-white italic mt-2">{accessLogs.length}</p>
                   </div>
                   <div className="bg-[#111827] border border-orange-500/20 p-8 rounded-[40px] shadow-xl">
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Night Shifts (23:00 - 06:00)</p>
                      <p className="text-5xl font-black text-white italic mt-2">
                         {accessLogs.filter(l => {
                            const h = new Date(l.time).getHours();
                            return h >= 23 || h <= 6;
                         }).length}
                      </p>
                   </div>
                </div>

                <div className="bg-[#111827] border border-white/5 rounded-[50px] p-10 shadow-3xl overflow-hidden">
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                      <Key size={20} className="text-emerald-500"/> Access Ledger
                   </h3>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                               <th className="p-4">Timestamp</th>
                               <th className="p-4">Staff Identity</th>
                               <th className="p-4">Area / Node</th>
                               <th className="p-4">Action</th>
                               <th className="p-4 text-right">Verification</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-800/50">
                            {accessLogs.length > 0 ? accessLogs.slice().reverse().map((log, i) => (
                              <tr key={i} className="group hover:bg-white/5 transition-all">
                                 <td className="p-4 text-[10px] text-gray-400 font-mono">{new Date(log.time).toLocaleString()}</td>
                                 <td className="p-4 text-xs font-bold text-white uppercase italic">{log.staffId}</td>
                                 <td className="p-4 text-xs text-indigo-400 font-bold uppercase">{log.area}</td>
                                 <td className="p-4 text-xs text-gray-300 italic">{log.action}</td>
                                 <td className="p-4 text-right">
                                    <span className="text-[8px] font-black text-emerald-500 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-500/20">LOGGED</span>
                                 </td>
                              </tr>
                            )) : (
                              <tr>
                                 <td colSpan={5} className="p-10 text-center text-[10px] font-black text-gray-600 uppercase tracking-widest italic">No Access Records Found</td>
                              </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
           )}
        </div>
      </main>

      {/* ZERO LOSS PROMISE FOOTER */}
      <footer className="fixed bottom-0 left-64 right-0 h-14 bg-emerald-600 flex items-center justify-between px-10 border-t border-emerald-500 z-50">
         <div className="flex items-center gap-4">
            <ShieldCheck size={20} className="text-white" />
            <span className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">🛡 ZERO LOSS PROMISE PROTOCOL: ACTIVE OVERSIGHT</span>
         </div>
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]"/>
               <span className="text-[9px] font-black text-white uppercase">RECONCILIATION GATE: LOCKED</span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest">Audit Ref: PRAGNYA-GX-900</span>
         </div>
      </footer>
    </div>
  );
};

export default SecurityDashboard;

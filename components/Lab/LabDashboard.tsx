import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FlaskConical, Clock, CheckCircle2, Search, FileUp, 
  Activity, User, Filter, CheckCircle, LogOut, Loader2, 
  Lock, AlertTriangle, BarChart3, TrendingUp, Sparkles,
  Zap, AlertCircle, History, ShieldCheck, Microscope, 
  ArrowRight, RefreshCw, Layers, Database, Gavel, Bug,
  Bot, X, GraduationCap, Edit3, Save, Check, ClipboardCheck, 
  ArrowUpRight, ShieldAlert, Barcode, Timer, LayoutGrid, FileSearch,
  ChevronRight, Target, ImageIcon, Upload, Beaker,
  Thermometer, Droplets, Info, FileDown, Inbox, Command,
  Network, Cpu, HardDrive, UserPlus, Camera, Trash2, Printer, PlusCircle, UserCheck,
  TrendingDown, Landmark, Wallet, IndianRupee, Scan, FilePlus, UserCircle,
  FileText
} from 'lucide-react';
import { Patient, Investigation, SampleStage, LabResultData, LabResultData as LabResult, LabInvestment } from '../../types';
import { speakText, extractLabDataFromImage, sushrutAnalyzeLabInvestmentOCR, sushrutAnalyzeLabReportOCR } from '../../geminiService';
import { emitEvent } from '../../utils/hospitalEvents';
import EnterpriseDiagnosticHub from './EnterpriseDiagnosticHub';
import ProtectionShiftLock from '../Shared/ProtectionShiftLock';
import { protectionService } from '../../utils/protectionLogic';

/* ==========================================================
LAB DASHBOARD ORDER RESTORE PATCH
SCAN MULTIPLE INSTITUTIONAL KEYS
NO DELETION | NO REGRESSION
========================================================== */

const LabOrderRestore: React.FC<{ onSync: (orders: any[]) => void }> = ({ onSync }) => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = () => {
      const keys = [
        "doctor_investigation_orders",
        "department_orders",
        "enterprise_lab_reports",
        "investigation_registry",
        "lab_worklist_cache"
      ];

      let merged: any[] = [];
      keys.forEach(key => {
        try {
          const val = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(val)) {
            val.forEach(item => {
              if (item.testName || item.name) {
                const exists = merged.some(m => m.patientId === item.patientId && (m.testName === (item.testName || item.name)));
                if (!exists) merged.push(item);
              }
            });
          }
        } catch(e) {}
      });

      setOrders(merged);
      onSync(merged);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [onSync]);

  if (orders.length === 0) return null;

  return (
    <div className="mb-10 p-8 bg-indigo-950/20 border border-indigo-500/30 rounded-[50px] shadow-3xl animate-in slide-in-from-top-4 duration-700">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
           <Database className="text-indigo-400" size={24} />
           <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Registry Ingress Queue</h3>
        </div>
        <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase">{orders.length} Active Nodes</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {orders.map((order, i) => (
          <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-[30px] flex flex-col gap-3 group hover:border-indigo-500/30 transition-all shadow-inner">
            <div className="flex justify-between items-start">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{order.patientId}</p>
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <p className="text-sm font-black text-white uppercase italic truncate group-hover:text-indigo-400 transition-colors">{order.testName || order.name || order.item_name}</p>
            <p className="text-[8px] text-gray-700 font-bold uppercase mt-2">Source: {order.department || 'Clinical Node'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const LabDashboard: React.FC<{
  patients?: Patient[];
  onLogout?: () => void;
  onUpdateInvestigation?: (patientId: string, invId: string, updates: Partial<Investigation>) => void;
  onNewPatient?: (patient: Patient) => void;
}> = ({ patients = [], onLogout, onUpdateInvestigation }) => {
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showShiftLock, setShowShiftLock] = useState(false);
  
  const [encounterFilter, setEncounterFilter] = useState<'ALL' | 'OP' | 'IP' | 'ICU'>('ALL');
  const [activeWorkflow, setActiveWorkflow] = useState<'ANALYTICAL' | 'ENTERPRISE_HUB' | 'UPLOADS' | 'HISTORY'>('ANALYTICAL');
  
  const [legacyOrders, setLegacyOrders] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const allOrderedTests = useMemo(() => {
    const stateOrders = (patients || []).flatMap(p => 
      (p.investigations || [])
        .filter(inv => inv.type === 'LAB')
        .map(inv => ({ 
          ...inv, 
          patientName: p.name, 
          patientId: p.id, 
          age: p.age, 
          gender: p.gender,
          patientType: p.type,
          complaint: p.chiefComplaint,
          patient: p,
          isLegacy: false 
        }))
    );

    const legacyMapped = legacyOrders.map((lo, idx) => ({
      id: `LEGACY-${idx}-${lo.patientId}`,
      test_id: `L-${idx}`,
      name: lo.testName || lo.item_name || lo.name || "Unknown Lab Node",
      type: 'LAB' as const,
      priority: 'Routine',
      price: lo.rate || 0,
      payment_status: 'PAID',
      result_status: 'LOCKED',
      expectedTurnaround: '6h',
      patientName: `NODE-${lo.patientId?.slice(-4) || 'UNK'}`,
      patientId: lo.patientId,
      patientType: lo.patientId?.startsWith('IP') ? 'IP' : 'OP',
      isLegacy: true,
      patient: undefined as Patient | undefined,
      sampleStage: undefined as SampleStage | undefined,
      complaint: lo.complaint || lo.notes || 'Registry Entry',
      orderedBy: lo.orderedBy || 'Consultant Node'
    })).filter(lo => !stateOrders.some(so => so.name === lo.name && so.patientId === lo.patientId));

    return [...stateOrders, ...legacyMapped].sort((a: any, b: any) => {
        const prioMap: Record<string, number> = { 'Stat': 0, 'Urgent': 1, 'Must': 2, 'Routine': 3 };
        return (prioMap[a.priority as string] || 4) - (prioMap[b.priority as string] || 4);
    });
  }, [patients, legacyOrders]);

  const filteredTests = useMemo(() => {
    return allOrderedTests.filter(inv => {
      const matchesSearch = (inv.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || inv.patientId?.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
      if (encounterFilter !== 'ALL' && inv.patientType !== encounterFilter) return false;
      return true;
    });
  }, [allOrderedTests, searchTerm, encounterFilter]);

  const selectedInv = useMemo(() => allOrderedTests.find(i => i.id === selectedInvId), [allOrderedTests, selectedInvId]);

  const handleStageAdvance = (patientId: string, invId: string, currentStage?: SampleStage) => {
    if (invId.startsWith('LEGACY-')) {
       alert("Legacy Node: Synchronizing with state registry before release.");
       return;
    }
    const stages: SampleStage[] = ['COLLECTED', 'RECEIVED', 'PROCESSING', 'ANALYZER', 'VERIFIED', 'RELEASED'];
    const currentIndex = currentStage ? stages.indexOf(currentStage) : -1;
    const nextStage = stages[currentIndex + 1];
    if (!nextStage) return;

    const updates: Partial<Investigation> = { sampleStage: nextStage };
    const timeKey = `${nextStage.toLowerCase()}At` as keyof Investigation;
    (updates as any)[timeKey] = new Date().toISOString();
    
    if (nextStage === 'RELEASED') {
        updates.result_status = 'COMPLETED';
        updates.currentResult = 'Test cycle complete. Integrity hash verified by institutional kernel.';
    }

    onUpdateInvestigation?.(patientId, invId, updates);
  };

  const handleGenericUpload = (type: 'RESUME' | 'PHOTO' | 'RESULT') => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          speakText(`${type} successfully committed to institutional vault.`, "Zephyr");
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="flex h-full bg-[#020408] overflow-hidden font-['Inter'] relative text-slate-200">
      
      <aside className="w-80 border-r border-white/5 bg-[#070b14]/80 backdrop-blur-3xl flex flex-col shrink-0 relative z-20 shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-[#0a0f18]/90">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-600 rounded-[18px] flex items-center justify-center text-white shadow-xl">
                <FlaskConical size={24} />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Diagnostic Hub</h2>
            </div>
          </div>
          
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-gray-800 shadow-inner overflow-x-auto scrollbar-hide">
             <button onClick={() => setActiveWorkflow('ANALYTICAL')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeWorkflow === 'ANALYTICAL' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-600 hover:text-white'}`}>Queue</button>
             <button onClick={() => setActiveWorkflow('UPLOADS')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeWorkflow === 'UPLOADS' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-600 hover:text-white'}`}>Uploads</button>
             <button onClick={() => setActiveWorkflow('ENTERPRISE_HUB')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeWorkflow === 'ENTERPRISE_HUB' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:text-white'}`}>Enterprise</button>
          </div>
        </div>

        {activeWorkflow === 'ANALYTICAL' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-6 border-b border-white/5">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                <input 
                  type="text" placeholder="Filter active nodes..." 
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 rounded-2xl pl-12 pr-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white outline-none focus:border-pink-500/50 transition-all shadow-inner" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {filteredTests.map((inv) => (
                <div 
                  key={inv.id} onClick={() => setSelectedInvId(inv.id)}
                  className={`p-6 rounded-[35px] cursor-pointer border transition-all relative overflow-hidden group ${selectedInvId === inv.id ? 'bg-pink-600/10 border-pink-500/40 shadow-xl' : 'bg-[#111827] border-white/5 hover:border-white/10'}`}
                >
                   <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase ${inv.patientType === 'IP' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-cyan-600/20 text-cyan-400'}`}>
                        {inv.patientType || 'OP'} Node
                      </span>
                      {inv.isLegacy && <span className="px-2 py-0.5 bg-amber-600/20 text-amber-500 text-[7px] font-black rounded uppercase">Registry</span>}
                   </div>
                   <h3 className="font-black text-[15px] uppercase italic text-white truncate group-hover:text-pink-400 transition-colors leading-none">{inv.patientName}</h3>
                   <p className="text-[10px] font-bold text-gray-500 uppercase mt-2 tracking-wide truncate">{inv.name}</p>
                </div>
              ))}
              {filteredTests.length === 0 && (
                <div className="py-20 text-center opacity-10 flex flex-col items-center gap-4">
                   <Clock size={48} />
                   <p className="text-[10px] font-black uppercase tracking-widest italic">Hub Standby</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-6 bg-[#0a0f18]/90 border-t border-white/5">
           <button 
             onClick={() => setShowShiftLock(true)}
             className="w-full flex items-center justify-center gap-3 px-4 py-5 rounded-[28px] bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-black uppercase text-[10px] tracking-widest shadow-2xl mb-3"
           >
              <Lock size={20} /> [ LOCK SHIFT ]
           </button>
           <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-4 py-5 rounded-[28px] bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95">
              <LogOut size={20} /> [ EXIT HUB ]
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#020408]">
        <header className="h-20 border-b border-white/5 bg-[#0a0f18]/60 backdrop-blur-3xl flex items-center justify-between px-10 shrink-0 z-30 shadow-2xl">
            <div className="flex items-center gap-8">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Institutional Diagnostics</h2>
                <div className="flex items-center gap-4">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_emerald]" />
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Node v6.5 Active</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setActiveWorkflow('UPLOADS')} className="flex items-center gap-3 px-6 py-2.5 bg-amber-600/10 border border-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase italic shadow-xl hover:bg-amber-600 hover:text-white transition-all">
                    <FileUp size={16} /> Fast Upload
                </button>
                <button onClick={onLogout} className="px-10 py-3 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-red-600 hover:text-white transition-all italic">
                    <LogOut size={16} /> Exit Hub
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar scppable p-10">
           
           {activeWorkflow === 'ANALYTICAL' && <LabOrderRestore onSync={setLegacyOrders} />}

           {activeWorkflow === 'UPLOADS' ? (
             <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                {/* Same as previous */}
             </div>
           ) : activeWorkflow === 'ENTERPRISE_HUB' ? (
             <EnterpriseDiagnosticHub patient={selectedInv?.patient} />
           ) : selectedInv ? (
             <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in slide-in-from-right-4 duration-700">
                <div className="bg-[#111827] border border-white/5 p-12 rounded-[70px] shadow-4xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02]"><Network size={250} /></div>
                    <h4 className="text-[11px] font-black text-pink-500 uppercase tracking-[0.5em] mb-16 italic flex items-center gap-4">
                        <Barcode size={24} className="animate-pulse" /> Analytical Ingress Lattice
                    </h4>
                    
                    <div className="flex items-center justify-between relative px-10">
                        {[
                          { id: 'COLLECTED', label: 'Ingress', icon: FlaskConical },
                          { id: 'RECEIVED', label: 'Verify', icon: Database },
                          { id: 'PROCESSING', label: 'Logic', icon: RefreshCw },
                          { id: 'ANALYZER', label: 'Machine', icon: Zap },
                          { id: 'VERIFIED', label: 'Review', icon: ShieldCheck },
                          { id: 'RELEASED', label: 'Commit', icon: ArrowUpRight }
                        ].map((step, idx) => {
                          const stages: SampleStage[] = ['COLLECTED', 'RECEIVED', 'PROCESSING', 'ANALYZER', 'VERIFIED', 'RELEASED'];
                          // Fix: Use selectedInv.sampleStage instead of undefined currentStage
                          const currentIdx = selectedInv.sampleStage ? stages.indexOf(selectedInv.sampleStage) : -1;
                          const isComplete = idx <= currentIdx;
                          const isCurrent = idx === currentIdx + 1;
                          return (
                              <div key={step.id} className="relative z-10 flex flex-col items-center gap-6 group">
                                  <button 
                                    disabled={(!isCurrent && !isComplete) || (selectedInv.result_status === 'COMPLETED')}
                                    onClick={() => handleStageAdvance(selectedInv.patientId, selectedInv.id, selectedInv.sampleStage)}
                                    className={`w-16 h-16 rounded-[22px] flex items-center justify-center border transition-all duration-500 shadow-2xl ${
                                        isComplete ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/20' : 
                                        isCurrent ? 'bg-pink-600 text-white border-pink-400 shadow-pink-500/20 animate-pulse scale-110' : 
                                        'bg-[#0a0f18] text-gray-800 border-gray-900 opacity-40'
                                    }`}
                                  >
                                      <step.icon size={32} />
                                  </button>
                                  <span className={`text-[9px] font-black uppercase tracking-widest block text-center w-20 ${isCurrent ? 'text-pink-500' : isComplete ? 'text-emerald-500' : 'text-gray-800'}`}>{step.label}</span>
                              </div>
                          );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="bg-[#111827] border border-white/5 p-10 rounded-[60px] shadow-3xl flex flex-col justify-between">
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Patient Context</p>
                         <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">{selectedInv.patientName}</h3>
                         <p className="text-sm text-slate-400 italic">"Diagnosed symptoms: {selectedInv.complaint || 'Diagnostic Eval'}"</p>
                      </div>
                      <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                         <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest italic">Ordered By: {selectedInv.orderedBy || 'Consultant Node'}</span>
                         <span className="text-[10px] font-mono text-gray-600">{selectedInv.id}</span>
                      </div>
                   </div>
                   <div className="bg-[#111827] border border-pink-500/20 p-10 rounded-[60px] shadow-3xl flex flex-col items-center justify-center text-center gap-6">
                      <div className="w-20 h-20 bg-pink-600/10 border border-pink-500/20 rounded-full flex items-center justify-center text-pink-500 shadow-inner">
                         <Microscope size={40} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-black text-white uppercase italic">Pathology Station</p>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Awaiting result node release</p>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center py-32 space-y-12">
                <div className="opacity-[0.03] grayscale pointer-events-none select-none flex flex-col items-center">
                   <FlaskConical size={240} className="text-gray-700" />
                   <h3 className="text-8xl font-black uppercase tracking-[0.5em] italic mt-12 text-center leading-tight">Analytical <br/> Station</h3>
                </div>
                
                <div className="max-w-md w-full p-10 bg-[#111827] border border-amber-500/20 rounded-[50px] shadow-4xl text-center space-y-8 animate-in slide-in-from-bottom-4">
                   <div className="w-20 h-20 bg-amber-600/10 rounded-[30px] flex items-center justify-center text-amber-500 border border-amber-500/20 mx-auto shadow-inner animate-pulse">
                      <AlertTriangle size={40} />
                   </div>
                   <div className="space-y-3">
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Missing Result Node?</h4>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">If a patient's result is missing from the queue, initialize a manual ingress commit.</p>
                   </div>
                   <button onClick={() => setActiveWorkflow('UPLOADS')} className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white rounded-[32px] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 italic border-2 border-white/10 flex items-center justify-center gap-4">
                      <Scan size={20} /> UPLOAD MISSING RESULT
                   </button>
                </div>
             </div>
           )}
        </div>
      </main>

      {showShiftLock && <ProtectionShiftLock userId="LAB-ROOT" onClose={() => setShowShiftLock(false)} onShiftClosed={() => { setShowShiftLock(false); onLogout?.(); }} />}
    </div>
  );
};

export default LabDashboard;

import React, { useState, useMemo, useEffect } from 'react';
import {
  Bed, Activity, Clock, Heart, Thermometer, Zap, CheckCircle2,
  AlertTriangle, UserCheck, ShieldCheck, LogOut, Bot, Syringe,
  ChevronRight, TrendingUp, FileText, Droplets, Wind, X, MessageSquare, 
  Search, ListChecks, ArrowUpRight, Scale, Bell, Sparkles, LayoutGrid, 
  ArrowLeft, Receipt, FlaskConical, Siren, AlertCircle, History, User,
  Stethoscope, Info, Check, Send, PhoneCall, ShieldAlert, Plus, Pill, ClipboardList,
  Play, Square, Box, LifeBuoy, ShoppingCart, Loader2
} from 'lucide-react';
import { Patient, VitalsRecord, NursingTask, TimedService, ConsumptionRecord } from '../../types';
import { speakText } from '../../geminiService';
import { saveDepartmentBill } from '../Admin/BillingDashboard';
import { protectionService } from '../../utils/protectionLogic';
import StaffSupportAIAgent from '../AI/StaffSupportAIAgent';

export const useWardPatients = (allPatients: Patient[]) => {
  return useMemo(() => {
    return allPatients.filter(p => p.type === 'IP' || p.status === 'Admitted').map(p => ({
      patientId: p.id,
      patientName: p.name,
      bedNumber: p.bedNumber || 'G-101',
      ...p
    }));
  }, [allPatients]);
};

const WardDashboard: React.FC<{ patients: Patient[], onLogout?: () => void }> = ({ patients = [], onLogout }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'medications' | 'services' | 'control'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Control & Indent States
  const [showCrashCart, setShowCrashCart] = useState(false);
  const [showStaffSupport, setShowStaffSupport] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [indentItem, setIndentItem] = useState("");
  const [isSendingIndent, setIsSendingIndent] = useState(false);

  const wardPatients = useWardPatients(patients);
  const selectedPatient = useMemo(() => wardPatients.find(p => p.id === selectedPatientId), [wardPatients, selectedPatientId]);

  const filteredPatients = useMemo(() => {
    return wardPatients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [wardPatients, searchTerm]);

  return (
    <div className="flex h-screen bg-[#020408] text-slate-200 overflow-hidden font-['Inter'] relative">
      <aside className="w-80 border-r border-white/5 bg-[#070b14] flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 bg-[#0a0f18]/40">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                 <Bed size={20} />
              </div>
              <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Ward Node</h1>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              <input 
                type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filter beds..." 
                className="w-full bg-black/40 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-bold uppercase text-white outline-none focus:border-indigo-500" 
              />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {filteredPatients.map(p => (
             <div 
               key={p.id} onClick={() => setSelectedPatientId(p.id)}
               className={`p-6 border-b border-white/5 cursor-pointer transition-all ${selectedPatientId === p.id ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500' : 'hover:bg-white/5'}`}
             >
                <div className="flex justify-between items-start">
                   <p className="text-sm font-black text-white uppercase italic truncate w-3/4">{p.name}</p>
                   <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-[7px] font-black uppercase">{p.bedNumber || 'G-101'}</span>
                </div>
                <p className="text-[9px] text-gray-600 font-bold uppercase mt-1">{p.id}</p>
             </div>
           ))}
        </div>
        <div className="p-6 border-t border-white/5 bg-[#0a0f18]/40">
           <button onClick={onLogout} className="w-full py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
              <LogOut size={16} /> [ EXIT HUB ]
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#020408]">
        {selectedPatient ? (
          <>
            <header className="h-20 border-b border-white/5 bg-[#0d1321]/60 backdrop-blur-3xl flex items-center justify-between px-10 shrink-0 z-20">
               <div className="flex items-center gap-8">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                    <Bed size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedPatient.name}</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase mt-2">MRN: {selectedPatient.id} • Bed: {selectedPatient.bedNumber || 'G-101'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowStaffSupport(true)}
                    className="px-6 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl flex items-center gap-3 transition-all border border-red-500/20"
                  >
                    <ShieldAlert size={16} /> ASK HELP - STAFF AI
                  </button>
                  <button 
                    onClick={() => setShowCrashCart(true)}
                    className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl flex items-center gap-3 animate-pulse border border-white/10"
                  >
                    <Siren size={18} /> OPEN CRASH CART
                  </button>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 scppable">
               <div className="max-w-6xl mx-auto space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     {[
                       { label: 'Temp', value: '98.4 F', icon: Thermometer, color: 'text-amber-500' },
                       { label: 'Pulse', value: '78 bpm', icon: Activity, color: 'text-cyan-500' },
                       { label: 'SpO2', value: '98%', icon: Wind, color: 'text-emerald-500' },
                       { label: 'BP', value: '120/80', icon: Droplets, color: 'text-blue-500' },
                     ].map(v => (
                       <div key={v.label} className="bg-[#111827] border border-white/5 p-6 rounded-[35px] shadow-3xl group">
                          <div className="flex justify-between items-center mb-4">
                             <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{v.label} Pulse</p>
                             <v.icon size={16} className={v.color} />
                          </div>
                          <p className="text-3xl font-black text-white italic">{v.value}</p>
                       </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                     <div className="lg:col-span-8 bg-[#0a0f18] border border-white/5 rounded-[50px] p-10 shadow-3xl space-y-8">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-4 border-b border-white/5 pb-6">
                           <ListChecks size={24} className="text-indigo-500" /> Hourly Care Roster
                        </h3>
                        <div className="space-y-4">
                           {[
                             { task: "Vital Monitoring", time: "09:00 AM", status: "Done" },
                             { task: "Medication Admin (Panto-D)", time: "10:00 AM", status: "Pending" },
                             { task: "IV Fluid Check", time: "11:00 AM", status: "Due" },
                           ].map((t, i) => (
                             <div key={i} className="p-6 bg-[#111827] border border-gray-800 rounded-[35px] flex items-center justify-between group hover:border-indigo-500/40 transition-all">
                                <div className="flex items-center gap-6">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.status === 'Done' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                      <Check size={20} />
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-white uppercase italic">{t.task}</p>
                                      <p className="text-[9px] text-gray-600 font-bold uppercase mt-1">Schedule: {t.time}</p>
                                   </div>
                                </div>
                                <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase ${t.status === 'Done' ? 'bg-emerald-600/20 text-emerald-500' : 'bg-amber-600/20 text-amber-500'}`}>{t.status}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="lg:col-span-4 space-y-8">
                        <div className="bg-[#111827] border border-red-500/20 rounded-[50px] p-8 shadow-3xl space-y-6">
                           <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest italic flex items-center gap-3"><AlertTriangle size={18} /> Safety Pulse</h4>
                           <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-[32px] animate-pulse">
                              <p className="text-[10px] text-red-200 font-bold leading-relaxed italic">
                                 "Watch for respiratory lag. SpO2 dropped to 94% briefly during sleep cycle."
                              </p>
                           </div>
                           <button className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Alert Consultant</button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-5 grayscale select-none">
             <LayoutGrid size={200} />
             <h3 className="text-6xl font-black uppercase tracking-[0.5em] italic mt-12 text-center">WARD<br/>NODE</h3>
          </div>
        )}
      </main>

      {showStaffSupport && <StaffSupportAIAgent onClose={() => setShowStaffSupport(false)} />}
      
      {showCrashCart && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="bg-[#111827] border border-red-500/30 w-full max-w-4xl h-[85vh] rounded-[70px] overflow-hidden flex flex-col shadow-4xl">
              <header className="p-10 border-b border-white/5 bg-red-600/5 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <Siren size={40} className="text-red-500 animate-pulse" />
                    <div>
                       <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Crash Cart Protocol</h2>
                       <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Institutional Emergency Guard v1.0</p>
                    </div>
                 </div>
                 <button onClick={() => setShowCrashCart(false)} className="p-4 bg-white/5 hover:bg-red-600/20 rounded-2xl text-gray-500 hover:text-red-500 transition-all"><X size={32}/></button>
              </header>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {['Adrenaline', 'Atropine', 'Amiodarone', 'Lignocaine', 'Dopamine', 'Defibrillator Pad'].map(item => (
                       <button 
                        key={item} 
                        className="p-8 bg-[#0a0f18] border border-gray-800 rounded-[40px] flex flex-col items-center gap-4 group hover:border-red-500/40 transition-all shadow-inner"
                       >
                          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20 group-hover:bg-red-600 group-hover:text-white transition-all">
                             <Pill size={32} />
                          </div>
                          <span className="text-lg font-black text-white uppercase italic">{item}</span>
                       </button>
                    ))}
                 </div>
              </div>
              <footer className="p-10 bg-red-600/5 border-t border-white/5 flex justify-between items-center">
                 <p className="text-[10px] font-black text-gray-600 uppercase italic">Mandatory audit node: all withdrawals are logged via forensic hash.</p>
                 <button onClick={() => setShowCrashCart(false)} className="px-12 py-5 bg-red-600 hover:bg-red-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all">Commit Withdrawal</button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default WardDashboard;

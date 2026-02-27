
import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, Search, ShieldCheck, HeartPulse,
  Users, Bot, Heart, ShieldAlert, User, Stethoscope, Database, ArrowLeft,
  LayoutGrid, Activity, Radio, ClipboardCheck, Zap, UserCheck, Waves, Clock,
  Sparkles, MessageCircle, Mic, Bell, Ticket, Siren, CheckCircle2, TrendingUp, Monitor,
  LogOut, ChevronRight, Star
} from 'lucide-react';
import { RegistrationStatus, Patient, HealthSnapshot } from '../../types';
import MitraAgent from '../AI/MitraAgent';
import RegistrationForm from './RegistrationForm';
import HealthSnapshotForm from './HealthSnapshotForm';
import { onDashboardEnter, onDashboardExit } from '../../MitraVoiceController';
import { ReceptionAIMasterLayer } from './ReceptionAIMasterLayer';
import { ReceptionSmartFlow } from './ReceptionSmartFlow';

const StatusBadge: React.FC<{ status?: RegistrationStatus }> = ({ status }) => {
  const configs: Record<string, { label: string, color: string, dot: string }> = {
    'REGISTERED': { label: 'Registered', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
    'PENDING_TRIAGE': { label: 'Waiting for Triage', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
    'IN_TRIAGE': { label: 'In Triage', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-500' },
    'WITH_DOCTOR': { label: 'In Consultation', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-500' },
    'SENT_FOR_INVESTIGATION': { label: 'Investigation', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', dot: 'bg-cyan-500' },
    'BILLING_PENDING': { label: 'Billing Pending', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
    'SEEN_BY_DOCTOR': { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  };
  const config = configs[status || 'REGISTERED'] || configs['REGISTERED'];
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${config.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </div>
  );
};

const ReceptionDashboard: React.FC<{ 
  patients: Patient[], 
  onNewPatient: (p: Patient) => void, 
  onLogout?: () => void, 
  onUpdatePatient?: (id: string, updates: Partial<Patient>) => void
}> = ({ patients = [], onNewPatient, onLogout, onUpdatePatient }) => {
  const [showMitraFull, setShowMitraFull] = useState(false);
  const [activePanel, setActivePanel] = useState<'HOME' | 'REGISTRATION' | 'TRIAGE'>('HOME');
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [systemHealth, setSystemHealth] = useState<'NORMAL' | 'DELAY' | 'CRITICAL'>('NORMAL');

  useEffect(() => {
    onDashboardEnter("RECEPTION");
    return () => onDashboardExit();
  }, []);

  const handleHome = () => { 
    setActivePanel('HOME'); 
    setShowMitraFull(false); 
    setSelectedPid(null); 
  };
  
  const handleSnapshotSave = (snapshot: HealthSnapshot) => {
    if (selectedPid && onUpdatePatient) {
      onUpdatePatient(selectedPid, { healthSnapshot: snapshot, regStatus: 'PENDING_TRIAGE' });
    }
    setActivePanel('HOME');
    setSelectedPid(null);
  };

  const handleRegistrationComplete = (p: Patient) => {
    onNewPatient(p);
    handleHome();
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const flowMetrics = useMemo(() => {
    const reg = patients.filter(p => p.regStatus === 'REGISTERED').length;
    const triage = patients.filter(p => p.regStatus === 'IN_TRIAGE' || p.regStatus === 'PENDING_TRIAGE').length;
    const consult = patients.filter(p => p.regStatus === 'WITH_DOCTOR').length;
    const billing = patients.filter(p => p.regStatus === 'BILLING_PENDING').length;
    const exit = patients.filter(p => p.regStatus === 'SEEN_BY_DOCTOR').length;
    return { reg, triage, consult, billing, exit };
  }, [patients]);

  const cabinStatus = [
    { id: 1, name: 'Cabin 1', status: 'Available', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 2, name: 'Cabin 2', status: 'Occupied', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 3, name: 'Cabin 3', status: 'Cleaning', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 4, name: 'Diag Hub', status: 'Delay', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="flex h-full bg-[#020617] font-['Inter'] overflow-hidden relative">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 🧠 TOP COMMAND BAR */}
        <header className="h-20 bg-[#0a0f18] border-b border-white/5 flex items-center justify-between px-10 shrink-0 z-50 shadow-2xl">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">COGNIMED AI STABLE</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex gap-10">
                 <div className="text-center">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Active Nodes</p>
                    <p className="text-lg font-black text-white italic">{patients.length}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Wait Time</p>
                    <p className="text-lg font-black text-cyan-400 italic">14m</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Lattice State</p>
                    <p className="text-lg font-black text-white italic">SYCED</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest italic ${systemHealth === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                 <Activity size={14} /> SYSTEM PULSE: {systemHealth}
              </div>
              <button className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all relative">
                 <Bell size={20} />
                 <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button onClick={onLogout} className="p-3 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                 <LogOut size={20} />
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 scppable">
          {activePanel === 'HOME' && (
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-32">
              
              {/* 📊 LIVE FLOW STATUS BAR */}
              <div className="bg-[#111827] border border-white/5 rounded-3xl p-6 flex justify-between items-center shadow-xl">
                 {[
                   { label: 'Ingress', val: flowMetrics.reg, color: 'text-blue-400' },
                   { label: 'Triage', val: flowMetrics.triage, color: 'text-amber-400' },
                   { label: 'Consult', val: flowMetrics.consult, color: 'text-indigo-400' },
                   { label: 'Yield', val: flowMetrics.billing, color: 'text-rose-400' },
                   { label: 'Exit', val: flowMetrics.exit, color: 'text-emerald-400' }
                 ].map((step, i, arr) => (
                   <React.Fragment key={step.label}>
                      <div className="flex-1 flex flex-col items-center gap-1">
                         <span className="text-[14px] font-black text-white italic">{step.val}</span>
                         <span className={`text-[9px] font-bold uppercase tracking-widest ${step.color}`}>{step.label}</span>
                      </div>
                      {i < arr.length - 1 && <ChevronRight className="text-gray-800" size={16} />}
                   </React.Fragment>
                 ))}
              </div>

              {/* 🟦 PRIMARY ACTION ZONE */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <button onClick={() => setActivePanel('REGISTRATION')} className="p-8 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[35px] shadow-2xl transition-all active:scale-95 flex flex-col items-center gap-4 group">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                       <UserPlus size={32} />
                    </div>
                    <span className="text-lg font-black uppercase italic tracking-tighter leading-none">Fast Ingress</span>
                 </button>
                 <button onClick={() => setShowMitraFull(true)} className="p-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[35px] shadow-2xl transition-all active:scale-95 flex flex-col items-center gap-4 group">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                       <Ticket size={32} />
                    </div>
                    <span className="text-lg font-black uppercase italic tracking-tighter leading-none">Token Node</span>
                 </button>
                 <button className="p-8 bg-amber-600 hover:bg-amber-500 text-white rounded-[35px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                       <LayoutGrid size={32} />
                    </div>
                    <span className="text-lg font-black uppercase italic tracking-tighter leading-none">Admission</span>
                 </button>
                 <button className="p-8 bg-rose-600 hover:bg-rose-500 text-white rounded-[35px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                       <Siren size={32} />
                    </div>
                    <span className="text-lg font-black uppercase italic tracking-tighter leading-none">Emergency</span>
                 </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* 🕵️‍♂️ MIDDLE: SMART ACTIVE QUEUE */}
                 <div className="lg:col-span-8 space-y-6">
                    <div className="bg-[#111827] border border-white/5 rounded-[45px] shadow-4xl overflow-hidden">
                       <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#0a0f18]/40">
                          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                             <Users size={24} className="text-cyan-500" /> Neural Queue Registry
                          </h3>
                          <div className="relative">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={14} />
                             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filter Registry..." className="bg-black/40 border border-gray-800 rounded-2xl pl-12 pr-6 py-2.5 text-[10px] font-black text-white outline-none focus:border-cyan-500 w-64 shadow-inner tracking-widest uppercase" />
                          </div>
                       </div>
                       <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredPatients.map(p => (
                            <div key={p.id} className="p-6 bg-[#0a0f18] border border-gray-800 rounded-[35px] hover:border-cyan-500/30 transition-all group cursor-pointer">
                               <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-cyan-600/20 group-hover:text-cyan-400 transition-all"><User size={20}/></div>
                                     <div>
                                        <p className="text-sm font-black text-white uppercase italic truncate w-32">{p.name}</p>
                                        <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">TOKEN: {p.token?.number || '---'}</p>
                                     </div>
                                  </div>
                                  <StatusBadge status={p.regStatus} />
                               </div>
                               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                  <div className="flex items-center gap-2">
                                     <Clock size={12} className="text-gray-700" />
                                     <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Wait: 12m</span>
                                  </div>
                                  <div className="flex items-center gap-2 justify-end">
                                     <button onClick={() => { setSelectedPid(p.id); setActivePanel('TRIAGE'); }} className="text-[8px] font-black text-cyan-500 uppercase tracking-widest hover:text-white transition-colors">Dispatch Triage</button>
                                  </div>
                               </div>
                            </div>
                          ))}
                          {filteredPatients.length === 0 && (
                            <div className="col-span-2 py-20 text-center opacity-10 flex flex-col items-center gap-4">
                               <Database size={64}/>
                               <p className="text-xl font-black uppercase tracking-[0.5em] italic">Lattice Empty</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* 🏘️ RIGHT: CABIN FLOW & EXPERIENCE */}
                 <div className="lg:col-span-4 space-y-8">
                    {/* CABIN VISUAL MAP */}
                    <div className="bg-[#111827] border border-white/5 rounded-[45px] p-8 shadow-4xl space-y-6">
                       <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] italic flex items-center gap-3 border-b border-white/5 pb-4"><LayoutGrid size={16}/> Neural Command Map</h3>
                       <div className="grid grid-cols-2 gap-4">
                          {cabinStatus.map(cabin => (
                            <div key={cabin.id} className={`p-5 rounded-[30px] border border-white/5 ${cabin.bg} flex flex-col items-center text-center gap-3`}>
                               <div className={`w-8 h-8 rounded-lg ${cabin.bg} border border-white/5 flex items-center justify-center ${cabin.color}`}>
                                  <Stethoscope size={16} />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-white uppercase italic">{cabin.name}</p>
                                  <p className={`text-[8px] font-black uppercase mt-1 ${cabin.color}`}>{cabin.status}</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <ReceptionAIMasterLayer 
                      waitingCount={flowMetrics.triage} 
                      activePatients={patients.length}
                      onClearAction={() => {}}
                    />
                 </div>
              </div>
            </div>
          )}

          {activePanel === 'REGISTRATION' && (
            <RegistrationForm onSubmit={handleRegistrationComplete} onReset={handleHome} />
          )}

          {activePanel === 'TRIAGE' && selectedPid && (
            <HealthSnapshotForm patient={patients.find(p=>p.id===selectedPid)!} onSave={handleSnapshotSave} onCancel={handleHome} />
          )}
        </div>
      </div>

      {showMitraFull && <MitraAgent context="Reception" onClose={() => setShowMitraFull(false)} />}

      {/* 🚀 COGNIMED ASSIST (FLOATING) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] group">
        <button 
          onClick={() => {
            setShowMitraFull(true);
            window.dispatchEvent(new CustomEvent('mitra-trigger-greeting'));
          }}
          className="bg-[#0f172a]/80 hover:bg-cyan-600/30 backdrop-blur-2xl border border-white/10 px-10 py-5 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all active:scale-90 flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="relative">
             <Bot size={28} className="text-cyan-400 group-hover:text-white transition-colors" />
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#020617] animate-pulse" />
          </div>
          <div className="text-left">
             <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">COGNIMED AI ASSIST</p>
             <p className="text-[12px] font-black text-white uppercase italic leading-none">Core Interface</p>
          </div>
          <Sparkles size={16} className="text-cyan-500/40 group-hover:text-cyan-400 transition-colors animate-pulse ml-2" />
        </button>
      </div>

      {/* 🚨 CRITICAL ESCALATION (FIXED) */}
      <button className="fixed bottom-10 right-10 z-[200] p-6 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-[0_15px_45px_rgba(220,38,38,0.4)] transition-all active:scale-90 group">
         <Siren size={32} className="group-hover:animate-ping" />
      </button>
    </div>
  );
};

export default ReceptionDashboard;

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Target, LogOut, ShieldPlus, HeartHandshake, LineChart, 
  CreditCard, Activity, Users, PhoneCall, ShieldAlert, Gavel, Radio, BarChart3, LayoutGrid,
  Zap, Clock, ArrowRight, CheckCircle2, ClipboardList, Globe, Shield, Lock, AlertTriangle
} from 'lucide-react';
import { UserRole, InsuranceClaim, InstitutionalBill, RevenueLedger, Patient, Investigation } from '../../types';
import StaffManagementHub from './StaffManagementHub';
import FinancialCounselorHub from './FinancialCounselorHub';
import BehavioralSupportHub from './BehavioralSupportHub';
import FollowUpHub from './FollowUpHub';
import QualityAnalyticsHub from './QualityAnalyticsHub';
import ExecutiveConsole from './ExecutiveConsole';
import OutcomeTrackingHub from '../Doctor/OutcomeTrackingHub';
import NABHComplianceHub from './NABHComplianceHub';
import InstitutionalCommandCenter from './InstitutionalCommandCenter';
import ICUOutcomeBenchmarkingHub from './ICUOutcomeBenchmarkingHub';
import HospitalDigitalTwin from './HospitalDigitalTwin';
import EnterpriseControlPanel from './EnterpriseControlPanel';
import EnterpriseGovernance from './EnterpriseGovernance';
import { EnterpriseSecurityAI } from './EnterpriseSecurityAI';
import { DashboardGuard } from '../Shared/DashboardGuard';
import LossPreventionDashboard from './LossPreventionDashboard';

const AdminDashboard: React.FC<{ role: UserRole; onLogout?: () => void; patients: Patient[] }> = ({ 
  onLogout, patients = []
}) => {
  const [isSyncing, setIsSyncing] = useState(true);
  const [activeTab, setActiveTab] = useState('Institutional Flow');

  const [claims] = useState<InsuranceClaim[]>([]);
  const [bills] = useState<InstitutionalBill[]>([]);
  const [revenue] = useState<RevenueLedger>({
    OPD: 150000, IPD: 450000, Pharmacy: 80000, Lab: 120000, Radiology: 95000, Surgery: 800000, Total: 1800000, Emergency: 0
  });
  const [expenses] = useState(600000);

  // Fix: Added safety check for p.investigations to prevent "Cannot read properties of undefined (reading 'map')"
  const allInvs = useMemo(() => {
    return (patients || []).flatMap(p => (p.investigations || []).map(inv => ({ ...inv, patientName: p.name, patientId: p.id })));
  }, [patients]);

  useEffect(() => {
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardGuard loading={isSyncing}>
      <div className="flex flex-col h-full bg-[#05070a]">
        <header className="h-16 border-b border-slate-800 bg-[#070b14]/50 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.5em] italic">ADMIN COMMAND NODE</span>
          </div>
          {onLogout && (
            <button onClick={onLogout} className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-xl">
              <LogOut size={18} />
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 md:p-16">
          <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700">
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="flex items-center gap-10">
                   <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-4xl">
                      <ShieldPlus size={48} />
                   </div>
                   <div>
                      <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Administration</h1>
                      <p className="text-gray-500 font-bold uppercase tracking-[0.8em] text-[11px] mt-6 italic">Master Price & Audit OS</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 bg-[#111827] p-2.5 rounded-[32px] border border-gray-800 shadow-4xl overflow-x-auto scrollbar-hide whitespace-nowrap">
                   {[
                      {id: 'Institutional Flow', label: 'Flow Audit', icon: Zap},
                      {id: 'Loss Prevention', label: 'Loss Prevention', icon: ShieldAlert},
                      {id: 'Security & AI', label: 'Security v9', icon: Lock},
                      {id: 'Enterprise Control', label: 'Network HUD', icon: Globe},
                      {id: 'Governance', label: 'Governance', icon: Shield},
                      {id: 'Digital Twin', label: 'Digital Twin', icon: LayoutGrid},
                      {id: 'Command Center', label: 'Command', icon: Radio},
                      {id: 'Executive Console', label: 'CEO Console', icon: Target},
                      {id: 'NABH Compliance', label: 'NABH / JCI', icon: Gavel},
                      {id: 'Quality Metrics', label: 'Quality', icon: Activity}, 
                      {id: 'Staff Logic', label: 'Staff', icon: Users}
                    ].map(tab => (
                     <button 
                       key={tab.id} onClick={() => setActiveTab(tab.id)}
                       className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl italic' : 'text-gray-600 hover:text-white'}`}
                     >
                       <tab.icon size={14} /> {tab.label}
                     </button>
                   ))}
                </div>
             </div>

             <main>
                {activeTab === 'Institutional Flow' && (
                  <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-40">
                     <div className="bg-[#111827] border border-white/5 rounded-[60px] p-12 shadow-4xl space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12"><Zap size={400}/></div>
                        <div className="flex items-center gap-6 border-b border-white/5 pb-8 relative z-10">
                           <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400"><Clock size={28}/></div>
                           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">CLINICAL → FINANCIAL → EXECUTION FLOW</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 relative z-10">
                           {allInvs.map((inv, idx) => (
                              <div key={idx} className="bg-[#0a0f18] border border-gray-800 p-8 rounded-[40px] flex flex-col md:flex-row items-center gap-8 group hover:border-indigo-500/20 transition-all shadow-inner">
                                 <div className="w-full md:w-64 border-r border-white/5 pr-8">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 italic">INVESTIGATION ORDER GENERATED</p>
                                    <h4 className="text-xl font-black text-white uppercase italic truncate">{inv.name}</h4>
                                 </div>
                                 
                                 <div className="flex-1 flex items-center justify-between px-4 gap-4 overflow-x-auto scrollbar-hide">
                                    {[
                                       { label: 'PRICE PENDING', status: inv.price > 0 ? 'COMPLETE' : 'PENDING', color: inv.price > 0 ? 'text-indigo-400' : 'text-amber-500 animate-pulse' },
                                       { label: 'BILL LINKED', status: inv.payment_status === 'PENDING' ? 'PENDING' : 'COMPLETE', color: inv.payment_status === 'PENDING' ? 'text-gray-700' : 'text-indigo-400' },
                                       { label: 'PAYMENT CONFIRMED', status: inv.payment_status === 'PAID' ? 'COMPLETE' : 'PENDING', color: inv.payment_status === 'PAID' ? 'text-indigo-400' : 'text-gray-700' },
                                       { label: 'LAB RELEASED', status: inv.sampleStage === 'VERIFIED' || inv.sampleStage === 'RELEASED' ? 'COMPLETE' : 'PENDING', color: inv.sampleStage === 'VERIFIED' || inv.sampleStage === 'RELEASED' ? 'text-indigo-400' : 'text-gray-700' },
                                       { label: 'REPORT FINALIZED', status: inv.result_status === 'COMPLETED' ? 'COMPLETE' : 'PENDING', color: inv.result_status === 'COMPLETED' ? 'text-emerald-500 font-black' : 'text-gray-700' }
                                    ].map((step, i) => (
                                       <div key={i} className="flex flex-col items-center gap-2 min-w-[100px]">
                                          <div className={`w-3 h-3 rounded-full ${step.status === 'COMPLETE' ? 'bg-indigo-500 shadow-[0_0_10px_indigo]' : 'bg-gray-800'}`} />
                                          <p className={`text-[7px] font-black uppercase tracking-widest text-center ${step.color}`}>{step.label}</p>
                                       </div>
                                    ))}
                                 </div>

                                 <div className="w-full md:w-48 text-right border-l border-white/5 pl-8">
                                    <p className="text-[8px] font-black text-gray-700 uppercase mb-1">CHARGE LOCKED</p>
                                    <p className={`text-sm font-black italic ${inv.payment_status === 'PAID' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>₹{inv.price} - {inv.payment_status}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                )}
                {activeTab === 'Loss Prevention' && <LossPreventionDashboard />}
                {activeTab === 'Security & AI' && <EnterpriseSecurityAI patient={patients[0]} />}
                {activeTab === 'Enterprise Control' && <EnterpriseControlPanel />}
                {activeTab === 'Governance' && <EnterpriseGovernance userRole="ADMIN" />}
                {activeTab === 'Digital Twin' && <HospitalDigitalTwin patients={patients} revenue={revenue} />}
                {activeTab === 'Command Center' && <InstitutionalCommandCenter patients={patients} revenue={revenue} />}
                {activeTab === 'Executive Console' && <ExecutiveConsole claims={claims} revenue={revenue} bills={bills} expenses={expenses} />}
                {activeTab === 'NABH Compliance' && <NABHComplianceHub />}
                {activeTab === 'Quality Metrics' && <QualityAnalyticsHub />}
                {activeTab === 'Staff Logic' && <StaffManagementHub />}
             </main>
          </div>
        </div>
      </div>
    </DashboardGuard>
  );
};

export default AdminDashboard;
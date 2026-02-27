
import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap } from 'lucide-react';
import { UserRole, Patient, Investigation, InstitutionalBill } from './types';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/Auth/LoginScreen';
import DoctorDashboard from './components/Doctor/Dashboard';
import ReceptionDashboard from './components/Receptionist/ReceptionDashboard';
import PharmacyDashboard from './components/Pharmacy/PharmacyDashboard';
import WardDashboard from './components/Ward/WardDashboard';
import BillingDashboard from './components/Admin/BillingDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import LabDashboard from './components/Lab/LabDashboard';
import RadiologyDashboard from './components/Radiology/RadiologyDashboard';
import SupportDashboard from './components/Support/SupportDashboard';
import SecurityDashboard from './components/Security/SecurityDashboard';
import AgentDrawer from './components/AI/AgentDrawer';
import AI_Overlay from './components/Shared/AI_Overlay';
import { DashboardGuard } from './components/Shared/DashboardGuard';
import { UniversalNavBar } from './components/UniversalNavBar';
import { SoftErrorBanner } from './components/Shared/SoftErrorBanner';
import { AppEventToast, resetWorkflow } from './components/Shared/AppEventToast';
import { onEvent, emitEvent } from './utils/hospitalEvents';
import NurseTriage from './components/Receptionist/NurseTriage';

type SyncState = 'BOOTING' | 'READY';

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'OP-100234',
    mrNumber: 'MRN-100234',
    name: 'Sarah Mitchell',
    age: 42,
    gender: 'Female',
    phone: '9876543210',
    chiefComplaint: 'Acute abdominal pain, localized to RLQ.',
    extraSymptoms: 'Symptoms coincided with increased digital device engagement.',
    type: 'OP',
    status: 'Waiting',
    regStatus: 'REGISTERED',
    isConsultationPaid: true,
    registeredAt: '09:00 AM',
    investigations: [],
    medications: [],
    token: { number: 'A-101', department: 'General', priority: 'Normal', issuedAt: '09:00 AM' }
  }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTriageActive, setIsTriageActive] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('BOOTING');
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [notifications, setNotifications] = useState<{id: string, text: string, type: 'info' | 'success' | 'alert'}[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(true); // Fallback for local dev if window.aistudio is missing
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success as per guidelines to avoid race conditions
    }
  };
  
  const getOfflineBills = (): InstitutionalBill[] => {
    try { return JSON.parse(localStorage.getItem('OFFLINE_BILLS_V3_UNIFIED') || '[]'); } 
    catch (e) { return []; }
  };
  
  const saveOfflineBills = (bills: InstitutionalBill[]) => localStorage.setItem('OFFLINE_BILLS_V3_UNIFIED', JSON.stringify(bills));

  useLayoutEffect(() => {
    const timer = setTimeout(() => setSyncState('READY'), 500);
    const watchdog = setTimeout(() => {
      if (syncState === 'BOOTING') {
        setSyncState('READY');
      }
    }, 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(watchdog);
    };
  }, [syncState]);

  const addNotification = useCallback((who: string, what: string, patient: string, type: 'info' | 'success' | 'alert') => {
    const id = Date.now().toString();
    const text = `[${who}] ${ what } for ${ patient }`;
    setNotifications(prev => [{ id, text, type }, ...prev].slice(0, 5));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 7000);
  }, []);

  const autoDepartmentSync = useCallback((patientId: string, category: any, itemName: string, rate: number, department: string) => {
    if (!patientId) return;
    const bills = getOfflineBills();
    const billIdx = bills.findIndex(b => (b.patientId === patientId) && b.status !== 'Discharged');
    
    if (billIdx !== -1) {
      const updatedBills = [...bills];
      const targetBill = updatedBills[billIdx];
      const newItem = { 
        name: itemName, cost: rate, category: category, qty: 1, 
        date: new Date().toLocaleDateString(), status: 'Pending' as const, taxPercent: 12 
      };
      targetBill.items.push(newItem);
      targetBill.total += rate;
      targetBill.auditLog.push({ user: 'System-AutoSync', action: `AUTO_CHARGE_SYNC: ${itemName}`, time: new Date().toLocaleTimeString() });
      saveOfflineBills(updatedBills);
      emitEvent("PAYMENT_CONFIRMED", { name: targetBill.patientName }); 
      addNotification(department, `Billing Node Updated: ${itemName}`, targetBill.patientName, "info");
    }
  }, [addNotification]);

  useEffect(() => {
    const handleRemoteOrder = (payload: { patientId: string, investigations: Investigation[] }) => {
      const { patientId, investigations } = payload;
      setPatients(prev => {
        const patientExists = prev.some(p => p.id === patientId);
        if (!patientExists) return prev;
        return prev.map(p => p.id === patientId ? { 
          ...p, 
          investigations: [...(p.investigations || []), ...investigations],
          regStatus: 'SENT_FOR_INVESTIGATION'
        } : p);
      });
      investigations.forEach(inv => {
        const category = inv.type === 'RADIOLOGY' ? 'Radiology' : 'Lab';
        autoDepartmentSync(patientId, category, inv.name, inv.price || 500, inv.type || 'LAB');
      });
    };

    const handleMedOrder = (payload: { patientId: string, medications: any[] }) => {
      setPatients(prev => prev.map(p => p.id === payload.patientId ? {
        ...p,
        medications: [...(p.medications || []), ...payload.medications]
      } : p));
      addNotification("DOCTOR", "Therapeutic Plan Released", payload.patientId, "info");
    };

    const unsubOrder = onEvent("INVESTIGATION_ORDER_CREATED", handleRemoteOrder);
    const unsubMed = onEvent("MEDICATION_DRAFT_CONFIRMED" as any, handleMedOrder);
    return () => {
      unsubOrder();
      unsubMed();
    };
  }, [autoDepartmentSync, addNotification]);

  const handleNewPatient = useCallback((p: Patient) => {
    setPatients(prev => [...prev, p]);
    const bills = getOfflineBills();
    const newBill: InstitutionalBill = {
      id: `BILL-${Date.now()}`, billNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      mrNumber: p.mrNumber || p.id, patientId: p.id, patientName: p.name, patient: p.name,
      visitType: p.type === 'IP' ? 'IPD' : 'OPD',
      items: [{ name: 'Registration & Admin', cost: 350, category: 'Registration', date: new Date().toLocaleDateString(), status: 'Pending', taxPercent: 0 }],
      total: 350, status: 'Generated', createdAt: new Date().toISOString(),
      auditLog: [{ user: 'System', action: 'Auto-Bill Generated', time: new Date().toLocaleTimeString() }],
      signatures: []
    };
    saveOfflineBills([newBill, ...bills]);
    addNotification("BILLING", "Registry: Bill Active", p.name, "success");
  }, [addNotification]);

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
  };

  const logout = useCallback(() => {
    resetWorkflow();
    setRole(null);
    setIsAuthenticated(false);
    setActiveTab('Dashboard');
    setActiveAgent(null);
  }, []);

  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full w-full"
        >
          <DashboardGuard loading={syncState === 'BOOTING'}>
            <LoginScreen onLogin={handleLogin} />
          </DashboardGuard>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isTriageActive) return <NurseTriage onExit={() => setIsTriageActive(false)} />;

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={role}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col h-full w-full bg-[#020408] font-['Inter'] relative overflow-hidden"
      >
        <UniversalNavBar />
        
        <div className="app-body-wrapper relative">
          <Sidebar 
            role={role!} activeTab={activeTab} onTabChange={setActiveTab} 
            onLogout={logout} onAgentClick={setActiveAgent} activeAgent={activeAgent}
          />
          <main className="flex-1 flex flex-col min-h-0 relative bg-[#020408] overflow-hidden">
            <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={role + activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full w-full"
                >
                  {role === UserRole.DOCTOR && (
                    <DoctorDashboard 
                      patients={patients} 
                      onAdmit={(id: string) => setPatients(prev => prev.map(p => p.id === id ? {...p, type: 'IP', status: 'Admitted'} : p))}
                      onDischarge={(id: string) => setPatients(prev => prev.map(p => p.id === id ? {...p, status: 'Discharged'} : p))}
                      onLogout={logout} onUpdatePatient={(id, updates) => setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))}
                      onOrderInvestigations={(pid: string, tests: any[]) => emitEvent("INVESTIGATION_ORDER_CREATED", { patientId: pid, investigations: tests })}
                    />
                  )}
                  {role === UserRole.RECEPTIONIST && <ReceptionDashboard patients={patients} onNewPatient={handleNewPatient} onLogout={logout} onUpdatePatient={(id, updates) => setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))} />}
                  {role === UserRole.PHARMACY && <PharmacyDashboard onLogout={logout} />}
                  {role === UserRole.WARD && <WardDashboard patients={patients} onLogout={logout} />}
                  {role === UserRole.BILLING && <BillingDashboard patients={patients} onLogout={logout} />}
                  {role === UserRole.ADMIN && <AdminDashboard role={role} patients={patients} onLogout={logout} />}
                  {role === UserRole.LAB && <LabDashboard patients={patients} onLogout={logout} onUpdateInvestigation={(pid, invid, updates) => setPatients(prev => prev.map(p => p.id === pid ? {...p, investigations: (p.investigations || []).map(i => i.id === invid ? { ...i, ...updates } : i)} : p))} />}
                  {role === UserRole.RADIOLOGY && <RadiologyDashboard patients={patients} onLogout={logout} onUpdateInvestigation={(pid, invid, updates) => setPatients(prev => prev.map(p => p.id === pid ? {...p, investigations: (p.investigations || []).map(i => i.id === invid ? { ...i, ...updates } : i)} : p))} />}
                  {role === UserRole.PATIENT_SUPPORT && <SupportDashboard patients={patients} onLogout={logout} />}
                  {role === UserRole.SECURITY_CONTROL && <SecurityDashboard onLogout={logout} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        <AgentDrawer agentId={activeAgent} onClose={() => setActiveAgent(null)} role={role!} patients={patients} />
        <AI_Overlay />
        <AppEventToast />
        <SoftErrorBanner />

        {hasApiKey === false && (
          <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
            <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white mb-8 shadow-[0_0_50px_rgba(79,70,229,0.5)] animate-pulse">
              <Zap size={48} />
            </div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Kernel Authentication Required</h2>
            <p className="text-slate-400 max-w-md mb-10 font-medium leading-relaxed">
              To activate the COGNIMED Intelligence Nodes (Gemini 3.1 Pro), you must select a valid API key from a paid Google Cloud project.
            </p>
            <button 
              onClick={handleSelectKey}
              className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[30px] font-black uppercase text-sm tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center gap-4 border border-white/10 italic"
            >
              <Zap size={20} /> [ SELECT API KEY ]
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-8 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-all border-b border-indigo-500/20 pb-1"
            >
              View Billing Documentation
            </a>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default App;

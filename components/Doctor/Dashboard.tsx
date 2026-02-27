import {
  Search, Activity, HeartPulse, Stethoscope, Sparkles,
  Zap, Loader2, Info, ChevronRight, Users, Volume2, 
  User, Brain, RefreshCw, EyeOff, LayoutGrid, LogOut as ExitIcon,
  LogOut, Droplets, Pill, Siren, FileText, Printer, Save, Scissors,
  ShieldAlert, Building, Layers, Cpu, ShieldCheck, ClipboardCheck,
  CheckCircle2, Wind, Microscope, GraduationCap, Scale, MessageSquare,
  ZapOff, Dna, BrainCircuit, Activity as PulseIcon,
  VolumeX, Baby, Route, Map, Target
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, Investigation, DoctorTabExtended } from '../../types';
import { sushrutUltraAnalyzeStream, sushrutSurgicalPlanningStream, speakText, stopSpeech } from '../../geminiService';
import InvestigationsTab from './tabs/InvestigationsTab';
import MedicationTab from './tabs/MedicationsTab';
import CounselingTab from './tabs/CounselingTab';
import SurgicalPlanningTab from './tabs/SurgicalPlanningTab';
import QuietOpinionTab from './tabs/QuietOpinionTab';
import MDTBoardTab from './tabs/MDTBoardTab';
import DigitalTwinTab from './tabs/DigitalTwinTab';
import ReportsOCRTab from './tabs/ReportsOCRTab';
import AdvancedIQHub from './tabs/AdvancedIQHub';
import ICUEmergencyCommandCenter from './tabs/ICUEmergencyCommandCore';
import SepsisIntelligenceHub from './tabs/SepsisIntelligenceHub';
import RenalIntelligenceHub from './tabs/RenalIntelligenceHub';
import RadiologyResultsTab from './tabs/RadiologyResultsTab';
import BehavioralSupportHub from '../Admin/BehavioralSupportHub';
import PathophysiologyModule from './tabs/PathophysiologyModule'; 
import NICUIntelligenceHub from './tabs/NICUIntelligenceHub';
import GenomicsIntelligenceHub from './tabs/GenomicsIntelligenceHub';
import MedicalManagementPlanningTab from './tabs/MedicalManagementPlanningTab';
import ClinicalRoadmapTab from './tabs/ClinicalRoadmapTab';
import ClinicalHub from './tabs/ClinicalHub';
import { runAI, manualModeMessage } from '../Shared/AppEventToast';
import { emitEvent } from '../../utils/hospitalEvents';
import { saveDepartmentBill } from '../Admin/BillingDashboard';
import { ClinicalIntelligenceEngine } from '../Shared/ClinicalIntelligenceEngine';
import { ClinicalGapMonitor } from './ClinicalGapMonitor';

// --- CORE RENDERER ---
const DoctorTabRenderer: React.FC<{
  activeTab: DoctorTabExtended;
  selectedPatient: Patient;
  handleInvestigationsOrder: (pid: string, tests: Investigation[]) => void;
  aiResult: any;
  runSusruta: (level: any) => void;
  tabAiResults: any;
  surgicalAiResult: any;
  runSurgicalAi: (params: any) => void;
  liveVitals: any;
  selectedLevel: 'V1' | 'V2' | 'V3';
}> = React.memo(({ activeTab, selectedPatient, handleInvestigationsOrder, aiResult, runSusruta, tabAiResults, surgicalAiResult, runSurgicalAi, liveVitals, selectedLevel }) => {
  
  const clinicalResult = useMemo(() => {
    if (!aiResult.rawResponse) return null;
    return {
      summary: aiResult.rawResponse.split('Differential')[0].trim(),
      differentials: [{ name: 'Clinical Syndrome under Investigation', probability: 85 }]
    };
  }, [aiResult.rawResponse]);

  const renderContent = () => {
    switch (activeTab) {
      case 'clinical_roadmap':
        return <ClinicalRoadmapTab patient={selectedPatient} />;
      case 'ddx':
        return (
          <div className="space-y-12 pb-32">
            <div className="bg-[#111827] border border-cyan-500/20 rounded-[40px] p-8 shadow-4xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
               <div className="absolute left-0 top-0 h-full w-1 bg-cyan-500 animate-pulse" />
               <div className="flex items-center gap-6 relative z-10">
                  <div className="w-14 h-14 bg-cyan-600/10 rounded-2xl flex items-center justify-center text-cyan-500 border border-cyan-500/20 shadow-inner"><Cpu size={28} /></div>
                  <div><h3 className="text-xl font-black text-white uppercase italic tracking-tight">Intelligence Depth</h3><p className="text-[11px] text-cyan-500/60 font-black uppercase mt-1">COGNIMED Reasoning Node</p></div>
               </div>
               <div className="flex bg-[#0a0f18] p-2 rounded-[24px] border border-white/5 shadow-2xl relative z-10">
                  {['V1', 'V2', 'V3'].map((lvl) => (
                    <button key={lvl} onClick={() => runSusruta(lvl as any)} disabled={aiResult.status === 'loading'}
                      className={`flex flex-col items-center gap-1 px-8 py-3 rounded-2xl transition-all min-w-[120px] ${selectedLevel === lvl && aiResult.status !== 'idle' ? 'bg-cyan-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-105 italic' : 'text-gray-600 hover:text-gray-300'}`}>
                       <span className="text-[10px] font-black uppercase tracking-widest">{lvl} {lvl === 'V1' ? 'Quick' : lvl === 'V2' ? 'Standard' : 'Forensic'}</span>
                    </button>
                  ))}
               </div>
            </div>
            <PathophysiologyModule patient={selectedPatient} onAnalysisUpdate={(text) => {}} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-[#0a0f18] border border-indigo-500/10 rounded-[60px] p-12 shadow-4xl space-y-10">
                  <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] italic border-b border-white/5 pb-4">Diagnostic Ingress</h4>
                  <InvestigationsTab patient={selectedPatient} onOrder={handleInvestigationsOrder} aiState={aiResult} onAnalyze={() => runSusruta('V2')} latestSynthesis={aiResult.rawResponse} clinicalAnalysisResult={clinicalResult || undefined} />
               </div>
               <div className="bg-[#0a0f18] border border-emerald-500/10 rounded-[60px] p-12 shadow-4xl space-y-10">
                  <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] italic border-b border-white/5 pb-4">Therapeutic Release</h4>
                  <MedicationTab patient={selectedPatient} latestAnalysis={aiResult.rawResponse} />
               </div>
            </div>
            {aiResult.rawResponse && (
              <div className="bg-[#0a0f18] border border-cyan-500/20 rounded-[60px] p-12 shadow-4xl"><div className="text-[17px] text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">{aiResult.rawResponse}</div></div>
            )}
          </div>
        );
      case 'investigations':
        return <InvestigationsTab patient={selectedPatient} onOrder={handleInvestigationsOrder} aiState={aiResult} onAnalyze={() => runSusruta('V2')} latestSynthesis={tabAiResults.ddx} clinicalAnalysisResult={clinicalResult || undefined} />;
      case 'medications':
        return <MedicationTab patient={selectedPatient} latestAnalysis={tabAiResults.ddx} />;
      case 'surgery':
        return <SurgicalPlanningTab patient={selectedPatient} aiResult={surgicalAiResult} onInitiateSurgery={runSurgicalAi} latestSynthesis={tabAiResults.ddx} />;
      case 'emergency_super_icu':
        return <ICUEmergencyCommandCenter patient={selectedPatient} vitals={liveVitals} aiResult={aiResult} handlers={{ onInitiateVent: (p: any) => runSusruta('V2'), onInitiatePoison: (t: any, l: any) => runSusruta(l), onInitiateBurns: (s: any, l: any) => runSusruta(l), onInitiateTrauma: (p: any, l: any) => runSusruta(l), onInitiateStroke: (p: any) => runSusruta(p.level), onInitiateACLS: (p: any) => runSusruta(p.level), onInitiatePediatric: (p: any) => runSusruta(p.level), onInitiateObstetric: (p: any) => runSusruta(p.level), onInitiateDisaster: (p: any) => runSusruta(p.level) }} />;
      case 'sepsis':
        return <SepsisIntelligenceHub patient={selectedPatient} vitals={liveVitals} aiResult={{...aiResult, rawResponse: tabAiResults.ddx || ""}} onInitiateSepsis={() => runSusruta('V2')} />;
      case 'renal':
        return <RenalIntelligenceHub patient={selectedPatient} aiResult={{...aiResult, rawResponse: tabAiResults.ddx || ""}} onInitiateRenal={() => runSusruta('V2')} />;
      case 'nicu':
        return <NICUIntelligenceHub patient={selectedPatient} vitals={liveVitals} aiResult={aiResult} onInitiateNICU={(p) => runSusruta(p.level)} />;
      case 'genomics':
        return <GenomicsIntelligenceHub patient={selectedPatient} />;
      case 'radiology_results':
        return <RadiologyResultsTab patient={selectedPatient} />;
      case 'reports':
        return <ReportsOCRTab />;
      case 'counseling':
        return <CounselingTab patient={selectedPatient} latestAnalysis={tabAiResults.ddx} />;
      case 'mdt':
        return <MDTBoardTab patient={selectedPatient} analysisContext={tabAiResults.ddx} />;
      case 'twin':
        return <DigitalTwinTab patient={selectedPatient} />;
      case 'advanced_iq':
        return <AdvancedIQHub patient={selectedPatient} vitals={liveVitals} procedure={selectedPatient.chiefComplaint} />;
      case 'tobacco_cessation':
        return <BehavioralSupportHub />;
      case 'clinical_hub':
        return <ClinicalHub patient={selectedPatient} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
});

// --- CONTROL BAR ---
export const DoctorControlRestoreBar: React.FC<{ activeTab: string, onTabChange: (t: any) => void }> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap gap-2.5 p-4 mb-6 bg-[#070b14]/60 border border-white/5 rounded-[30px] shadow-inner animate-in fade-in slide-in-from-top-2 duration-500">
      <button className={`restore-btn ${activeTab === 'clinical_hub' ? 'primary' : ''}`} onClick={()=>onTabChange("clinical_hub")}><ClipboardCheck size={12}/> Clinical Hub</button>
      <button className={`restore-btn ${activeTab === 'clinical_roadmap' ? 'primary' : ''}`} onClick={()=>onTabChange("clinical_roadmap")}><Map size={12}/> Clinical Roadmap</button>
      <button className={`restore-btn ${activeTab === 'ddx' ? 'primary' : ''}`} onClick={()=>onTabChange("ddx")}><Stethoscope size={12}/> Clinical Ingress</button>
      <button className={`restore-btn ${activeTab === 'surgery' ? 'primary' : ''}`} onClick={()=>onTabChange("surgery")}><Scissors size={12}/> Surgical Plan</button>
      <button className={`restore-btn ${activeTab === 'investigations' ? 'primary' : ''}`} onClick={()=>onTabChange("investigations")}><Activity size={12}/> Investigation Node</button>
      <button className={`restore-btn ${activeTab === 'medications' ? 'primary' : ''}`} onClick={()=>onTabChange("medications")}><Pill size={12}/> Therapeutic Release</button>
      <button className={`restore-btn ${activeTab === 'emergency_super_icu' ? 'primary' : ''}`} onClick={()=>onTabChange("emergency_super_icu")}><Siren size={12}/> Emergency Hub</button>
      <button className={`restore-btn ${activeTab === 'mdt' ? 'primary' : ''}`} onClick={()=>onTabChange("mdt")}><Users size={12}/> MDT Board</button>
      <button className="restore-btn primary" onClick={()=>speakText("Clinical session finalized and archived.", "Zephyr")}><Save size={12}/> Commit Node</button>
      <button className="restore-btn secondary" onClick={()=>window.print()}><Printer size={12}/> Print Node</button>
      <button className="restore-btn danger" onClick={stopSpeech}><VolumeX size={12}/> Stop Audio</button>
    </div>
  );
};

// --- MAIN COMPONENT ---
const DoctorDashboard: React.FC<{
  patients: Patient[],
  onOrderInvestigations: (pid: string, tests: Investigation[]) => void,
  onAdmit: (id: string) => void,
  onDischarge: (id: string) => void,
  onLogout: () => void,
  onUpdatePatient?: (id: string, updates: Partial<Patient>) => void
}> = ({ patients = [], onOrderInvestigations, onAdmit, onDischarge, onLogout, onUpdatePatient }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<DoctorTabExtended>('ddx');
  const [tabAiResults, setTabAiResults] = useState<Partial<Record<string, string>>>({});
  const [aiResult, setAiResult] = useState({ rawResponse: "", status: "idle" as 'idle' | 'loading' | 'done' | 'error' });
  const [surgicalAiResult, setSurgicalAiResult] = useState({ rawResponse: "", status: "idle" as 'idle' | 'loading' | 'done' | 'error' });
  const [liveVitals, setLiveVitals] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

  const runSusruta = async (level: 'V1' | 'V2' | 'V3') => {
    if (!selectedPatient || aiResult.status === 'loading') return;
    setSelectedLevel(level);
    await runAI("susruta", async () => {
      setAiResult(prev => ({ ...prev, status: 'loading', rawResponse: "" }));
      const stream = sushrutUltraAnalyzeStream({ patient: selectedPatient, level });
      let resText = "";
      for await (const chunk of stream) {
        resText += chunk;
        setAiResult(prev => ({ ...prev, rawResponse: resText }));
        setTabAiResults(prev => ({ ...prev, ddx: resText }));
      }
      setAiResult(prev => ({ ...prev, status: 'done' }));
    }, () => {
      setAiResult(prev => ({ ...prev, status: 'error' }));
      manualModeMessage(`Clinical Analysis (${level})`);
    });
  };

  const runSurgicalAi = async (params: any) => {
    if (!selectedPatient || surgicalAiResult.status === 'loading') return;
    await runAI("susruta", async () => {
      setSurgicalAiResult(prev => ({ ...prev, status: 'loading', rawResponse: "" }));
      const stream = sushrutSurgicalPlanningStream({ ...params, patient: selectedPatient });
      let resText = "";
      for await (const chunk of stream) {
        resText += chunk;
        setSurgicalAiResult(prev => ({ ...prev, rawResponse: resText }));
      }
      setSurgicalAiResult(prev => ({ ...prev, status: 'done' }));
    }, () => {
      setSurgicalAiResult(prev => ({ ...prev, status: 'error' }));
    });
  };

  const handleInvestigationsOrder = (pid: string, tests: Investigation[]) => {
    onOrderInvestigations(pid, tests);
    emitEvent("INVESTIGATION_ORDER_CREATED", { patientId: pid, investigations: tests });
    speakText("Clinical orders successfully dispatched.", "Zephyr");
  };

  const TABS: { id: DoctorTabExtended; label: string; icon: any }[] = [
    { id: 'clinical_hub', label: 'Clinical Hub', icon: ClipboardCheck },
    { id: 'clinical_roadmap', label: 'Clinical Roadmap', icon: Map },
    { id: 'ddx', label: 'Clinical Ingress', icon: Stethoscope },
    { id: 'surgery', label: 'Surgical Plan', icon: Sparkles },
    { id: 'emergency_super_icu', label: 'Emergency Hub', icon: Siren },
    { id: 'investigations', label: 'Investigations', icon: Activity },
    { id: 'medications', label: 'Therapeutics', icon: Pill },
    { id: 'radiology_results', label: 'Radiology Sync', icon: Zap },
    { id: 'sepsis', label: 'Sepsis Radar', icon: Activity },
    { id: 'renal', label: 'Renal Guard', icon: Droplets },
    { id: 'nicu', label: 'NICU Intelligence', icon: Baby },
    { id: 'genomics', label: 'Genomics Hub', icon: Dna },
    { id: 'mdt', label: 'MDT Board', icon: Users },
    { id: 'twin', label: 'Digital Twin', icon: BrainCircuit },
    { id: 'counseling', label: 'Counseling', icon: MessageSquare },
    { id: 'reports', label: 'Lab Registry', icon: FileText },
    { id: 'advanced_iq', label: 'Forensic IQ', icon: RefreshCw },
    { id: 'tobacco_cessation', label: 'Tobacco Cessation', icon: HeartPulse }
  ];

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-1 w-full min-h-0 bg-[#020408] text-slate-200 overflow-hidden">
      <aside className="w-80 border-r border-white/5 flex flex-col bg-[#070b14]/80 backdrop-blur-3xl shrink-0 shadow-2xl relative z-10 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-[#070b14]/90 z-20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.5em] italic">COGNIMED INGRESS v1.0</h3>
            <button onClick={onLogout} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"><ExitIcon size={16} /></button>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            <input type="text" placeholder="Filter patient nodes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl pl-10 pr-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white outline-none focus:border-cyan-500/50 transition-all shadow-inner" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar scrollable-node scppable">
          <AnimatePresence initial={false}>
            {filteredPatients.map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => { setSelectedPatientId(p.id); setAiResult({rawResponse:"",status:"idle"}); }} 
                className={`px-8 py-6 border-b border-white/5 cursor-pointer transition-all ${ selectedPatientId === p.id ? 'bg-cyan-600/10 border-l-4 border-l-cyan-500 shadow-inner' : 'hover:bg-white/5' }`}
              >
                <div className="flex items-center justify-between"><p className="text-[14px] font-black uppercase italic text-slate-100">{p.name}</p></div>
                <p className="text-[9px] text-gray-500 font-black uppercase mt-2 tracking-widest">{p.id} • {p.age}y • {p.gender}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </aside>

      <main className="main-content flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#020408]">
        {selectedPatient ? (
          <>
            <header className="p-6 border-b border-white/5 bg-[#0d1321]/60 backdrop-blur-3xl flex items-center justify-between shrink-0 z-30 shadow-2xl">
               <div className="flex items-center gap-6">
                 <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border border-white/20 animate-spin neural-orbit-line" />
                    </div>
                    <div className="w-2 h-2 bg-white rounded-full animate-cognimed-core" />
                 </div>
                 <div><h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedPatient.name}</h2><p className="text-[10px] font-black text-gray-500 uppercase mt-1.5 tracking-widest">Node: {selectedPatient.id} • {selectedPatient.age}y</p></div>
               </div>
               <div className="flex items-center gap-6">
                  <ClinicalIntelligenceEngine patient={selectedPatient} vitals={liveVitals} labs={selectedPatient.investigations} medications={selectedPatient.medications} />
                  <ClinicalGapMonitor patient={selectedPatient} vitals={liveVitals} />
                  <button onClick={() => setActiveTab('clinical_roadmap')} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl transition-all active:scale-95 border-2 border-white/10 group"><Map size={14} className="group-hover:rotate-12 transition-transform" /> Clinical Roadmap</button>
                  <button onClick={onLogout} className="flex items-center gap-2 px-6 py-2.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase italic shadow-xl hover:bg-red-600 hover:text-white transition-all"><LogOut size={14} /> Exit Node</button>
               </div>
            </header>

            <nav className="flex items-center gap-2 p-2 bg-[#070b14]/40 border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0 z-20 shadow-inner">
               {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border relative group ${ activeTab === tab.id ? 'bg-cyan-600 text-white border-cyan-400 shadow-2xl scale-105 z-10 italic' : 'bg-white/5 text-gray-500 border-transparent hover:text-white hover:bg-white/10' }`}>
                    <tab.icon size={14} /> {tab.label}
                  </button>
               ))}
            </nav>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 scppable content-scroll-area">
               <DoctorControlRestoreBar activeTab={activeTab} onTabChange={setActiveTab} />
               <DoctorTabRenderer activeTab={activeTab} selectedPatient={selectedPatient} handleInvestigationsOrder={handleInvestigationsOrder} aiResult={aiResult} runSusruta={runSusruta} tabAiResults={tabAiResults} surgicalAiResult={surgicalAiResult} runSurgicalAi={runSurgicalAi} liveVitals={liveVitals} selectedLevel={selectedLevel} />
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center opacity-[0.03] grayscale py-32 text-center select-none pointer-events-none"
          >
             <Target size={200} className="text-gray-700 mx-auto" />
             <h3 className="text-6xl font-black uppercase tracking-[0.5em] italic mt-12 leading-tight">COGNIMED <br/> Node Standby</h3>
          </motion.div>
        )}
      </main>
      <style>{`
        .restore-btn { padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); background: #0a1f33; color: #94a3b8; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 8px; }
        .restore-btn:hover { background: #111827; border-color: rgba(6, 182, 212, 0.3); color: white; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.4); }
        .restore-btn.primary { background: #059669; color: white; border-color: #10b981; }
        .restore-btn.secondary { background: #2563eb; color: white; border-color: #3b82f6; }
        .restore-btn.danger { background: #dc2626; color: #ef4444; border-color: #ef4444; }
      `}</style>
    </div>
  );
};
export default DoctorDashboard;

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  HeartHandshake, Bot, Scale, GraduationCap, HeartPulse, 
  Waves, Mic, Volume2, Sparkles, Loader2, Info, 
  TrendingUp, ArrowRight, Smile, ShieldCheck, Zap, LogOut, 
  Home, Activity, AlertTriangle, BookOpen, User, ChevronRight, 
  Search, Leaf, Users, MessageSquare, ShieldAlert, Clock,
  ArrowLeft, RefreshCw, Star, Camera, ShieldPlus,
  Lock, Gavel, Crown, EyeOff, Image as ImageIcon,
  Building, Siren, Printer, Radio, Globe, Shield,
  Award, Newspaper, Share2, Network, Send, Dumbbell, Apple, Cigarette, Heart, LogOut as Power,
  Database, Plus, Trash2, Play, VolumeX, Eye,
  X
} from 'lucide-react';
import { DashboardGuard } from '../Shared/DashboardGuard';
import StaffManagementHub from '../Admin/StaffManagementHub';
import StaffSupportAIAgent from '../AI/StaffSupportAIAgent';
import WellnessAIEngine from '../Shared/WellnessAIEngine';
import WardAssistantAgent from '../AI/WardAssistantAgent';
import HomeCareHub from './HomeCareHub';
import { Patient, LegalVaultEntry } from '../../types';
import { 
  sushrutSafePatientSummaryStream, 
  sushrutICUUpdateStream,
  sushrutConsentBotStream,
  sushrutVIPSummaryStream,
  sushrutReputationRiskStream,
  sushrutDoctorExcellenceStream,
  sushrutGenerateCaseSynthesis,
  sushrutHospitalPitchStream,
  speakText,
  stopSpeech
} from '../../geminiService';
import { getSafeMicrophoneStream } from '../../utils/VoiceTurnController';

interface HospitalCase {
  id: string;
  patientName: string;
  procedureType: string;
  preImage: string;
  postImage: string;
  preNotes: string;
  postNotes: string;
  aiSynthesis: string;
  timestamp: string;
}

const SupportDashboard: React.FC<{ patients?: Patient[], onLogout?: () => void }> = ({ patients = [], onLogout }) => {
  const [activeTab, setActiveTab] = useState<'VOICE' | 'FINANCE' | 'STAFF' | 'WELLNESS' | 'KIDS' | 'HOME_CARE' | 'PATIENT_INTEL' | 'REPUTATION' | 'EVERYONE_CARE'>('VOICE');
  const [intelSubTab, setIntelSubTab] = useState<'WARD' | 'ICU' | 'CONSENT' | 'VIP' | 'DOCTOR_BRAND'>('WARD');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showVoiceHub, setShowVoiceHub] = useState(false);
  const [showStaffSupport, setShowStaffSupport] = useState(false);
  
  // --- Case Registry & Presentation Mode State ---
  const [caseRegistry, setCaseRegistry] = useState<HospitalCase[]>(() => {
    const saved = localStorage.getItem('hospital_case_registry');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationCase, setPresentationCase] = useState<HospitalCase | null>(null);
  const [presentationPitch, setPresentationPitch] = useState("");
  const [isPitching, setIsPitching] = useState(false);
  const [caseLanguage, setCaseLanguage] = useState("English");
  
  // New Case Form
  const [newCase, setNewCase] = useState({
    patientName: '',
    procedureType: 'Hip Replacement',
    preImage: '',
    postImage: '',
    preNotes: '',
    postNotes: ''
  });
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [isListeningForNotes, setIsListeningForNotes] = useState<'pre' | 'post' | null>(null);

  // Existing states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [safeSummary, setSafeSummary] = useState({ text: '', status: 'idle' as 'idle' | 'loading' | 'done' });
  const [searchTerm, setSearchTerm] = useState('');
  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [legalVault, setLegalVault] = useState<LegalVaultEntry[]>(() => JSON.parse(localStorage.getItem('legal_vault_logs') || '[]'));

  const activePatients = useMemo(() => patients.filter(p => p.status !== 'Discharged'), [patients]);
  const filteredRegistry = activePatients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const displayCases = caseRegistry.filter(c => 
    c.patientName.toLowerCase().includes(caseSearchTerm.toLowerCase()) || 
    c.procedureType.toLowerCase().includes(caseSearchTerm.toLowerCase())
  );

  useEffect(() => {
    localStorage.setItem('hospital_case_registry', JSON.stringify(caseRegistry));
  }, [caseRegistry]);

  const handlePatientClick = async (p: Patient, subTabOverride?: 'WARD' | 'ICU' | 'CONSENT' | 'VIP' | 'DOCTOR_BRAND') => {
    setSelectedPatientId(p.id);
    const subTab = subTabOverride || intelSubTab;
    
    setSafeSummary({ text: '', status: 'loading' });
    try {
      let stream;
      if (subTab === 'ICU') stream = sushrutICUUpdateStream({ patient: p });
      else if (subTab === 'CONSENT') stream = sushrutConsentBotStream({ procedure: p.chiefComplaint, patient: p });
      else if (subTab === 'VIP') stream = sushrutVIPSummaryStream({ patient: p });
      else if (subTab === 'DOCTOR_BRAND') stream = sushrutDoctorExcellenceStream({ doctorName: "Murali", query: p.chiefComplaint });
      else stream = sushrutSafePatientSummaryStream({ patient: p });

      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setSafeSummary(prev => ({ ...prev, text: fullText }));
      }
      setSafeSummary(prev => ({ ...prev, text: fullText, status: 'done' }));
    } catch (e) {
      setSafeSummary({ text: 'Error generating summary node.', status: 'idle' });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'pre' | 'post') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCase(prev => ({ ...prev, [type === 'pre' ? 'preImage' : 'postImage']: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceNote = (type: 'pre' | 'post') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = caseLanguage === 'Telugu' ? 'te-IN' : caseLanguage === 'Hindi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListeningForNotes(type);
    recognition.onend = () => setIsListeningForNotes(null);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setNewCase(prev => ({ ...prev, [type === 'pre' ? 'preNotes' : 'postNotes']: text }));
    };

    recognition.start();
  };

  const handleSynthesizeCase = async () => {
    if (!newCase.patientName || !newCase.preNotes || !newCase.postNotes) {
      alert("Please provide patient name and clinical condition notes (via voice or text).");
      return;
    }
    setIsGeneratingCase(true);
    try {
      const synthesis = await sushrutGenerateCaseSynthesis({
        procedure: newCase.procedureType,
        preNotes: newCase.preNotes,
        postNotes: newCase.postNotes,
        language: caseLanguage
      });
      
      const completedCase: HospitalCase = {
        id: `CASE-${Date.now()}`,
        ...newCase,
        aiSynthesis: synthesis,
        timestamp: new Date().toISOString()
      };
      
      setCaseRegistry([completedCase, ...caseRegistry]);
      setIsAddingCase(false);
      setNewCase({ patientName: '', procedureType: 'Hip Replacement', preImage: '', postImage: '', preNotes: '', postNotes: '' });
      speakText("Success case synchronized with brand registry.", "Zephyr");
    } catch (e) {
      alert("Error synthesizing case study.");
    } finally {
      setIsGeneratingCase(false);
    }
  };

  const startPresentation = async (c: HospitalCase) => {
    setPresentationCase(c);
    setIsPresenting(true);
    setIsPitching(true);
    setPresentationPitch("");
    stopSpeech();

    try {
      const stream = sushrutHospitalPitchStream({
        procedureType: c.procedureType,
        language: caseLanguage
      });
      
      let fullPitch = "";
      for await (const chunk of stream) {
        fullPitch += chunk;
        setPresentationPitch(fullPitch);
      }
      setIsPitching(false);
      speakText(fullPitch, "Zephyr", caseLanguage);
    } catch (e) {
      setPresentationPitch("Welcome to our Excellence Center. This case demonstrates our surgical precision.");
      setIsPitching(false);
    }
  };

  const closePresentation = () => {
    setIsPresenting(false);
    setPresentationCase(null);
    setPresentationPitch("");
    stopSpeech();
  };

  const currentPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [patients, selectedPatientId]);

  return (
    <DashboardGuard loading={isSyncing}>
      <div className="flex h-screen bg-[#020408] overflow-hidden font-['Inter'] relative">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 border-r border-white/5 bg-[#070b14] flex flex-col shrink-0 z-[60] shadow-3xl">
          <div className="p-8 border-b border-white/5 bg-[#0a0f18]/50 mb-6">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-xl">
                   <HeartHandshake size={20} />
                </div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Support Hub</h1>
             </div>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-1">
            {[
              { id: 'VOICE', label: 'Voice Care Hub', icon: Waves },
              { id: 'PATIENT_INTEL', label: 'Registry Updates', icon: Users },
              { id: 'EVERYONE_CARE', label: 'Helping Hub', icon: Heart },
              { id: 'STAFF', label: 'Staff Training', icon: GraduationCap },
              { id: 'REPUTATION', label: 'Brand Monitor', icon: ShieldCheck },
              { id: 'HOME_CARE', label: 'Home Protocol', icon: Home },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg italic' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                 <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5 bg-[#0a0f18]/50 space-y-2">
             <button onClick={onLogout} className="w-full py-4 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl italic flex items-center justify-center gap-3"><Power size={16} /> [ EXIT HUB ]</button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-[#05070a] overflow-hidden relative">
          <header className="p-6 border-b border-white/5 bg-[#0a0f18]/50 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-6">
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_purple]" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic">Institutional Node Active</span>
             </div>
             <div className="flex bg-[#0a0f18] p-1 rounded-xl border border-white/5">
                {['English', 'Telugu', 'Hindi'].map(l => (
                  <button key={l} onClick={() => setCaseLanguage(l)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${caseLanguage === l ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-600 hover:text-white'}`}>{l}</button>
                ))}
             </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 scppable">
             
             {activeTab === 'REPUTATION' && (
               <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                     <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-3xl">
                           <ShieldCheck size={40} />
                        </div>
                        <div>
                           <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Brand Monitor</h2>
                           <p className="text-slate-500 font-medium italic text-2xl mt-3">"Outcome Registry & Hospital Superiority Presentation Hub."</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="relative group">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                           <input 
                             value={caseSearchTerm} onChange={e => setCaseSearchTerm(e.target.value)}
                             placeholder="Search Hip Replacement..." 
                             className="bg-black/40 border border-gray-800 rounded-2xl pl-10 pr-4 py-3 text-[10px] font-black uppercase text-white outline-none focus:border-indigo-500 shadow-inner w-64"
                           />
                        </div>
                        <button 
                          onClick={() => setIsAddingCase(true)}
                          className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 italic border border-white/10 flex items-center gap-3"
                        >
                           <Plus size={18} /> Add Success Case
                        </button>
                     </div>
                  </div>

                  {/* SUCCESS GALLERY */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {displayCases.map(c => (
                       <div 
                         key={c.id}
                         onClick={() => startPresentation(c)}
                         className="bg-[#111827] border border-white/5 rounded-[60px] overflow-hidden group hover:border-indigo-500/40 transition-all cursor-pointer shadow-4xl relative"
                       >
                          <div className="aspect-[16/10] grid grid-cols-2 gap-1 p-2 bg-black">
                             <img src={c.preImage || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=60'} className="w-full h-full object-cover opacity-60 rounded-l-[40px]" alt="Pre" />
                             <img src={c.postImage || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=60'} className="w-full h-full object-cover rounded-r-[40px]" alt="Post" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                          </div>
                          <div className="p-10 space-y-6">
                             <div className="flex justify-between items-start">
                                <div>
                                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">{c.procedureType}</span>
                                   <h3 className="text-2xl font-black text-white uppercase italic mt-1 group-hover:text-indigo-400 transition-colors">{c.patientName}</h3>
                                </div>
                                <div className="p-4 bg-indigo-600/10 rounded-2xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl">
                                   <Play size={20} fill="currentColor" />
                                </div>
                             </div>
                             <p className="text-sm text-gray-500 italic leading-relaxed line-clamp-2">"{c.aiSynthesis.substring(0, 150)}..."</p>
                             <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                                <ShieldCheck size={16} className="text-emerald-500" />
                                <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest italic">Institutional Success Node</span>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>

                  {displayCases.length === 0 && (
                    <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-8">
                       <Database size={150} />
                       <h3 className="text-4xl font-black uppercase tracking-[0.5em] italic">No Matching Cases</h3>
                    </div>
                  )}
               </div>
             )}

             {/* ADD CASE MODAL */}
             {isAddingCase && (
               <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                  <div className="bg-[#111827] border-2 border-indigo-500/20 w-full max-w-5xl rounded-[80px] p-16 shadow-[0_0_150px_rgba(79,70,229,0.2)] overflow-hidden flex flex-col relative">
                     <button onClick={() => setIsAddingCase(false)} className="absolute top-10 right-10 p-4 bg-white/5 hover:bg-red-600 transition-all rounded-2xl text-gray-500 hover:text-white"><X size={32}/></button>
                     
                     <div className="flex items-center gap-8 mb-12 border-b border-white/5 pb-10">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl animate-pulse">
                           <Camera size={32}/>
                        </div>
                        <div>
                           <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Success Registry Entry</h2>
                           <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mt-2 italic">Capture Pre/Post Clinical Transformations via Voice or Text</p>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-4 italic">Patient Identity</label>
                              <input value={newCase.patientName} onChange={e => setNewCase({...newCase, patientName: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-xl font-black italic text-white outline-none focus:border-indigo-500 shadow-inner" placeholder="Enter patient name/alias..." />
                           </div>
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-4 italic">Procedure Category</label>
                              <select value={newCase.procedureType} onChange={e => setNewCase({...newCase, procedureType: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-xl font-black italic text-white outline-none focus:border-indigo-500 appearance-none">
                                 {['Hip Replacement', 'Knee Replacement', 'Spine Surgery', 'Cardiac Bypass', 'Laparoscopy', 'Neurosurgery', 'Pediatrics Success'].map(opt => <option key={opt}>{opt}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           {/* PRE-ADMISSION UPLOAD */}
                           <div className="space-y-6">
                              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest text-center">T1: PRE-ADMISSION NODE</p>
                              <div className="aspect-video bg-[#0a0f18] border-2 border-dashed border-gray-800 rounded-[50px] flex items-center justify-center relative overflow-hidden group">
                                 {newCase.preImage ? (
                                   <img src={newCase.preImage} className="w-full h-full object-cover" alt="Pre" />
                                 ) : <ImageIcon size={64} className="text-gray-800 group-hover:text-indigo-500 transition-colors" />}
                                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'pre')} />
                              </div>
                              <div className="relative group">
                                 <textarea value={newCase.preNotes} onChange={e => setNewCase({...newCase, preNotes: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-[40px] p-8 pr-16 text-sm italic text-slate-400 min-h-[150px]" placeholder="Before treatment condition (Symptoms, Pain...)" />
                                 <button onClick={() => handleVoiceNote('pre')} className={`absolute right-6 bottom-6 p-4 rounded-2xl transition-all shadow-xl ${isListeningForNotes === 'pre' ? 'bg-red-600 animate-pulse text-white' : 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}>
                                    <Mic size={20} />
                                 </button>
                              </div>
                           </div>
                           {/* POST-SURGERY UPLOAD */}
                           <div className="space-y-6">
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">T2: POST-SURGERY NODE</p>
                              <div className="aspect-video bg-[#0a0f18] border-2 border-dashed border-gray-800 rounded-[50px] flex items-center justify-center relative overflow-hidden group">
                                 {newCase.postImage ? (
                                   <img src={newCase.postImage} className="w-full h-full object-cover" alt="Post" />
                                 ) : <ImageIcon size={64} className="text-gray-800 group-hover:text-emerald-500 transition-colors" />}
                                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'post')} />
                              </div>
                              <div className="relative group">
                                 <textarea value={newCase.postNotes} onChange={e => setNewCase({...newCase, postNotes: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-[40px] p-8 pr-16 text-sm italic text-slate-400 min-h-[150px]" placeholder="After treatment result (Walking, Pain-free...)" />
                                 <button onClick={() => handleVoiceNote('post')} className={`absolute right-6 bottom-6 p-4 rounded-2xl transition-all shadow-xl ${isListeningForNotes === 'post' ? 'bg-red-600 animate-pulse text-white' : 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}>
                                    <Mic size={20} />
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="mt-12 pt-10 border-t border-white/5 flex justify-center">
                        <button 
                          onClick={handleSynthesizeCase}
                          disabled={isGeneratingCase}
                          className="px-24 py-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white rounded-[50px] font-black uppercase text-xl tracking-[0.4em] shadow-4xl transition-all active:scale-95 italic border-2 border-white/10 flex items-center gap-8 group"
                        >
                           {isGeneratingCase ? <Loader2 size={32} className="animate-spin" /> : <Sparkles size={32} className="group-hover:rotate-12 transition-transform" />}
                           [ 🔘 INITIATE DEBATE & SYNTHESIS ]
                        </button>
                     </div>
                  </div>
               </div>
             )}

             {/* PRESENTATION OVERLAY */}
             {isPresenting && presentationCase && (
               <div className="fixed inset-0 z-[2000] bg-[#020408] flex items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-700">
                  <div className="bg-[#05070a] border-4 border-indigo-500/40 w-full h-full rounded-[80px] shadow-[0_0_200px_rgba(79,70,229,0.3)] overflow-hidden flex flex-col relative">
                     <button onClick={closePresentation} className="absolute top-12 right-12 p-5 bg-red-600 text-white rounded-3xl hover:bg-red-500 transition-all z-[100] shadow-4xl active:scale-95"><X size={40}/></button>
                     
                     <div className="flex-1 flex flex-col lg:flex-row">
                        {/* Visualization Node */}
                        <div className="lg:w-1/2 p-16 flex flex-col justify-center gap-12 bg-black/40 border-r border-white/5">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-emerald-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl rotate-3">
                                 <ShieldCheck size={32} />
                              </div>
                              <div>
                                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1 italic">Verified Institutional Outcome</h4>
                                 <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{presentationCase.procedureType}</h3>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-10">
                              <div className="space-y-4">
                                 <div className="aspect-[3/4] bg-[#111827] rounded-[50px] border border-white/5 overflow-hidden shadow-2xl relative group">
                                    <img src={presentationCase.preImage} className="w-full h-full object-cover grayscale opacity-60" alt="Pre" />
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-[9px] font-black text-gray-300 uppercase">BEFORE AT PMB</div>
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <div className="aspect-[3/4] bg-[#111827] rounded-[50px] border-4 border-emerald-500/40 overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.2)] relative group">
                                    <img src={presentationCase.postImage} className="w-full h-full object-cover" alt="Post" />
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-emerald-600 text-white rounded-full border border-emerald-400/30 text-[9px] font-black uppercase shadow-2xl animate-pulse">AFTER AT PMB</div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Presentation Script Node */}
                        <div className="lg:w-1/2 p-20 flex flex-col justify-center relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-16 opacity-[0.02] rotate-12"><Radio size={400} /></div>
                           
                           <div className="space-y-12 relative z-10">
                              <div className="flex items-center gap-6">
                                 <Waves className="text-indigo-500 animate-pulse" size={64} />
                                 <div>
                                    <h4 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.6em] italic">Clinical Synthesis Narrative</h4>
                                    <p className="text-white text-3xl font-black italic tracking-tight mt-2">Superior Logic Briefing</p>
                                 </div>
                              </div>

                              <div className="bg-[#0a0f18] p-12 rounded-[60px] border border-white/5 shadow-inner min-h-[400px] flex flex-col justify-center">
                                 {isPitching ? (
                                   <div className="flex flex-col items-center gap-10 opacity-40">
                                      <Loader2 size={80} className="animate-spin text-indigo-500" />
                                      <p className="text-xl font-black text-white uppercase tracking-[0.8em] animate-pulse">Mapping Superiority logic...</p>
                                   </div>
                                 ) : (
                                   <div className="prose prose-invert max-w-none">
                                      <div className="text-[28px] text-slate-100 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering drop-shadow-2xl">
                                         {presentationPitch || presentationCase.aiSynthesis}
                                      </div>
                                   </div>
                                 )}
                              </div>

                              <div className="flex justify-center gap-8">
                                 <button onClick={() => speakText(presentationPitch || presentationCase.aiSynthesis, 'Zephyr', caseLanguage)} className="px-14 py-8 bg-indigo-600 text-white rounded-[40px] font-black uppercase text-xs tracking-[0.3em] shadow-4xl hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-6 border-2 border-white/10 italic">
                                    <Volume2 size={32} /> Play Clinical Narrative
                                 </button>
                                 <button onClick={stopSpeech} className="p-8 bg-white/5 border border-white/10 text-gray-500 hover:text-white rounded-[40px] transition-all"><VolumeX size={32}/></button>
                              </div>
                           </div>
                        </div>
                     </div>

                     <footer className="h-20 border-t border-white/5 bg-[#0a0f18] flex items-center justify-between px-20 shrink-0 opacity-40">
                        <div className="flex items-center gap-6">
                           <ShieldCheck size={20} className="text-emerald-500" />
                           <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">INSTITUTIONAL TRUST NODE: VERIFIED</span>
                        </div>
                        <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest italic">Success Registry Ref: {presentationCase.id}</p>
                     </footer>
                  </div>
               </div>
             )}

             {activeTab === 'PATIENT_INTEL' && (
               <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                     <div className="lg:col-span-4 space-y-8">
                        <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] shadow-3xl h-[650px] flex flex-col">
                           <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                              <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                                 <Users size={18} className="text-cyan-500" /> Active Registry
                              </h3>
                              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filter..." className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1 text-[8px] font-black uppercase text-white outline-none focus:border-cyan-500" />
                           </div>
                           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                              {filteredRegistry.map(p => (
                                <button key={p.id} onClick={() => handlePatientClick(p)} className={`w-full p-5 rounded-3xl border transition-all text-left ${selectedPatientId === p.id ? 'bg-purple-600 border-purple-400 shadow-xl scale-[1.02] italic' : 'bg-black/20 border-white/5 hover:border-purple-500/30'}`}>
                                   <div className="flex justify-between items-start">
                                      <p className="text-sm font-black text-white uppercase">{p.name}</p>
                                      <span className={`px-2 py-0.5 ${p.type === 'IP' ? 'bg-indigo-600' : 'bg-cyan-600'} text-white rounded text-[6px] font-black uppercase`}>{p.type} NODE</span>
                                   </div>
                                   <p className="text-[9px] text-gray-600 font-bold uppercase mt-1.5">{p.id} • {p.age}Y</p>
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="lg:col-span-8 space-y-8">
                        {selectedPatientId ? (
                          <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
                             <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-white/5 shadow-inner w-fit overflow-x-auto scrollbar-hide">
                                {[{ id: 'WARD', label: 'Update', icon: Building }, { id: 'ICU', label: 'Critical', icon: Siren }, { id: 'CONSENT', label: 'Consent', icon: Gavel }, { id: 'VIP', label: 'VIP Node', icon: Crown }].map(st => (
                                  <button key={st.id} onClick={() => { setIntelSubTab(st.id as any); handlePatientClick(activePatients.find(p => p.id === selectedPatientId)!, st.id as any); }} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${intelSubTab === st.id ? 'bg-purple-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}>
                                     <st.icon size={12} /> {st.label}
                                  </button>
                                ))}
                             </div>
                             <div className={`bg-[#0a0f18] border rounded-[60px] p-12 shadow-4xl relative overflow-hidden transition-all duration-700 border-white/5`}>
                                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                                   <div className="flex items-center gap-4">
                                      <div className={`w-2 h-2 rounded-full ${safeSummary.status === 'loading' ? 'bg-cyan-500 animate-ping' : 'bg-emerald-500'}`} />
                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic">{intelSubTab} SENSOR ACTIVE</span>
                                   </div>
                                </div>
                                <div className="prose prose-invert max-w-none">
                                   <div className="text-[22px] text-slate-100 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering drop-shadow-md">{safeSummary.text || "Initializing summary protocol..."}</div>
                                </div>
                             </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center py-40 opacity-10 grayscale select-none">
                             <ShieldAlert size={200} />
                             <h3 className="text-6xl font-black uppercase tracking-[0.5em] italic mt-12">Support Node</h3>
                             <p className="text-xs font-bold uppercase tracking-widest mt-4">Select active patient node to begin synthesis</p>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
             )}

             {activeTab === 'EVERYONE_CARE' && <WellnessAIEngine patient={currentPatient} />}
             {activeTab === 'STAFF' && <StaffManagementHub />}
             
             {activeTab === 'VOICE' && (
                <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
                   <div className="bg-[#111827] border border-white/5 p-16 rounded-[60px] text-center space-y-10 shadow-4xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.02]"><Waves size={300} /></div>
                      <div className="w-24 h-24 bg-purple-600/10 rounded-full mx-auto flex items-center justify-center text-purple-500 border border-purple-500/20 animate-pulse">
                         <Waves size={48} />
                      </div>
                      <div className="space-y-4">
                         <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter">Real-Time Ward Assistant</h3>
                         <p className="text-slate-400 font-medium italic text-lg max-w-2xl mx-auto leading-relaxed">"Susruta v6.5 provides live guidance, explaining disease pathways, recovery plans, and prognosis in human-centric language."</p>
                      </div>
                      <div className="flex flex-col md:flex-row justify-center gap-6">
                        <button onClick={() => setShowVoiceHub(true)} className="px-16 py-7 bg-purple-600 text-white rounded-[40px] font-black uppercase tracking-[0.4em] shadow-3xl hover:bg-purple-500 transition-all active:scale-95 italic border-2 border-white/10">[ Open Voice Interface ]</button>
                        <button onClick={onLogout} className="px-16 py-7 bg-red-600/10 border-2 border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white rounded-[40px] font-black uppercase tracking-[0.4em] transition-all active:scale-95 italic flex items-center justify-center gap-4"><Power size={24} /> EXIT SYSTEM NODE</button>
                      </div>
                   </div>
                </div>
             )}
             
             {activeTab === 'HOME_CARE' && <HomeCareHub patients={patients} />}
          </div>
        </main>
      </div>

      {showStaffSupport && <StaffSupportAIAgent onClose={() => setShowStaffSupport(false)} />}
      {showVoiceHub && <WardAssistantAgent onClose={() => setShowVoiceHub(false)} patient={currentPatient} patients={patients} />}
      
      <footer className="fixed bottom-0 left-64 right-0 h-10 bg-[#0a0f18] border-t border-white/5 flex items-center justify-between px-10 z-[100] backdrop-blur-3xl opacity-60">
         <div className="flex items-center gap-4">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic">🛡 v7.5 INSTITUTIONAL REPUTATION LATTICE ACTIVE</span>
         </div>
         <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest italic">Hub Master: Root-Sync-Active</p>
      </footer>
    </DashboardGuard>
  );
};

export default SupportDashboard;

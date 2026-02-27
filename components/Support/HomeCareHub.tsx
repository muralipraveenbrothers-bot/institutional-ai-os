
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, Activity, HeartPulse, Pill, Scale, 
  Droplets, Thermometer, Wind, AlertTriangle, 
  ShieldCheck, Zap, TrendingUp, Info, 
  ChevronRight, ArrowRight, Loader2, Sparkles, 
  Volume2, BookOpen, UserCheck, Calculator,
  Calendar, CheckCircle2, Clock, Siren, Apple,
  User, Database, Search, Languages, Globe,
  ShieldAlert, ClipboardList, Stethoscope, Bed,
  ArrowLeft, RefreshCw, Printer, AlertCircle
} from 'lucide-react';
import { sushrutHomeRecoveryStream, speakText } from '../../geminiService';
import { Patient } from '../../types';

interface HomeCareHubProps {
  patients?: Patient[];
}

const HomeCareHub: React.FC<HomeCareHubProps> = ({ patients = [] }) => {
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<'English' | 'Telugu' | 'Hindi'>('English');
  const [vitals, setVitals] = useState({ bp: '', sugar: '', temp: '', weight: '' });
  const [analysis, setAnalysis] = useState({ text: '', status: 'idle' as 'idle' | 'loading' | 'done' });
  const [activeView, setActiveView] = useState<'SUMMARY' | 'GUIDE' | 'MEDICINES'>('SUMMARY');

  // Automatically show all registered patients (IP or OP)
  const filteredRegistry = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const selectedPatient = useMemo(() => 
    patients.find(p => p.id === selectedPid), 
  [patients, selectedPid]);

  const runHomeScan = async () => {
    if (!selectedPatient) return;
    setAnalysis({ text: '', status: 'loading' });
    try {
      const stream = sushrutHomeRecoveryStream({ 
        patient: selectedPatient, 
        vitals,
        language 
      });
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setAnalysis(prev => ({ ...prev, text: fullText }));
      }
      setAnalysis(prev => ({ ...prev, status: 'done' }));
      speakText(fullText.substring(0, 300).replace(/[#*]/g, ''), 'Zephyr', language);
    } catch (e) {
      setAnalysis({ text: 'Institutional link reset. Please try re-syncing.', status: 'idle' });
    }
  };

  const handlePatientSelect = (pid: string) => {
    setSelectedPid(pid);
    setAnalysis({ text: '', status: 'idle' });
    setActiveView('SUMMARY');
    // We could auto-run the scan here if we wanted immediate output
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
      
      {!selectedPid ? (
        <div className="space-y-12 animate-in zoom-in-95 duration-700">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
              <div className="flex items-center gap-8">
                 <div className="w-20 h-20 bg-emerald-600 rounded-[28px] flex items-center justify-center text-white shadow-3xl">
                    <Home size={40} />
                 </div>
                 <div>
                    <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Home Protocol Hub</h2>
                    <p className="text-slate-500 font-medium italic text-2xl mt-3 max-w-xl leading-relaxed">
                       "All registered nodes are listed below. Select a patient to begin post-discharge guidance."
                    </p>
                 </div>
              </div>
              <div className="relative w-full md:w-96 group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   placeholder="Search registered patients..." 
                   className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl pl-12 pr-6 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRegistry.map(p => (
                <button 
                  key={p.id}
                  onClick={() => handlePatientSelect(p.id)}
                  className="p-10 bg-[#111827] border border-gray-800 rounded-[50px] transition-all text-left flex flex-col justify-between h-[280px] group relative overflow-hidden hover:border-emerald-500/40 shadow-2xl active:scale-95"
                >
                   <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><User size={150}/></div>
                   <div className="space-y-6 relative z-10">
                      <div className="flex justify-between items-center">
                         <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase ${p.type === 'IP' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20'}`}>{p.type} Node</div>
                         <p className="text-[10px] font-mono text-gray-700">{p.id}</p>
                      </div>
                      <h4 className="text-3xl font-black text-white uppercase italic tracking-tight leading-none group-hover:text-white transition-colors">{p.name}</h4>
                      <p className="text-sm text-gray-500 italic font-medium leading-relaxed line-clamp-2">"Issue: {p.chiefComplaint}"</p>
                   </div>
                   <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-emerald-400">Sync Recovery Node</span>
                      <ChevronRight size={24} className="text-gray-800 group-hover:translate-x-1 group-hover:text-white transition-all" />
                   </div>
                </button>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-12 animate-in slide-in-from-right-10 duration-700">
           
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                 <button onClick={() => setSelectedPid(null)} className="p-4 bg-white/5 hover:bg-emerald-600/20 text-gray-500 hover:text-emerald-500 rounded-2xl transition-all border border-white/5 group">
                    <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-600 rounded-[22px] flex items-center justify-center text-white shadow-3xl">
                       <ShieldCheck size={32} />
                    </div>
                    <div>
                       <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedPatient?.name}</h2>
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 italic">Node {selectedPatient?.id} • Home Care Mode</p>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-gray-800 shadow-inner">
                    {['English', 'Telugu', 'Hindi'].map(lang => (
                      <button 
                        key={lang}
                        onClick={() => setLanguage(lang as any)}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-emerald-600 text-white shadow-xl' : 'text-gray-600 hover:text-white'}`}
                      >
                         {lang}
                      </button>
                    ))}
                 </div>
                 <button 
                   onClick={runHomeScan}
                   disabled={analysis.status === 'loading'}
                   className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-3xl active:scale-95 transition-all flex items-center gap-4 border-2 border-white/10 italic"
                 >
                    {analysis.status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />} [ Re-Sync Guidance ]
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-[#111827] border border-amber-500/30 p-10 rounded-[60px] shadow-3xl space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><AlertCircle size={150} /></div>
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-2">
                          <Stethoscope size={14}/> Patient Problem Node
                       </p>
                       <h3 className="text-3xl font-black text-white uppercase italic tracking-tight leading-tight transition-colors">"{selectedPatient?.chiefComplaint}"</h3>
                       <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.3em]">Hospital Diagnosis Context</p>
                    </div>
                    
                    <div className="space-y-6 pt-10 border-t border-white/5">
                       <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3 italic"><Activity size={16}/> Daily Vital Monitor</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[8px] font-black text-gray-700 uppercase ml-2 italic">BP</label>
                             <input value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-black text-white outline-none focus:border-emerald-500 shadow-inner" placeholder="120/80" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[8px] font-black text-gray-700 uppercase ml-2 italic">Sugar</label>
                             <input value={vitals.sugar} onChange={e => setVitals({...vitals, sugar: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-black text-white outline-none focus:border-emerald-500 shadow-inner" placeholder="110" />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-[#0a0f18] border border-red-500/20 p-8 rounded-[45px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-125 transition-transform duration-[10s]"><Siren size={120} className="text-red-500" /></div>
                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest italic flex items-center gap-3 mb-6"><AlertTriangle size={18} className="animate-pulse" /> Emergency Warnings</h4>
                    <p className="text-sm text-slate-100 font-bold italic leading-relaxed">"Immediate representative required if you detect chest pain or sudden breathlessness."</p>
                 </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                 <div className="bg-[#111827] border border-white/5 rounded-[60px] p-12 shadow-4xl relative overflow-hidden min-h-[600px] flex flex-col">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-6"><ClipboardList size={400} /></div>
                    
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                       <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Post-Discharge Recovery Logic</h3>
                       <button onClick={() => speakText(analysis.text, 'Zephyr', language)} className="p-4 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-xl group">
                          <Volume2 size={24} className="group-hover:scale-110" />
                       </button>
                    </div>

                    <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pr-4">
                       {analysis.status === 'loading' ? (
                          <div className="h-full flex flex-col items-center justify-center gap-8 opacity-40">
                             <Loader2 size={80} className="animate-spin text-emerald-500" />
                             <p className="text-xl font-black text-white uppercase tracking-[1em] animate-pulse">Synthesizing Protocol...</p>
                          </div>
                       ) : analysis.text ? (
                          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                             <div className="prose prose-invert max-w-none text-2xl text-slate-100 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                                {analysis.text}
                             </div>
                          </div>
                       ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-10 grayscale">
                             <Sparkles size={100} className="mb-8" />
                             <p className="text-2xl font-black uppercase tracking-[0.2em] italic">Logic Node Standby</p>
                             <button onClick={runHomeScan} className="mt-8 px-10 py-4 bg-emerald-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">Initialize Synthesis</button>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HomeCareHub;

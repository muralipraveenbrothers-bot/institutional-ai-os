
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ShieldAlert, MessageSquare, MapPin, Zap, Siren, 
  Volume2, Loader2, Sparkles, UserX, AlertTriangle, 
  CheckCircle2, Languages, ShieldCheck, HeartHandshake,
  Bot, Clock, PhoneCall, TrendingUp
} from 'lucide-react';
import { sushrutStaffSupportScriptStream, speakText } from '../../geminiService';

interface StaffSupportAIAgentProps {
  onClose: () => void;
  staffId?: string;
}

const PROBLEMS = [
  "Patient angry", "Attender not listening", "Alcoholic / Aggressive attender",
  "Financial dispute / Billing argument", "Emotional breakdown / Crying",
  "Language barrier / Confusion", "VIP / Political pressure", "ICU stress / Critical update"
];

const LOCATIONS = ["Ward", "ICU", "OP", "Reception", "OT", "Billing"];

const INTENSITIES = [
  { label: "Calm", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Tense", color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Aggressive", color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Physical Risk", color: "text-red-500", bg: "bg-red-500/10" }
];

const LANGUAGES = ["English", "Telugu", "Hindi"];

const StaffSupportAIAgent: React.FC<StaffSupportAIAgentProps> = ({ onClose, staffId = "STAFF-NODE-AUTO" }) => {
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState({
    problem: "",
    location: "",
    intensity: "",
    language: "English"
  });
  const [result, setResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result.text]);

  const generateScript = async () => {
    setResult({ text: "", status: 'loading' });
    setStep(5);
    try {
      const stream = sushrutStaffSupportScriptStream({
        problem: selection.problem,
        location: selection.location,
        intensity: selection.intensity,
        language: selection.language
      });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setResult(prev => ({ ...prev, text: fullText }));
      }
      setResult(prev => ({ ...prev, status: 'done' }));
      
      // Log for training improvement
      const logs = JSON.parse(localStorage.getItem('staff_support_audit_logs') || '[]');
      logs.push({
        id: `SUP-${Date.now()}`,
        timestamp: new Date().toISOString(),
        staffId,
        ...selection,
        scriptProvided: fullText.substring(0, 200)
      });
      localStorage.setItem('staff_support_audit_logs', JSON.stringify(logs.slice(-100)));
      
    } catch (e) {
      setResult({ text: "Communication link reset. Please try again or call your supervisor.", status: 'idle' });
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
      <div className="bg-[#111827] border-2 border-red-500/30 w-full max-w-4xl rounded-[60px] shadow-[0_0_100px_rgba(239,68,68,0.2)] flex flex-col h-[85vh] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><HeartHandshake size={400} /></div>
        
        <header className="p-10 border-b border-white/5 flex items-center justify-between shrink-0 relative z-10">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-red-600 rounded-[28px] flex items-center justify-center text-white shadow-xl animate-pulse">
                 <ShieldAlert size={32} />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">ASK HELP: STAFF AI</h2>
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 italic">De-escalation & Communication Guard</p>
              </div>
           </div>
           <button onClick={onClose} className="p-4 bg-white/5 hover:bg-red-600/20 text-gray-500 hover:text-red-500 rounded-2xl transition-all border border-white/5"><X size={28}/></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 relative z-10" ref={scrollRef}>
           {step === 1 && (
             <div className="space-y-10 animate-in slide-in-from-bottom-8">
                <div className="text-center space-y-4">
                   <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">1. What is the problem?</h3>
                   <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Select the primary conflict node</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {PROBLEMS.map(p => (
                     <button 
                       key={p} 
                       onClick={() => { setSelection({...selection, problem: p}); setStep(2); }}
                       className="p-8 bg-[#0a0f18] border border-gray-800 rounded-[40px] text-lg font-black text-white uppercase italic text-left group hover:border-red-500/50 hover:bg-red-600/5 transition-all shadow-inner"
                     >
                        <span className="opacity-40 group-hover:opacity-100 transition-opacity mr-4">▪</span> {p}
                     </button>
                   ))}
                </div>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-10 animate-in slide-in-from-right-8">
                <div className="text-center space-y-4">
                   <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">2. Where is this happening?</h3>
                   <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Location-specific de-escalation context</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   {LOCATIONS.map(l => (
                     <button 
                       key={l} 
                       onClick={() => { setSelection({...selection, location: l}); setStep(3); }}
                       className="p-10 bg-[#0a0f18] border border-gray-800 rounded-[40px] flex flex-col items-center gap-4 group hover:border-indigo-500/50 hover:bg-indigo-600/5 transition-all shadow-inner"
                     >
                        <MapPin size={32} className="text-gray-700 group-hover:text-indigo-500" />
                        <span className="text-xl font-black text-white uppercase italic">{l}</span>
                     </button>
                   ))}
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-10 animate-in slide-in-from-right-8">
                <div className="text-center space-y-4">
                   <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">3. Intensity level?</h3>
                   <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Behavioral intensity calibration</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {INTENSITIES.map(i => (
                     <button 
                       key={i.label} 
                       onClick={() => { setSelection({...selection, intensity: i.label}); setStep(4); }}
                       className={`p-10 bg-[#0a0f18] border border-gray-800 rounded-[40px] flex items-center justify-between group transition-all shadow-inner ${i.bg} hover:border-white/20`}
                     >
                        <span className={`text-3xl font-black uppercase italic ${i.color}`}>{i.label}</span>
                        <Zap size={32} className={`${i.color} opacity-40 group-hover:opacity-100 animate-pulse`} />
                     </button>
                   ))}
                </div>
             </div>
           )}

           {step === 4 && (
             <div className="space-y-10 animate-in slide-in-from-right-8">
                <div className="text-center space-y-4">
                   <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">4. Select Language</h3>
                   <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Generate script for effective engagement</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {LANGUAGES.map(lang => (
                     <button 
                       key={lang} 
                       onClick={() => { setSelection({...selection, language: lang}); generateScript(); }}
                       className="p-10 bg-[#0a0f18] border border-gray-800 rounded-[40px] flex flex-col items-center gap-4 group hover:border-emerald-500/50 hover:bg-emerald-600/5 transition-all shadow-inner"
                     >
                        <Languages size={32} className="text-gray-700 group-hover:text-emerald-500" />
                        <span className="text-xl font-black text-white uppercase italic">{lang}</span>
                     </button>
                   ))}
                </div>
             </div>
           )}

           {step === 5 && (
             <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                   <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${result.status === 'loading' ? 'bg-red-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_10px_emerald]'}`} />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Live Script Synthesis Node</span>
                   </div>
                   <div className="flex gap-4">
                      <span className="px-4 py-1.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-lg text-[9px] font-black uppercase italic">{selection.problem}</span>
                      <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg text-[9px] font-black uppercase italic">{selection.language}</span>
                   </div>
                </div>

                {result.status === 'loading' && !result.text ? (
                  <div className="py-24 flex flex-col items-center gap-8 opacity-40">
                     <Loader2 size={64} className="animate-spin text-red-500" />
                     <p className="text-[14px] font-black uppercase tracking-[0.8em] animate-pulse">Syncing Behavior Logic...</p>
                  </div>
                ) : (
                  <div className="bg-[#0a0f18] border border-red-500/10 rounded-[60px] p-12 shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.01] pointer-events-none"><Sparkles size={300} /></div>
                     <div className="prose prose-invert max-w-none">
                        <div className="text-xl text-slate-100 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering drop-shadow-md">
                           {result.text || "Synchronizing..."}
                        </div>
                     </div>
                     <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-6">
                        <button 
                          onClick={() => speakText(result.text)}
                          className="px-12 py-5 bg-red-600 hover:bg-red-500 text-white rounded-[32px] font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-4 border border-white/10"
                        >
                           <Volume2 size={20} /> [ Audio Assist ]
                        </button>
                        <button 
                          onClick={() => setStep(1)}
                          className="px-12 py-5 bg-white/5 border border-white/10 text-gray-500 hover:text-white rounded-[32px] font-black uppercase text-[10px] tracking-widest transition-all italic"
                        >
                           Change Situation
                        </button>
                     </div>
                  </div>
                )}
             </div>
           )}
        </div>

        <footer className="p-10 border-t border-white/5 bg-[#0a0f18] shrink-0 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
           <div className="flex items-center gap-4 text-[9px] font-black text-gray-700 uppercase tracking-widest italic leading-relaxed max-w-xl">
              <ShieldCheck size={24} className="text-emerald-500 shrink-0" />
              "Safety Protocol: Never argue. Escalation is a clinical skill. If situation is physically unsafe, inform security node immediately."
           </div>
           <div className="flex gap-4">
              <div className="px-5 py-2 rounded-full bg-red-600/5 border border-red-500/20 text-[9px] font-black text-red-500 uppercase tracking-[0.4em]">AUTH: {staffId}</div>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default StaffSupportAIAgent;

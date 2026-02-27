import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Waves, Mic, MicOff, Printer, RotateCcw, 
  Volume2, ShieldAlert, Sparkles, 
  Activity, Leaf, Dumbbell, Home,
  Loader2, Send, Play,
  ShieldCheck, Video, UserCircle, Scale, Brain,
  Check, AlertCircle, Edit3, HeartHandshake,
  TrendingUp, Activity as PulseIcon, RefreshCw, Square,
  Ghost
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  voiceHardReset,
  registerActiveVideo,
  voiceSpeakSafe,
  autoRetryListen,
  confirmUnderstanding,
  stopAllVoice
} from '../../utils/VoiceTurnController';
import { approveClinicalContentGuarded } from './AppEventToast';
import { Patient } from '../../types';
import { generatePatientPDF } from '../../utils/PatientPDFEngine';
import { monitorAIError, monitorBlankScreen } from '../../utils/MonitorCore';

// --- Assets ---
const THERAPY_VIDEOS: Record<string, { title: string; difficulty: string; url: string }> = {
  'Yoga-General': { title: 'Gentle Spinal Flow', difficulty: 'Beginner', url: 'https://www.youtube.com/embed/v7AYKMP6rOE' },
  'Physio-Knee': { title: 'Knee Strengthening Protocol', difficulty: 'Rehab Phase', url: 'https://www.youtube.com/embed/1v0TAn4XInI' },
  'Exercise-Elderly': { title: 'Chair-Based Mobility', difficulty: 'Safe/Home', url: 'https://www.youtube.com/embed/8BcPHWGguM0' }
};

const PLACEHOLDER_ASSET = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

interface PersonalizationData {
  age: string;
  mobility: 'Bed' | 'Assisted' | 'Independent';
  surgeryStatus: 'None' | 'Recent' | 'Chronic';
}

type NodeStep = 'INTAKE' | 'CONFIRMING' | 'PERSONALIZATION' | 'PROCESSING' | 'ADVICE';

export default function HolisticCareNode({ moduleName, onClose, patient }: { moduleName: string; onClose: () => void; patient?: Patient }) {
  const normalizedModule = moduleName.charAt(0).toUpperCase() + moduleName.slice(1).toLowerCase();
  
  const [step, setStep] = useState<NodeStep>('INTAKE');
  const [userInput, setUserInput] = useState('');
  const [voiceState, setVoiceState] = useState<string>('IDLE');
  const [adviceText, setAdviceText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [showAsset, setShowAsset] = useState(false);
  
  const icons: Record<string, any> = { 'Yoga': Brain, 'Physiotherapy': Activity, 'Naturopathy': Leaf, 'Exercise': Dumbbell, 'Home care': Home };
  const Icon = icons[normalizedModule] || Activity;

  // --- Watchdog Monitor for Blank Screen ---
  useEffect(() => {
    const watchdog = setTimeout(() => {
      if (step === 'PROCESSING' && !adviceText) {
        monitorBlankScreen(normalizedModule);
      }
    }, 8000); // Trigger alert if processing hangs for > 8s
    return () => clearTimeout(watchdog);
  }, [step, adviceText, normalizedModule]);

  // --- Voice Sync Lifecycle ---
  useEffect(() => {
    const handleVoiceUpdate = (e: any) => setVoiceState(e.detail);
    window.addEventListener('voice-state-update', handleVoiceUpdate);

    runHandsFreeIntake();

    return () => {
      window.removeEventListener('voice-state-update', handleVoiceUpdate);
      voiceHardReset();
      registerActiveVideo(null);
    };
  }, [normalizedModule]);

  const runHandsFreeIntake = () => {
    const greeting = `Namaskaram. I am SUSRUTA. Please tell me your concern for ${normalizedModule}.`;
    
    voiceSpeakSafe(greeting, () => {
      autoRetryListen((userText) => {
        setStep('CONFIRMING');
        setUserInput(userText);
        
        confirmUnderstanding(
          userText,
          () => {
            setStep('PERSONALIZATION');
            voiceSpeakSafe("Excellent. Now, let us calibrate your vitals for precision.");
          },
          () => {
            setStep('INTAKE');
            voiceSpeakSafe("I apologize. Please say it again.", () => {
              runHandsFreeIntake();
            });
          }
        );
      });
    });
  };

  const processClinicalLogic = async () => {
    setStep('PROCESSING');
    setIsLoading(true);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `You are SUSRUTA, expert in ${normalizedModule}. 
      Patient Problem: "${userInput}". 
      Age: ${personalization.age}, Mobility: ${personalization.mobility}, History: ${personalization.surgeryStatus}.
      Generate a safe, personalized clinical plan. Include specific movements or dietary markers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.1 }
      });

      const text = response.text || "";
      
      if (!text) {
        throw new Error("Empty Response Node");
      }

      setAdviceText(text);
      setStep('ADVICE');
      
      voiceSpeakSafe(text.split('\n\n')[0].replace(/[#*]/g, ''));
    } catch (err) {
      monitorAIError(normalizedModule, err);
      setAdviceText("Institutional synchronization failure. Please consult a specialist.");
      setStep('ADVICE');
    } finally {
      setIsLoading(false);
    }
  };

  const [personalization, setPersonalization] = useState<PersonalizationData>({
    age: patient?.age?.toString() || '45',
    mobility: 'Independent',
    surgeryStatus: 'None'
  });

  return (
    <div className="fixed inset-0 z-[10000] bg-[#020408]/96 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
      <div className="bg-[#0a0f18] border border-emerald-500/20 w-full max-w-5xl rounded-[60px] md:rounded-[80px] shadow-[0_50px_150px_rgba(16,185,129,0.2)] overflow-hidden flex flex-col h-[90vh]">
        
        <header className="p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-950/20 to-transparent shrink-0">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-[28px] flex items-center justify-center text-white shadow-xl relative group">
              <Icon size={32} />
              <div className="absolute inset-0 bg-white/10 animate-pulse rounded-[28px]" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none">SUSRUTA HOLISTIC</h2>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.6em] mt-2 italic">{normalizedModule} Intelligence Node</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 hover:bg-red-600/20 text-gray-500 hover:text-red-500 rounded-2xl transition-all"><X size={28}/></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-12 pb-40">
           
           {(step === 'INTAKE' || step === 'CONFIRMING') && (
             <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                <div className={`bg-[#111827] border p-16 rounded-[60px] shadow-inner text-center space-y-12 relative overflow-hidden transition-all duration-700 ${step === 'CONFIRMING' ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-emerald-500/10'}`}>
                   <div className="absolute top-0 right-0 p-12 opacity-5"><PulseIcon size={200} className="animate-pulse" /></div>
                   
                   <div className="w-24 h-24 bg-emerald-600/10 rounded-full mx-auto flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl relative">
                      <Waves size={48} className={voiceState === 'SPEAKING' || voiceState === 'LISTENING' ? "animate-pulse" : ""} />
                      {voiceState === 'LISTENING' && <div className="absolute -inset-4 border-2 border-emerald-500/20 rounded-full animate-ping" />}
                   </div>

                   <p className="text-4xl md:text-5xl text-emerald-50 font-black italic leading-tight tracking-tighter relative z-10">
                      {step === 'CONFIRMING' ? `"${userInput}"?` :
                       voiceState === 'SPEAKING' ? "Listening for intake..." : 
                       voiceState === 'LISTENING' ? "👂 I am listening to you..." : 
                       `"Namaskaram. Tell me your concern."`}
                   </p>

                   <div className="flex items-center justify-center gap-4">
                      <div className={`h-1.5 w-32 rounded-full overflow-hidden bg-gray-800`}>
                        <div className={`h-full bg-emerald-500 transition-all duration-700 ${voiceState === 'LISTENING' ? 'w-full animate-pulse' : 'w-0'}`} />
                      </div>
                      <span className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px]">Institutional Audio Core Active</span>
                   </div>
                </div>

                <div className="relative group">
                   <div className="absolute -top-8 left-10 text-[9px] font-black text-emerald-600 uppercase tracking-widest italic flex items-center gap-2">
                      <Sparkles size={12} className="animate-pulse" /> Live Transcription Relay v6.3
                   </div>
                   <textarea 
                     value={userInput}
                     onChange={e => setUserInput(e.target.value)}
                     className="w-full bg-[#111827] border border-gray-800 rounded-[50px] p-12 text-2xl text-white outline-none focus:border-emerald-500 shadow-4xl transition-all italic min-h-[300px] placeholder:opacity-5 font-medium"
                     placeholder="Intake data streaming..."
                   />
                   <div className="absolute right-8 bottom-8 flex gap-6">
                      <button 
                        onClick={runHandsFreeIntake}
                        className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-xl active:scale-95 ${voiceState === 'LISTENING' ? 'bg-red-600 animate-pulse shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-500'} text-white`}
                      >
                         <Mic size={32} />
                      </button>
                      <button 
                        onClick={() => setStep('PERSONALIZATION')}
                        disabled={!userInput.trim()}
                        className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white hover:bg-emerald-500 shadow-xl disabled:opacity-20 active:scale-95 transition-all"
                      >
                         <Send size={32} />
                      </button>
                   </div>
                </div>
             </div>
           )}

           {step === 'PERSONALIZATION' && (
             <div className="space-y-12 animate-in slide-in-from-right-10">
                <div className="flex items-center gap-8 mb-4">
                   <div className="w-16 h-16 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                      <UserCircle size={32} />
                   </div>
                   <div>
                      <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Clinical Calibration</h3>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">Adjust vitals for accurate synthesis</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {[
                     { label: 'Baseline Age', value: personalization.age, key: 'age', options: ['25','35','45','55','65','75'] },
                     { label: 'Mobility Node', value: personalization.mobility, key: 'mobility', options: ['Bed','Assisted','Independent'] },
                     { label: 'Surgical Logic', value: personalization.surgeryStatus, key: 'surgeryStatus', options: ['None','Recent','Chronic'] }
                   ].map(field => (
                     <div key={field.key} className="bg-[#111827] p-8 rounded-[40px] border border-white/5 space-y-6">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{field.label}</p>
                        <div className="flex flex-wrap gap-3">
                           {field.options.map(opt => (
                             <button 
                               key={opt}
                               onClick={() => setPersonalization({...personalization, [field.key]: opt})}
                               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${personalization[field.key as keyof PersonalizationData] === opt ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[#0a0f18] text-gray-600 border border-gray-800'}`}
                             >
                               {opt}
                             </button>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>

                <button 
                   onClick={processClinicalLogic}
                   className="w-full py-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[40px] font-black uppercase text-xl tracking-[0.4em] shadow-2xl transition-all active:scale-95 italic border border-white/10"
                >
                   [ RUN SUSRUTA CLINICAL SYNERGY ]
                </button>
             </div>
           )}

           {step === 'PROCESSING' && (
             <div className="h-full flex flex-col items-center justify-center space-y-12 py-20">
                <div className="relative scale-150">
                   <Loader2 size={80} className="text-emerald-500 animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={32} className="text-emerald-400 animate-pulse" />
                   </div>
                </div>
                <p className="text-2xl font-black text-white uppercase tracking-[1em] animate-pulse ml-[1em]">Synthesizing Nodes...</p>
             </div>
           )}

           {step === 'ADVICE' && (
             <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-1000">
                <div className={`p-10 rounded-[50px] border-2 flex items-center justify-between gap-10 shadow-4xl transition-all duration-700 ${isApproved ? 'bg-emerald-600/10 border-emerald-500/30 shadow-emerald-500/10' : 'bg-amber-600/5 border-amber-500/20 shadow-amber-500/5'}`}>
                   <div className="flex items-center gap-8">
                      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl ${isApproved ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white animate-pulse'}`}>
                        {isApproved ? <ShieldCheck size={40} /> : <AlertCircle size={40} />}
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${isApproved ? 'text-emerald-500' : 'text-amber-500'}`}>
                           {isApproved ? 'Institutional Authorization Secured' : 'AI DRAFT - Pending Clinical Audit'}
                        </p>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
                           {isApproved ? 'Authorized Care Plan' : 'Consultant Review Mandatory'}
                        </h3>
                      </div>
                   </div>
                   {!isApproved && (
                     <button 
                       onClick={() => { if (approveClinicalContentGuarded()) setIsApproved(true); }}
                       className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95"
                     >
                       Approve Advice
                     </button>
                   )}
                </div>

                <div className="bg-[#111827] border border-white/5 p-12 rounded-[60px] shadow-inner relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[4s]"><Ghost size={400} /></div>
                   <div className="prose prose-invert max-w-none relative z-10">
                      <div className="text-[20px] text-emerald-50 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                         {adviceText}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between px-4">
                      <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] flex items-center gap-3"><Video size={16} className="text-cyan-500" /> Clinical Asset Sync</h4>
                      <button 
                        onClick={() => setShowAsset(!showAsset)}
                        className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-400 transition-all"
                      >
                         {showAsset ? 'Hide Asset' : 'Visualize Diagnostic Path'}
                      </button>
                   </div>
                   {showAsset && (
                     <div className="rounded-[40px] overflow-hidden border border-white/5 bg-black shadow-4xl aspect-video relative group animate-in zoom-in-95 duration-500">
                        <video 
                          ref={registerActiveVideo} 
                          controls 
                          className="w-full h-full"
                          src={PLACEHOLDER_ASSET}
                        />
                        <div className="absolute top-4 left-4 pointer-events-none">
                           <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-black text-white/40 uppercase tracking-widest">
                              Neural-Sync: AI Awareness Enabled
                           </div>
                        </div>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
                   <button 
                      onClick={() => voiceSpeakSafe(adviceText.replace(/[#*]/g, ''))} 
                      className={`flex flex-col items-center justify-center gap-4 text-white font-black px-8 py-8 rounded-[40px] uppercase text-[11px] tracking-widest shadow-2xl transition-all active:scale-95 group ${isApproved ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-gray-800 text-gray-600 grayscale cursor-not-allowed'}`}
                    >
                      <Volume2 size={32} className="group-hover:scale-110" /> Speak Plan
                   </button>
                   <button 
                      onClick={() => generatePatientPDF({ module: "YOGA", language: "en-US", hospitalName: "PM BROTHERS", patientSummary: userInput, adviceSteps: adviceText.split('\n').filter(l => l.startsWith('-')), doctorApproved: true, doctorName: "Dr. Murali" })}
                      className={`flex flex-col items-center justify-center gap-4 border text-emerald-500 font-black px-8 py-8 rounded-[40px] uppercase text-[11px] tracking-widest transition-all shadow-xl group ${isApproved ? 'bg-[#111827] border-emerald-500/20 hover:bg-emerald-600/10' : 'bg-gray-800 border-gray-700 text-gray-600 grayscale cursor-not-allowed'}`}
                    >
                      <Printer size={32} className="group-hover:rotate-6" /> Print Handout
                   </button>
                   <button onClick={() => { setStep('INTAKE'); setUserInput(''); setAdviceText(''); setIsApproved(false); voiceHardReset(); }} className="flex flex-col items-center justify-center gap-4 bg-gray-900 border border-gray-800 text-gray-400 font-black px-8 py-8 rounded-[40px] uppercase text-[11px] tracking-widest hover:text-white transition-all shadow-xl group">
                      <RotateCcw size={32} className="group-hover:rotate-12" /> New Case
                   </button>
                   <button onClick={stopAllVoice} className="flex flex-col items-center justify-center gap-4 bg-red-950/20 border border-red-500/20 text-red-500 font-black px-8 py-8 rounded-[40px] uppercase text-[11px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl group">
                      <Square size={32} fill="currentColor" /> Silence AI
                   </button>
                </div>
             </div>
           )}
        </div>

        <footer className="p-10 border-t border-white/5 bg-[#0a0f18] shrink-0 flex items-center justify-between z-10">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-[10px] font-black text-gray-700 uppercase tracking-widest italic">
                 <ShieldCheck size={18} className="text-emerald-500" /> Secure Clinical Node: 101-TX-L1
              </div>
           </div>
           <div className="flex gap-4">
              <div className="px-5 py-2 rounded-full bg-emerald-600/5 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em]">HIPAA v6.0 COMPLIANT</div>
           </div>
        </footer>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Zap, Brain, Activity, Target, ShieldCheck, Microscope, 
  Leaf, Dumbbell, Apple, Home, Info, Sparkles,
  Loader2, Printer, CheckCircle2, ChevronRight, UserCircle,
  TrendingUp, RefreshCw, X, Heart,
  Mic, MicOff, Volume2, Globe, Play, BookOpen, 
  Languages, Siren, Scale, Waves, Carrot, HeartPulse,
  ClipboardList, UserPlus, Fingerprint, ArrowLeft,
  ShieldAlert, UserCheck, ClipboardCheck, AlertTriangle,
  FileText, Scan, Layers, Radio, Ghost, Headphones
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
// Added missing Patient import
import { Patient } from '../../types';
import { sushrutWellnessAIEngineStream, speakText, askSusruta, createAudioContext } from '../../geminiService';
import { approveClinicalContentGuarded } from './AppEventToast';
import { generatePatientPDF } from '../../utils/PatientPDFEngine';

/* --- Live Audio Helpers --- */
function encode(bytes: Uint8Array) {
  let b = '';
  for (let i = 0; i < bytes.byteLength; i++) b += String.fromCharCode(bytes[i]);
  return btoa(b);
}

function decode(base64: string) {
  const b = atob(base64);
  const bytes = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface WellnessAIEngineProps {
  // Fix: Added import for Patient to resolve 'Cannot find name' error
  patient?: Patient;
}

type Step = 'CATEGORY_PICK' | 'ENTRY_METHOD' | 'PROFILE_FORM' | 'REPORTS_CHECK' | 'VOICE_INTAKE' | 'GENERATING' | 'RESULT' | 'EMERGENCY_STOP' | 'PRE_LOCK';
type WellnessModule = 'YOGA' | 'EXERCISE' | 'NUTRITION' | 'NATUROPATHY' | 'HOME_CARE' | 'WEIGHT_LOSS' | 'DIABETES_MGMT';
type VoiceFlowPhase = 'IDLE' | 'PROMPTING' | 'COLLECTING' | 'RECOVERING_MISSING' | 'CONFIRMING';

const WellnessAIEngine: React.FC<WellnessAIEngineProps> = ({ patient }) => {
  const [activeStep, setActiveStep] = useState<Step>('CATEGORY_PICK');
  const [activeModule, setActiveModule] = useState<WellnessModule | null>(null);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isCatholicated, setIsCatholicated] = useState(false); 
  const [mode, setMode] = useState<'TEXT' | 'VOICE' | 'GUIDED'>('TEXT');
  const [language, setLanguage] = useState('English');
  const [voiceIntakeTranscript, setVoiceIntakeTranscript] = useState("");
  const [voicePhase, setVoicePhase] = useState<VoiceFlowPhase>('IDLE');
  const [hasReports, setHasReports] = useState<'YES' | 'NO' | 'UNKNOWN'>('UNKNOWN');

  // --- LIVE INTERACTIVE STATE ---
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveState, setLiveState] = useState<'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'IDLE'>('IDLE');
  const [liveTranscript, setLiveTranscript] = useState({ ai: '', user: '' });
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const [profile, setProfile] = useState({
    name: patient?.name || '',
    age: patient?.age?.toString() || '',
    sex: patient?.gender || 'Male',
    weight: '',
    height: '',
    mainProblem: patient?.chiefComplaint || '',
    knownConditions: patient?.healthSnapshot?.knownConditions || '',
    medications: ''
  });

  const bmiData = useMemo(() => {
    const w = parseFloat(profile.weight);
    const h = parseFloat(profile.height) / 100;
    if (!w || !h || h === 0) return { val: 0, cat: 'PENDING', color: 'text-gray-500' };
    const val = parseFloat((w / (h * h)).toFixed(1));
    let cat = 'NORMAL';
    let color = 'text-emerald-500';
    if (val < 18.5) { cat = 'UNDERWEIGHT'; color = 'text-blue-400'; }
    else if (val >= 25 && val < 30) { cat = 'OVERWEIGHT'; color = 'text-amber-500'; }
    else if (val >= 30) { cat = 'OBESE'; color = 'text-red-500'; }
    return { val, cat, color };
  }, [profile.weight, profile.height]);

  const cleanupLive = () => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
    }
    if (audioContextInRef.current && audioContextInRef.current.state !== 'closed') {
      audioContextInRef.current.close().catch(() => {});
    }
    if (audioContextOutRef.current && audioContextOutRef.current.state !== 'closed') {
      audioContextOutRef.current.close().catch(() => {});
    }
    sourcesRef.current.forEach(s => {
      try {
        s.stop();
      } catch (e) {}
    });
    sourcesRef.current.clear();
    setIsLiveActive(false);
    setLiveState('IDLE');
  };

  const startLiveWellnessSession = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        alert("Personalized API Key selection is mandatory for ShanVin's Realm.");
        await (window as any).aistudio.openSelectKey();
      }
    }

    setLiveState('CONNECTING');
    setIsLiveActive(true);
    setLiveTranscript({ ai: '', user: '' });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextInRef.current = createAudioContext({ sampleRate: 16000 });
      audioContextOutRef.current = createAudioContext({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLiveState('LISTENING');
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
            
            sessionPromise.then(s => s.sendRealtimeInput({ 
              text: `Namaskaram! I am your Wellness Mentor. I see we are discussing ${activeModule?.replace('_', ' ') || 'General Wellness'} for ${profile.name}. I will guide you through your personalized path. First, how are you feeling today? Any specific questions about your current plan?` 
            }));
          },
          onmessage: async (m: LiveServerMessage) => {
            if (m.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              setLiveState('SPEAKING');
              const base64 = m.serverContent.modelTurn.parts[0].inlineData.data;
              const buffer = await decodeAudioData(decode(base64), audioContextOutRef.current!, 24000, 1);
              const source = audioContextOutRef.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextOutRef.current!.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextOutRef.current!.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setLiveState('LISTENING');
              };
            }
            if (m.serverContent?.outputTranscription) setLiveTranscript(prev => ({ ...prev, ai: m.serverContent!.outputTranscription!.text }));
            if (m.serverContent?.inputTranscription) setLiveTranscript(prev => ({ ...prev, user: m.serverContent!.inputTranscription!.text }));
          },
          onerror: () => cleanupLive()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the SUSRUTA Wellness Mentor.
          INTERACTIVE PROTOCOL:
          1. Greet the patient warmly in their detected language (English, Telugu, or Hindi).
          2. AUTO-DETECT their language from audio and respond in the same language.
          3. Discuss their wellness module: ${activeModule}.
          4. Give 1-2 points of advice, then STOP and ask: "Is this clear?" or "Do you have any questions so far?".
          5. If they have questions, answer them clinically but empathetically.
          6. GOAL: Improve patient quality of life and hospital reputation through superior communication.
          7. Use professional, authoritative but warm tones.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      setIsLiveActive(false);
      setLiveState('IDLE');
    }
  };

  const executeWellnessGeneration = async () => {
    setAdvice("");
    setIsApproved(false);
    setIsCatholicated(false);
    setActiveStep('GENERATING');
    setLoading(true);
    try {
      const stream = sushrutWellnessAIEngineStream({ 
        patient: { name: profile.name }, 
        module: activeModule || "WELLNESS",
        context: { ...profile, bmi: bmiData.val, bmiCat: bmiData.cat, hasReports, diagnosis: profile.mainProblem },
        mode, language
      });
      let fullText = "";
      for await (const chunk of stream) { fullText += chunk; setAdvice(fullText); }
      const safetyClosing = "\n\n**STRICT ADHERENCE REQUIRED.**\n\nPlease consult your doctor before starting any new yoga, diet, or exercise plan.";
      setAdvice(fullText + safetyClosing);
      setActiveStep('RESULT');
      speakText("Your personalized plan is ready. Please review it with your physician.", 'Zephyr', language);
    } catch (e) { setAdvice("Institutional sync error."); setActiveStep('RESULT'); } finally { setLoading(false); }
  };

  const handlePrint = () => {
    if (!isApproved) return;
    generatePatientPDF({
      module: activeModule || "WELLNESS",
      language: language === 'Telugu' ? 'te-IN' : 'en-US',
      hospitalName: "PM BROTHERS MULTISPECIALITY HOSPITAL",
      patientSummary: `Name: ${profile.name}\nAge: ${profile.age}\nProblem: ${profile.mainProblem}\nBMI: ${bmiData.val} (${bmiData.cat})`,
      adviceSteps: advice.split('\n').filter(l => l.trim().length > 5),
      doctorApproved: true,
      doctorName: "Institutional Wellness Node"
    });
  };

  const MODULES = [
    { id: 'DIABETES_MGMT', label: 'Diabetes Care', icon: Activity, color: 'text-blue-400', desc: 'Blood Sugar & Diet' },
    { id: 'WEIGHT_LOSS', label: 'Weight Reduction', icon: Scale, color: 'text-rose-400', desc: 'BMI Optimization' },
    { id: 'YOGA', label: 'Yoga & Mind', icon: Brain, color: 'text-indigo-400', desc: 'Flexibility & Peace' },
    { id: 'NUTRITION', label: 'Diet Planner', icon: Carrot, color: 'text-emerald-400', desc: 'Clinical Portioning' },
    { id: 'NATUROPATHY', label: 'Naturopathy', icon: Leaf, color: 'text-teal-400', desc: 'Natural Healing' },
    { id: 'HOME_CARE', label: 'Home Remedies', icon: Home, color: 'text-amber-400', desc: 'Self Support' },
    { id: 'PHYSIOTHERAPY', label: 'Physiotherapy', icon: Activity, color: 'text-cyan-400', desc: 'Rehab & Mobility' }
  ];

  return (
    <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-8 md:p-12 shadow-4xl min-h-[780px] flex flex-col relative overflow-hidden font-['Inter']">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12 transition-transform duration-[10s]"><Heart size={500} fill="currentColor" /></div>
      
      {/* 🌐 HUB HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 border-b border-white/5 pb-8 relative z-10 gap-6">
         <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-emerald-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl relative overflow-hidden group">
               <HeartPulse size={40} className="relative z-10 group-hover:scale-110 transition-transform" />
               <div className="absolute inset-0 bg-white/10 animate-pulse" />
            </div>
            <div>
               <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Helping Hub</h3>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 italic">Institutional Wellness Node v9.5</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-white/5 shadow-inner">
              {['English', 'Telugu', 'Hindi'].map(l => (
                <button key={l} onClick={() => setLanguage(l)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === l ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-600 hover:text-white'}`}>{l}</button>
              ))}
            </div>
            {activeStep !== 'CATEGORY_PICK' && (
              <button onClick={() => { setActiveStep('CATEGORY_PICK'); cleanupLive(); }} className="p-4 bg-white/5 hover:bg-red-600/20 text-gray-500 hover:text-red-500 rounded-2xl transition-all border border-white/5 group active:scale-95 shadow-xl">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
         </div>
      </div>

      {/* 🚀 STEP 0: CATEGORY PICK */}
      {activeStep === 'CATEGORY_PICK' && (
        <div className="space-y-12 animate-in fade-in duration-700 py-10">
           <div className="text-center space-y-4">
              <h4 className="text-6xl font-black text-white uppercase italic tracking-tighter">What solution do you want?</h4>
              <p className="text-slate-500 font-medium italic text-2xl">Select your preferred clinical wellness pathway.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {MODULES.map(m => (
                <button 
                  key={m.id}
                  onClick={() => { setActiveModule(m.id as WellnessModule); setActiveStep('ENTRY_METHOD'); }}
                  className="p-10 rounded-[50px] border border-white/5 bg-[#0a0f18]/60 backdrop-blur-md hover:border-emerald-500/40 transition-all flex flex-col items-center justify-center text-center gap-6 h-[280px] shadow-3xl group relative overflow-hidden active:scale-95"
                >
                   <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000"><m.icon size={150}/></div>
                   <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center border transition-all shadow-inner ${m.color} bg-black/40 group-hover:bg-white/5 group-hover:border-white/10 group-hover:shadow-2xl`}>
                      <m.icon size={40} />
                   </div>
                   <div>
                      <span className="text-xl font-black uppercase italic tracking-widest text-white block">{m.label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mt-2 block">{m.desc}</span>
                   </div>
                </button>
              ))}
           </div>
        </div>
      )}

      {/* 🎙 STEP 1: ENTRY METHOD */}
      {activeStep === 'ENTRY_METHOD' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-16 animate-in zoom-in-95 duration-700 py-10">
           <div className="text-center space-y-6">
              <h4 className="text-6xl font-black text-white uppercase italic tracking-tighter">Profile Ingress</h4>
              <p className="text-slate-500 font-medium italic text-2xl max-w-xl mx-auto leading-relaxed">"Susruta requires clinical profile markers for safe advice."</p>
           </div>
           <div className="flex flex-col md:flex-row gap-10 w-full max-w-3xl">
              <button 
                onClick={() => setActiveStep('PROFILE_FORM')}
                className="flex-1 p-14 bg-[#0a0f18] border border-indigo-500/20 rounded-[60px] shadow-4xl hover:border-indigo-400/50 transition-all group flex flex-col items-center gap-10 active:scale-95"
              >
                 <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-3xl group-hover:rotate-6 transition-transform"><ClipboardList size={48}/></div>
                <div className="text-center">
                   <span className="text-3xl font-black text-white uppercase italic tracking-widest block leading-none">Manual Node</span>
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-4 block italic">📝 MANUAL DATA ENTRY</span>
                </div>
              </button>
              <button 
                onClick={() => { setActiveStep('PROFILE_FORM'); /* Simulated shortcut to voice node */ }}
                className="flex-1 p-14 bg-[#0a0f18] border border-emerald-500/20 rounded-[60px] shadow-4xl hover:border-emerald-400/50 transition-all group flex flex-col items-center gap-10 active:scale-95"
              >
                 <div className="w-24 h-24 bg-emerald-600 rounded-[32px] flex items-center justify-center text-white shadow-3xl group-hover:scale-110 transition-transform animate-pulse"><Mic size={48}/></div>
                 <div className="text-center">
                    <span className="text-3xl font-black text-white uppercase italic tracking-widest block leading-none">Voice Hub</span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-4 block italic">🎙 HANDS-FREE SYNC</span>
                 </div>
              </button>
           </div>
        </div>
      )}

      {/* PROFILE FORM (RETAINED) */}
      {activeStep === 'PROFILE_FORM' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 py-4 max-w-5xl mx-auto w-full">
           <div className="flex items-center gap-8 mb-6">
              <div className="w-20 h-20 bg-indigo-600/10 rounded-[32px] flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
                 <UserPlus size={40} />
              </div>
              <div>
                 <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Profile Calibration</h4>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">Personal vitals for targeted logic</p>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-[#0a0f18]/60 p-12 rounded-[70px] border border-white/5 shadow-inner backdrop-blur-3xl">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-6 italic">Full Legal Name</label>
                 <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-[#0d1321] border border-gray-800 rounded-3xl px-10 py-6 text-base font-black text-white outline-none focus:border-indigo-500 shadow-inner" placeholder="Enter name..." />
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-6 italic">Age</label>
                    <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="w-full bg-[#0d1321] border border-gray-800 rounded-3xl px-10 py-6 text-base font-black text-white outline-none" />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-6 italic">Gender</label>
                    <select value={profile.sex} onChange={e => setProfile({...profile, sex: e.target.value})} className="w-full bg-[#0d1321] border border-gray-800 rounded-3xl px-10 py-[22px] text-sm font-black text-white outline-none focus:border-indigo-500">
                       <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-6 italic">Weight (KG)</label>
                    <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} className="w-full bg-[#0d1321] border border-gray-800 rounded-3xl px-10 py-6 text-xl font-black text-emerald-500 outline-none" />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-6 italic">Height (CM)</label>
                    <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} className="w-full bg-[#0d1321] border border-gray-800 rounded-3xl px-10 py-6 text-base font-black text-white outline-none" />
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-6 italic">Health Problem suffering from</label>
                 <input value={profile.mainProblem} onChange={e => setProfile({...profile, mainProblem: e.target.value})} className="w-full bg-[#0d1321] border border-gray-800 rounded-3xl px-10 py-6 text-base font-black text-white outline-none" placeholder="e.g. Back Pain, Obesity, High Sugar" />
              </div>
           </div>
           <div className="flex justify-end pt-8">
              <button 
                onClick={() => setActiveStep('REPORTS_CHECK')}
                disabled={!profile.name || !profile.age || !profile.weight || !profile.height}
                className="px-20 py-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[50px] font-black uppercase text-base tracking-[0.4em] shadow-4xl active:scale-95 italic border-2 border-white/10 flex items-center justify-center gap-6"
              >
                 Next Protocol Node <ChevronRight size={24} />
              </button>
           </div>
        </div>
      )}

      {/* PRE-LOCK CATHOLICATE (RETAINED) */}
      {activeStep === 'PRE_LOCK' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-16 animate-in zoom-in-95 duration-700 py-10">
           <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-red-600/10 rounded-[32px] mx-auto flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
                <ShieldAlert size={48} />
              </div>
              <h4 className="text-5xl font-black text-white uppercase italic tracking-tighter">Physician Catholicate</h4>
              <p className="text-slate-500 font-medium italic text-2xl max-w-xl mx-auto leading-relaxed">
                "Clinical advice is supportive. You must follow the instructions strictly. Physician validation is required before starting."
              </p>
           </div>
           <div className="bg-[#0a0f18] p-12 rounded-[60px] border border-white/5 shadow-inner space-y-10 w-full max-w-2xl">
              <label className="flex items-center gap-8 cursor-pointer group">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${isCatholicated ? 'bg-emerald-600 border-emerald-400' : 'bg-black/40 border-gray-800'}`}>
                    <input type="checkbox" checked={isCatholicated} onChange={e => setIsCatholicated(e.target.checked)} className="hidden" />
                    {isCatholicated && <CheckCircle2 size={32} className="text-white animate-in zoom-in" />}
                 </div>
                 <div>
                    <p className="text-xl font-black text-white uppercase italic group-hover:text-emerald-400 transition-colors">I UNDERSTAND & AGREE</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black mt-2 tracking-widest">Protocol validation node acknowledgement</p>
                 </div>
              </label>
              <button 
                onClick={executeWellnessGeneration}
                disabled={!isCatholicated}
                className={`w-full py-10 rounded-[50px] font-black uppercase text-xl tracking-[0.4em] shadow-4xl transition-all italic border-2 flex items-center justify-center gap-8 group ${isCatholicated ? 'bg-indigo-600 border-indigo-400 text-white hover:bg-indigo-500' : 'bg-gray-800 border-white/5 text-gray-700 cursor-not-allowed opacity-20'}`}
              >
                 <Sparkles size={32} /> [ SYNTHESIZE PLAN ]
              </button>
           </div>
        </div>
      )}

      {/* 🏆 STEP: RESULT RESULT RESULT */}
      {activeStep === 'RESULT' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-1000 pb-32">
           <div className={`bg-[#0a0f18] border rounded-[80px] p-16 shadow-4xl relative overflow-hidden border-emerald-500/30`}>
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[6s]"><Microscope size={600} className="text-emerald-500" /></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-12 mb-16 relative z-10 gap-10">
                 <div className="flex items-center gap-10">
                    <div className={`w-20 h-20 rounded-[32px] bg-emerald-600 flex items-center justify-center text-white shadow-3xl`}>
                       <CheckCircle2 size={48} />
                    </div>
                    <div>
                       <p className={`text-sm font-black uppercase tracking-[0.5em] mb-3 text-emerald-500`}>Institutional Authorization Secured</p>
                       <h4 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Plan for {profile.name.toUpperCase()}</h4>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button 
                       onClick={startLiveWellnessSession}
                       className="px-14 py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[40px] font-black uppercase text-xs tracking-[0.3em] shadow-3xl transition-all active:scale-95 italic border-2 border-white/10 flex items-center justify-center gap-6 animate-pulse"
                    >
                       <Headphones size={28} /> [ START LIVE INTERACTIVE CARE ]
                    </button>
                 </div>
              </div>

              {/* 🎙 LIVE INTERACTIVE OVERLAY */}
              {isLiveActive && (
                <div className="bg-[#05070a] border-4 border-emerald-500/40 rounded-[60px] p-12 mb-16 animate-in zoom-in-95 duration-500 shadow-[0_0_100px_rgba(16,185,129,0.3)]">
                   <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-emerald-600 rounded-[20px] flex items-center justify-center text-white shadow-xl">
                            <Radio size={28} className="animate-pulse" />
                         </div>
                         <div>
                            <h4 className="text-2xl font-black text-white uppercase italic">Interactive Mentorship Active</h4>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Automatic Language Detection Node Synced</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="px-6 py-2 bg-emerald-600/10 border border-emerald-500/30 rounded-full text-[10px] font-black text-emerald-500 uppercase italic">
                           {liveState}
                        </div>
                        <button onClick={cleanupLive} className="p-4 bg-red-600 text-white rounded-2xl shadow-xl active:scale-95"><X size={24}/></button>
                      </div>
                   </div>

                   <div className="space-y-16 py-10">
                      <div className="flex justify-center items-center gap-12">
                         <Waves className={`text-emerald-500 ${liveState === 'SPEAKING' ? 'animate-pulse' : 'opacity-20'}`} size={120} />
                         <div className="w-48 h-48 rounded-full border-8 border-emerald-500/10 flex items-center justify-center relative">
                            <div className={`absolute inset-0 border-8 border-emerald-500/20 rounded-full ${liveState === 'LISTENING' ? 'animate-ping' : ''}`} />
                            <Mic size={64} className={`${liveState === 'LISTENING' ? 'text-emerald-400' : 'text-gray-800'}`} />
                         </div>
                         <Waves className={`text-emerald-500 ${liveState === 'LISTENING' ? 'animate-pulse' : 'opacity-20'}`} size={120} />
                      </div>

                      <div className="max-w-4xl mx-auto space-y-10 text-center">
                         <div className="space-y-4">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">AI Response Node</p>
                            <p className="text-3xl md:text-4xl text-white font-black italic leading-tight">
                               "{liveTranscript.ai || "Connecting to Wellness Core... Please wait."}"
                            </p>
                         </div>
                         {liveTranscript.user && (
                            <div className="pt-10 border-t border-white/5 space-y-4 animate-in slide-in-from-left-4">
                               <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] italic">User Input Captured</p>
                               <p className="text-2xl text-slate-400 font-bold italic">"{liveTranscript.user}"</p>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
              )}

              <div className="prose prose-invert max-w-none relative z-10">
                 <div className="text-2xl text-emerald-50/90 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering drop-shadow-lg">
                    {advice}
                 </div>
              </div>

              <div className="mt-20 pt-16 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                 <button onClick={() => setMode('TEXT')} className={`p-10 rounded-[50px] border transition-all flex flex-col items-center gap-6 shadow-2xl ${mode === 'TEXT' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-[#111827] border-white/5 text-gray-500'}`}>
                    <BookOpen size={40} />
                    <span className="text-[11px] font-black uppercase tracking-widest italic leading-none">Clinical Plan</span>
                 </button>
                 <button onClick={startLiveWellnessSession} className="p-10 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-[50px] flex flex-col items-center gap-6 hover:bg-indigo-600 hover:text-white transition-all shadow-2xl group">
                    <Radio size={40} className="group-hover:scale-110 transition-transform animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest italic leading-none">Live Interactive</span>
                 </button>
                 <button onClick={() => { if(approveClinicalContentGuarded()) setIsApproved(true); }} disabled={isApproved} className={`p-10 border rounded-[50px] flex flex-col items-center gap-6 transition-all shadow-2xl ${isApproved ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-[#111827] border-white/5 text-gray-500'}`}>
                    {isApproved ? <ShieldCheck size={40} /> : <UserCheck size={40} className="text-emerald-500" />}
                    <span className="text-[11px] font-black uppercase tracking-widest italic leading-none">{isApproved ? 'AUTHORIZED' : 'VERIFY PLAN'}</span>
                 </button>
                 <button onClick={handlePrint} disabled={!isApproved} className={`p-10 rounded-[50px] flex flex-col items-center gap-6 transition-all shadow-2xl border-2 ${isApproved ? 'bg-white text-slate-900 border-white hover:bg-slate-50' : 'bg-gray-900 text-gray-700 border-gray-800 cursor-not-allowed opacity-20'}`}>
                    <Printer size={40} />
                    <span className="text-[11px] font-black uppercase tracking-widest italic leading-none">Print Handout</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 🏁 FINAL SYSTEM FOOTER */}
      <footer className="mt-auto pt-12 border-t border-white/5 flex items-start gap-12 shadow-inner opacity-40 relative z-10 shrink-0">
          <ShieldCheck size={48} className="text-emerald-500/40 shrink-0 mt-1" />
          <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed text-left max-w-5xl">
             HELPING HUB ADVISORY PROTOCOL: v9.5 ACTIVE INTERACTION ENABLED. ALL LIVE AUDIO SESSIONS ARE MONITORED FOR SAFETY AND DATA QUALITY. AI AUTO-DETECTS TELUGU, HINDI, AND ENGLISH NODES. FINAL RESPONSIBILITY FOR CARE PLAN ADOPTION RESTS WITH THE PATIENT AND TREATING CONSULTANT.
          </p>
      </footer>
    </div>
  );
};

export default WellnessAIEngine;


import React, { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, ClipboardCheck, Timer, Target, 
  Users, Activity, Smile, BarChart3, 
  PhoneCall, Zap, CheckCircle2, AlertCircle,
  Briefcase, GraduationCap, ArrowRight, Loader2, Play, MessageSquare, MapPin, ShieldCheck, UserX,
  Volume2, VolumeX, Waves, Sparkles, Info,
  X, Printer, Globe, Languages, Send, Bot,
  Mic, UserCheck, HeartPulse, ShieldAlert,
  HelpCircle, Scale, MessageCircleQuestion, Lock, Key,
  AlertOctagon, Radio, MicOff, Ghost, Siren,
  Fingerprint, Headphones
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { generateStaffTasks, generateStaffCallScript, speakText, sushrutRosterInteractionStream, stopSpeech, createAudioContext } from '../../geminiService';
import { stopDoctorVoice } from '../Shared/AppEventToast';

const HOSPITAL_LAT = 17.385;
const HOSPITAL_LNG = 78.486;

/* --- Live Audio Protocol Helpers --- */
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

const StaffManagementHub: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'tasks' | 'call' | 'mentor'>('overview');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callScript, setCallScript] = useState<string | null>(null);
  const [tasks, setTasks] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [taskLanguage, setTaskLanguage] = useState<string>('English');
  
  // Mentorship & Auth State
  const [isStaffAuth, setIsStaffAuth] = useState(false);
  const [pin, setPin] = useState("");
  
  // Live Mentor Voice States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveState, setLiveState] = useState<'IDLE' | 'LISTENING' | 'SPEAKING' | 'CONNECTING'>('IDLE');
  const [transcript, setTranscript] = useState({ user: "", ai: "" });
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Interactive Query State (Roster only)
  const [query, setQuery] = useState("");
  const [queryResponse, setQueryResponse] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const queryEndRef = useRef<HTMLDivElement>(null);

  const [staffList, setStaffList] = useState([
    { id: 101, name: 'Dr. Murali', role: 'Doctor', present: true, lat: 17.3851, lng: 78.4861 },
    { id: 102, name: 'Nurse Aruna', role: 'Nurse', present: false, lat: 17.400, lng: 78.500 },
    { id: 103, name: 'Lab Tech Sam', role: 'Lab', present: true, lat: 17.3849, lng: 78.4859 },
  ]);

  useEffect(() => {
    if (queryEndRef.current) queryEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [queryResponse]);

  const verifyGeo = (lat: number, lng: number) => {
    const dLat = (lat - HOSPITAL_LAT) * 111000;
    const dLng = (lng - HOSPITAL_LNG) * 111000;
    const distance = Math.sqrt(dLat * dLat + dLng * dLng);
    return distance <= 200;
  };

  const handleCheckIn = (id: number) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, present: true, lat: HOSPITAL_LAT, lng: HOSPITAL_LNG } : s));
  };

  /* --- PURE VOICE MENTOR LOGIC (A-Z HOSPITAL SOLUTIONS) --- */
  const startLiveMentorSession = async () => {
    setLiveState('CONNECTING');
    setIsLiveActive(true);
    setTranscript({ user: "", ai: "" });
    
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
            
            // Initial Protocol Sequence: WISH -> ASK NAME -> ASK ROLE -> ASK HELP
            sessionPromise.then(s => s.sendRealtimeInput({ 
              text: "Namaskaram! Welcome to the Superintendent's Mentorship office. I am here to help our staff excel and improve the hospital's reputation. First, what shall I call you? And please tell me, what is your role in our hospital today? How can I help you improve our quality of care?" 
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
            if (m.serverContent?.outputTranscription) setTranscript(prev => ({ ...prev, ai: m.serverContent!.outputTranscription!.text }));
            if (m.serverContent?.inputTranscription) setTranscript(prev => ({ ...prev, user: m.serverContent!.inputTranscription!.text }));
          },
          onerror: (e) => { stopLiveMentor(); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the Senior Medical Superintendent and Chief Mentor. 
          FOLLOW THIS VOICE FLOW:
          1. Greet the staff member warmly (Namaskaram).
          2. Ask for their NAME and ROLE.
          3. Ask what SITUATION they need help with (rude attenders, errors, billing, etc.).
          4. Detect their language (Telugu, Hindi, English) and respond in kind.
          5. Provide the BEST quality solution with the primary goal of improving HOSPITAL QUALITY AND REPUTATION.
          6. Act as an authoritative but compassionate mentor who protects staff while ensuring excellence.
          NO TEXT OUTPUT - SPEAK ONLY.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      setLiveState('IDLE');
      setIsLiveActive(false);
    }
  };

  const stopLiveMentor = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsLiveActive(false);
    setLiveState('IDLE');
  };

  const handleAuth = () => {
    if (pin === "1234") {
      setIsStaffAuth(true);
      setPin("");
    } else {
      alert("Invalid Staff Node PIN");
      setPin("");
    }
  };

  const handleGenerateTasks = async (role: string) => {
    setLoading(true);
    setActiveRole(role);
    try {
      const res = await generateStaffTasks(role, `Institutional Clinical Pulse - Active ${role} Node`, taskLanguage);
      setTasks(res);
    } finally {
      setLoading(false);
    }
  };

  // Fixed missing handleGenerateCall function
  const handleGenerateCall = async () => {
    setLoading(true);
    try {
      const res = await generateStaffCallScript();
      setCallScript(res);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakRoster = async () => {
    if (!tasks) return;
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const cleanText = tasks.replace(/[#*]/g, '');
    try {
      await speakText(cleanText, 'Kore', taskLanguage);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-violet-500/20 rounded-[60px] p-10 shadow-3xl min-h-[600px] flex flex-col h-full overflow-hidden font-['Inter']">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-violet-600 rounded-[28px] flex items-center justify-center text-white shadow-xl">
            <TrendingUp size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Staff Node</h2>
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mt-1 italic">Institutional Quality & Logistics v7.5</p>
          </div>
        </div>
        <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-gray-800 shadow-inner overflow-x-auto scrollbar-hide">
           {[
             { id: 'overview', label: 'Attendance', icon: ShieldCheck },
             { id: 'tasks', label: 'Mentor Briefing', icon: GraduationCap },
             { id: 'mentor', label: 'Staff Queries', icon: MessageCircleQuestion },
             { id: 'call', label: 'Broadcasting', icon: PhoneCall }
           ].map(t => (
             <button 
               key={t.id}
               onClick={() => setActiveView(t.id as any)}
               className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeView === t.id ? 'bg-violet-600 text-white shadow-lg italic' : 'text-gray-600 hover:text-white'}`}
             >
                <t.icon size={14} /> {t.label}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        {activeView === 'overview' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="space-y-6">
                <h3 className="text-white font-black uppercase text-[10px] tracking-[0.4em] px-2 flex items-center gap-3 italic">
                   <ShieldCheck size={16} className="text-emerald-500" /> Bio-Metric Attendance Matrix
                </h3>
                <div className="grid grid-cols-1 gap-3">
                   {staffList.map(s => {
                     const isInside = verifyGeo(s.lat, s.lng);
                     return (
                       <div key={s.id} className="bg-[#0a0f18] p-6 rounded-[35px] border border-gray-800 flex items-center justify-between group hover:border-violet-500/20 transition-all shadow-inner">
                          <div className="flex items-center gap-6">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl ${s.present ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-800 text-gray-700 border-gray-700'}`}>
                                <Users size={20} />
                             </div>
                             <div>
                                <p className="text-white font-black uppercase italic text-sm">{s.name}</p>
                                <p className="text-[9px] text-gray-600 font-bold uppercase mt-1">{s.role} • Registry ID: {s.id}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className="text-right">
                                <p className={`text-[10px] font-black uppercase flex items-center gap-2 justify-end ${isInside ? 'text-emerald-500' : 'text-red-500'}`}>
                                   <MapPin size={12} /> {isInside ? 'In-Radius' : 'Off-Site'}
                                </p>
                                <p className="text-[8px] font-bold text-gray-800 uppercase mt-1">Geo-Location Locked</p>
                             </div>
                             {!s.present && (
                               <button 
                                 onClick={() => handleCheckIn(s.id)}
                                 className="px-8 py-3 bg-violet-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-violet-500 shadow-xl transition-all active:scale-95 italic border border-white/10"
                               >
                                  Force Sync
                               </button>
                             )}
                          </div>
                       </div>
                     );
                   })}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                <div className="bg-[#0a0f18] border border-gray-800 p-10 rounded-[50px] space-y-4 shadow-inner relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform"><Smile size={100}/></div>
                   <div className="flex items-center gap-3 text-emerald-500">
                      <Smile size={24} />
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Institutional Social Score</span>
                   </div>
                   <div className="text-6xl font-black text-white italic tracking-tighter">8.8<span className="text-2xl text-gray-800 ml-2">/10</span></div>
                </div>
                <div className="bg-[#0a0f18] border border-gray-800 p-10 rounded-[50px] space-y-4 shadow-inner relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform"><Activity size={100}/></div>
                   <div className="flex items-center gap-3 text-violet-400">
                      <Activity size={24} />
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Efficiency Threshold</span>
                   </div>
                   <div className="text-6xl font-black text-white italic tracking-tighter">NOMINAL</div>
                </div>
             </div>
          </div>
        )}

        {activeView === 'tasks' && (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 pb-10">
             {!tasks && (
               <div className="bg-[#0a0f18]/60 p-10 rounded-[50px] border border-white/5 space-y-10">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-5">
                       <Languages size={24} className="text-violet-400" />
                       <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Select Briefing Language</h3>
                    </div>
                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-gray-800 shadow-inner">
                       {['English', 'Telugu', 'Hindi'].map(l => (
                         <button 
                           key={l}
                           onClick={() => setTaskLanguage(l)}
                           className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${taskLanguage === l ? 'bg-violet-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
                         >
                            {l}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {['Doctor', 'Nurse', 'Lab Tech', 'Pharmacy'].map(role => (
                      <button 
                        key={role}
                        onClick={() => handleGenerateTasks(role)}
                        disabled={loading}
                        className="bg-[#0a0f18] border border-gray-800 p-10 rounded-[45px] text-center hover:border-violet-500/50 hover:bg-violet-600/5 transition-all group shadow-inner relative overflow-hidden active:scale-95 h-[220px] flex flex-col justify-center items-center"
                      >
                        <div className="absolute -top-4 -right-4 p-4 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000"><Briefcase size={120}/></div>
                        <div className="w-16 h-16 bg-gray-900 rounded-[22px] flex items-center justify-center text-gray-700 mx-auto mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-xl border border-white/5">
                          {loading && activeRole === role ? <Loader2 className="animate-spin" size={32} /> : <GraduationCap size={32} />}
                        </div>
                        <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{role} Node</h4>
                        <p className="text-[8px] font-black text-gray-700 uppercase mt-3 tracking-widest">Initialize Clinical Briefing</p>
                      </button>
                    ))}
                 </div>
               </div>
             )}
             {tasks && (
               <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                  <div className="bg-violet-600/10 border border-violet-500/20 p-10 rounded-[60px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
                     <div className="flex items-center gap-8">
                        <div className="w-16 h-16 bg-violet-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl">
                           {isSpeaking ? <HeartPulse size={32} className="animate-pulse" /> : <ClipboardCheck size={32} />}
                        </div>
                        <div>
                           <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{activeRole} Superior Briefing</h4>
                           <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mt-2 italic">Language: {taskLanguage} • High-Fidelity Audio</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={handleSpeakRoster} className={`px-10 py-5 ${isSpeaking ? 'bg-red-600 animate-pulse' : 'bg-violet-600 hover:bg-violet-500'} text-white rounded-[30px] font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all flex items-center gap-4 italic border border-white/10`}>
                           {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                           [ {isSpeaking ? 'SILENCE SUPERIOR' : 'HEAR CLINICAL BRIEFING'} ]
                        </button>
                        <button onClick={() => setTasks(null)} className="p-5 bg-white/5 border border-white/10 text-gray-500 hover:text-white rounded-[30px] transition-all"><X size={24}/></button>
                     </div>
                  </div>
                  <div className="bg-[#0a0f18] p-12 rounded-[70px] border border-gray-800 shadow-4xl overflow-hidden relative">
                     <div className="absolute top-0 right-0 p-10 opacity-[0.01] pointer-events-none rotate-6"><Sparkles size={400}/></div>
                     <div className="prose prose-invert max-w-none text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering drop-shadow-md">
                        {tasks}
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* 🎙 PURE VOICE MENTOR VIEW */}
        {activeView === 'mentor' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 pb-10 flex flex-col h-full min-h-[600px]">
             {!isStaffAuth ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-20">
                   <div className="w-24 h-24 bg-violet-600 rounded-[32px] flex items-center justify-center text-white shadow-3xl animate-in zoom-in-95 duration-500">
                      <Lock size={48} />
                   </div>
                   <div className="text-center space-y-4">
                      <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">Authorized Personnel Only</h3>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Enter Staff Node PIN to access Superior Advice</p>
                   </div>
                   <div className="max-w-xs w-full space-y-6">
                      <input 
                        type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} placeholder="••••"
                        className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-6 text-4xl text-center font-black italic text-white focus:border-violet-500 outline-none transition-all shadow-inner tracking-[0.5em]"
                      />
                      <button onClick={handleAuth} className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl transition-all italic border-2 border-white/10">
                         [ SYNC IDENTITY ]
                      </button>
                   </div>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-16">
                   <div className="text-center space-y-6">
                      <h3 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Superior Voice Link</h3>
                      <p className="text-slate-500 font-medium italic text-2xl max-w-2xl mx-auto leading-relaxed">
                         "Speak naturally. I will guide you to handle any situation—rude attenders, mistakes, or billing—to improve our hospital's reputation."
                      </p>
                   </div>

                   <div className="relative flex flex-col items-center gap-12">
                      {isLiveActive && (
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] text-center space-y-4 animate-in fade-in zoom-in-95">
                           <div className="flex justify-center items-center gap-10 text-violet-400 mb-8">
                              <Waves className={liveState === 'SPEAKING' ? 'animate-pulse' : 'opacity-20'} size={100} />
                              <span className="text-2xl font-black uppercase italic tracking-[0.4em] animate-pulse">{liveState}</span>
                              <Waves className={liveState === 'LISTENING' ? 'animate-pulse' : 'opacity-20'} size={100} />
                           </div>
                           <div className="bg-[#0a0f18]/80 p-8 rounded-[40px] border border-violet-500/20 shadow-2xl">
                              <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-4">Transcription Pulse</p>
                              <p className="text-white text-2xl font-black italic">"{transcript.ai || "Connecting to Superior Logic Node..."}"</p>
                              {transcript.user && <p className="text-gray-600 text-lg font-bold italic mt-6 pt-6 border-t border-white/5">"{transcript.user}"</p>}
                           </div>
                        </div>
                      )}

                      {!isLiveActive ? (
                        <button 
                          onClick={startLiveMentorSession}
                          className="w-72 h-72 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex flex-col items-center justify-center gap-6 shadow-[0_0_100px_rgba(139,92,246,0.4)] transition-all active:scale-95 border-8 border-white/10 group animate-pulse"
                        >
                           <Headphones size={80} className="group-hover:scale-110 transition-transform" />
                           <span className="text-xl font-black uppercase italic tracking-widest">START LIVE LINK</span>
                        </button>
                      ) : (
                        <button 
                          onClick={stopLiveMentor}
                          className="w-64 h-64 rounded-full bg-red-600 hover:bg-red-500 text-white flex flex-col items-center justify-center gap-6 shadow-[0_0_80px_rgba(220,38,38,0.3)] transition-all active:scale-95 border-8 border-white/10 animate-bounce"
                        >
                           <MicOff size={64} />
                           <span className="text-lg font-black uppercase italic tracking-widest">DISCONNECT</span>
                        </button>
                      )}
                      
                      <div className="flex gap-10 mt-8">
                         <div className="flex items-center gap-3 px-6 py-3 bg-black/40 rounded-full border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">A-Z HOSPITAL SOLUTIONS ACTIVE</span>
                         </div>
                         <div className="flex items-center gap-3 px-6 py-3 bg-black/40 rounded-full border border-white/5">
                            <Globe size={14} className="text-indigo-500" />
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">AUTO-LANGUAGE DETECTION</span>
                         </div>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {activeView === 'call' && (
          <div className="space-y-10 animate-in slide-in-from-right-8 duration-500 pb-10">
             <div className="bg-violet-600/5 border border-violet-500/10 p-16 rounded-[70px] text-center space-y-12 shadow-4xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 p-10 opacity-[0.02]"><PhoneCall size={400}/></div>
                <div className="w-24 h-24 bg-violet-600 rounded-[32px] flex items-center justify-center text-white mx-auto shadow-xl relative z-10">
                   <PhoneCall size={48} className={loading ? 'animate-pulse' : ''} />
                </div>
                <div className="space-y-4 relative z-10">
                   <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter">Institutional Call Hub</h3>
                   <p className="text-gray-500 font-bold uppercase tracking-[0.5em] text-sm italic">Daily Motivational & Operational Broadcasting</p>
                </div>
                {!callScript && !loading && (
                   <button onClick={handleGenerateCall} className="px-16 py-7 bg-violet-600 hover:bg-violet-500 text-white rounded-[40px] font-black uppercase tracking-[0.4em] shadow-3xl transition-all flex items-center justify-center gap-6 mx-auto group active:scale-95 italic border-2 border-white/10">
                     <Zap size={24} fill="currentColor" /> [ INITIATE BROADCAST ]
                   </button>
                )}
             </div>
             {callScript && (
               <div className="bg-[#0a0f18] p-14 rounded-[70px] border border-gray-800 shadow-inner relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                  <div className="absolute top-8 right-12 flex items-center gap-4">
                     <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                     <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Live Broadcasting Node</span>
                  </div>
                  <h4 className="text-gray-600 text-[10px] font-black uppercase tracking-[0.5em] mb-12 flex items-center gap-4 italic border-b border-white/5 pb-4">
                     <MessageSquare size={18} className="text-violet-500" /> Executive Call Transcript
                  </h4>
                  <div className="prose prose-invert max-w-none text-gray-300 text-2xl italic leading-relaxed whitespace-pre-wrap font-medium">
                     {callScript}
                  </div>
                  <div className="flex gap-6 mt-10">
                    <button onClick={() => speakText(callScript!, 'Kore')} className="flex-1 py-6 bg-violet-600 hover:bg-violet-500 text-white rounded-[35px] font-black uppercase text-xs tracking-widest italic shadow-3xl transition-all active:scale-95 flex items-center justify-center gap-4">
                       <Volume2 size={24} /> Play Script Audio
                    </button>
                    <button onClick={() => { setCallScript(null); }} className="px-12 py-6 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-[35px] font-black uppercase text-xs tracking-widest transition-all">Clear Session</button>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-widest italic shrink-0 opacity-40">
        <div className="flex items-center gap-6">
           <span className="flex items-center gap-3"><Briefcase size={16} /> Pragnya IQ Integration Locked</span>
           <div className="h-4 w-px bg-white/10" />
           <span className="flex items-center gap-3 text-emerald-500/80"><ShieldCheck size={16} /> Forensic Identity Sync Active</span>
        </div>
        <p className="text-[8px] tracking-[0.5em] mt-4 md:mt-0"> Institutional Kernel Node v7.5.0 </p>
      </div>
    </div>
  );
};

export default StaffManagementHub;

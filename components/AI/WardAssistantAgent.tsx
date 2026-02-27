
import { 
  X, Bot, Waves, Ear, Loader2, Network, Zap, CheckCircle,
  Play, Pause, Square, ShieldAlert, User, Activity, Sparkles, 
  Languages, Info, Phone, UserPlus, ClipboardList, Stethoscope,
  Heart, Apple, Dumbbell, Calendar, MessageSquare, Brain, FlaskConical,
  Star, Award, Trophy, Rocket, Ghost, HeartPulse, Beaker, ZapOff,
  Medal, PartyPopper, Smile, Thermometer, Home, BookOpen, Globe,
  ChevronRight, Users, Search, Database, Bed, ArrowLeft, LogOut
} from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createAudioContext } from '../../geminiService';
import { getSafeMicrophoneStream } from '../../utils/VoiceTurnController';
import { runAI, manualModeMessage } from '../Shared/AppEventToast';
import { Patient } from '../../types';

const SAMPLE_RATE_IN = 16000;
const SAMPLE_RATE_OUT = 24000;

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

interface WardAssistantAgentProps {
  onClose: () => void;
  patient?: Patient | null;
  patients?: Patient[];
}

const WardAssistantAgent: React.FC<WardAssistantAgentProps> = ({ onClose, patient, patients = [] }) => {
  const [sessionState, setSessionState] = useState<'idle' | 'listening' | 'speaking' | 'connecting' | 'error'>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [isPediatricMode, setIsPediatricMode] = useState(false);
  const [isHomeMode, setIsHomeMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Telugu' | 'Hindi'>('English');
  const [errorMessage, setErrorMessage] = useState('');
  const [transcript, setTranscript] = useState({ ai: '', user: '' });
  const [patientSearch, setPatientSearch] = useState('');
  
  // Profile State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patient || null);
  const [encounterType, setEncounterType] = useState<'IP' | 'OP'>(selectedPatient?.type === 'IP' ? 'IP' : 'OP');

  const sessionRef = useRef<any>(null);
  const isSessionActive = useRef(false);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const filteredRegistry = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.id.toLowerCase().includes(patientSearch.toLowerCase())
    );
  }, [patients, patientSearch]);

  const handlePatientSelect = (p: Patient) => {
    setSelectedPatient(p);
    setEncounterType(p.type === 'IP' ? 'IP' : 'OP');
    if (p.age < 12) setIsPediatricMode(true);
    else setIsPediatricMode(false);
  };

  const cleanupLocal = () => {
    isSessionActive.current = false;
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (audioContextInRef.current && audioContextInRef.current.state !== 'closed') {
      audioContextInRef.current.close().catch(() => {});
    }
    if (audioContextOutRef.current && audioContextOutRef.current.state !== 'closed') {
      audioContextOutRef.current.close().catch(() => {});
    }
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setSessionState('idle');
    setIsPaused(false);
  };

  const startSession = async (forcePediatric = false, forceHome = false) => {
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    const pMode = forcePediatric || isPediatricMode;
    const hMode = forceHome || isHomeMode;

    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        alert("Personalized API Key selection required.");
        await (window as any).aistudio.openSelectKey();
      }
    }

    await runAI("mitra", async () => {
      setSessionState('connecting');
      setErrorMessage('');
      setIsPaused(false);
      
      const stream = await getSafeMicrophoneStream();
      
      if (!stream) {
        setSessionState('error');
        setErrorMessage("Microphone access denied.");
        manualModeMessage("Voice Node");
        return;
      }

      audioContextInRef.current = createAudioContext({ sampleRate: SAMPLE_RATE_IN });
      audioContextOutRef.current = createAudioContext({ sampleRate: SAMPLE_RATE_OUT });

      if (!audioContextInRef.current || !audioContextOutRef.current) throw new Error("Hardware Error.");

      await audioContextInRef.current.resume();
      await audioContextOutRef.current.resume();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const langPrompt = `RESPOND EXCLUSIVELY IN ${selectedLanguage.toUpperCase()}.`;
      const patientProfileContext = `
        PATIENT PROFILE:
        - Name: ${selectedPatient.name}
        - Age: ${selectedPatient.age}
        - Problem: ${selectedPatient.chiefComplaint}
      `;

      const systemInstruction = hMode 
        ? `You are SUSRUTA HOME-MODE for ${selectedPatient.name}. ${langPrompt} ${patientProfileContext} Guide recovery.`
        : pMode 
          ? `You are the ROBOT PAL for ${selectedPatient.name}. ${langPrompt} ${patientProfileContext} Be friendly.`
          : `You are the WARD ASSISTANT. ${langPrompt} ${patientProfileContext} Be professional and empathetic.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            isSessionActive.current = true;
            setSessionState('listening');
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isPaused) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);

            sessionPromise.then(s => {
              s.sendRealtimeInput({ text: `Namaskaram! I am syncing with ${selectedPatient.name}. How can I assist?` });
            });
          },
          onmessage: async (m: LiveServerMessage) => {
            if (m.serverContent?.inputTranscription) setTranscript(prev => ({ ...prev, user: m.serverContent!.inputTranscription!.text }));
            if (m.serverContent?.outputTranscription) setTranscript(prev => ({ ...prev, ai: m.serverContent!.outputTranscription!.text }));
            
            const base64EncodedAudioString = m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64EncodedAudioString && audioContextOutRef.current) {
              setSessionState('speaking');
              try {
                const buffer = await decodeAudioData(decode(base64EncodedAudioString), audioContextOutRef.current!, SAMPLE_RATE_OUT, 1);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextOutRef.current!.currentTime);
                const s = audioContextOutRef.current!.createBufferSource();
                s.buffer = buffer; 
                s.connect(audioContextOutRef.current!.destination);
                s.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(s);
                s.onended = () => {
                  sourcesRef.current.delete(s);
                  if (sourcesRef.current.size === 0) setSessionState('listening');
                };
              } catch (e) {}
            }
          },
          onclose: () => { isSessionActive.current = false; setSessionState('idle'); },
          onerror: (e: any) => { setSessionState('error'); cleanupLocal(); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: pMode ? 'Puck' : 'Zephyr' } } }
        }
      });
      sessionRef.current = await sessionPromise;
    }, () => {
      setSessionState('error');
      cleanupLocal();
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#020408]/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-700">
      <div className={`bg-[#111827] border w-full max-w-7xl rounded-[80px] shadow-[0_0_150px_rgba(168,85,247,0.2)] flex flex-col md:flex-row overflow-hidden min-h-[820px] border-gray-800`}>
        
        {/* Sidebar */}
        <div className={`w-full md:w-80 bg-[#0a0f18] border-r border-gray-800 p-10 flex flex-col gap-8 shrink-0`}>
           <div className="flex items-center gap-5">
              <div className={`w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[32px] flex items-center justify-center text-white shadow-3xl`}>
                 <Bot size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Ward AI</h3>
                 <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mt-1 italic">Intelligent Voice Node</p>
              </div>
           </div>

           {selectedPatient && (
             <div className={`bg-[#111827] p-8 rounded-[40px] border border-indigo-500/30 shadow-inner`}>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 italic">Active Node</p>
                <h4 className="text-xl font-black text-white uppercase italic truncate">{selectedPatient.name}</h4>
                <p className="text-[10px] text-gray-600 font-bold mt-1 uppercase">{encounterType} MODE</p>
                <button onClick={() => setSelectedPatient(null)} className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:text-red-400 mt-6 block">[ Switch Patient ]</button>
             </div>
           )}

           <div className="mt-auto space-y-3">
              {/* Prominent Exit Button to come home */}
              <button 
                onClick={() => { cleanupLocal(); onClose(); }} 
                className="w-full py-8 bg-red-600/10 border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white rounded-[40px] font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4 italic group"
              >
                <LogOut size={24} className="group-hover:-translate-x-1 transition-transform" />
                EXIT VOICE HUB
              </button>
           </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 p-14 flex flex-col relative overflow-y-auto custom-scrollbar bg-[#111827]`}>
           
           {!selectedPatient ? (
             <div className="space-y-12 animate-in fade-in duration-700 h-full flex flex-col">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                   <div className="space-y-4">
                      <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">Voice Registry</h2>
                      <p className="text-slate-500 font-medium italic text-2xl">Select a registered node to begin interaction.</p>
                   </div>
                   <div className="relative w-full md:w-96 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      <input 
                        type="text" 
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                        placeholder="Filter registered patients..." 
                        className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl pl-12 pr-6 py-4 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                      />
                   </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-4">
                   {filteredRegistry.map(p => (
                     <button 
                        key={p.id}
                        onClick={() => handlePatientSelect(p)}
                        className={`p-8 bg-[#0a0f18] border rounded-[45px] transition-all text-left flex flex-col justify-between h-[240px] group relative overflow-hidden ${p.type === 'IP' ? 'hover:border-indigo-500/40' : 'hover:border-cyan-500/40'} shadow-2xl active:scale-95`}
                     >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">{p.type === 'IP' ? <Bed size={120}/> : <User size={120}/>}</div>
                        <div className="space-y-4 relative z-10">
                           <div className="flex justify-between items-center">
                              <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase ${p.type === 'IP' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20'}`}>{p.type} Node</div>
                              <p className="text-[10px] font-mono text-gray-700">{p.id}</p>
                           </div>
                           <h4 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none group-hover:text-white transition-colors">{p.name}</h4>
                           <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic truncate">"Problem: {p.chiefComplaint}"</p>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                           <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-300">Ready to Sync</span>
                           <ChevronRight size={20} className="text-gray-800 group-hover:translate-x-1 group-hover:text-white transition-all" />
                        </div>
                     </button>
                   ))}
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-[#0a0f18] rounded-[24px] flex items-center justify-center text-gray-500 border border-gray-800"><Waves size={28} /></div>
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Interactive Voice Core</h2>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {sessionState === 'idle' ? (
                            <button onClick={() => startSession()} className="px-10 py-5 rounded-[30px] bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 shadow-3xl">
                               <Zap size={18} fill="currentColor" /> Activate Relay
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 bg-black/40 p-2 rounded-[30px] border border-gray-800 shadow-2xl">
                               <button 
                                 onClick={() => setIsPaused(!isPaused)} 
                                 className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${isPaused ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}
                               >
                                  {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                                  {isPaused ? 'Resume' : 'Pause'}
                               </button>
                               <button onClick={cleanupLocal} className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
                                  <Square size={14} fill="currentColor" /> Stop
                               </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`bg-[#0a0f18] border rounded-[70px] p-20 flex flex-col justify-center relative min-h-[480px] shadow-inner mb-12 transition-all border-gray-800`}>
                    {sessionState === 'connecting' ? (
                        <div className="flex flex-col items-center gap-12 animate-in zoom-in-95">
                        <Loader2 className="animate-spin text-purple-500" size={100} />
                        <p className="text-[14px] font-black uppercase tracking-[0.8em] animate-pulse">Syncing Neural Link...</p>
                        </div>
                    ) : sessionState === 'idle' ? (
                        <div className="text-center space-y-16">
                        <div className="space-y-4">
                            <h3 className="font-black text-6xl uppercase italic leading-tight tracking-tighter text-white">Voice Care <br/> Standby</h3>
                            <p className="text-gray-500 text-[14px] font-black uppercase tracking-[0.6em] flex items-center justify-center gap-4">
                                <Ear size={24} className="text-purple-500 animate-pulse" /> Awaiting Command
                            </p>
                        </div>

                        <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
                            <div className="bg-[#111827] border border-gray-800 p-10 rounded-[50px] space-y-8 shadow-inner">
                                <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-center gap-3">
                                    <Globe size={18} className="text-cyan-500" /> Interaction Language
                                </h4>
                                <div className="flex justify-center gap-6">
                                    {['English', 'Telugu', 'Hindi'].map(lang => (
                                    <button 
                                        key={lang}
                                        onClick={() => setSelectedLanguage(lang as any)}
                                        className={`px-10 py-4 rounded-2xl text-sm font-black uppercase transition-all border ${selectedLanguage === lang ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-black/40 text-gray-600 border-white/5 hover:text-white'}`}
                                    >
                                        {lang}
                                    </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button onClick={() => startSession()} className="px-28 py-9 rounded-[60px] bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-lg tracking-[0.6em] shadow-3xl active:scale-95 transition-all flex items-center gap-10 mx-auto group italic">
                            <Zap size={40} fill="currentColor" /> START INTERACTION
                        </button>
                        </div>
                    ) : (
                        <div className="space-y-12 w-full animate-in slide-in-from-bottom-10 duration-700">
                        <div className="flex items-center gap-10 border-b border-white/5 pb-8 text-purple-500">
                            <Waves className={sessionState === 'speaking' && !isPaused ? 'animate-pulse' : 'opacity-20'} size={80} />
                            <span className="text-[16px] font-black uppercase tracking-[0.7em] italic animate-pulse">🟢 INTERACTION LIVE</span>
                        </div>
                        
                        <div className="space-y-16">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 text-purple-500">
                                    <Bot size={14} /> Ward AI says:
                                </p>
                                <p className="text-4xl md:text-5xl font-bold italic leading-tight tracking-tighter text-white">
                                   {transcript.ai || "Namaskaram 🙏 I am syncing with your care profile."}
                                </p>
                            </div>
                            {transcript.user && (
                                <div className="pt-12 border-t border-gray-800/40 space-y-4 animate-in fade-in slide-in-from-left-4">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic flex items-center gap-2"><User size={14} /> Input Capture:</p>
                                <p className="text-2xl md:text-3xl text-gray-500 font-medium italic leading-tight">"{transcript.user}"</p>
                                </div>
                            )}
                        </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-auto flex justify-between items-center px-10 text-[9px] font-black text-gray-700 uppercase tracking-widest italic">
                  <span className="flex items-center gap-2"><Activity size={12} className="text-emerald-500" /> Latency: 2ms</span>
                  <span>Institutional Node v6.5 • Authorized root session</span>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default WardAssistantAgent;

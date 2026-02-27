import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Bot, Waves, Ear, Loader2, Network, Zap, CheckCircle,
  Play, Pause, Square, ShieldAlert, User, Activity, Sparkles, 
  Languages, Info, Phone, UserPlus, ClipboardList
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createAudioContext } from '../../geminiService';
import { 
  MitraContext, 
  HARD_STOP_MITRA, 
  detectIntent, 
  handleGlobalCommand,
  extractFormData,
  setMitraWorkflow
} from '../../MitraVoiceController';
import { runAI, manualModeMessage } from '../Shared/AppEventToast';
import { getSafeMicrophoneStream } from '../../utils/VoiceTurnController';

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

const MitraAgent: React.FC<{ 
  onClose: () => void, 
  context: 'Reception' | 'Ward' | 'General'
}> = ({ onClose, context }) => {
  const [sessionState, setSessionState] = useState<'idle' | 'listening' | 'speaking' | 'connecting' | 'error'>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transcript, setTranscript] = useState({ ai: '', user: '' });
  const [formState, setFormState] = useState(MitraContext.currentForm);
  const [workflow, setWorkflow] = useState(MitraContext.workflow);
  
  const sessionRef = useRef<any>(null);
  const isSessionActive = useRef(false);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const handleHardStop = () => cleanupLocal();
    const handlePause = () => setIsPaused(true);
    const handleResume = () => setIsPaused(false);
    const handleStartRequest = () => { if (sessionState === 'idle') startSession(); };
    const handleFormUpdate = (e: any) => setFormState({ ...e.detail });
    const handleWorkflowUpdate = (e: any) => setWorkflow(e.detail);

    window.addEventListener('mitra-hard-stop', handleHardStop);
    window.addEventListener('mitra-pause', handlePause);
    window.addEventListener('mitra-resume', handleResume);
    window.addEventListener('mitra-request-start', handleStartRequest);
    window.addEventListener('mitra-form-update', handleFormUpdate);
    window.addEventListener('mitra-workflow-change', handleWorkflowUpdate);

    return () => {
      window.removeEventListener('mitra-hard-stop', handleHardStop);
      window.removeEventListener('mitra-pause', handlePause);
      window.removeEventListener('mitra-resume', handleResume);
      window.removeEventListener('mitra-request-start', handleStartRequest);
      window.removeEventListener('mitra-form-update', handleFormUpdate);
      window.removeEventListener('mitra-workflow-change', handleWorkflowUpdate);
    };
  }, [sessionState]);

  useEffect(() => {
    if (sessionRef.current && workflow !== 'NONE' && sessionState === 'listening') {
      setTimeout(() => {
        if (sessionRef.current && isSessionActive.current) {
          sessionRef.current.sendRealtimeInput({ 
            text: `The user is now focusing on the ${workflow.toLowerCase()} field. Please politely ask the patient or staff to provide this specific information in Telugu and English.` 
          });
        }
      }, 300);
    }
  }, [workflow, sessionState]);

  useEffect(() => {
    const isSpeaking = sessionState === 'speaking';
    const isActive = sessionState !== 'idle' && sessionState !== 'error' && sessionState !== 'connecting';
    MitraContext.isSpeaking = isSpeaking;
    MitraContext.isActive = isActive;
    window.dispatchEvent(new CustomEvent('mitra-state-change', { detail: { isActive, isSpeaking } }));
  }, [sessionState]);

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

  useEffect(() => {
    return () => cleanupLocal();
  }, []);

  const startSession = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        alert("Institutional Policy: Personalized API Key selection is required for Live Voice Interactions.");
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
        setErrorMessage("Microphone device not found or access denied. Manual entry required.");
        manualModeMessage("Reception/Voice");
        return;
      }

      audioContextInRef.current = createAudioContext({ sampleRate: SAMPLE_RATE_IN });
      audioContextOutRef.current = createAudioContext({ sampleRate: SAMPLE_RATE_OUT });

      if (!audioContextInRef.current || !audioContextOutRef.current) throw new Error("Hardware Synchronization Failure.");

      await audioContextInRef.current.resume();
      await audioContextOutRef.current.resume();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            isSessionActive.current = true;
            setSessionState('listening');
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);

            sessionPromise.then(s => {
              if (s && s.sendRealtimeInput) {
                const greeting = MitraContext.workflow !== 'NONE' 
                  ? `Namaskaram! నమస్కారం! I am MITRA. Let's work together to complete this registration. It only takes a moment! Please provide the patient's ${MitraContext.workflow.toLowerCase()}.` 
                  : "Namaskaram! నమస్కారం! I am MITRA. I am here to help ensure our patients receive the best care. How can I assist you in this session?";
                s.sendRealtimeInput({ text: greeting });
              }
            });
          },
          onmessage: async (m: LiveServerMessage) => {
            if (m.serverContent?.inputTranscription) {
              const text = m.serverContent.inputTranscription.text;
              setTranscript(prev => ({ ...prev, user: text }));
              if (handleGlobalCommand(text)) return;
              extractFormData(text);
              MitraContext.currentForm.intent = detectIntent(text);
            }

            if (m.serverContent?.outputTranscription) {
              setTranscript(prev => ({ ...prev, ai: m.serverContent!.outputTranscription!.text }));
            }
            
            const base64EncodedAudioString = m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64EncodedAudioString && audioContextOutRef.current) {
              setSessionState('speaking');
              try {
                const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), audioContextOutRef.current!, SAMPLE_RATE_OUT, 1);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextOutRef.current!.currentTime);
                const s = audioContextOutRef.current!.createBufferSource();
                s.buffer = audioBuffer; 
                s.connect(audioContextOutRef.current!.destination);
                s.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(s);
                s.onended = () => {
                  sourcesRef.current.delete(s);
                  if (sourcesRef.current.size === 0) setSessionState('listening');
                };
              } catch (e) {}
            }
          },
          onclose: () => { 
            isSessionActive.current = false; 
            setSessionState('idle'); 
          },
          onerror: (e: any) => {
            console.error("Socket Error:", e);
            if (e.message?.includes("Requested entity was not found")) {
              if (typeof window !== 'undefined' && (window as any).aistudio) {
                (window as any).aistudio.openSelectKey();
              }
            }
            isSessionActive.current = false;
            setSessionState('error');
            setErrorMessage("Voice relay socket interrupted. Node link reset.");
            cleanupLocal();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `
            You are MITRA AI. Institutional Clinical Assistant at PM Brothers Hospital.
            CURRENT NODE: ${context.toUpperCase()}.

            BILINGUAL PROTOCOL:
            You must greet and interact using both Telugu and English.
            Use "Namaskaram" or "నమస్కారం" frequently.

            MOTIVATIONAL TONE:
            Be encouraging and supportive. Use phrases like "We are here for you," "This will help provide excellent care," "Almost done," and "Great job."
            Remind users that accuracy helps the clinical team.

            REGISTRATION WORKFLOW:
            If in REGISTRATION workflow, guide the user through these fields:
            1. FULL NAME
            2. AGE
            3. GENDER
            4. MOBILE NUMBER
            5. CHIEF COMPLAINT

            The current active workflow field is: ${workflow}.
            
            TONE: Welcoming, motivational, efficient.
            CONSTRAINTS: Max 2 sentences per response. 
          `,
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });
      sessionRef.current = await sessionPromise;
    }, () => {
      setSessionState('error');
      setErrorMessage("Voice assistance temporarily unavailable.");
      manualModeMessage("Reception/Voice");
      cleanupLocal();
    });
  };

  const handleManualStop = () => HARD_STOP_MITRA();
  const handleManualPause = () => {
    setIsPaused(true);
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
  };
  const handleManualResume = () => setIsPaused(false);

  return (
    <div className="fixed inset-0 z-[2147483647] bg-[#0a0f18]/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-700">
      <div className="bg-[#111827] border w-full max-w-6xl rounded-[80px] shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden min-h-[780px] border-gray-800">
        
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-[#0a0f18] border-r border-gray-800 p-10 flex flex-col gap-8 shrink-0">
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-indigo-700 rounded-[32px] flex items-center justify-center text-white shadow-3xl">
                 <Bot size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mitra AI</h3>
                 <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mt-1 italic">{context} Node Active</p>
              </div>
           </div>
           
           <div className={`bg-[#111827] p-8 rounded-[40px] border ${sessionState === 'error' ? 'border-red-500/30' : 'border-gray-800'} shadow-inner`}>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                 <CheckCircle size={12} className={sessionState === 'error' ? 'text-red-500' : 'text-emerald-400'} /> Sync State
              </p>
              <span className="text-3xl font-black text-white italic uppercase">
                {isPaused ? 'Paused' : sessionState === 'idle' ? 'Ready' : sessionState}
              </span>
           </div>

           <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Voice Ledger</p>
              <div className="bg-[#111827]/50 p-6 rounded-[32px] border border-gray-800 space-y-5">
                 <div className="flex items-center gap-4">
                    <User size={14} className={formState.name ? 'text-cyan-500' : 'text-gray-700'} />
                    <div>
                       <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none">Name</p>
                       <p className={`text-sm font-black italic uppercase truncate w-32 ${formState.name ? 'text-white' : 'text-gray-800'}`}>{formState.name || '---'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <Phone size={14} className={formState.mobile ? 'text-emerald-500' : 'text-gray-700'} />
                    <div>
                       <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none">Phone</p>
                       <p className={`text-sm font-black italic uppercase ${formState.mobile ? 'text-white' : 'text-gray-800'}`}>{formState.mobile || '---'}</p>
                    </div>
                 </div>
                 {workflow !== 'NONE' && (
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">Workflow Step</p>
                        <p className="text-xs font-black text-white uppercase italic">{workflow}</p>
                    </div>
                 )}
              </div>
           </div>

           <div className="mt-auto">
              <button 
                onClick={() => { cleanupLocal(); onClose(); }} 
                className="w-full flex items-center justify-center gap-4 py-6 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-[32px] font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
              >
                <X size={18} /> Close Node
              </button>
           </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-14 flex flex-col bg-[#111827] relative overflow-y-auto custom-scrollbar">
           <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-[#0a0f18] rounded-[24px] flex items-center justify-center text-gray-500 border border-gray-800"><Network size={28}/></div>
                 <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Voice Hub</h2>
              </div>
              
              <div className="flex items-center gap-3 bg-black/40 p-2 rounded-[30px] border border-gray-800 shadow-2xl">
                {sessionState === 'idle' ? (
                  <button onClick={startSession} className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
                    <Zap size={14} fill="currentColor" /> Open Relay
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button onClick={handleManualResume} className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
                        <Play size={14} fill="currentColor" /> Resume
                      </button>
                    ) : (
                      <button onClick={handleManualPause} className="px-6 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
                        <Pause size={14} fill="currentColor" /> Pause
                      </button>
                    )}
                    <button onClick={handleManualStop} className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
                      <Square size={14} fill="currentColor" /> Stop
                    </button>
                  </>
                )}
              </div>
           </div>

           <div className={`bg-[#0a0f18] border ${sessionState === 'error' ? 'border-red-500/20' : 'border-gray-800'} rounded-[70px] p-20 flex flex-col justify-center relative min-h-[440px] shadow-inner mb-12`}>
              {sessionState === 'connecting' ? (
                <div className="flex flex-col items-center gap-12 animate-in zoom-in-95">
                   <Loader2 className="animate-spin text-cyan-500" size={100} />
                   <p className="text-[14px] font-black text-gray-600 uppercase tracking-[0.8em] animate-pulse">Syncing Socket...</p>
                </div>
              ) : sessionState === 'error' ? (
                <div className="text-center space-y-8 animate-in zoom-in-95">
                    <ShieldAlert size={48} className="text-red-500 mx-auto" />
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Transmission Failed</h3>
                    <p className="text-gray-500 italic max-w-sm mx-auto leading-relaxed">{errorMessage}</p>
                    <button onClick={startSession} className="bg-red-600 hover:bg-red-500 text-white px-12 py-4 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl transition-all italic">Retry Handshake</button>
                </div>
              ) : sessionState === 'idle' ? (
                <div className="text-center space-y-16">
                   <div className="space-y-4">
                      <h3 className="text-white font-black text-6xl uppercase italic leading-tight tracking-tighter">Ready to <br/> Assist</h3>
                      <p className="text-gray-500 text-[14px] font-black uppercase tracking-[0.6em] flex items-center justify-center gap-4">
                         <Ear size={24} className="text-cyan-500 animate-pulse" /> Awaiting Initiation
                      </p>
                   </div>
                   <button onClick={startSession} className="bg-cyan-600 hover:bg-cyan-500 text-white px-28 py-9 rounded-[50px] font-black uppercase text-lg tracking-[0.6em] shadow-[0_30px_80px_rgba(6,182,212,0.3)] active:scale-95 transition-all flex items-center gap-10 mx-auto group italic">
                     <Zap size={40} className="group-hover:rotate-12 transition-transform" /> OPEN RELAY
                   </button>
                </div>
              ) : (
                <div className="space-y-12 w-full animate-in slide-in-from-bottom-10 duration-700">
                   <div className="flex items-center gap-10 text-cyan-500 border-b border-white/5 pb-8">
                      <Waves className={sessionState === 'speaking' && !isPaused ? 'animate-pulse' : 'opacity-20'} size={80} />
                      <span className={`text-[16px] font-black uppercase tracking-[0.7em] italic ${isPaused ? 'text-amber-500' : 'animate-pulse text-cyan-500'}`}>
                        {isPaused ? '🔴 RELAY PAUSED' : '🟢 LIVE RELAY'}
                      </span>
                   </div>
                   <div className="space-y-16">
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic flex items-center gap-2"><Bot size={14} /> Mitra AI says:</p>
                         <p className="text-4xl md:text-5xl font-bold italic leading-tight text-white tracking-tighter">
                           {transcript.ai || (workflow !== 'NONE' ? `Please tell me the patient's ${workflow.toLowerCase()}.` : "Namaskaram 🙏 I am syncing with the current node.")}
                         </p>
                      </div>
                      {transcript.user && (
                        <div className="pt-12 border-t border-gray-800/40 space-y-4 animate-in fade-in slide-in-from-left-4">
                           <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic flex items-center gap-2"><User size={14} /> You said:</p>
                           <p className="text-2xl md:text-3xl text-gray-500 font-medium italic leading-tight">"{transcript.user}"</p>
                        </div>
                      )}
                   </div>
                </div>
              )}
           </div>

           <div className="flex items-center justify-between px-10 text-[9px] font-black text-gray-700 uppercase tracking-widest italic">
              <span className="flex items-center gap-2"><Activity size={12} className="text-emerald-500" /> Latency: Minimal</span>
              <span className="flex items-center gap-2"><Sparkles size={12} className="text-cyan-500" /> Bilingual Engine v6.3</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MitraAgent;
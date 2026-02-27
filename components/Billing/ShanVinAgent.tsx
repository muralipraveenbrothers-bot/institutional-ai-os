import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Mic, MicOff, Sparkles, Waves, Gamepad2, BookOpen, Music, Star, Heart, 
  Loader2, Smile, Lock, Settings, Save, ShieldCheck, Clock, 
  Baby, GraduationCap, ChevronRight, UserCircle, History as HistoryIcon,
  Volume2, VolumeX, Radio, CheckCircle2, AlertCircle, Key, Headphones
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createAudioContext } from '../../geminiService';

// --- Heyansh API Contract v1.1 Constants ---
const SAMPLE_RATE_IN = 16000;
const SAMPLE_RATE_OUT = 24000;
const STORAGE_KEY = 'heyansh_v16_final_contract';
const DEFAULT_PIN = '1234';

// --- Interfaces ---

interface StoryRecord {
  id: string; 
  title: string;
  category: string;
  date: number;
}

interface ChildProfile {
  child_id: string;
  child_name: string;
  age_group: '4-6' | '7-9' | '10-12';
  preferred_language: 'telugu' | 'hindi' | 'english' | 'mixed';
  history: StoryRecord[];
  favorites: string[];
  settings: {
    daily_limit_minutes: number;
    bedtime_mode: boolean;
    allowed_story_types: string[];
  };
}

// --- Audio Helper Functions ---
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

const STORY_TYPES = ['Adventure', 'Science', 'Animal Fables', 'Mythology', 'Space', 'Bedtime Stories'];

const HeyanshAgent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // --- Profile State ---
  const [profile, setProfile] = useState<ChildProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      child_id: 'kid_1',
      child_name: 'Explorer',
      age_group: '7-9',
      preferred_language: 'english',
      history: [],
      favorites: [],
      settings: {
        daily_limit_minutes: 30,
        bedtime_mode: false,
        allowed_story_types: STORY_TYPES
      }
    };
  });

  // --- UI States ---
  const [sessionState, setSessionState] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
  const [transcript, setTranscript] = useState({ ai: '', user: '' });
  const [showParentPortal, setShowParentPortal] = useState(false);
  const [parentPin, setParentPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);

  // --- Audio Refs ---
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const handleParentAuth = () => {
    if (parentPin === DEFAULT_PIN) {
      setIsPinVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setParentPin('');
    }
  };

  const handleSaveSettings = (newSettings: Partial<ChildProfile['settings']>) => {
    setProfile(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const cleanup = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
    }
    if (audioContextInRef.current && audioContextInRef.current.state !== 'closed') {
      audioContextInRef.current.close().catch(() => {});
    }
    if (audioContextOutRef.current && audioContextOutRef.current.state !== 'closed') {
      audioContextOutRef.current.close().catch(() => {});
    }
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    setSessionState('idle');
  };

  const startInteraction = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        alert("Personalized API Key selection is mandatory for Heyansh's Realm.");
        await (window as any).aistudio.openSelectKey();
      }
    }

    setSessionState('connecting');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: SAMPLE_RATE_IN,
          channelCount: 1
        } 
      });

      audioContextInRef.current = createAudioContext({ sampleRate: SAMPLE_RATE_IN });
      audioContextOutRef.current = createAudioContext({ sampleRate: SAMPLE_RATE_OUT });

      if (!audioContextInRef.current || !audioContextOutRef.current) {
        throw new Error("Audio Context Failed");
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setSessionState('listening');
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (m: LiveServerMessage) => {
            if (m.serverContent?.outputTranscription) setTranscript(prev => ({ ...prev, ai: m.serverContent!.outputTranscription!.text }));
            if (m.serverContent?.inputTranscription) setTranscript(prev => ({ ...prev, user: m.serverContent!.inputTranscription!.text }));
            
            const base64EncodedAudioString = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && audioContextOutRef.current) {
              setSessionState('speaking');
              const buffer = await decodeAudioData(decode(base64EncodedAudioString), audioContextOutRef.current, SAMPLE_RATE_OUT, 1);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextOutRef.current.currentTime);
              const src = audioContextOutRef.current.createBufferSource();
              src.buffer = buffer;
              src.connect(audioContextOutRef.current.destination);
              src.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(src);
              src.onended = () => {
                sourcesRef.current.delete(src);
                if (sourcesRef.current.size === 0) setSessionState('listening');
              };
            }
          },
          onclose: () => {
            setSessionState('idle');
          },
          onerror: (e: any) => {
            console.error("Heyansh Socket Error:", e);
            if (e.message?.includes("Requested entity was not found")) {
              if (typeof window !== 'undefined' && (window as any).aistudio) {
                (window as any).aistudio.openSelectKey();
              }
            }
            setSessionState('error');
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are Heyansh, a magical AI friend for kids. Use child-friendly, expressive language. 
          Profile: Age ${profile.age_group}, Allowed Types: ${profile.settings.allowed_story_types.join(', ')}. 
          Mode: ${profile.settings.bedtime_mode ? 'Calm/Sleepy' : 'Exciting/Active'}.

          STRICT AUDIO PROCESSING & SPEAKER FOCUS:
          1. NEAR-FIELD FOCUS: You must exclusively listen to the primary user speaking directly and closely to the microphone. 
          2. IGNORE BACKGROUND: Actively ignore and filter out background conversations, distant voices, outdoor noise, or traffic sounds. If you hear a faint voice that is not the main user, do not respond to it.
          3. TELUGU PHONETIC SENSITIVITY: You are highly accurate in Telugu child phonetics. Be very careful not to confuse similar-sounding words. 
             - Example: If a child says 'Siggupadutundi' (సిగ్గుపడుతుంది), do not mistake it for 'Singapore'. Use the context of shyness and child emotions to correctly identify the word.
          4. RESPONSE STYLE: Keep responses warm, patient, and magical. Use simple words and a clear, steady pace.`,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      setSessionState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-orange-500/95 backdrop-blur-3xl flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[60px] shadow-3xl flex flex-col relative overflow-hidden">
        
        {/* Playful Header */}
        <div className="p-8 md:p-12 border-b border-orange-100 flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-orange-500 rounded-[24px] flex items-center justify-center text-white shadow-xl rotate-3">
              <Gamepad2 size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-orange-600 uppercase italic tracking-tighter">Heyansh's Realm</h2>
              <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest mt-1">Version 16.0 • Near-Field Audio Focus</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowParentPortal(true)}
              className="p-4 bg-orange-50 text-orange-500 rounded-2xl hover:bg-orange-100 transition-all flex items-center gap-2 group"
            >
              <Lock size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Parent Portal</span>
            </button>
            <button onClick={() => { cleanup(); onClose(); }} className="p-4 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Main Interaction Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {sessionState === 'idle' || sessionState === 'error' ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-12">
              <div className="relative">
                <div className="w-48 h-48 bg-orange-50 rounded-full flex items-center justify-center">
                  <Smile size={80} className="text-orange-500" />
                </div>
                <div className="absolute -top-4 -right-4 bg-yellow-400 p-4 rounded-full shadow-lg animate-bounce">
                  <Star className="text-white fill-white" size={24} />
                </div>
              </div>
              <div className="max-w-md space-y-6">
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">
                  {sessionState === 'error' ? "Oops! The portal closed." : `Ready for a story, ${profile.child_name}?`}
                </h3>
                <p className="text-slate-400 font-medium italic text-sm">
                  {sessionState === 'error' ? "Let's try re-opening the magical gateway." : "I'm listening only to you! Background noises are now filtered out."}
                </p>
              </div>
              <button 
                onClick={startInteraction}
                className="bg-orange-500 hover:bg-orange-400 text-white px-12 py-6 rounded-[40px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-4 group"
              >
                <Mic size={28} /> {sessionState === 'error' ? 'Re-Open Portal' : 'Start Talking'}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col p-12 space-y-8 animate-in slide-in-from-bottom-8">
              <div className="flex-1 bg-orange-50 rounded-[40px] p-12 flex flex-col justify-center relative overflow-hidden border border-orange-100 shadow-inner">
                <div className="absolute top-0 right-0 p-12 opacity-5"><Sparkles size={120} /></div>
                
                <div className="space-y-12">
                  <div className="flex items-center gap-6">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_orange]" />
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em]">Heyansh is {sessionState === 'speaking' ? 'telling a story' : 'listening...'}</span>
                  </div>

                  <p className="text-3xl md:text-5xl font-black text-orange-600 leading-tight italic tracking-tighter">
                    {transcript.ai || "Hello! What shall we dream about today?"}
                  </p>

                  {transcript.user && (
                    <div className="pt-12 border-t border-orange-200">
                      <p className="text-xl text-slate-500 font-bold italic">"{transcript.user}"</p>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-12 right-12 flex gap-4">
                  {['✨', '💖', '🚀', '🌈'].map(emoji => (
                    <button key={emoji} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-24 flex items-center justify-center gap-8">
                {sessionState === 'listening' && (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="w-2 bg-orange-500 rounded-full animate-[bounce_1s_infinite]" style={{ height: `${Math.random() * 40 + 20}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
                <button onClick={cleanup} className="bg-red-50 text-red-500 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all">End Journey</button>
              </div>
            </div>
          )}
        </div>

        {/* --- PARENT PORTAL MODAL --- */}
        {showParentPortal && (
          <div className="fixed inset-0 z-[400] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[60px] shadow-3xl p-12 relative overflow-hidden">
              <button 
                onClick={() => { setShowParentPortal(false); setIsPinVerified(false); setParentPin(''); setPinError(false); }}
                className="absolute top-10 right-10 text-slate-400 hover:text-red-500 transition-all"
              >
                <X size={32} />
              </button>

              {!isPinVerified ? (
                <div className="space-y-12 py-10">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-orange-500 rounded-[28px] mx-auto flex items-center justify-center text-white shadow-xl mb-6">
                      <Key size={32} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Parent Access</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Enter security PIN to modify kids' dashboard</p>
                  </div>

                  <div className="max-w-xs mx-auto space-y-6">
                    <div className="relative">
                      <input 
                        type="password"
                        maxLength={4}
                        value={parentPin}
                        onChange={(e) => { setParentPin(e.target.value); setPinError(false); }}
                        placeholder="••••"
                        className={`w-full bg-slate-50 border-2 rounded-3xl px-6 py-5 text-center text-3xl font-black tracking-[0.5em] focus:outline-none transition-all ${pinError ? 'border-red-500 text-red-500' : 'border-slate-100 focus:border-orange-500'}`}
                      />
                      {pinError && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center mt-4">Invalid Security PIN</p>}
                    </div>
                    <button 
                      onClick={handleParentAuth}
                      className="w-full py-5 bg-orange-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-400 transition-all"
                    >
                      Verify Access
                    </button>
                    <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">Default PIN: 1234</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Settings size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Parent Controls</h3>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1">Management Protocol v16.0</p>
                    </div>
                  </div>

                  <div className="space-y-8 h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                    {/* Time Limits */}
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                        <Clock size={16} className="text-indigo-500" /> Daily Usage Limits
                      </h4>
                      <div className="flex items-center justify-between">
                        <input 
                          type="range" min="15" max="120" step="15" 
                          value={profile.settings.daily_limit_minutes}
                          onChange={(e) => handleSaveSettings({ daily_limit_minutes: parseInt(e.target.value) })}
                          className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer mr-8"
                        />
                        <span className="text-2xl font-black text-slate-800 italic shrink-0">{profile.settings.daily_limit_minutes} min</span>
                      </div>
                    </div>

                    {/* Age Group */}
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                        <Baby size={16} className="text-pink-500" /> Developmental Level
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {(['4-6', '7-9', '10-12'] as const).map(group => (
                          <button 
                            key={group}
                            onClick={() => setProfile(prev => ({ ...prev, age_group: group }))}
                            className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${profile.age_group === group ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                          >
                            {group} yrs
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Story Types */}
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                        <BookOpen size={16} className="text-emerald-500" /> Locked Story Categories
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {STORY_TYPES.map(type => (
                          <button 
                            key={type}
                            onClick={() => {
                              const types = profile.settings.allowed_story_types.includes(type)
                                ? profile.settings.allowed_story_types.filter(t => t !== type)
                                : [...profile.settings.allowed_story_types, type];
                              handleSaveSettings({ allowed_story_types: types });
                            }}
                            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase text-left transition-all border ${profile.settings.allowed_story_types.includes(type) ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-600' : 'bg-white border-slate-100 text-slate-300 opacity-50'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setIsPinVerified(false); setShowParentPortal(false); }}
                    className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-4 group"
                  >
                    <Save size={20} className="group-hover:rotate-12 transition-transform" />
                    Apply Changes & Exit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeyanshAgent;
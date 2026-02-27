import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, Activity, Bot, MessageSquare, Mic, Square, Loader2, 
  AlertCircle, ShieldCheck, CheckCircle2, Clock, User, Waves, Zap
} from 'lucide-react';
import { processFollowUpResponse } from '../../geminiService';
import { voiceSpeak, voiceListen, startHolisticConversation, voiceHardReset } from '../../utils/VoiceTurnController';

const FollowUpHub: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [transcript, setTranscript] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    return () => voiceHardReset();
  }, []);

  const handleStartCall = (patient: any) => {
    voiceHardReset();
    setActiveCall(patient);
    setTranscript("");
    setAiAnalysis(null);
    
    const greeting = `Hello, this is from PM Brothers Hospital. I am checking how you are feeling today, ${patient.name}. Is your pain better, the same, or worse?`;
    
    // MASTER FLOW: Speak -> (Speak Ends) -> Listen
    setIsListening(true);
    startHolisticConversation(greeting, (userText) => {
      setTranscript(userText);
      setIsListening(false);
      handleProcessResponse(userText, patient);
    });
  };

  const handleProcessResponse = async (input: string, patientOverride?: any) => {
    const targetPatient = patientOverride || activeCall;
    if (!input.trim() || !targetPatient) return;

    setLoading(true);
    try {
      const analysis = await processFollowUpResponse(targetPatient, input);
      setAiAnalysis(analysis);
      
      if (analysis) {
        voiceSpeak(typeof analysis === 'string' ? analysis : (analysis as any).suggestedAiSpeech);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const manualListen = () => {
    setIsListening(true);
    voiceListen((userText) => {
      setTranscript(userText);
      setIsListening(false);
      handleProcessResponse(userText);
    });
  };

  const stopCall = () => {
    voiceHardReset();
    setActiveCall(null);
    setTranscript("");
    setAiAnalysis(null);
    setIsListening(false);
  };

  return (
    <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-10 shadow-3xl h-[75vh] flex flex-col md:flex-row gap-10">
      <div className="w-full md:w-80 border-r border-gray-800 pr-0 md:pr-8 flex flex-col gap-6 shrink-0">
        <div className="flex items-center gap-4 mb-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Clock size={24}/></div>
           <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Call Queue</h3>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
           {pendingFollowUps.map(p => (
             <div 
               key={p.id} 
               onClick={() => handleStartCall(p)}
               className={`p-6 rounded-[32px] border transition-all cursor-pointer group ${activeCall?.id === p.id ? 'bg-indigo-600 border-indigo-400' : 'bg-[#0a0f18] border-gray-800 hover:border-gray-700'}`}
             >
                <p className={`text-sm font-black uppercase italic leading-none ${activeCall?.id === p.id ? 'text-white' : 'text-slate-300'}`}>{p.name}</p>
                <p className="text-[9px] font-black text-gray-600 uppercase mt-2 group-hover:text-gray-400 transition-colors">{p.discharged}</p>
                <div className="mt-4 flex items-center justify-between">
                   <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Next-Day AI Check</span>
                   <PhoneCall size={12} className={activeCall?.id === p.id ? 'text-white' : 'text-gray-700'} />
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeCall ? (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4">
             <div className="flex items-center justify-between mb-10 shrink-0">
                <div className="flex items-center gap-6">
                   <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center border border-emerald-500/20 shadow-inner ${isListening ? 'bg-emerald-600/20 text-emerald-500' : 'bg-indigo-600/10 text-indigo-400'}`}>
                      <Activity size={32} className={isListening ? "animate-pulse" : ""} />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tight">{activeCall.name}</h4>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Diagnosis: {activeCall.diagnosis}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="px-5 py-2 bg-black/40 rounded-full border border-white/5 text-[9px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live AI Interaction Node
                   </div>
                   <button onClick={stopCall} className="p-3 bg-gray-800 text-gray-500 rounded-xl hover:text-red-500 transition-all shadow-xl"><Square size={16}/></button>
                </div>
             </div>

             <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                   <div className={`bg-[#0a0f18] border transition-all duration-500 rounded-[50px] p-10 flex-1 relative overflow-hidden shadow-inner flex flex-col ${isListening ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' : 'border-gray-800'}`}>
                      <div className="absolute top-6 right-8 flex gap-3 items-center">
                         <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_emerald]' : 'bg-gray-800'}`} />
                         <span className={`text-[10px] font-black uppercase tracking-widest ${isListening ? 'text-emerald-500' : 'text-gray-700'}`}>{isListening ? 'Listening' : 'Ready'}</span>
                      </div>
                      <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-8 italic">Voice Transcription Engine</h5>
                      
                      <div className="flex-1 space-y-8 flex flex-col justify-center">
                         <div className="space-y-3">
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic flex items-center gap-2">
                               <Bot size={14}/> AI STATUS
                            </p>
                            <div className="text-2xl text-slate-100 font-medium italic leading-relaxed h-20">
                               {isListening ? "👂 Capturing patient response..." : "Awaiting interaction cycle."}
                            </div>
                         </div>
                         <div className="space-y-4 pt-10 border-t border-white/5 flex-1">
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-2">
                               <User size={14}/> PATIENT TRANSCRIPT
                            </p>
                            <textarea 
                               value={transcript}
                               readOnly
                               className="w-full bg-transparent border-none outline-none text-3xl font-black text-white italic tracking-tight placeholder:opacity-5 resize-none h-full"
                               placeholder="VOICE_DATA_LOCKED"
                            />
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-4 shrink-0">
                      <button 
                        onClick={manualListen}
                        disabled={isListening}
                        className={`flex-1 py-7 ${isListening ? 'bg-emerald-950 text-emerald-500 border border-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl'} rounded-[32px] font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-4 disabled:opacity-50`}
                      >
                        {isListening ? <Waves size={24} className="animate-pulse" /> : <Mic size={24}/>}
                        [ {isListening ? 'MIC_ACTIVE' : 'RE-OPEN MIC'} ]
                      </button>
                      <button 
                        onClick={() => handleProcessResponse(transcript)}
                        disabled={loading || !transcript.trim()}
                        className="flex-[2] py-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] font-black uppercase tracking-[0.3em] italic shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-30 active:scale-95"
                      >
                        {loading ? <Loader2 className="animate-spin" size={24}/> : <Zap size={24} fill="currentColor"/>}
                        [ RUN CLINICAL ANALYTICS ]
                      </button>
                   </div>
                </div>

                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                   {aiAnalysis ? (
                     <div className="bg-white/5 border border-indigo-500/20 rounded-[40px] p-8 space-y-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Sentiment Result</span>
                           <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase italic ${aiAnalysis.status === 'WORSE' ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-emerald-600/20 text-emerald-500'}`}>
                             {aiAnalysis.status}
                           </span>
                        </div>
                        <div className="space-y-4">
                           <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">AI Response</p>
                           <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                             <p className="text-sm text-slate-300 italic font-bold leading-relaxed">"{aiAnalysis.suggestedAiSpeech}"</p>
                           </div>
                        </div>
                        {aiAnalysis.status === 'WORSE' && (
                          <div className="pt-6 border-t border-red-500/20 space-y-5">
                             <div className="flex items-center gap-3 text-red-500">
                                <AlertCircle size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Escalation Node Required</span>
                             </div>
                             <button className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[11px] font-black uppercase italic shadow-2xl transition-all active:scale-95">Notify Specialist Registry</button>
                          </div>
                        )}
                     </div>
                   ) : (
                     <div className="flex-1 border-2 border-dashed border-gray-800 rounded-[40px] flex flex-col items-center justify-center text-center p-8 opacity-20">
                        <Bot size={64} className="mb-6 text-gray-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">Awaiting Response Synthesis</p>
                     </div>
                   )}
                   
                   <div className="bg-[#0a0f18] border border-gray-800 p-8 rounded-[40px] space-y-5 shadow-inner">
                      <div className="flex items-center gap-3">
                         <ShieldCheck size={18} className="text-emerald-500" />
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sync Protocol Status</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-[8px] font-black uppercase text-gray-700">
                           <span>Cycle Sync</span>
                           <span className={activeCall ? "text-emerald-500" : ""}>{activeCall ? "COMPLETE" : "PENDING"}</span>
                        </div>
                        <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                           <div className={`h-full bg-indigo-500 transition-all duration-1000 ${activeCall ? 'w-full' : 'w-0'}`} />
                        </div>
                        <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest leading-relaxed">
                           Institutional OS Kernel v6.0.4 <br/> 
                           Audio-Hardware Handshake: VERIFIED
                        </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="h-full flex-1 flex flex-col items-center justify-center opacity-[0.03] grayscale select-none py-20">
             <PhoneCall size={180} className="text-gray-700" />
             <h3 className="text-6xl font-black uppercase tracking-[0.6em] italic text-center mt-12">Call Node Standby</h3>
          </div>
        )}
      </div>
    </div>
  );
};

const pendingFollowUps = [
  { id: '1', name: 'Rajesh Sharma', phone: '9848012345', diagnosis: 'Laparoscopic Hernia Repair', discharged: '22 Hours ago' },
  { id: '2', name: 'Anitha Reddy', phone: '9000192837', diagnosis: 'Acute Bronchitis', discharged: '25 Hours ago' },
  { id: '3', name: 'Srinivas G', phone: '8877665544', diagnosis: 'Post-Op Knee Rehab', discharged: '24 Hours ago' },
  { id: '4', name: 'Priya Das', phone: '9122334455', diagnosis: 'Gastroscopy Post-Care', discharged: '20 Hours ago' },
];

export default FollowUpHub;

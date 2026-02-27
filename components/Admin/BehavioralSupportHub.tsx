import React, { useState, useRef, useEffect } from 'react';
import { 
  HeartHandshake, Brain, Baby, Sparkles, Send, Mic, 
  ShieldAlert, Loader2, Printer, CheckCircle2, AlertCircle,
  MessageCircle, X, Volume2, User, Bot, History, Save,
  Calendar, Zap, TrendingUp, Info, PhoneCall, ShieldCheck,
  ChevronDown, Target, FileText, ClipboardCheck, ShieldX, 
  AlertOctagon, ArrowUpRight, Stethoscope, AlertTriangle, FileUp
} from 'lucide-react';
import { samanvayaBehavioralStream, speakText } from '../../geminiService';
import { generatePatientPDF } from '../../utils/PatientPDFEngine';
import { approveClinicalContentGuarded } from '../Shared/AppEventToast';
import { logEvent } from '../../utils/MonitorCore';

const ADULT_START = "I'm here to support you. We can talk at your pace. How has your mood been today — good, okay, or difficult? What happened just before you started feeling this way?";
const HABIT_START = "Habits are learned patterns. They can be changed without blame. When does the urge usually come — time, place, or emotion? What do you usually do right after the urge?";
const CHILD_3_5_START = "Many children at this age struggle with emotions. This is common. When does the crying usually start? What happens just before it? How do adults usually respond?";
const CHILD_6_8_START = "Children need guidance, not control. How many hours is the child using the phone? And what happens when the phone is taken away?";
const MOTIVATION_START = "Progress is built from small steps. What is one small goal you would like to work on today?";

const BehavioralSupportHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Adult' | 'Child' | 'Habits' | 'Motivation'>('Adult');
  const [childAge, setChildAge] = useState<'3-5' | '6-8'>('3-5');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [safetyTriggered, setSafetyTriggered] = useState(false);
  const [escalationSummary, setEscalationSummary] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation on tab change
  useEffect(() => {
    let startMsg = ADULT_START;
    if (activeTab === 'Habits') startMsg = HABIT_START;
    if (activeTab === 'Motivation') startMsg = MOTIVATION_START;
    if (activeTab === 'Child') {
      startMsg = childAge === '3-5' ? CHILD_3_5_START : CHILD_6_8_START;
    }
    setChatHistory([{ role: 'ai', text: startMsg }]);
    setIsApproved(false);
    setSafetyTriggered(false);
    setEscalationSummary(null);
    setSessionSummary(null);
  }, [activeTab, childAge]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || safetyTriggered) return;
    
    const userMsg = input;
    setInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    setIsApproved(false);

    // Detect high-risk words for safety trigger
    const riskWords = ["suicide", "harm", "kill", "die", "end it", "abuse", "beating", "hurt myself", "violence", "hit"];
    if (riskWords.some(w => userMsg.toLowerCase().includes(w))) {
      setSafetyTriggered(true);
      logEvent("BEHAVIORAL_SAFETY_ALERT", `High-risk language detected: ${userMsg}`, "CRITICAL");
      
      const aiResponse = "I’m really glad you shared this. You deserve support. For your safety, I must pause this coaching session. Please speak with your doctor or a mental health professional immediately. We are here to support you.";
      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
      
      // Generate escalation summary
      const stream = samanvayaBehavioralStream(`CRITICAL SAFETY TRIGGER DETECTED. GENERATE AN ESCALATION SUMMARY for the doctor based on this message: "${userMsg}". 
      INCLUDE:
      - Who: ${activeTab === 'Child' ? `Parent of child (${childAge}y)` : activeTab}
      - Concern: Detection of high-risk behavior
      - Exact risk phrase: Found in user message
      - Recommendation: Urgent Psychiatry referral or Routine checkup
      DO NOT add diagnosis.`, userMsg);
      
      let summary = "";
      for await (const chunk of stream) { summary += chunk; }
      setEscalationSummary(summary);
      setIsLoading(false);
      return;
    }

    try {
      const historyStr = chatHistory.map(h => `${h.role}: ${h.text}`).join("\n");
      let contextPrefix = "";
      if (activeTab === 'Child') {
        contextPrefix = `PARENT COACHING (${childAge} years) - STRUCTURE: 1. Developmental Context, 2. Right Now, 3. Consistently, 4. Consult Doctor. `;
      } else if (activeTab === 'Motivation') {
        contextPrefix = `MOTIVATION HUB - STRUCTURE: 1. Behavioral Pattern, 2. Right Now, 3. Consistently, 4. Consult Doctor. `;
      } else {
        contextPrefix = `${activeTab} Support - STRUCTURE: 1. Behavioral Pattern, 2. Right Now, 3. Consistently, 4. Consult Doctor. `;
      }

      const stream = samanvayaBehavioralStream(`${contextPrefix}: ${userMsg}`, historyStr);
      
      let aiResponse = "";
      setChatHistory(prev => [...prev, { role: 'ai', text: "" }]);
      
      for await (const chunk of stream) {
        aiResponse += chunk;
        setChatHistory(prev => {
          const newHist = [...prev];
          newHist[newHist.length - 1].text = aiResponse;
          return newHist;
        });
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Institutional sync error. Please retry." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateHandout = async (type: 'Emotional Support' | 'Screen Time') => {
    setIsLoading(true);
    try {
      const historyStr = chatHistory.map(h => `${h.role}: ${h.text}`).join("\n");
      const stream = samanvayaBehavioralStream(`COMMAND: GENERATE A PRINTABLE HANDOUT.
      TYPE: ${type === 'Emotional Support' ? 'Emotional Support & Daily Coping Plan' : 'Screen Time Balance Plan for Children (6–8 Years)'}
      STRICTLY USE THE REQUESTED CONTENT STRUCTURE FROM THE SYSTEM PROMPT.`, historyStr);
      
      let aiResponse = "";
      setChatHistory(prev => [...prev, { role: 'ai', text: "" }]);
      
      for await (const chunk of stream) {
        aiResponse += chunk;
        setChatHistory(prev => {
          const newHist = [...prev];
          newHist[newHist.length - 1].text = aiResponse;
          return newHist;
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (chatHistory.length < 2 || isGeneratingSummary) return;
    setIsGeneratingSummary(true);
    
    try {
      const historyStr = chatHistory.map(h => `${h.role}: ${h.text}`).join("\n");
      const stream = samanvayaBehavioralStream(`COMMAND: GENERATE A SHORT SUMMARY of this session with:
      - Session type (Adult CBT / Addiction / Child / Parent / Motivation)
      - Key issues
      - Advice given (bullet points)
      - Any red flags
      - Recommendation (continue / escalate)
      DO NOT add diagnosis, treatment, or personal judgment.`, historyStr);
      
      let summary = "";
      for await (const chunk of stream) {
        summary += chunk;
      }
      setSessionSummary(summary);
    } catch (e) {
      alert("Failed to generate summary node.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handlePrintPlan = () => {
    if (!isApproved) {
      alert("Consultant approval required before printing take-home advice.");
      return;
    }
    const lastAi = chatHistory.filter(h => h.role === 'ai').pop()?.text;
    if (!lastAi) return;

    generatePatientPDF({
      module: "HOME_CARE",
      language: "en-US",
      hospitalName: "PM BROTHERS BEHAVIORAL UNIT",
      patientSummary: `Support Type: ${activeTab}${activeTab === 'Child' ? ` (${childAge})` : ''}\nFocus: Behavioral Strategy`,
      adviceSteps: lastAi.split('\n').filter(l => l.trim().length > 5),
      doctorApproved: true,
      doctorName: "Dr. Murali (Consultant Psych)",
      dateTime: new Date().toLocaleString()
    });
  };

  return (
    <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-10 shadow-3xl h-[80vh] flex flex-col animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[24px] flex items-center justify-center text-white shadow-xl">
            <HeartHandshake size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Samanvaya Hub</h2>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">Harmony & Behavioral Logic Node</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-gray-800 shadow-inner overflow-x-auto scrollbar-hide">
             {['Adult', 'Habits', 'Child', 'Motivation'].map(t => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t as any)}
                 disabled={safetyTriggered}
                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white disabled:opacity-30'}`}
               >
                  {t}
               </button>
             ))}
          </div>

          {activeTab === 'Child' && !safetyTriggered && (
            <div className="flex bg-indigo-950/20 p-1.5 rounded-2xl border border-indigo-500/20">
               {['3-5', '6-8'].map(age => (
                 <button 
                   key={age}
                   onClick={() => setChildAge(age as any)}
                   className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${childAge === age ? 'bg-indigo-500/40 text-white shadow-inner' : 'text-indigo-400/40 hover:text-indigo-200'}`}
                 >
                    Ages {age}
                 </button>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Safety Alert Panel (The "Big One") */}
      {safetyTriggered && (
        <div className="mb-6 bg-red-600/10 border-2 border-red-500 p-8 rounded-[40px] flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-top-4 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
           <div className="w-16 h-16 bg-red-600 rounded-[20px] flex items-center justify-center text-white shrink-0 animate-pulse">
              <ShieldX size={32} />
           </div>
           <div className="flex-1 text-center md:text-left">
              <p className="text-red-500 font-black uppercase text-xs tracking-widest mb-1">Session Terminated: High Risk Detected</p>
              <p className="text-white font-bold text-lg italic">"AI safety filters activated. User deserves human clinical support."</p>
           </div>
           <button 
             onClick={() => { setSafetyTriggered(false); setEscalationSummary(null); }} 
             className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl"
           >
              Reset Session
           </button>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-8 min-h-0">
         
         {/* Conversation Feed */}
         <div className="flex-1 bg-[#0a0f18] border border-gray-800 rounded-[40px] flex flex-col shadow-inner overflow-hidden relative">
            <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${safetyTriggered ? 'bg-red-500' : 'bg-indigo-500 animate-pulse'}`} />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{safetyTriggered ? 'Safety Lock Engaged' : 'Live Synthesis Node'}</span>
               </div>
               <button 
                onClick={() => {
                  let startMsg = ADULT_START;
                  if (activeTab === 'Habits') startMsg = HABIT_START;
                  if (activeTab === 'Motivation') startMsg = MOTIVATION_START;
                  if (activeTab === 'Child') startMsg = childAge === '3-5' ? CHILD_3_5_START : CHILD_6_8_START;
                  setChatHistory([{ role: 'ai', text: startMsg }]);
                  setSessionSummary(null);
                  setSafetyTriggered(false);
                  setEscalationSummary(null);
                }} 
                className="text-[9px] font-black text-gray-700 hover:text-white transition-all uppercase tracking-widest"
               >
                 Clear Log
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
               {chatHistory.map((h, i) => (
                 <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] p-8 rounded-[40px] flex gap-6 shadow-2xl relative overflow-hidden ${h.role === 'user' ? 'bg-indigo-600/10 border border-indigo-500/20' : 'bg-[#111827] border border-gray-800'}`}>
                       <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${h.role === 'user' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' : 'bg-gray-800 text-cyan-500 border-gray-700'}`}>
                          {h.role === 'user' ? <User size={24} /> : <HeartHandshake size={24} />}
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                             {h.role === 'user' ? (activeTab === 'Child' ? 'Parent Input' : 'Observation') : 'Samanvaya AI'}
                          </p>
                          <div className={`text-base italic leading-relaxed whitespace-pre-wrap font-medium ${h.role === 'user' ? 'text-white' : 'text-slate-300'}`}>
                             {h.text}
                          </div>
                       </div>
                       {h.role === 'ai' && <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Sparkles size={80}/></div>}
                    </div>
                 </div>
               ))}
               {isLoading && (
                 <div className="flex justify-start animate-pulse">
                    <div className="bg-[#111827] border border-gray-800 p-8 rounded-[40px] flex items-center gap-6">
                       <Loader2 size={24} className="text-indigo-500 animate-spin" />
                       <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">Synthesizing...</span>
                    </div>
                 </div>
               )}
               <div ref={chatEndRef} />
            </div>

            {/* Input Gate */}
            <div className="p-8 border-t border-white/5 bg-[#070b14]/50">
               <div className="relative group">
                  <input 
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    disabled={safetyTriggered}
                    placeholder={safetyTriggered ? "Session paused for safety review..." : "Describe behavior or situation..."}
                    className="w-full bg-[#111827] border border-gray-800 rounded-3xl pl-10 pr-20 py-6 text-xl text-white outline-none focus:border-indigo-500 transition-all italic shadow-inner disabled:opacity-20"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-indigo-500 transition-colors">
                     <MessageCircle size={18} />
                  </div>
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || safetyTriggered}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 disabled:opacity-20"
                  >
                     <Send size={24} />
                  </button>
               </div>
            </div>
         </div>

         {/* Action Sidebar */}
         <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
            
            {/* DOCTOR ALERT PANEL (VISIBLE WHEN SAFETY TRIGGERED) */}
            {safetyTriggered && escalationSummary && (
              <div className="bg-[#111827] border-2 border-red-500 p-8 rounded-[40px] space-y-8 shadow-4xl animate-in slide-in-from-right-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-[0.05]"><AlertOctagon size={100} className="text-red-500" /></div>
                 <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                    <AlertTriangle size={16} /> Doctor Alert Panel
                 </h4>
                 
                 <div className="space-y-4 relative z-10">
                    <div className="bg-red-600/10 border border-red-500/20 p-4 rounded-2xl">
                       <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-2">Escalation Summary</p>
                       <p className="text-[11px] text-slate-100 font-bold italic leading-relaxed whitespace-pre-wrap">{escalationSummary}</p>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest text-center">Protocol Response</p>
                       <div className="grid grid-cols-1 gap-2">
                          <button className="w-full py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                             <ArrowUpRight size={14}/> Refer Psychiatry
                          </button>
                          <button onClick={() => { setSafetyTriggered(false); setEscalationSummary(null); }} className="w-full py-3 bg-gray-800 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">
                             Continue Support
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            <div className="bg-[#0a0f18] border border-gray-800 p-8 rounded-[40px] space-y-8 shadow-2xl">
               <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <TrendingUp size={16} className="text-emerald-500" /> Outcome Plan
               </h4>
               
               <div className="space-y-4">
                  <div className={`p-6 rounded-[32px] border transition-all ${isApproved ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-amber-600/5 border-amber-500/10'}`}>
                     <div className="flex items-center gap-4 mb-4">
                        {isApproved ? <ShieldCheck size={24} className="text-emerald-500" /> : <AlertCircle size={24} className="text-amber-500 animate-pulse" />}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isApproved ? 'text-emerald-500' : 'text-amber-500'}`}>
                           {isApproved ? 'Authorized' : 'Audit Required'}
                        </span>
                     </div>
                     <p className="text-[11px] text-gray-500 italic leading-relaxed">Doctor must verify behavioral strategy before release.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleGenerateHandout('Emotional Support')}
                      disabled={isLoading || safetyTriggered}
                      className="py-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-[24px] font-black uppercase text-[8px] tracking-widest shadow-xl transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <FileUp size={14} /> Emotional Plan
                    </button>
                    <button 
                      onClick={() => handleGenerateHandout('Screen Time')}
                      disabled={isLoading || safetyTriggered || activeTab !== 'Child'}
                      className="py-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white disabled:opacity-20 rounded-[24px] font-black uppercase text-[8px] tracking-widest shadow-xl transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Zap size={14} /> Screen Time
                    </button>
                  </div>

                  <button 
                    onClick={() => { if(approveClinicalContentGuarded()) setIsApproved(true); }}
                    disabled={isApproved || chatHistory.length < 2 || safetyTriggered}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 border border-white/10"
                  >
                    Authorize Plan
                  </button>

                  <button 
                    onClick={handleGenerateSummary}
                    disabled={chatHistory.length < 2 || safetyTriggered || isGeneratingSummary}
                    className="w-full py-5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white disabled:opacity-20 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3"
                  >
                    {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />} 
                    Session Summary
                  </button>
                  
                  <button 
                    onClick={handlePrintPlan}
                    disabled={!isApproved}
                    className="w-full py-5 bg-[#111827] border border-gray-800 hover:border-indigo-500 text-gray-400 hover:text-white disabled:opacity-20 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-3"
                  >
                    <Printer size={16} /> Print Handout
                  </button>
               </div>
            </div>

            {sessionSummary && (
              <div className="bg-[#0a0f18] border border-indigo-500/30 p-8 rounded-[40px] space-y-6 shadow-2xl animate-in slide-in-from-right-4">
                 <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic flex items-center gap-3">
                    <FileText size={16} /> Clinical Summary
                 </h4>
                 <div className="text-[11px] text-slate-300 italic leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                    {sessionSummary}
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* Footer Status */}
      <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-gray-700 uppercase tracking-widest italic shrink-0">
        <span className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500" /> Behavioral Sync: ACTIVE</span>
        <div className="flex items-center gap-4">
           <span>Model: Gemini-3-Pro-Behavioral</span>
           <div className="h-3 w-[1px] bg-white/5" />
           <span>Latency: 92ms</span>
        </div>
      </div>
    </div>
  );
};

export default BehavioralSupportHub;

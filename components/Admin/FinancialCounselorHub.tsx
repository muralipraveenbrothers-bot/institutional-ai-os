import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Scale, Calculator, Printer, Loader2, ShieldAlert, Languages, CheckCircle2, Mic, Square,
  User, Bot, Plus, Trash2, Target, Volume2, MicOff, Send, Download, Zap, Waves,
  ShieldCheck, Info, HeartPulse, Building2, AlertTriangle, ChevronRight, ChevronDown,
  Stethoscope, Shield, Sparkles, CreditCard, ShieldPlus
} from 'lucide-react';
import { answerFinancialQuestion, explainFinanceEstimate } from '../../geminiService';
import { generatePatientPDF } from '../../utils/PatientPDFEngine';
import { voiceSpeak, voiceListen, startHolisticConversation, voiceHardReset, setVoiceLanguage } from '../../utils/VoiceTurnController';

const VALUE_MATRIX = [
  { category: 'Daily Ward', inclusion: 'Bed, Monitoring, Linen, Housekeeping', justification: 'Focus on hygiene and 24/7 vigilance.' },
  { category: 'Doctor Rounds', inclusion: 'Specialist Review & Modification', justification: 'Expertise from premier national institutes (AIIMS, PGI, Gandhi Hospital alumni).' },
  { category: 'Nursing Care', inclusion: 'IV management & continuous monitoring', justification: 'Continuous vigilance to prevent complications.' },
  { category: 'Infrastructure', inclusion: 'OT, Sterilization, Oxygen Plant', justification: 'Safety over shortcuts; no compromise on quality.' },
];

const CASE_SCENARIOS = [
  { id: 'fever', label: 'Fever Admission', rationale: 'Early treatment prevents expensive ICU stays later.' },
  { id: 'stroke', label: 'CVA (Stroke)', rationale: 'Close monitoring now reduces the risk of long-term disability/paralysis.' },
  { id: 'pancreatitis', label: 'Pancreatitis', rationale: 'Strict electrolyte and fluid management is a safety priority.' },
];

const FinancialCounselorHub: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [estimateExplanation, setEstimateExplanation] = useState<string | null>(null);
  const [lang, setLang] = useState('English');
  const [patientQuestion, setPatientQuestion] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showValueMatrix, setShowValueMatrix] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => voiceHardReset();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiAnswer, patientQuestion]);

  const [estimate, setEstimate] = useState({
    procedureName: 'Laparoscopic Appendicectomy',
    expectedStay: 3,
    items: [
      { id: '1', category: 'OT', description: 'OT Charges & Anesthesia', cost: 15000 },
      { id: '2', category: 'Doc', description: 'Surgeon & Visit Fee', cost: 8000 },
      { id: '3', category: 'Ward', description: 'Semi-Private Room (3 Days)', cost: 4500 },
      { id: '4', category: 'Pharma', description: 'Medicines & Consumables', cost: 6000 },
    ]
  });

  const totalCost = estimate.items.reduce((acc, i) => acc + i.cost, 0);

  const addItem = () => {
    setEstimate({ ...estimate, items: [...estimate.items, { id: Date.now().toString(), category: 'Other', description: 'New Item', cost: 0 }] });
  };

  const removeItem = (id: string) => {
    setEstimate({ ...estimate, items: estimate.items.filter(i => i.id !== id) });
  };

  const handleGenerateExplanation = async () => {
    setLoading(true);
    try {
      const res = await explainFinanceEstimate(estimate);
      setEstimateExplanation(res);
      setStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintHandout = () => {
    generatePatientPDF({
      module: "ESTIMATE",
      language: lang === 'Telugu' ? 'te-IN' : 'en-US',
      hospitalName: "PM BROTHERS MULTISPECIALTY HOSPITAL",
      patientSummary: `Case Ref: ${Date.now().toString().slice(-6)}\nProcedure: ${estimate.procedureName}`,
      doctorApproved: true,
      estimate: {
        procedure: estimate.procedureName,
        stay: estimate.expectedStay,
        items: estimate.items.map(i => ({ desc: i.description, cost: i.cost })),
        total: totalCost,
        tierComparison: estimateExplanation?.split('Safety Emphasis')[1]?.split('\n\n')[0] || "Optimized for institutional safety and affordability."
      },
      doctorName: "Finance Desk Node",
      dateTime: new Date().toLocaleString()
    });
  };

  const handleVoiceExplain = () => {
    const intro = lang === 'Telugu' ? "ఖర్చు వివరాలు ఇక్కడ ఉన్నాయి." : "Here is the treatment value breakdown.";
    const textToSpeak = intro + (estimateExplanation ? estimateExplanation.substring(0, 500) : "");
    setVoiceLanguage(lang === 'Telugu' ? 'te-IN' : 'en-US');
    voiceSpeak(textToSpeak);
  };

  const handleVoiceListen = () => {
    const promptText = lang === 'Telugu' 
      ? "దయచేసి మీ ప్రశ్నను అడగండి, నేను వింటున్నాను." 
      : "Please ask your financial question, I am listening.";

    setVoiceLanguage(lang === 'Telugu' ? 'te-IN' : 'en-US');
    setIsListening(true);
    
    startHolisticConversation(promptText, async (userText) => {
      setPatientQuestion(userText);
      setIsListening(false);
      setIsAnswering(true);
      try {
        const answer = await answerFinancialQuestion(userText, { ...estimate, estimateExplanation });
        setAiAnswer(answer);
        voiceSpeak(answer);
      } catch (err) {
        setAiAnswer("Institutional Sync Error. Please retry.");
      } finally {
        setIsAnswering(false);
      }
    });
  };

  const handleStopAll = () => {
    voiceHardReset();
    setIsAnswering(false);
    setIsListening(false);
  };

  return (
    <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-10 shadow-3xl min-h-[600px] flex flex-col h-[75vh]">
      <div className="flex items-center justify-between mb-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 transition-transform hover:scale-110">
            <Scale size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Financial Counselor</h2>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2 italic">Advanced Trust & Value Node v3.0</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`w-3 h-3 rounded-full transition-all duration-500 ${step >= s ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]' : 'bg-gray-800'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2" ref={scrollRef}>
        
        {/* 🟢 VALUE JUSTIFICATION MATRIX (ADD-ONLY) */}
        <div className="mb-10 animate-in slide-in-from-top-2">
          <button 
            onClick={() => setShowValueMatrix(!showValueMatrix)}
            className="w-full flex items-center justify-between p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-[30px] text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600/20 transition-all shadow-inner"
          >
            <div className="flex items-center gap-3">
               <ShieldCheck size={16} /> [ VIEW VALUE JUSTIFICATION MATRIX ]
            </div>
            {showValueMatrix ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {showValueMatrix && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 animate-in fade-in zoom-in-95 duration-500">
               {VALUE_MATRIX.map((v, i) => (
                 <div key={i} className="bg-[#0a0f18] p-6 rounded-[32px] border border-gray-800 space-y-3 group hover:border-indigo-500/30 transition-all">
                    <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{v.category}</p>
                    <div className="h-px bg-white/5 w-full" />
                    <p className="text-[8px] text-indigo-400 font-bold uppercase">{v.inclusion}</p>
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">"{v.justification}"</p>
                 </div>
               ))}
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-indigo-600/5 border border-indigo-500/10 p-10 rounded-[48px] space-y-8 shadow-inner">
              
              {/* 🟢 CASE SCENARIOS GATES (ADD-ONLY) */}
              <div className="space-y-4">
                 <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] ml-2 italic">Clinical Case Scenarios (AI Rationale)</p>
                 <div className="flex flex-wrap gap-3">
                    {CASE_SCENARIOS.map(cs => (
                      <button 
                        key={cs.id}
                        onClick={() => setEstimate({ ...estimate, procedureName: cs.label })}
                        className={`px-5 py-2.5 rounded-2xl border transition-all text-[10px] font-black uppercase italic ${estimate.procedureName === cs.label ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl' : 'bg-black/40 border-gray-800 text-gray-500 hover:text-gray-300'}`}
                      >
                         {cs.label}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1">Target Procedure</label>
                   <input type="text" value={estimate.procedureName} onChange={e => setEstimate({...estimate, procedureName: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-bold italic" />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1">Expected Stay (Days)</label>
                   <input type="number" value={estimate.expectedStay} onChange={e => setEstimate({...estimate, expectedStay: parseInt(e.target.value) || 0})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-bold" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                      <Calculator size={14} /> Itemized Yield Components
                   </h4>
                   <button onClick={addItem} className="px-4 py-1.5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"><Plus size={14}/> Add Node</button>
                </div>
                <div className="space-y-3">
                   {estimate.items.map((item, idx) => (
                     <div key={item.id} className="flex gap-4 items-center animate-in slide-in-from-left-2">
                        <input type="text" value={item.description} onChange={e => {
                          const newItems = [...estimate.items];
                          newItems[idx].description = e.target.value;
                          setEstimate({...estimate, items: newItems});
                        }} className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500/40 font-medium italic" />
                        <div className="flex items-center bg-black/40 border border-gray-800 rounded-xl px-4 group focus-within:border-emerald-500/40">
                          <span className="text-[10px] font-black text-gray-700 mr-2 uppercase">INR</span>
                          <input type="number" value={item.cost} onChange={e => {
                            const newItems = [...estimate.items];
                            newItems[idx].cost = parseInt(e.target.value) || 0;
                            setEstimate({...estimate, items: newItems});
                          }} className="w-24 py-2 text-xs text-emerald-500 font-black outline-none bg-transparent" />
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                     </div>
                   ))}
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-white/5 mt-4">
                 <Languages size={18} className="text-indigo-500" />
                 <select value={lang} onChange={e => setLang(e.target.value)} className="bg-[#0a0f18] text-[10px] font-black uppercase text-gray-400 border border-gray-800 rounded-xl px-6 py-3 outline-none focus:border-indigo-500 cursor-pointer appearance-none">
                    <option value="English">English Registry</option>
                    <option value="Telugu">Telugu Registry</option>
                 </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-indigo-600/10 p-10 rounded-[40px] border border-indigo-500/20 shadow-2xl">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Aggregate Yield Estimate</p>
                  <p className="text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">₹{totalCost.toLocaleString()}</p>
               </div>
               <button 
                 onClick={handleGenerateExplanation}
                 disabled={loading}
                 className="px-12 py-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-[40px] font-black uppercase text-xs tracking-widest transition-all flex items-center gap-4 shadow-[0_20px_50px_rgba(99,102,241,0.3)] active:scale-95 italic border-2 border-white/10"
               >
                 {loading ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                 <span>[ GENERATE ADVANCED COUNSEL ]</span>
               </button>
            </div>
          </div>
        )}

        {step === 3 && estimateExplanation && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8">
            <div className="bg-amber-600/10 border border-amber-500/20 p-10 rounded-[50px] flex flex-col md:flex-row items-center justify-between shadow-lg gap-8">
               <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-amber-600/20 rounded-[20px] flex items-center justify-center text-amber-500 shadow-inner border border-amber-500/10">
                     <ShieldAlert size={36} />
                  </div>
                  <div>
                     <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest italic leading-none mb-2">Fiduciary Review Deck</p>
                     <h4 className="text-white font-black uppercase text-lg italic leading-none">Draft: Advanced Cost Justification</h4>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="px-8 py-4 bg-gray-900 text-gray-400 rounded-2xl text-[10px] font-black uppercase hover:text-white transition-all italic tracking-widest border border-gray-800">Recalibrate</button>
                  <button onClick={() => setStep(4)} className="px-14 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-2xl hover:bg-emerald-500 transition-all italic tracking-[0.2em] border border-white/10">Authorize Release</button>
               </div>
            </div>

            <div className="bg-[#0a0f18] p-12 rounded-[60px] border border-indigo-500/20 shadow-4xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none rotate-12"><Bot size={300} /></div>
               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-8 italic border-b border-white/5 pb-4 flex items-center gap-3">
                  <Bot size={16} /> 7-STEP VALUE POSITIONING OUTPUT
               </h4>
               <div className="prose prose-invert max-w-none text-[17px] leading-relaxed whitespace-pre-wrap font-mono italic text-slate-300 custom-markdown-rendering">
                 {estimateExplanation}
               </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <div className="text-center py-6">
                <div className="w-24 h-24 bg-emerald-600/10 border border-emerald-500/20 rounded-[32px] mx-auto flex items-center justify-center text-emerald-500 mb-8 shadow-2xl animate-in zoom-in-90 duration-500">
                   <ShieldCheck size={56} />
                </div>
                <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Trust-Gate Unlocked</h3>
                <p className="text-gray-500 font-bold uppercase tracking-[0.6em] text-[11px] mt-6 italic">Institutional Disclosure Protocol Active</p>
             </div>

             <div className={`bg-[#0a0f18] p-14 rounded-[70px] border transition-all duration-500 shadow-4xl space-y-12 relative overflow-hidden ${isListening ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' : 'border-indigo-500/10'}`}>
                <div className="absolute top-0 right-0 p-12 opacity-[0.01] pointer-events-none rotate-12"><Bot size={400} /></div>
                
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5">
                       <Bot size={28} className="text-indigo-500" />
                       <h4 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.5em] italic">Human-Centric Finance Relay</h4>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-2 bg-black/40 rounded-full border border-white/5">
                        <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_emerald]' : 'bg-gray-800'}`} />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{isListening ? 'LISTENING_NODE' : 'IDLE_NODE'}</span>
                    </div>
                </div>
                
                {/* 📋 INTERACTION DECK */}
                <div className="flex flex-wrap justify-center gap-6 relative z-10">
                  <button 
                    onClick={handleVoiceExplain}
                    className="px-12 py-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[40px] font-black uppercase text-xs tracking-widest shadow-[0_20px_50px_rgba(99,102,241,0.3)] transition-all flex items-center gap-5 group active:scale-95 border border-white/10"
                  >
                    <Volume2 size={24} className="group-hover:scale-110 transition-transform" /> <span className="italic">Justify & Reassure</span>
                  </button>
                  <button 
                    onClick={handleVoiceListen}
                    disabled={isAnswering || isListening}
                    className={`px-12 py-7 ${isListening ? 'bg-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.5)]' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-[40px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center gap-5 group active:scale-95 disabled:opacity-30 border border-white/10`}
                  >
                    {isListening ? <Waves size={24} className="animate-pulse" /> : <Mic size={24} />}
                    <span className="italic">{isListening ? 'Node Capturing...' : 'Listen For Resistance'}</span>
                  </button>
                  <button 
                    onClick={handlePrintHandout}
                    className="px-12 py-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[40px] font-black uppercase text-xs tracking-widest shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all flex items-center gap-5 group active:scale-95 border border-white/10"
                  >
                    <Printer size={24} className="group-hover:rotate-6 transition-transform" /> <span className="italic">Formal Print</span>
                  </button>
                  <button 
                    onClick={handleStopAll}
                    className="px-10 py-7 bg-gray-900 hover:bg-red-600/10 text-gray-600 hover:text-red-500 border border-gray-800 rounded-[40px] font-black uppercase text-xs tracking-widest transition-all flex items-center gap-5 active:scale-95"
                  >
                    <Square size={20} fill="currentColor" /> <span className="italic">Silence Node</span>
                  </button>
                </div>

                {/* Interaction Logs */}
                {(patientQuestion || aiAnswer || isAnswering) && (
                   <div className="space-y-10 pt-12 animate-in slide-in-from-bottom-6 duration-700 relative z-10 border-t border-white/5">
                      {patientQuestion && (
                        <div className="flex justify-end">
                           <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[40px] max-w-[80%] shadow-xl group">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-3"><User size={14} className="group-hover:scale-110 transition-transform" /> Input Capture</p>
                              <p className="text-white italic font-bold text-lg">"{patientQuestion}"</p>
                           </div>
                        </div>
                      )}
                      
                      {isAnswering && (
                        <div className="flex justify-start animate-pulse">
                           <div className="bg-violet-600/5 border border-violet-500/10 p-8 rounded-[40px] flex items-center gap-6">
                              <Loader2 size={24} className="text-indigo-500 animate-spin" />
                              <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">Drafting trust-based response...</span>
                           </div>
                        </div>
                      )}

                      {aiAnswer && !isAnswering && (
                        <div className="flex justify-start">
                           <div className="bg-indigo-600/10 border border-indigo-500/20 p-10 rounded-[50px] max-w-[85%] shadow-4xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><Bot size={80} /></div>
                              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-6 flex items-center gap-3 italic"><Bot size={18}/> Adv. Counselor Reply</p>
                              <div className="text-slate-200 italic leading-relaxed text-[17px] font-medium whitespace-pre-wrap font-mono drop-shadow-md custom-markdown-rendering">
                                {aiAnswer}
                              </div>
                           </div>
                        </div>
                      )}
                   </div>
                )}
             </div>

             {/* 🛡️ COMPETITIVE STRATEGY & PAYMENT SUPPORT (ADD-ONLY) */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                {[
                  { label: "EMI & Staged", desc: "Pay in 3/6 parts", icon: CreditCard, color: "text-blue-500" },
                  { label: "Insurance Node", desc: "TPA Documentation Help", icon: ShieldPlus, color: "text-emerald-500" },
                  { label: "Safety Advantage", desc: "Safety vs Shortcuts", icon: AlertTriangle, color: "text-amber-500" },
                  { label: "Elite Credentials", desc: "AIIMS/PGI Experts", icon: Stethoscope, color: "text-indigo-500" }
                ].map((item, i) => (
                  <div key={i} className="bg-[#0a0f18] p-8 rounded-[40px] border border-gray-800 flex flex-col items-center text-center gap-4 group hover:border-indigo-500/30 transition-all shadow-inner">
                     <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center ${item.color} border border-white/5 group-hover:scale-110 transition-transform shadow-xl`}>
                        <item.icon size={24} />
                     </div>
                     <div>
                        <p className="text-sm font-black text-white uppercase italic">{item.label}</p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase mt-1">{item.desc}</p>
                     </div>
                  </div>
                ))}
             </div>

             <button 
              onClick={() => { setStep(1); setPatientQuestion(null); setAiAnswer(null); setEstimateExplanation(null); handleStopAll(); }}
              className="w-full py-8 border border-gray-800 text-gray-700 rounded-[40px] font-black uppercase tracking-[0.3em] mt-10 hover:text-white hover:border-indigo-500/40 transition-all italic active:scale-95 shadow-inner"
             >
                Initialize New Case Registry
             </button>
          </div>
        )}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-600 font-black uppercase tracking-widest italic shrink-0">
        <span className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500" /> Professional Financial Trust Node: LOCKED</span>
        <div className="flex items-center gap-4">
           <p className="text-[8px] uppercase tracking-widest text-gray-700">7-Step Architecture: Active</p>
           <div className="h-4 w-[1px] bg-white/5" />
           <span>Node: PRAGNYA-FIN-ADV-v3.0</span>
        </div>
      </div>
    </div>
  );
};

export default FinancialCounselorHub;
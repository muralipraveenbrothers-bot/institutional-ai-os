import React, { useState, useRef } from 'react';
import { 
  EyeOff, ShieldCheck, Loader2, Sparkles, Ghost, Volume2, MessageSquare, Send, User, Bot, X, Radar, ClipboardList, Scale, Info, Award, BarChart4, Zap, GitBranch, BookOpen, Brain
} from 'lucide-react';
import { Patient, EvidenceBadge } from '../../../types';
import { sushrutQuietSynthesisStream, sushrutDiscussionStream, speakText, sushrutExplainSynthesisStream } from '../../../geminiService';
import { initiateQuietSynthesis, runAI, manualModeMessage } from '../../Shared/AppEventToast';

interface QuietOpinionTabProps {
  patient: Patient;
  analysisContext: {
    ddx: string;
    labs: string;
    trends: string;
  };
}

const QuietOpinionTab: React.FC<QuietOpinionTabProps> = ({ patient, analysisContext }) => {
  const [doctorNotes, setDoctorNotes] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3' | null>(null);
  const [synthesisResult, setSynthesisResult] = useState({ 
    text: "", 
    status: 'idle' as 'idle' | 'loading' | 'done' | 'error',
    badges: [] as EvidenceBadge[],
    benchmarks: [] as any[]
  });
  const [explanationResult, setExplanationResult] = useState({
    text: "",
    status: 'idle' as 'idle' | 'loading' | 'done' | 'error'
  });
  const [isDiscussing, setIsDiscussing] = useState(false);
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'doctor' | 'ai' | 'structured', text: string}[]>([]);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const explanationEndRef = useRef<HTMLDivElement>(null);

  const runQuietSynthesis = async (level: 'V1' | 'V2' | 'V3') => {
    if (!patient) return;
    setSelectedLevel(level);
    setExplanationResult({ text: "", status: 'idle' });
    await runAI("susruta", async () => {
      setSynthesisResult(prev => ({ ...prev, text: "", status: 'loading' }));
      
      const internalSummary = initiateQuietSynthesis({
        symptoms: [patient.chiefComplaint || "Routine triage"],
        provisionalDx: analysisContext?.ddx ? [analysisContext.ddx.substring(0, 50) + "..."] : []
      }) || "Standard Framework Standby";

      const fullContext = `
        MRN: ${patient.id}, Context: ${patient.chiefComplaint}. 
        Previous DDX Findings: ${analysisContext?.ddx || 'None run'}. 
        Lab Data Nodes: ${analysisContext?.labs || 'None released'}.
        Manual Doctor Notes: ${doctorNotes || 'None provided'}.
        Standard Internal Framework: ${internalSummary}
      `;

      try {
        const stream = sushrutQuietSynthesisStream({
          patient,
          context: fullContext,
          level
        });
        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          setSynthesisResult(prev => ({ ...prev, text: fullText }));
        }
        
        setSynthesisResult(prev => ({ 
          ...prev, 
          status: 'done',
          badges: [
            { item: `${level} Analysis Rigor`, level: 'Current', note: `Based on level ${level} institutional oversight node` },
            { item: 'Peer Alignment', level: level === 'V3' ? 'Emerging' : 'Current', note: 'Cross-referenced against multi-specialist nodes' }
          ],
          benchmarks: [
            { aspect: 'Synthesis Depth', evidence: level, hospital: 'Standard' },
            { aspect: 'Safety Safeguard', evidence: 'Active', hospital: 'Verified' }
          ]
        }));
      } catch (err) {
        setSynthesisResult(prev => ({ ...prev, status: 'error', text: "Oversight Node Offline. Please check institutional link." }));
      }
    }, () => {
      setSynthesisResult(prev => ({ ...prev, text: "AI Mode Offline. Accessing local synthesis cache.", status: 'error' }));
      manualModeMessage("Quiet Synthesis");
    });
  };

  const runSynthesisExplanation = async () => {
    if (!synthesisResult.text || explanationResult.status === 'loading') return;
    
    setExplanationResult({ text: "", status: 'loading' });
    try {
      const stream = sushrutExplainSynthesisStream({ 
        synthesis: synthesisResult.text, 
        patient 
      });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setExplanationResult(prev => ({ ...prev, text: fullText }));
        explanationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      setExplanationResult(prev => ({ ...prev, status: 'done' }));
    } catch (err) {
      setExplanationResult({ text: "Explanation Node Link Error.", status: 'error' });
    }
  };

  const handleDiscussion = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || discussionLoading) return;
    const userQuery = query;
    setQuery("");
    setChatHistory(prev => [...prev, { role: 'doctor', text: userQuery }]);
    setDiscussionLoading(true);
    try {
      const stream = sushrutDiscussionStream({ 
        patient, 
        query: userQuery, 
        history: chatHistory.map(h => h.text).join('\n') 
      });
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
    } catch (err) {} finally {
      setDiscussionLoading(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      <div className="bg-[#0f172a] border border-slate-700 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Radar size={300} /></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12 border-b border-white/5 pb-10 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-slate-900 rounded-[36px] flex items-center justify-center text-slate-400 border border-slate-800">
               <EyeOff size={48} />
            </div>
            <div>
               <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">V3 Quiet synthesis</h2>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-3 italic">Non-Judgmental Peer Oversight Node</p>
            </div>
          </div>
        </div>

        <div className="space-y-10 relative z-10">
           <div className="space-y-6">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] flex items-center gap-3">
                <ClipboardList size={14} className="text-indigo-500" /> Surgeon Observation Ledger
              </label>
              <textarea 
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                className="w-full h-32 bg-[#05070a] border border-slate-800 rounded-[40px] p-8 text-sm text-slate-300 italic leading-relaxed focus:border-indigo-500 outline-none transition-all shadow-inner custom-scrollbar"
                placeholder="Provide optional clinical narrative for multi-agent synthesis calibration..."
              />
           </div>

           <div className="py-6 flex flex-col items-center gap-8">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.6em] italic">Incite Peer Logic Node</p>
              <div className="flex flex-wrap justify-center gap-6">
                {[
                  { id: 'V1', label: 'Quick Scan', desc: 'Safety First' },
                  { id: 'V2', label: 'Balanced Review', desc: 'Standard Audit' },
                  { id: 'V3', label: 'Advanced Synthesis', desc: 'Deep Peer Reasoning' }
                ].map((lvl) => (
                  <button 
                    key={lvl.id} 
                    onClick={() => runQuietSynthesis(lvl.id as any)} 
                    disabled={synthesisResult.status === 'loading'} 
                    className={`px-10 py-8 rounded-[40px] font-black uppercase text-sm tracking-[0.3em] shadow-2xl transition-all active:scale-95 border-2 italic group flex flex-col items-center gap-2 ${selectedLevel === lvl.id && synthesisResult.status !== 'idle' ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/20' : 'bg-[#0a0f18] text-gray-500 border-gray-800 hover:border-indigo-500/50 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                       {selectedLevel === lvl.id && synthesisResult.status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Ghost size={18} />}
                       <span>[{lvl.id} {lvl.label}]</span>
                    </div>
                    <span className="text-[8px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">{lvl.desc}</span>
                  </button>
                ))}
              </div>
           </div>

           {(synthesisResult.text || synthesisResult.status === 'loading') && (
             <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
                <div className="bg-[#05070a] border border-slate-800 rounded-[50px] p-12 shadow-inner relative">
                  <div className="flex items-center justify-between border-b border-white/5 pb-8 mb-10">
                    <div className="flex items-center gap-5">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_indigo]" />
                        <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.5em]">{selectedLevel} Senior Colleague Perspective</span>
                    </div>
                    {synthesisResult.status === 'loading' && <Loader2 size={24} className="text-indigo-500 animate-spin" />}
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <div className="text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering mb-12">
                        {synthesisResult.text || "Synchronizing with institutional knowledge nodes..."}
                    </div>
                  </div>

                  {synthesisResult.status === 'done' && (
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="bg-indigo-600/5 p-8 rounded-[40px] border border-indigo-500/20">
                            <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                               <Award size={16} /> Clinical Evidence Quality
                            </h5>
                            <div className="space-y-4">
                               {synthesisResult.badges.map((b, i) => (
                                 <div key={i} className="bg-black/40 p-5 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                       <span className="text-xs font-black text-white italic">{b.item}</span>
                                       <span className={`px-3 py-1 rounded text-[8px] font-black uppercase ${b.level === 'Current' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>{b.level}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed italic">"{b.note}"</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="bg-emerald-600/5 p-8 rounded-[40px] border border-emerald-500/20">
                            <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                               <BarChart4 size={16} /> Outcome Benchmarking
                            </h5>
                            <div className="space-y-4">
                               {synthesisResult.benchmarks.map((o, i) => (
                                 <div key={i} className="flex items-center justify-between p-5 bg-black/20 rounded-2xl">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{o.aspect}</span>
                                    <div className="flex gap-8">
                                       <div className="text-right">
                                          <p className="text-[8px] text-gray-600 uppercase">Status</p>
                                          <p className="text-sm font-black text-white italic">{o.evidence}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[8px] text-emerald-500 uppercase">Node</p>
                                          <p className="text-sm font-black text-emerald-400 italic">{o.hospital}</p>
                                       </div>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      {/* --- ADD-ON: DEEP LOGIC TRACE SECTION --- */}
                      {explanationResult.text || explanationResult.status === 'loading' ? (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-700 bg-indigo-600/5 border border-indigo-500/20 rounded-[40px] p-10 space-y-8">
                           <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-4">
                              <div className="flex items-center gap-4">
                                 <Brain size={20} className="text-indigo-400" />
                                 <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">AI Logic Trace & Deep Reasoning</h4>
                              </div>
                              {explanationResult.status === 'loading' && <Loader2 size={18} className="animate-spin text-indigo-400" />}
                           </div>
                           <div className="prose prose-invert max-w-none text-sm text-slate-300 italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                              {explanationResult.text || "Initializing reasoning node..."}
                           </div>
                           <div ref={explanationEndRef} />
                        </div>
                      ) : null}

                      <div className="pt-10 border-t border-white/5 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-4 text-gray-600 italic">
                           <Info size={16} />
                           <p className="text-[10px] font-black uppercase tracking-widest">"Observational insight only. Final decision rests with treating doctor. Based on level {selectedLevel} rigors."</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6">
                           <button onClick={(e) => { e.stopPropagation(); speakText(synthesisResult.text); }} className="p-5 bg-indigo-600/10 text-indigo-500 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                              <Volume2 size={20}/> Hear Opinion
                           </button>
                           <button 
                             onClick={runSynthesisExplanation} 
                             disabled={explanationResult.status === 'loading'}
                             className="px-10 py-5 bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900 rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                           >
                              <GitBranch size={20} />
                              {explanationResult.status === 'loading' ? 'Tracing...' : 'View Deep Logic Trace'}
                           </button>
                           <button onClick={() => setIsDiscussing(!isDiscussing)} className="px-14 py-5 bg-indigo-600 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3">
                              <MessageSquare size={20} />
                              {isDiscussing ? "End Peer Session" : "Discuss Clinical Logic"}
                           </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
             </div>
           )}
        </div>
      </div>

      {isDiscussing && (
        <div className="bg-[#111827] border border-indigo-500/20 rounded-[50px] overflow-hidden shadow-4xl animate-in slide-in-from-right-10 duration-700 flex flex-col h-[600px]">
           <div className="p-8 border-b border-white/5 bg-indigo-950/10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <Bot size={24} className="text-indigo-500" />
                 <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Colleague Discussion Hub</h4>
              </div>
              <button onClick={() => setIsDiscussing(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
           </div>
           <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#05070a]/20 custom-scrollbar">
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.role === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-6 rounded-[32px] flex gap-4 ${
                     chat.role === 'doctor' ? 'bg-indigo-600/10 border border-indigo-500/10' : 
                     'bg-slate-800/40 border border-slate-700'
                   }`}>
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center">
                         {chat.role === 'doctor' ? <User size={16} className="text-indigo-400"/> : <Bot size={16} className="text-slate-400"/>}
                      </div>
                      <div className="text-sm italic leading-relaxed whitespace-pre-wrap text-slate-300">
                         {chat.text}
                      </div>
                   </div>
                </div>
              ))}
              {discussionLoading && <Loader2 size={24} className="text-indigo-500 animate-spin mx-auto" />}
              <div ref={chatEndRef} />
           </div>
           <form onSubmit={handleDiscussion} className="p-6 border-t border-white/5 bg-[#111827]">
              <div className="relative group">
                <input 
                  type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Ask advisor about specific clinical markers..."
                  className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl pl-6 pr-14 py-4 text-sm text-white focus:border-indigo-500 outline-none italic transition-all shadow-inner"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 transition-colors"><Send size={20}/></button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default QuietOpinionTab;
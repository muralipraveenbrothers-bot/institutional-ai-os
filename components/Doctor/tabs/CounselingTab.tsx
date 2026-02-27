import React, { useState } from 'react';
import { 
  MessageCircle, Languages, Brain, Sparkles, Loader2, 
  CheckCircle2, Info, ChevronRight, MessageSquare, Handshake, Globe, Ear,
  ClipboardList, Clock, RefreshCw, AlertTriangle, ListChecks, Volume2, Zap,
  Calendar, ArrowRight, TrendingUp,
  // Fix: Added missing ChevronDown import
  ChevronDown
} from 'lucide-react';
import { Patient } from '../../../types';
import { mitraPatientExplanationStream, sushrutFollowUpSuggestionStream, speakText } from '../../../geminiService';

interface CounselingTabProps {
  patient: Patient;
  latestAnalysis?: string;
}

const CounselingTab: React.FC<CounselingTabProps> = ({ patient, latestAnalysis = "" }) => {
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('Reassuring');
  const [approvedPoints, setApprovedPoints] = useState(latestAnalysis);
  const [explanation, setExplanation] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  
  // ADD-ON D: Follow-up state
  const [followUp, setFollowUp] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [showFollowUp, setShowFollowUp] = useState(true);

  const runMitra = async () => {
    setExplanation({ text: "", status: 'loading' });
    try {
      const stream = mitraPatientExplanationStream({
        patient,
        approvedPoints,
        language,
        tone
      });
      for await (const chunk of stream) {
        setExplanation(prev => ({ ...prev, text: prev.text + chunk }));
      }
      setExplanation(prev => ({ ...prev, status: 'done' }));
    } catch (err) {
      setExplanation(prev => ({ ...prev, status: 'error' }));
    }
  };

  const runFollowUpScan = async () => {
    setFollowUp({ text: "", status: 'loading' });
    try {
      const stream = sushrutFollowUpSuggestionStream({ patient });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setFollowUp(prev => ({ ...prev, text: fullText }));
      }
      setFollowUp(prev => ({ ...prev, status: 'done' }));
    } catch (err) {
      setFollowUp(prev => ({ ...prev, status: 'error' }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-12 shadow-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Handshake size={300} /></div>
        
        <div className="flex items-center gap-10 mb-12 border-b border-white/5 pb-10 relative z-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-[36px] flex items-center justify-center text-white shadow-[0_25px_70px_rgba(79,70,229,0.5)]">
             <MessageSquare size={48} />
          </div>
          <div>
             <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Counseling Hub</h2>
             <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.5em] mt-3">Relational Node: Mitra AI v6.0</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
           <div className="space-y-10">
              <div className="space-y-6">
                 <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] flex items-center gap-3">
                   <ClipboardList size={14} className="text-indigo-500" /> Doctor-Approved Context
                 </label>
                 <textarea 
                   value={approvedPoints}
                   onChange={e => setApprovedPoints(e.target.value)}
                   className="w-full h-64 bg-[#0a0f18] border border-gray-800 rounded-[40px] p-8 text-sm text-slate-300 italic leading-relaxed focus:border-indigo-500 outline-none transition-all shadow-inner custom-scrollbar"
                   placeholder="Enter clinical notes or approved diagnosis points here..."
                 />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                       <Languages size={14} /> Output Language
                    </label>
                    <select 
                      value={language} 
                      onChange={e => setLanguage(e.target.value)}
                      className="w-full bg-[#0d1321] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                       <option value="English">English</option>
                       <option value="Telugu">Telugu</option>
                       <option value="Hindi">Hindi</option>
                    </select>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                       <Ear size={14} /> Tone Synthesis
                    </label>
                    <select 
                      value={tone} 
                      onChange={e => setTone(e.target.value)}
                      className="w-full bg-[#0d1321] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                       <option value="Reassuring">Reassuring</option>
                       <option value="Neutral">Neutral</option>
                    </select>
                 </div>
              </div>

              <button 
                onClick={runMitra}
                disabled={explanation.status === 'loading' || !approvedPoints.trim()}
                className="w-full py-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase text-base tracking-[0.4em] rounded-[40px] shadow-[0_20px_60px_rgba(79,70,229,0.3)] transition-all active:scale-95 italic flex items-center justify-center gap-8 border-2 border-white/10"
              >
                 {explanation.status === 'loading' ? <Loader2 size={32} className="animate-spin" /> : <Sparkles size={32} />}
                 <span>[ SYNTHESIZE EXPLANATION ]</span>
              </button>
           </div>

           <div className="flex flex-col">
              {explanation.text || explanation.status === 'loading' ? (
                <div className="bg-[#0a0f18] border border-indigo-500/30 rounded-[50px] p-10 flex-1 shadow-2xl flex flex-col relative animate-in slide-in-from-right-4 duration-700">
                   <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8 shrink-0">
                      <div className="flex items-center gap-4">
                         <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_indigo]" />
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em]">MITRA Approved Relay</span>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                      <div className="prose prose-invert max-w-none text-[15px] text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                         {explanation.text || "Synchronizing..."}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="bg-[#0d1321]/30 border border-gray-800 border-dashed rounded-[50px] flex-1 flex flex-col items-center justify-center text-center opacity-30 p-12">
                   <MessageCircle size={100} className="mb-10 text-gray-700" />
                   <h3 className="text-2xl font-black uppercase tracking-widest italic">Mitra Relay Idle</h3>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* ADD-ON D: OP FOLLOW-UP & REMINDER INTELLIGENCE */}
      <div className="bg-[#111827] border border-blue-500/20 rounded-[60px] overflow-hidden shadow-4xl relative">
         <div 
           className="p-8 border-b border-white/5 bg-gradient-to-r from-blue-600/10 to-indigo-700/10 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
           onClick={() => setShowFollowUp(!showFollowUp)}
         >
           <div className="flex items-center gap-6">
             <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Clock size={28} />
             </div>
             <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Follow-Up Strategy (Advisory)</h3>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1 italic">Continuity & Safety Node v1.0</p>
             </div>
           </div>
           {/* Fix: Added missing ChevronDown import from lucide-react */}
           {showFollowUp ? <ChevronDown size={24} className="text-gray-600" /> : <ChevronRight size={24} className="text-gray-600" />}
         </div>

         {showFollowUp && (
           <div className="p-10 space-y-8 bg-black/20">
              {followUp.status === 'idle' ? (
                <div className="py-20 text-center opacity-20 flex flex-col items-center gap-6 grayscale">
                   <Calendar size={64} className="text-gray-500" />
                   <button 
                     onClick={runFollowUpScan}
                     className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                   >
                     [ Initiate Strategy Scan ]
                   </button>
                </div>
              ) : followUp.status === 'loading' ? (
                <div className="py-20 flex flex-col items-center gap-6 opacity-40">
                   <Loader2 size={48} className="animate-spin text-indigo-500" />
                   <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Modeling Longitudinal Path...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-4 duration-700">
                   <div className="lg:col-span-8 bg-[#0a0f18] p-10 rounded-[50px] border border-blue-500/10 shadow-inner">
                      <div className="flex items-center gap-4 mb-6 text-blue-400">
                         <ListChecks size={20} />
                         <h4 className="text-[11px] font-black uppercase tracking-widest">Suggested Follow-Up Plan</h4>
                      </div>
                      <div className="prose prose-invert max-w-none text-[15px] text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                         {followUp.text}
                      </div>
                      <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                         <button className="px-6 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Relay to Discharge Summary</button>
                         <button onClick={() => speakText(followUp.text)} className="p-2.5 bg-white/5 text-gray-500 hover:text-white rounded-xl transition-all border border-white/5"><Volume2 size={16}/></button>
                      </div>
                   </div>
                   
                   <div className="lg:col-span-4 space-y-6">
                      <div className="bg-red-950/20 border border-red-500/20 p-8 rounded-[40px] shadow-inner space-y-6">
                         <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-3 italic"><AlertTriangle size={16} className="animate-pulse" /> Warning Signs</h4>
                         <p className="text-[11px] text-slate-400 italic leading-relaxed">AI suggests prioritizing these signs for patient counseling to ensure early re-presentation.</p>
                         <div className="h-px bg-red-500/10 w-full" />
                         <p className="text-xs font-bold text-red-200 uppercase tracking-tight italic">Refer to "Synthesis Brief" for specific markers.</p>
                      </div>
                      
                      <div className="bg-emerald-950/10 border border-emerald-500/20 p-8 rounded-[40px] shadow-inner space-y-4">
                         <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3 italic"><CheckCircle2 size={16}/> Reminders</h4>
                         <p className="text-[11px] text-slate-400 italic">Authorize automated SMS/Push reminder for the suggested follow-up interval.</p>
                         <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all italic border border-white/10">Authorize Reminder</button>
                      </div>
                   </div>
                </div>
              )}
           </div>
         )}
      </div>

      <div className="p-10 bg-indigo-600/5 border border-indigo-500/20 rounded-[48px] flex items-start gap-8 shadow-inner">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shrink-0">
             <Info size={32} />
          </div>
          <div className="space-y-2">
             <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                Relational Logic Active: MITRA will simplify terminology, ensure calm pacing, and strictly avoid adding information not provided in the input context.
             </p>
             <p className="text-[10px] text-indigo-500/60 font-bold uppercase tracking-widest">Protocol: safe-explain-mode-v6</p>
          </div>
      </div>
    </div>
  );
};

export default CounselingTab;
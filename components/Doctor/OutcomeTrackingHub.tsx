import React, { useState, useMemo } from 'react';
import { 
  LineChart, Activity, TrendingUp, User, Clock, 
  Bot, ShieldCheck, CheckCircle2, ChevronRight, 
  Search, Loader2, Sparkles, AlertCircle,
  HelpCircle, Info
} from 'lucide-react';
import { Patient, OutcomeEvent } from '../../types';
import { generateOutcomeTrackingSummary } from '../../geminiService';
import { approveClinicalContentGuarded } from '../Shared/AppEventToast';

const MOCK_OUTCOME_HISTORY: Record<string, OutcomeEvent[]> = {
  'OP-100234': [
    { date: '2024-03-01', indicator: 'Mood Stability', value: 3, note: 'Patient reports high anxiety and low sleep.', source: 'Patient' },
    { date: '2024-03-08', indicator: 'Mood Stability', value: 4, note: 'Slightly better engagement in sessions.', source: 'AI' },
    { date: '2024-03-15', indicator: 'Mood Stability', value: 6, note: 'Managing triggers with routine.', source: 'Parent' },
    { date: '2024-03-22', indicator: 'Mood Stability', value: 7, note: 'Consistently applying coping mechanisms.', source: 'AI' },
  ]
};

const OutcomeTrackingHub: React.FC<{ patients: Patient[] }> = ({ patients }) => {
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedPatient = patients.find(p => p.id === selectedPid);
  const history = selectedPid ? MOCK_OUTCOME_HISTORY[selectedPid] || [] : [];

  const handleGenerate = async () => {
    if (!selectedPatient || isGenerating) return;
    setIsGenerating(true);
    setReport(null);
    setIsApproved(false);
    try {
      const summary = await generateOutcomeTrackingSummary(selectedPatient, history);
      setReport(summary);
    } catch (e) {
      console.error("Outcome Sync Error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrendColor = (val: number) => {
    if (val < 4) return 'bg-red-500';
    if (val < 7) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-10 shadow-3xl min-h-[70vh] flex flex-col md:flex-row gap-10 animate-in fade-in duration-700">
      
      {/* Patient Selector */}
      <div className="w-full md:w-80 flex flex-col gap-6 shrink-0 border-r border-gray-800 pr-0 md:pr-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
             <User size={24} />
          </div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Case Selector</h3>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input 
            type="text" 
            placeholder="Search MRN..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {filteredPatients.map(p => (
            <div 
              key={p.id}
              onClick={() => { setSelectedPid(p.id); setReport(null); setIsApproved(false); }}
              className={`p-5 rounded-[32px] border cursor-pointer transition-all ${selectedPid === p.id ? 'bg-indigo-600 border-indigo-400 shadow-xl' : 'bg-[#0a0f18] border-gray-800 hover:border-gray-700'}`}
            >
               <p className={`text-sm font-black uppercase italic ${selectedPid === p.id ? 'text-white' : 'text-slate-300'}`}>{p.name}</p>
               <p className="text-[9px] text-gray-600 font-bold uppercase mt-1">{p.id} • {p.age}y</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Analysis View */}
      <div className="flex-1 flex flex-col gap-8 min-h-0">
        {selectedPatient ? (
          <div className="flex-1 flex flex-col gap-8 animate-in slide-in-from-right-4 duration-500">
             
             {/* Header */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-[#0a0f18] rounded-[24px] flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
                      <TrendingUp size={32} />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedPatient.name}</h2>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Node: {selectedPatient.id} • Outcome Node</p>
                   </div>
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all flex items-center gap-3 italic border border-white/10"
                >
                   {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                   Analyze Outcome Trend
                </button>
             </div>

             <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">
                
                {/* Visual Trend Chart */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                   <div className="bg-[#0a0f18] border border-gray-800 rounded-[50px] p-10 flex-1 flex flex-col shadow-inner">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                         <Activity size={16} className="text-indigo-500" /> Longitudinal Pulse Timeline
                      </h4>
                      
                      <div className="flex-1 flex flex-col justify-between">
                         {history.length > 0 ? (
                           <div className="space-y-6">
                              {history.map((evt, idx) => (
                                <div key={idx} className="flex items-start gap-6 group">
                                   <div className="flex flex-col items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${getTrendColor(evt.value)} shadow-[0_0_10px_currentColor]`} />
                                      {idx !== history.length - 1 && <div className="w-px h-12 bg-gray-800" />}
                                   </div>
                                   <div className="flex-1 pb-6 border-b border-white/5 last:border-0">
                                      <div className="flex items-center justify-between mb-2">
                                         <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{evt.date} • Source: {evt.source}</p>
                                         <span className="text-xs font-black text-white italic">Pulse: {evt.value}/10</span>
                                      </div>
                                      <p className="text-sm text-slate-300 italic group-hover:text-white transition-colors">"{evt.note}"</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                         ) : (
                           <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center gap-4">
                              <HelpCircle size={48} />
                              <p className="text-sm font-black uppercase tracking-widest italic">Awaiting data nodes for temporal mapping</p>
                           </div>
                         )}
                      </div>
                   </div>
                </div>

                {/* AI Summary Sidebar */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                   {report ? (
                     <div className="bg-[#111827] border border-indigo-500/30 rounded-[50px] p-10 flex-1 flex flex-col shadow-4xl relative overflow-hidden animate-in zoom-in-95">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Bot size={100} /></div>
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-8 italic flex items-center gap-3">
                           <Bot size={16} /> Trend Synthesis
                        </h4>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                           <div className="prose prose-invert max-w-none">
                              <div className="text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono">
                                 {report}
                              </div>
                           </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-4">
                           <div className="flex items-center gap-3">
                              {isApproved ? <ShieldCheck size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-amber-500 animate-pulse" />}
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isApproved ? 'text-emerald-500' : 'text-amber-500'}`}>
                                 {isApproved ? 'Node Authorized' : 'Clinical Audit Required'}
                              </span>
                           </div>
                           <button 
                             onClick={() => { if(approveClinicalContentGuarded()) setIsApproved(true); }}
                             disabled={isApproved}
                             className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all italic border border-white/10"
                           >
                              {isApproved ? 'Audit Verified' : 'Authorize Analysis'}
                           </button>
                        </div>
                     </div>
                   ) : (
                     <div className="bg-[#0a0f18] border-2 border-dashed border-gray-800 rounded-[50px] p-12 flex-1 flex flex-col items-center justify-center text-center opacity-30">
                        <Bot size={64} className="mb-6 text-gray-700" />
                        <p className="text-lg font-black uppercase italic tracking-widest">Awaiting Command</p>
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-4">Initialize temporal analysis</p>
                     </div>
                   )}

                   <div className="bg-[#0a0f18] border border-gray-800 p-8 rounded-[40px] space-y-6 shadow-inner">
                      <h5 className="text-[9px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2 italic">
                         <Info size={14} /> Tracking Kernel
                      </h5>
                      <p className="text-[10px] text-gray-600 font-bold uppercase leading-relaxed">
                         Outcome tracking focuses on longitudinal trends using encouraging, blame-free parameters. Final authority resides with clinical consultants.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-[0.03] grayscale select-none py-24">
             <LineChart size={200} className="text-gray-700" />
             <h3 className="text-6xl font-black uppercase tracking-[0.5em] italic text-center mt-12 leading-tight">Observation <br/> Node Standby</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutcomeTrackingHub;


import React, { useState, useMemo } from 'react';
import { 
  Radio, Sparkles, Loader2, ShieldCheck, Volume2, Target, AlertTriangle, 
  Activity, Zap, Info, TrendingUp, Siren, Grid, BarChart3, Database
} from 'lucide-react';
import { speakText } from '../../../geminiService';

interface DisasterHubProps {
  aiResult: { rawResponse: string, status: string };
  onInitiateDisaster: (params: { eventType: string, casualtyCount: string, resourceLoad: any }) => void;
}

const DisasterCommandHub: React.FC<DisasterHubProps> = ({ aiResult, onInitiateDisaster }) => {
  const [eventType, setEventType] = useState("");
  const [casualtyCount, setCasualtyCount] = useState("");
  
  const resourceLoad = {
    beds: "2 Available",
    icu: "LOCKED (Full)",
    vents: "4 Available",
    ot: "1 Standby"
  };

  const handleRun = () => {
    onInitiateDisaster({ eventType, casualtyCount, resourceLoad });
  };

  const parseValue = (text: string, marker: string) => {
    const line = text.split('\n').find(l => l.includes(marker));
    return line ? line.replace(marker, '').trim() : '';
  };

  return (
    <div className="bg-[#020408] border border-amber-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Siren size={300} /></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-amber-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl animate-pulse">
               <Radio size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Disaster Command Node</h3>
               <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 italic">Mass-Casualty Coordination Hub | Resource Aware</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <input 
              placeholder="Event Type (e.g. Explosion)" value={eventType} onChange={e => setEventType(e.target.value)}
              className="bg-black/40 border border-gray-800 rounded-xl px-4 py-2 text-[10px] font-black text-white w-48"
            />
            <button 
              onClick={handleRun}
              className="px-8 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl"
            >
              Initiate Event Mode
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 relative z-10">
         {Object.entries(resourceLoad).map(([key, val]) => (
            <div key={key} className="bg-[#0a0f18] border border-gray-800 p-6 rounded-3xl flex flex-col justify-between group hover:border-amber-500/20 transition-all">
               <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest italic">{key}</p>
               <p className={`text-xl font-black italic mt-2 ${val.includes('Full') ? 'text-red-500' : 'text-emerald-400'}`}>{val}</p>
            </div>
         ))}
      </div>

      {aiResult.status === 'loading' ? (
        <div className="py-20 flex flex-col items-center gap-6 opacity-40">
           <Loader2 size={48} className="animate-spin text-amber-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Modeling Event Dynamics...</p>
        </div>
      ) : aiResult.rawResponse ? (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-[#111827] p-10 rounded-[50px] border border-white/5 shadow-inner">
              <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                 <Zap size={20} className="text-amber-500" />
                 <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Autonomous Triage Briefing</h4>
              </div>
              <div className="prose prose-invert max-w-none text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                 {aiResult.rawResponse}
              </div>
           </div>
           
           <div className="flex justify-center gap-8">
              <button onClick={() => speakText(aiResult.rawResponse)} className="px-12 py-6 bg-amber-600 text-white rounded-full font-black uppercase text-xs tracking-widest shadow-2xl italic">
                 [ Audio Briefing ]
              </button>
           </div>
        </div>
      ) : (
        <div className="py-40 text-center opacity-10 flex flex-col items-center gap-6">
           <Siren size={100} />
           <p className="text-xl font-black uppercase tracking-widest">Command Standby Mode</p>
        </div>
      )}

      <div className="mt-10 p-8 bg-amber-950/10 border border-amber-500/10 rounded-[40px] flex items-start gap-6 opacity-60">
          <Info className="text-amber-400 shrink-0" size={24} />
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-relaxed">
                Disaster Mode Warning: AI coordination node provides situational awareness only. Human emergency command retains absolute authority over triage and resource allocation.
             </p>
             <p className="text-[8px] text-amber-500/40 font-bold uppercase tracking-widest italic">Hub: cmd-center-v1 • Surge Level: NOMINAL</p>
          </div>
      </div>
    </div>
  );
};

export default DisasterCommandHub;

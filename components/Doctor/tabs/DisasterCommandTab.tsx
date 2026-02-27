
import React, { useState } from 'react';
import { 
  Radio, Sparkles, Loader2, Activity, ShieldCheck, 
  Volume2, Target, AlertTriangle, CheckCircle2, Zap,
  TrendingUp, ZapOff, ShieldAlert, Crosshair, Scale, Siren
} from 'lucide-react';
import { speakText } from '../../../geminiService';
import DisasterIntelligenceHub from './DisasterIntelligenceHub';

interface DisasterProps {
  aiResult: { rawResponse: string, status: string };
  onInitiateDisaster: (params: { incident: string, casualties: string, resources: any, level: 'V1' | 'V2' | 'V3' }) => void;
}

const DisasterCommandTab: React.FC<DisasterProps> = ({ aiResult, onInitiateDisaster }) => {
  const [incident, setIncident] = useState("");
  const [casualties, setCasualties] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V1');
  const [showHub, setShowHub] = useState(false);

  // Mock Resource Load for Context
  const resources = {
    icu_beds: "2 Available",
    blood_stock: "Critical (O-Neg)",
    vent_load: "85% capacity",
    staff_status: "Surge phase active"
  };

  const handleRun = () => {
    if (!incident) return;
    onInitiateDisaster({ incident, casualties, resources, level: selectedLevel });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* CONFIG HUD */}
      <div className="bg-[#111827] border border-amber-500/20 rounded-[50px] p-10 shadow-3xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><Radio size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                <Siren size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest leading-none">Disaster Command Node</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Institutional Mass-Casualty Protocol v1.0</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 bg-[#0a0f18] p-2 rounded-2xl border border-white/5 shadow-2xl">
              {['V1', 'V2', 'V3'].map((lvl) => (
                <button 
                  key={lvl} 
                  onClick={() => setSelectedLevel(lvl as any)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl ? 'bg-amber-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-gray-400'}`}
                >
                   {lvl} {lvl === 'V1' ? 'TRIAGE' : lvl === 'V2' ? 'RESOURCE' : 'SURGE'}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Incident Type / Location</label>
              <input 
                value={incident} 
                onChange={e => setIncident(e.target.value)} 
                placeholder="e.g. Factory Explosion, Main Street..."
                className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-amber-500 shadow-inner transition-all" 
              />
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Estimated Casualties</label>
              <input 
                value={casualties} 
                onChange={e => setCasualties(e.target.value)} 
                placeholder="e.g. 20-30 yellow, 5 red..."
                className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-amber-500 shadow-inner transition-all" 
              />
           </div>
        </div>

        <button 
          onClick={handleRun} 
          disabled={aiResult?.status === 'loading' || !incident} 
          className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-4 italic border border-white/10"
        >
          {aiResult?.status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />} 
          [ {aiResult?.status === 'loading' ? 'MODELLING SURGE IMPACT...' : 'INITIATE COMMAND PROTOCOL'} ]
        </button>
      </div>

      {aiResult?.rawResponse && (
        <div className="animate-in slide-in-from-top-4 duration-700">
           <button 
              onClick={() => setShowHub(!showHub)}
              className={`w-full py-8 rounded-[40px] font-black uppercase text-base tracking-[0.3em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 italic ${showHub ? 'bg-amber-600 border-amber-400 text-white' : 'bg-black/40 border-amber-500/30 text-amber-400 hover:bg-amber-600/10'}`}
           >
              {showHub ? <ZapOff size={28} /> : <Zap size={28} className="animate-pulse" />}
              {showHub ? '[ HIDE COMMAND INTEL ]' : '[ Disaster & Mass-Casualty Intelligence ]'}
           </button>
        </div>
      )}

      {showHub && aiResult?.rawResponse && (
        <DisasterIntelligenceHub incident={incident} casualties={casualties} resources={resources} />
      )}

      {/* SYNTHESIS AREA */}
      {aiResult?.rawResponse && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
           <div className="bg-[#0a0f18] border border-amber-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_15px_amber]" />
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Command Synthesis</h3>
                 </div>
                 <button onClick={() => speakText(aiResult.rawResponse)} className="p-4 bg-amber-600/10 text-amber-500 rounded-2xl hover:bg-amber-600 transition-all"><Volume2 size={20}/></button>
              </div>
              <div className="prose prose-invert max-w-none text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                 {aiResult.rawResponse}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DisasterCommandTab;

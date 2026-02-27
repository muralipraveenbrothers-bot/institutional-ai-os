
import React, { useState } from 'react';
import { 
  Activity as BrainIcon, Sparkles, Loader2, Activity, ShieldCheck, 
  Volume2, Target, AlertTriangle, CheckCircle2, Zap,
  TrendingUp, ZapOff, ShieldAlert, Crosshair, Scale, Clock
} from 'lucide-react';
import { Patient } from '../../../types';
import { speakText } from '../../../geminiService';
import { approveClinicalContentGuarded } from '../../Shared/AppEventToast';
import StrokeIntelligenceHub from './StrokeIntelligenceHub';

interface NeuroProps {
  patient: Patient;
  vitals: any;
  aiResult: { rawResponse: string, status: string };
  onInitiateStroke: (params: { deficit: string, onset: string, level: 'V1' | 'V2' | 'V3' }) => void;
}

const AcuteNeuroTab: React.FC<NeuroProps> = ({ patient, vitals, aiResult, onInitiateStroke }) => {
  const [deficit, setDeficit] = useState(patient.chiefComplaint || "");
  const [onset, setOnset] = useState("Unknown");
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V1');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showHub, setShowHub] = useState(false);

  const handleRun = () => {
    if (!deficit) return;
    onInitiateStroke({ deficit, onset, level: selectedLevel });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* CONFIG HUD */}
      <div className="bg-[#0a0f18] border border-indigo-500/20 rounded-[50px] p-10 shadow-3xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><BrainIcon size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
                <BrainIcon size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest leading-none">Acute Neuro Node</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Time is Brain Protocol v6.5</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 bg-[#111827] p-2 rounded-2xl border border-white/5 shadow-2xl">
              {['V1', 'V2', 'V3'].map((lvl) => (
                <button 
                  key={lvl} 
                  onClick={() => setSelectedLevel(lvl as any)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl ? 'bg-indigo-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-gray-400'}`}
                >
                   {lvl} {lvl === 'V1' ? 'NEURO' : lvl === 'V2' ? 'PATTERN' : 'WINDOW'}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Deficit / Presentation</label>
              <input 
                value={deficit} 
                onChange={e => setDeficit(e.target.value)} 
                placeholder="e.g. Right-sided weakness, Aphasia..."
                className="w-full bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-indigo-500 shadow-inner transition-all" 
              />
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Time of Onset (LKN)</label>
              <div className="relative group">
                 <Clock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700" />
                 <input 
                   value={onset} 
                   onChange={e => setOnset(e.target.value)} 
                   placeholder="e.g. 2 hours ago..."
                   className="w-full bg-[#111827] border border-gray-800 rounded-2xl pl-12 pr-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-indigo-500 shadow-inner transition-all" 
                 />
              </div>
           </div>
        </div>

        <button 
          onClick={handleRun} 
          disabled={aiResult?.status === 'loading' || !deficit} 
          className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-4 italic border border-white/10"
        >
          {aiResult?.status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />} 
          [ {aiResult?.status === 'loading' ? 'SCANNING NEURO LATTICE...' : 'INITIATE NEURO SURVEY'} ]
        </button>
      </div>

      {aiResult?.rawResponse && (
        <div className="animate-in slide-in-from-top-4 duration-700">
           <button 
              onClick={() => setShowHub(!showHub)}
              className={`w-full py-8 rounded-[40px] font-black uppercase text-base tracking-[0.3em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 italic ${showHub ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/40 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/10'}`}
           >
              {showHub ? <ZapOff size={28} /> : <Zap size={28} className="animate-pulse" />}
              {showHub ? '[ HIDE NEURO INTEL ]' : '[ Stroke & Acute Neuro Intelligence ]'}
           </button>
        </div>
      )}

      {showHub && aiResult?.rawResponse && (
        <StrokeIntelligenceHub patient={patient} deficit={deficit} onset={onset} vitals={vitals} />
      )}

      {/* SYNTHESIS AREA */}
      {aiResult?.rawResponse && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
           <div className="bg-[#0a0f18] border border-indigo-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_indigo]" />
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Neurological Synthesis</h3>
                 </div>
                 <button onClick={() => speakText(aiResult.rawResponse)} className="p-4 bg-indigo-600/10 text-indigo-500 rounded-2xl hover:bg-indigo-600 transition-all"><Volume2 size={20}/></button>
              </div>
              <div className="prose prose-invert max-w-none text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                 {aiResult.rawResponse}
              </div>
           </div>

           <div className={`p-12 rounded-[60px] border-2 transition-all duration-1000 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-4xl ${isAuthorized ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-indigo-600/5 border-indigo-500/20'}`}>
              <div className="flex items-center gap-10">
                 <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center shadow-3xl ${isAuthorized ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white animate-pulse'}`}>
                    {isAuthorized ? <ShieldCheck size={56} /> : <ShieldAlert size={56} />}
                 </div>
                 <div className="text-left">
                    <p className={`text-[12px] font-black uppercase tracking-[0.6em] mb-3 ${isAuthorized ? 'text-emerald-500' : 'text-indigo-400'}`}>
                       {isAuthorized ? 'Neuro Protocol Verified' : 'Consultant Neurology Signature'}
                    </p>
                    <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                       {isAuthorized ? 'Survey Finalized' : 'Authorize Neuro Plan'}
                    </h4>
                 </div>
              </div>
              <button 
                onClick={() => { if(approveClinicalContentGuarded()) setIsAuthorized(true); }}
                disabled={isAuthorized}
                className="px-20 py-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-[40px] font-black uppercase text-sm tracking-[0.3em] shadow-3xl transition-all active:scale-95 italic border-2 border-white/10 flex items-center gap-6"
              >
                 {isAuthorized ? 'NEURO PATH SECURED' : 'COMMIT NEURO PLAN'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AcuteNeuroTab;

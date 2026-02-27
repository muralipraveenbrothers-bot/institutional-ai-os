import React, { useState } from 'react';
import { 
  Flame, Sparkles, Loader2, Activity, ShieldCheck, 
  Volume2, Target, AlertTriangle, CheckCircle2, Zap, Droplets,
  Gavel, Clock, Microscope, HeartPulse, Brain, ZapOff, Wind, Thermometer
} from 'lucide-react';
import { Patient } from '../../../types';
import { speakText } from '../../../geminiService';
import { approveClinicalContentGuarded } from '../../Shared/AppEventToast';
import BurnsIntelligenceHub from './BurnsIntelligenceHub';

interface BurnsProps {
  patient: Patient;
  vitals: any;
  aiResult: { rawResponse: string, status: string };
  onInitiateBurns: (severity: string, level: 'V1' | 'V2' | 'V3') => void;
}

const TraumaBurnsTab: React.FC<BurnsProps> = ({ patient, vitals, aiResult, onInitiateBurns }) => {
  const [severity, setSeverity] = useState(patient.chiefComplaint || "");
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showIntelligenceHub, setShowIntelligenceHub] = useState(false);

  const handleRun = () => {
    if (!severity) return;
    onInitiateBurns(severity, selectedLevel);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* 1. CONFIG HUD */}
      <div className="bg-[#111827] border border-orange-500/20 rounded-[50px] p-10 shadow-3xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Flame size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
                <Flame size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest leading-none">Trauma & Burns Hub</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Institutional Resuscitation Protocol v1.0</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 bg-[#0a0f18] p-2 rounded-2xl border border-white/5 shadow-2xl">
              {['V1', 'V2', 'V3'].map((lvl) => (
                <button 
                  key={lvl} 
                  onClick={() => setSelectedLevel(lvl as any)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl ? 'bg-orange-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-gray-400'}`}
                >
                   {lvl} {lvl === 'V1' ? 'INITIAL' : lvl === 'V2' ? 'ORGAN' : 'INHALATION'}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Injury Severity / %TBSA Estimate</label>
              <input 
                value={severity} 
                onChange={e => setSeverity(e.target.value)} 
                placeholder="e.g. 40% TBSA, Facial Involvement..."
                className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-orange-500 shadow-inner transition-all" 
              />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0f18] p-5 rounded-2xl border border-white/5 shadow-inner flex flex-col justify-center text-center">
                 <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">HR Node</p>
                 <p className="text-2xl font-black text-white italic">{vitals?.pulse || '---'}</p>
              </div>
              <div className="bg-[#0a0f18] p-5 rounded-2xl border border-white/5 shadow-inner flex flex-col justify-center text-center">
                 <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">SpO2 Node</p>
                 <p className="text-2xl font-black text-cyan-500 italic">{vitals?.spo2 || '---'}%</p>
              </div>
           </div>
        </div>

        <button 
          onClick={handleRun} 
          disabled={aiResult?.status === 'loading' || !severity} 
          className="w-full py-6 bg-orange-600 hover:bg-orange-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-4 italic border border-white/10"
        >
          {aiResult?.status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />} 
          [ {aiResult?.status === 'loading' ? 'SYNCHRONIZING SPECIALIST...' : 'INITIATE BURNS PROTOCOL'} ]
        </button>
      </div>

      {/* --- ADD-ON: BURNS INTELLIGENCE TOGGLE --- */}
      {aiResult?.rawResponse && (
        <div className="animate-in slide-in-from-top-4 duration-700">
           <button 
              onClick={() => setShowIntelligenceHub(!showIntelligenceHub)}
              className={`w-full py-8 rounded-[40px] font-black uppercase text-base tracking-[0.3em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 italic ${showIntelligenceHub ? 'bg-orange-600 border-orange-400 text-white' : 'bg-black/40 border-orange-500/30 text-orange-400 hover:bg-orange-600/10'}`}
           >
              {showIntelligenceHub ? <ZapOff size={28} /> : <Zap size={28} className="animate-pulse" />}
              {showIntelligenceHub ? '[ HIDE INTELLIGENCE HUB ]' : '[ Burns & Inhalation Injury Intelligence ]'}
           </button>
           <p className="text-[9px] text-gray-500 uppercase tracking-widest text-center mt-3 italic">Early resuscitation | Airway-first | Outcome-oriented</p>
        </div>
      )}

      {showIntelligenceHub && aiResult?.rawResponse && (
        <BurnsIntelligenceHub patient={patient} severity={severity} vitals={vitals} />
      )}

      {/* 2. DYNAMIC SYNTHESIS AREA */}
      {aiResult?.rawResponse && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
           
           <div className="bg-[#0a0f18] border border-orange-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse shadow-[0_0_15px_orange]" />
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Resuscitation Synthesis</h3>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => speakText(aiResult.rawResponse)} className="p-4 bg-orange-600/10 text-orange-500 rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-xl"><Volume2 size={20}/></button>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                 <div className="lg:col-span-8 space-y-10">
                    <div className="prose prose-invert max-w-none text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                       {aiResult.rawResponse}
                    </div>
                 </div>

                 <div className="lg:col-span-4 space-y-8">
                    <div className="bg-orange-600/5 border border-orange-500/20 p-8 rounded-[40px] shadow-inner space-y-6">
                       <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic flex items-center gap-3">
                          <Activity size={16} /> Airway Vigilance
                       </h4>
                       <div className="space-y-4">
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                             <p className="text-[8px] font-black text-gray-600 uppercase mb-2">Priority Action</p>
                             <p className="text-xs text-orange-400 font-bold italic uppercase">Assess for hoarseness / stridor</p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[40px] shadow-inner space-y-6">
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-3">
                          <Microscope size={16} /> Fluid Logic
                       </h4>
                       <p className="text-[11px] text-slate-400 italic leading-relaxed uppercase font-bold">
                          Monitor urine output every 1 hour (Target 0.5-1ml/kg/hr).
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* 3. FINAL AUTHORIZATION NODE */}
           <div className={`p-12 rounded-[60px] border-2 transition-all duration-1000 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-4xl ${isAuthorized ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-orange-600/5 border-orange-500/20'}`}>
              <div className="flex items-center gap-10">
                 <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center shadow-3xl ${isAuthorized ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white animate-pulse'}`}>
                    {isAuthorized ? <ShieldCheck size={56} /> : <Flame size={56} />}
                 </div>
                 <div className="text-left">
                    <p className={`text-[12px] font-black uppercase tracking-[0.6em] mb-3 ${isAuthorized ? 'text-emerald-500' : 'text-orange-400'}`}>
                       {isAuthorized ? 'Resuscitation Path Locked' : 'Consultant Burns Signature'}
                    </p>
                    <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                       {isAuthorized ? 'Plan Released' : 'Authorize Resuscitation'}
                    </h4>
                 </div>
              </div>
              <button 
                onClick={() => { if(approveClinicalContentGuarded()) setIsAuthorized(true); }}
                disabled={isAuthorized}
                className="px-20 py-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-[40px] font-black uppercase text-sm tracking-[0.3em] shadow-3xl transition-all active:scale-95 italic border-2 border-white/10 flex items-center gap-6"
              >
                 {isAuthorized ? 'PROTOCOL DISPATCHED' : 'COMMIT RESUS PLAN'}
              </button>
           </div>
        </div>
      )}
      
      {/* Disclaimer */}
      <div className="p-10 bg-orange-600/5 border border-orange-500/20 rounded-[48px] flex items-start gap-8 shadow-inner opacity-60">
          <div className="w-14 h-14 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-500/10 shrink-0">
             <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
             <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                Burns Node Disclaimer: AI evaluation is assistive. Airway management and fluid resuscitation must be human-verified by a registered intensivist or burn surgeon.
             </p>
             <p className="text-[10px] text-orange-500/60 font-bold uppercase tracking-widest">Verification: burns-protocol-1.0 • Airway-Sync: ACTIVE</p>
          </div>
      </div>

    </div>
  );
};

export default TraumaBurnsTab;
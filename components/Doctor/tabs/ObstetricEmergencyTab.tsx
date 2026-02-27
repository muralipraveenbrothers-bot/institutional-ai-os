
import React, { useState } from 'react';
import { 
  Heart, Sparkles, Loader2, Activity, ShieldCheck, 
  Volume2, Target, AlertTriangle, CheckCircle2, Zap,
  TrendingUp, ZapOff, ShieldAlert, Crosshair, Scale
} from 'lucide-react';
import { Patient } from '../../../types';
import { speakText } from '../../../geminiService';
import { approveClinicalContentGuarded } from '../../Shared/AppEventToast';
import ObstetricIntelligenceHub from './ObstetricIntelligenceHub';

interface ObstetricProps {
  patient: Patient;
  vitals: any;
  aiResult: { rawResponse: string, status: string };
  onInitiateObstetric: (params: { complaint: string, gestation: string, level: 'V1' | 'V2' | 'V3' }) => void;
}

const ObstetricEmergencyTab: React.FC<ObstetricProps> = ({ patient, vitals, aiResult, onInitiateObstetric }) => {
  const [complaint, setComplaint] = useState(patient.chiefComplaint || "");
  const [gestation, setGestation] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V1');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showHub, setShowHub] = useState(false);

  const handleRun = () => {
    if (!complaint) return;
    onInitiateObstetric({ complaint, gestation, level: selectedLevel });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* CONFIG HUD */}
      <div className="bg-[#111827] border border-rose-500/20 rounded-[50px] p-10 shadow-3xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><Heart size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-rose-600/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-inner">
                <Heart size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest leading-none">Obstetric ER Node</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Institutional Obstetric Protocol v1.0</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 bg-[#0a0f18] p-2 rounded-2xl border border-white/5 shadow-2xl">
              {['V1', 'V2', 'V3'].map((lvl) => (
                <button 
                  key={lvl} 
                  onClick={() => setSelectedLevel(lvl as any)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl ? 'bg-rose-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-gray-400'}`}
                >
                   {lvl} {lvl === 'V1' ? 'MATERNAL' : lvl === 'V2' ? 'EMERGENCY' : 'ESCALATION'}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Chief Complaint</label>
              <input 
                value={complaint} 
                onChange={e => setComplaint(e.target.value)} 
                className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-rose-500 shadow-inner transition-all" 
              />
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Gestational Age (Weeks)</label>
              <input 
                value={gestation} 
                onChange={e => setGestation(e.target.value)} 
                placeholder="e.g. 34 weeks"
                className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black uppercase text-white outline-none focus:border-rose-500 shadow-inner transition-all" 
              />
           </div>
        </div>

        <button 
          onClick={handleRun} 
          disabled={aiResult?.status === 'loading' || !complaint} 
          className="w-full py-6 bg-rose-600 hover:bg-rose-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-4 italic border border-white/10"
        >
          {aiResult?.status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />} 
          [ {aiResult?.status === 'loading' ? 'MAPPING OBSTETRIC LATTICE...' : 'INITIATE OBSTETRIC PROTOCOL'} ]
        </button>
      </div>

      {aiResult?.rawResponse && (
        <div className="animate-in slide-in-from-top-4 duration-700">
           <button 
              onClick={() => setShowHub(!showHub)}
              className={`w-full py-8 rounded-[40px] font-black uppercase text-base tracking-[0.3em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 italic ${showHub ? 'bg-rose-600 border-rose-400 text-white' : 'bg-black/40 border-rose-500/30 text-rose-400 hover:bg-rose-600/10'}`}
           >
              {showHub ? <ZapOff size={28} /> : <Zap size={28} className="animate-pulse" />}
              {showHub ? '[ HIDE OBSTETRIC INTEL ]' : '[ Obstetric Emergency Intelligence ]'}
           </button>
        </div>
      )}

      {showHub && aiResult?.rawResponse && (
        <ObstetricIntelligenceHub patient={patient} complaint={complaint} gestation={gestation} vitals={vitals} />
      )}

      {/* SYNTHESIS AREA */}
      {aiResult?.rawResponse && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
           <div className="bg-[#0a0f18] border border-rose-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_15px_rose]" />
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Obstetric Synthesis</h3>
                 </div>
                 <button onClick={() => speakText(aiResult.rawResponse)} className="p-4 bg-rose-600/10 text-rose-500 rounded-2xl hover:bg-rose-600 transition-all"><Volume2 size={20}/></button>
              </div>
              <div className="prose prose-invert max-w-none text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                 {aiResult.rawResponse}
              </div>
           </div>

           <div className={`p-12 rounded-[60px] border-2 transition-all duration-1000 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-4xl ${isAuthorized ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-rose-600/5 border-rose-500/20'}`}>
              <div className="flex items-center gap-10">
                 <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center shadow-3xl ${isAuthorized ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'}`}>
                    {isAuthorized ? <ShieldCheck size={56} /> : <ShieldAlert size={56} />}
                 </div>
                 <div className="text-left">
                    <p className={`text-[12px] font-black uppercase tracking-[0.6em] mb-3 ${isAuthorized ? 'text-emerald-500' : 'text-rose-400'}`}>
                       {isAuthorized ? 'Obstetric Protocol Verified' : 'Consultant Signature Required'}
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
                 {isAuthorized ? 'OB-PATH SECURED' : 'COMMIT RESUS PLAN'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ObstetricEmergencyTab;

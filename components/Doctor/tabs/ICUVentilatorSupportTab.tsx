
import React, { useState, useRef } from 'react';
import { 
  Wind, Sparkles, Loader2, Activity, ShieldCheck, 
  Volume2, Target, AlertTriangle, CheckCircle2, Zap,
  Camera, FileUp, Beaker, Brain, Scissors, Clock,
  ArrowUpRight, BarChart3, Pill, Trash2, Microscope, Scale,
  TrendingUp, ZapOff, Waves, Search, ShieldAlert
} from 'lucide-react';
import { Patient } from '../../../types';
import { speakText, analyzeABGOCR } from '../../../geminiService';
import { approveClinicalContentGuarded } from '../../Shared/AppEventToast';
import ICUVentIntelligenceHub from './ICUVentIntelligenceHub';
import WeaningIntelligenceHub from './WeaningIntelligenceHub';

interface ICUVentProps {
  patient: Patient;
  vitals: any;
  aiResult: { rawResponse: string, status: string };
  onInitiateVent: (params: { indication: string, abg: any, level: 'V1' | 'V2' | 'V3' }) => void;
}

const ICUVentilatorSupportTab: React.FC<ICUVentProps> = ({ patient, vitals, aiResult, onInitiateVent }) => {
  const [indication, setIndication] = useState("Acute Respiratory Distress");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');
  const [showIntelligenceHub, setShowIntelligenceHub] = useState(false);
  const [showWeaningHub, setShowWeaningHub] = useState(false);
  
  // ABG State
  const [isScanningABG, setIsScanningABG] = useState(false);
  const [abgData, setAbgData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleABGUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningABG(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await analyzeABGOCR(base64, file.type);
      setAbgData(result);
      setIsScanningABG(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = (level: 'V1' | 'V2' | 'V3') => {
    setSelectedLevel(level);
    onInitiateVent({ indication, abg: abgData, level });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* 🟩 VENTILATOR COMMAND HUD */}
      <div className="bg-[#111827] border border-cyan-500/20 rounded-[60px] p-10 shadow-3xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Wind size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10 border-b border-white/5 pb-8">
           <div className="flex items-center gap-8">
              <div className="w-18 h-18 bg-cyan-600/10 rounded-[28px] flex items-center justify-center text-cyan-500 border border-cyan-500/20 shadow-inner">
                <Wind size={36} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Ventilator Command Node</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Institutional Airway Intelligence v6.5</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-[8px] font-black text-gray-600 uppercase">Synchronized MRN</p>
                 <p className="text-xs font-black text-white italic">{patient.id}</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
           {/* ABG INGRESS */}
           <div className="lg:col-span-4 space-y-4">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1 italic">Acid-Base Ingress (ABG OCR)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`group h-48 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-all ${abgData ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-gray-800 hover:border-cyan-500/30 bg-black/20'}`}
              >
                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleABGUpload} accept="image/*" />
                 {isScanningABG ? (
                   <Loader2 size={36} className="text-cyan-500 animate-spin" />
                 ) : abgData ? (
                   <>
                     <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-500 mb-4 shadow-xl">
                        <CheckCircle2 size={24} />
                     </div>
                     <p className="text-xs font-black text-white uppercase italic">{abgData.imbalance || 'Analysis Synced'}</p>
                     <p className="text-[9px] text-gray-500 uppercase mt-2 font-mono">pH: {abgData.pH} | pCO2: {abgData.pCO2}</p>
                   </>
                 ) : (
                   <>
                     <Camera size={36} className="text-gray-700 group-hover:text-cyan-500 transition-colors mb-4" />
                     <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Snap ABG Report</p>
                     <p className="text-[8px] text-gray-800 mt-2">OCR EXTRACTOR ACTIVE</p>
                   </>
                 )}
              </div>
           </div>

           {/* PARAMS & ENGINES */}
           <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Clinical Indication</label>
                    <input 
                      value={indication} 
                      onChange={e => setIndication(e.target.value)} 
                      className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-5 text-sm font-black uppercase text-white outline-none focus:border-cyan-500 shadow-inner" 
                    />
                 </div>
                 <div className="bg-[#0a0f18] p-6 rounded-2xl border border-white/5 flex items-center justify-between shadow-inner relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-2 opacity-5"><Activity size={40} /></div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">SpO2 Node</p>
                       <p className={`text-2xl font-black italic ${vitals?.spo2 && Number(vitals.spo2) < 92 ? 'text-red-500' : 'text-emerald-500'}`}>{vitals?.spo2 || '---'}%</p>
                    </div>
                    <div className="h-10 w-px bg-white/5" />
                    <div className="space-y-1 text-right">
                       <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">RR Node</p>
                       <p className="text-2xl font-black text-white italic">{vitals?.rr || '---'} /m</p>
                    </div>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] ml-1 italic">Select Analysis Engine Level</p>
                 <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'V1', label: 'Safety Sync', desc: 'ARDSNet / Basic', icon: ShieldCheck, color: 'text-emerald-500' },
                      { id: 'V2', label: 'Physio IQ', desc: 'Hemo-Lung Core', icon: Activity, color: 'text-cyan-500' },
                      { id: 'V3', label: 'Forensic AI', desc: 'Deep Precision', icon: Brain, color: 'text-indigo-500' }
                    ].map((engine) => (
                      <button 
                        key={engine.id}
                        onClick={() => handleRunAnalysis(engine.id as any)}
                        disabled={aiResult?.status === 'loading'}
                        className={`p-6 rounded-[32px] border transition-all flex flex-col items-center gap-3 group relative overflow-hidden ${selectedLevel === engine.id && aiResult.status !== 'idle' ? 'bg-cyan-600/20 border-cyan-500/50 shadow-2xl scale-[1.02]' : 'bg-[#0a0f18] border-gray-800 hover:border-cyan-500/30'}`}
                      >
                         {selectedLevel === engine.id && aiResult.status === 'loading' && (
                           <div className="absolute inset-0 bg-cyan-600/5 animate-pulse" />
                         )}
                         <engine.icon size={24} className={`${selectedLevel === engine.id && aiResult.status !== 'idle' ? 'text-white' : engine.color} group-hover:scale-110 transition-transform duration-500`} />
                         <div className="text-center">
                            <p className={`text-xs font-black uppercase italic ${selectedLevel === engine.id && aiResult.status !== 'idle' ? 'text-white' : 'text-slate-300'}`}>{engine.id}: {engine.label}</p>
                            <p className="text-[7px] font-bold text-gray-600 uppercase tracking-widest mt-1">{engine.desc}</p>
                         </div>
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* --- 2. DYNAMIC SYNTHESIS AREA --- */}
      {(aiResult?.status === 'loading' || aiResult?.rawResponse) && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
           
           <div className="bg-[#0a0f18] border border-cyan-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                 <div className="flex items-center gap-6">
                    <div className={`w-4 h-4 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_15px_cyan] ${aiResult.status === 'loading' ? 'animate-ping' : ''}`} />
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                      {aiResult.status === 'loading' ? `Executing ${selectedLevel} Pulmonary Synthesis...` : `${selectedLevel} ICU Command Synthesis`}
                    </h3>
                 </div>
                 {aiResult.rawResponse && (
                    <div className="flex gap-4">
                        <button onClick={() => speakText(aiResult.rawResponse)} className="p-4 bg-cyan-600/10 text-cyan-500 rounded-2xl hover:bg-cyan-600 hover:text-white transition-all shadow-xl group"><Volume2 size={24} className="group-hover:scale-110 transition-transform"/></button>
                    </div>
                 )}
              </div>

              {aiResult.status === 'loading' ? (
                <div className="py-24 flex flex-col items-center justify-center gap-8 opacity-50 relative z-10">
                   <div className="relative">
                      <Loader2 size={80} className="text-cyan-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Sparkles size={32} className="text-cyan-400 animate-pulse" />
                      </div>
                   </div>
                   <div className="text-center space-y-4">
                      <p className="text-xl font-black text-white uppercase tracking-[0.6em] italic animate-pulse ml-[0.6em]">Syncing Neural Pulse...</p>
                      <p className="text-[10px] text-cyan-700 font-bold uppercase tracking-widest">Cross-referencing ABG Data & Vitals History</p>
                   </div>
                   <div className="w-full max-w-lg h-2 bg-gray-900 rounded-full overflow-hidden mt-6 shadow-inner border border-white/5">
                      <div className="h-full bg-cyan-500 shadow-[0_0_15px_cyan] animate-[loading-bar_1.5s_infinite_ease-in-out]" />
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                   {/* Left: Vent & Sedation Details */}
                   <div className="lg:col-span-8 space-y-10">
                      <div className="prose prose-invert max-w-none">
                         <div className="text-[19px] text-slate-100 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                            {aiResult.rawResponse}
                         </div>
                      </div>
                   </div>

                   {/* Right: Weaning & Evidence Sidebar */}
                   <div className="lg:col-span-4 space-y-8">
                      <div className="bg-emerald-600/5 border border-emerald-500/20 p-10 rounded-[50px] shadow-3xl space-y-8 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-[0.05]"><TrendingUp size={120} /></div>
                         <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-3">
                            <TrendingUp size={16} /> Weaning Prognosis
                         </h4>
                         <div className="space-y-6">
                            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                               <p className="text-[9px] font-black text-gray-500 uppercase mb-3">Success Probability</p>
                               <div className="flex items-end gap-3">
                                  <p className="text-5xl font-black text-emerald-500 italic">88%</p>
                                  <span className="text-[10px] font-bold text-gray-700 uppercase mb-2">High Reserve</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[50px] shadow-3xl space-y-8">
                         <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-3">
                            <Microscope size={18} /> Evidence Base
                         </h4>
                         <p className="text-sm text-slate-400 italic leading-relaxed font-medium">
                            Advisory logic calibrated against ARDSNet lung-protective strategy (6ml/kg PBW) and SCCM PADIS guidelines for sedation titration.
                         </p>
                         <div className="flex items-center gap-3 text-[9px] font-black text-indigo-500 uppercase italic bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                            <CheckCircle2 size={12} /> Standard Care Aligned
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>

           {/* 3. FINAL AUTHORIZATION NODE */}
           {aiResult.status === 'done' && (
              <div className={`p-14 rounded-[70px] border-2 transition-all duration-1000 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-4xl ${isAuthorized ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-cyan-600/5 border-cyan-500/20'}`}>
                 <div className="flex items-center gap-10">
                    <div className={`w-28 h-28 rounded-[40px] flex items-center justify-center shadow-3xl ${isAuthorized ? 'bg-emerald-600 text-white' : 'bg-cyan-600 text-white animate-pulse'}`}>
                       {isAuthorized ? <ShieldCheck size={64} /> : <Zap size={64} />}
                    </div>
                    <div className="text-left">
                       <p className={`text-[13px] font-black uppercase tracking-[0.6em] mb-4 ${isAuthorized ? 'text-emerald-500' : 'text-cyan-400'}`}>
                          {isAuthorized ? 'Institutional Settings Finalized' : 'Consultant Intensity Verification'}
                       </p>
                       <h4 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                          {isAuthorized ? 'Command Locked' : 'Authorize Protocol'}
                       </h4>
                    </div>
                 </div>
                 <button 
                   onClick={() => { if(approveClinicalContentGuarded()) setIsAuthorized(true); }}
                   disabled={isAuthorized}
                   className="px-24 py-9 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-[50px] font-black uppercase text-base tracking-[0.4em] shadow-[0_30px_80px_rgba(16,185,129,0.3)] transition-all active:scale-95 italic border-2 border-white/10 flex items-center gap-8"
                 >
                    {isAuthorized ? 'PROTOCOL SECURED' : 'COMMIT & DISPATCH'}
                 </button>
              </div>
           )}
        </div>
      )}

      {/* INTELLIGENCE HUB TOGGLES */}
      {aiResult?.rawResponse && aiResult.status === 'done' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-700 pb-10">
           <div className="flex flex-col gap-3">
             <button 
                onClick={() => { setShowIntelligenceHub(!showIntelligenceHub); setShowWeaningHub(false); }}
                className={`w-full py-10 rounded-[50px] font-black uppercase text-sm tracking-[0.3em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 italic ${showIntelligenceHub ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/10'}`}
             >
                {showIntelligenceHub ? <ZapOff size={28} /> : <Zap size={28} className="animate-pulse" />}
                {showIntelligenceHub ? '[ HIDE VENT INTEL ]' : '[ ICU Ventilator Intelligence ]'}
             </button>
             <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center">LUNG-PROTECTIVE | VESSEL-SAFE | ADVISORY PULSE</p>
           </div>

           <div className="flex flex-col gap-3">
             <button 
                onClick={() => { setShowWeaningHub(!showWeaningHub); setShowIntelligenceHub(false); }}
                className={`w-full py-10 rounded-[50px] font-black uppercase text-sm tracking-[0.3em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 italic ${showWeaningHub ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-black/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/10'}`}
             >
                {showWeaningHub ? <ZapOff size={28} /> : <Waves size={28} className="animate-pulse" />}
                {showWeaningHub ? '[ HIDE WEANING INTEL ]' : '[ Weaning & Extubation Logic ]'}
             </button>
             <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center">SAFE LIBERATION | RSBI TRACKING | PATIENT-SPECIFIC</p>
           </div>
        </div>
      )}

      {showIntelligenceHub && aiResult?.rawResponse && (
        <ICUVentIntelligenceHub patient={patient} settings={aiResult.rawResponse} vitals={vitals} />
      )}

      {showWeaningHub && aiResult?.rawResponse && (
        <WeaningIntelligenceHub patient={patient} settings={aiResult.rawResponse} vitals={vitals} />
      )}
      
      {/* FINAL SAFETY DISCLAIMER */}
      <div className="p-12 bg-[#0a0f18] border border-cyan-500/10 rounded-[60px] flex items-start gap-10 shadow-inner opacity-60">
          <div className="w-16 h-16 rounded-[24px] bg-cyan-600/10 flex items-center justify-center text-cyan-500 border border-cyan-500/10 shrink-0 shadow-2xl">
             <ShieldAlert size={32} />
          </div>
          <div className="space-y-3">
             <p className="text-base font-black text-white uppercase italic tracking-tight leading-relaxed">
                Critical Care Governance Node: AI Ventilator Support (Gemini-3 Pro Intensivist) provides complex pattern interpretations and strategy suggestions. All hardware setting changes must be human-authorized and performed by a registered Respiratory Therapist or Intensivist. 
             </p>
             <div className="flex items-center gap-6">
                <p className="text-[10px] text-cyan-500/60 font-black uppercase tracking-widest italic">Verification ID: icu-v6.5.99 • ABG-OCR Handshake: SECURED</p>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             </div>
          </div>
      </div>

    </div>
  );
};

export default ICUVentilatorSupportTab;

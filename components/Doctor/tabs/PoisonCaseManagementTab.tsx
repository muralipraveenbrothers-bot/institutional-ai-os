import React, { useState, useRef } from 'react';
import { 
  Skull, Sparkles, Loader2, Activity, ShieldCheck, 
  Volume2, Target, AlertTriangle, CheckCircle2, Zap, Droplets,
  Gavel, Clock, Microscope, HeartPulse, Brain, Camera, FileUp,
  ZapOff, Waves
} from 'lucide-react';
import { Patient } from '../../../types';
import { speakText, identifyToxinFromImage } from '../../../geminiService';
import { approveClinicalContentGuarded } from '../../Shared/AppEventToast';
import PoisoningIntelligenceHub from './PoisoningIntelligenceHub';
import EnvenomationIntelligenceHub from './EnvenomationIntelligenceHub';

interface PoisonProps {
  patient: Patient;
  vitals: any;
  aiResult: { rawResponse: string, status: string };
  onInitiatePoison: (toxin: string, level: 'V1' | 'V2' | 'V3') => void;
}

const PoisonCaseManagementTab: React.FC<PoisonProps> = ({ patient, vitals, aiResult, onInitiatePoison }) => {
  const [toxin, setToxin] = useState(patient.chiefComplaint || "");
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isIdentifyingToxin, setIsIdentifyingToxin] = useState(false);
  const [showIntelligenceHub, setShowIntelligenceHub] = useState(false);
  const [showEnvenomationHub, setShowEnvenomationHub] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRun = () => {
    if (!toxin) return;
    onInitiatePoison(toxin, selectedLevel);
  };

  const handleToxinImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsIdentifyingToxin(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const identifiedName = await identifyToxinFromImage(base64, file.type);
        if (identifiedName && identifiedName !== "Identification Error") {
          setToxin(identifiedName);
          speakText(`AI identified suspected toxin as ${identifiedName}. Please verify.`, 'Zephyr');
        }
      } catch (err) {
        console.error("Toxin Vision Error:", err);
      } finally {
        setIsIdentifyingToxin(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* 1. CONFIG HUD */}
      <div className="bg-[#111827] border border-red-500/20 rounded-[50px] p-10 shadow-3xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Skull size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
                <Skull size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest leading-none">Toxicology Command Hub</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Institutional Emergency Protocol v6.3</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 bg-[#0a0f18] p-2 rounded-2xl border border-white/5 shadow-2xl">
              {['V1', 'V2', 'V3'].map((lvl) => (
                <button 
                  key={lvl} 
                  onClick={() => setSelectedLevel(lvl as any)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl ? 'bg-red-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-gray-400'}`}
                >
                   {lvl} {lvl === 'V1' ? 'EMERGENCY' : lvl === 'V2' ? 'SPECIFIC' : 'FORENSIC'}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 flex justify-between items-center">
                 Suspected Toxin / Poison
                 {isIdentifyingToxin && <span className="text-red-500 animate-pulse flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Identifying...</span>}
              </label>
              <div className="relative group">
                <input 
                  value={toxin} 
                  onChange={e => setToxin(e.target.value)} 
                  placeholder="e.g. Organophosphate, Snake Bite..."
                  className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl pl-6 pr-14 py-4 text-xs font-black uppercase text-white outline-none focus:border-red-500 shadow-inner transition-all" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  title="Identify toxin from image (Container, Bite, etc.)"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded-xl transition-all shadow-lg active:scale-90"
                >
                   <Camera size={18} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleToxinImageUpload} accept="image/*" />
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0f18] p-5 rounded-2xl border border-white/5 shadow-inner flex flex-col justify-center text-center">
                 <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">HR Node</p>
                 <p className="text-2xl font-black text-white italic">{vitals?.pulse || '---'} <span className="text-[8px] uppercase">BPM</span></p>
              </div>
              <div className="bg-[#0a0f18] p-5 rounded-2xl border border-white/5 shadow-inner flex flex-col justify-center text-center">
                 <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">SpO2 Node</p>
                 <p className="text-2xl font-black text-emerald-500 italic">{vitals?.spo2 || '---'} <span className="text-[8px] uppercase text-gray-700">%</span></p>
              </div>
           </div>
        </div>

        <button 
          onClick={handleRun} 
          disabled={aiResult?.status === 'loading' || !toxin} 
          className="w-full py-6 bg-red-600 hover:bg-red-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-4 italic border border-white/10"
        >
          {aiResult?.status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />} 
          [ {aiResult?.status === 'loading' ? 'SYNCHRONIZING SPECIALIST...' : 'INITIATE ANTIDOTE PROTOCOL'} ]
        </button>
      </div>

      {/* --- ADD-ON: POISONING & ENVENOMATION INTELLIGENCE TOGGLE --- */}
      {aiResult?.rawResponse && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-700">
           <div className="flex flex-col gap-2">
             <button 
                onClick={() => { setShowIntelligenceHub(!showIntelligenceHub); setShowEnvenomationHub(false); }}
                className={`w-full py-8 rounded-[40px] font-black uppercase text-xs tracking-[0.3em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 italic ${showIntelligenceHub ? 'bg-red-600 border-red-400 text-white' : 'bg-black/40 border-red-500/30 text-red-400 hover:bg-red-600/10'}`}
             >
                {showIntelligenceHub ? <ZapOff size={24} /> : <Zap size={24} className="animate-pulse" />}
                {showIntelligenceHub ? '[ HIDE POISON INTEL ]' : '[ Poisoning Management Intelligence ]'}
             </button>
           </div>
           <div className="flex flex-col gap-2">
             <button 
                onClick={() => { setShowEnvenomationHub(!showEnvenomationHub); setShowIntelligenceHub(false); }}
                className={`w-full py-8 rounded-[40px] font-black uppercase text-xs tracking-[0.3em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 italic ${showEnvenomationHub ? 'bg-red-600 border-red-400 text-white' : 'bg-black/40 border-red-500/30 text-red-400 hover:bg-red-600/10'}`}
             >
                {showEnvenomationHub ? <ZapOff size={24} /> : <Waves size={24} className="animate-pulse" />}
                {showEnvenomationHub ? '[ HIDE ENVENOMATION INTEL ]' : '[ Envenomation Management Intelligence ]'}
             </button>
           </div>
        </div>
      )}

      {showIntelligenceHub && aiResult?.rawResponse && (
        <PoisoningIntelligenceHub patient={patient} toxin={toxin} vitals={vitals} />
      )}

      {showEnvenomationHub && aiResult?.rawResponse && (
        <EnvenomationIntelligenceHub patient={patient} exposure={toxin} vitals={vitals} />
      )}

      {/* 2. DYNAMIC SYNTHESIS AREA */}
      {aiResult?.rawResponse && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
           
           <div className="bg-[#0a0f18] border border-red-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_red]" />
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Emergency Case Synthesis</h3>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => speakText(aiResult.rawResponse)} className="p-4 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl"><Volume2 size={20}/></button>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                 
                 {/* Left: Management Details */}
                 <div className="lg:col-span-8 space-y-10">
                    <div className="prose prose-invert max-w-none text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                       {aiResult.rawResponse}
                    </div>
                 </div>

                 {/* Right: Quick Logic Sidebar */}
                 <div className="lg:col-span-4 space-y-8">
                    <div className="bg-red-600/5 border border-red-500/20 p-8 rounded-[40px] shadow-inner space-y-6">
                       <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest italic flex items-center gap-3">
                          <Activity size={16} /> Immediate Stabilization
                       </h4>
                       <div className="space-y-4">
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                             <p className="text-[8px] font-black text-gray-600 uppercase mb-2">Priority Action</p>
                             <p className="text-xs text-red-400 font-bold italic uppercase">Ensure Airway Patency & Suctioning</p>
                          </div>
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                             <p className="text-[8px] font-black text-gray-500 uppercase mb-2">Gastric Ingress</p>
                             <p className="text-xs text-gray-300 font-bold italic leading-relaxed">Consider lavage ONLY if ingestion was within 1 hour and airway protected.</p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-amber-600/5 border border-amber-500/20 p-8 rounded-[40px] shadow-inner space-y-6">
                       <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-3">
                          <Gavel size={16} /> Forensic/MLC Node
                       </h4>
                       <p className="text-[11px] text-slate-400 italic leading-relaxed">
                          Secure all containers. Log timestamps for lavage/charcoal. Mandatory MLC notification for suspected poisoning nodes.
                       </p>
                    </div>

                    <div className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[40px] shadow-inner space-y-6">
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-3">
                          <Microscope size={16} /> Kinetic Insight
                       </h4>
                       <p className="text-[11px] text-slate-400 italic leading-relaxed uppercase font-bold">
                          Monitor LFT/RFT every 6 hours to detect temporal failure trends.
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* 3. FINAL AUTHORIZATION NODE */}
           <div className={`p-12 rounded-[60px] border-2 transition-all duration-1000 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-4xl ${isAuthorized ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-red-600/5 border-red-500/20'}`}>
              <div className="flex items-center gap-10">
                 <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center shadow-3xl ${isAuthorized ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
                    {isAuthorized ? <ShieldCheck size={56} /> : <Skull size={56} />}
                 </div>
                 <div className="text-left">
                    <p className={`text-[12px] font-black uppercase tracking-[0.6em] mb-3 ${isAuthorized ? 'text-emerald-500' : 'text-red-400'}`}>
                       {isAuthorized ? 'Emergency Protocol Finalized' : 'Consultant Emergency Signature'}
                    </p>
                    <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                       {isAuthorized ? 'Plan Locked' : 'Authorize Antidote'}
                    </h4>
                 </div>
              </div>
              <button 
                onClick={() => { if(approveClinicalContentGuarded()) setIsAuthorized(true); }}
                disabled={isAuthorized}
                className="px-20 py-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-[40px] font-black uppercase text-sm tracking-[0.3em] shadow-3xl transition-all active:scale-95 italic border-2 border-white/10 flex items-center gap-6"
              >
                 {isAuthorized ? 'ANTIDOTE DISPATCHED' : 'COMMIT EMERGENCY PLAN'}
              </button>
           </div>
        </div>
      )}
      
      {/* Disclaimer */}
      <div className="p-10 bg-red-600/5 border border-red-500/20 rounded-[48px] flex items-start gap-8 shadow-inner opacity-60">
          <div className="w-14 h-14 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 border border-red-500/10 shrink-0">
             <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
             <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                Poison Case Disclaimer: The Toxicology Node provides emergency guidance based on suspected toxin profiles. All clinical interventions must be performed by a registered clinician. MLC requirements are mandatory.
             </p>
             <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-widest">Verification: toxicology-protocol-6.3 • Toxin-Sync: ACTIVE</p>
          </div>
      </div>

    </div>
  );
};

export default PoisonCaseManagementTab;
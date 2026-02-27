
import React, { useState } from 'react';
import { 
  Wind, Skull, Flame, Ambulance, Activity as NeuroIcon, Zap, Baby, Heart, Radio,
  ShieldCheck, Target, Loader2, Siren, ChevronRight, Info, AlertTriangle, ZapOff
} from 'lucide-react';
import { Patient } from '../../../types';
import ICUVentilatorSupportTab from './ICUVentilatorSupportTab';
import PoisonCaseManagementTab from './PoisonCaseManagementTab';
import TraumaBurnsTab from './TraumaBurnsTab';
import TraumaBayTab from './TraumaBayTab';
import AcuteNeuroTab from './AcuteNeuroTab';
import ACLSCodeTab from './ACLSCodeTab';
import PediatricEmergencyTab from './PediatricEmergencyTab';
import ObstetricEmergencyTab from './ObstetricEmergencyTab';
import DisasterCommandTab from './DisasterCommandTab';

type EmergencyModule = 'VENT' | 'TOX' | 'BURN' | 'TRAUMA' | 'NEURO' | 'ACLS' | 'PEDS' | 'OBG' | 'DISASTER';

interface ICUEmergencyCommandCoreProps {
  patient: Patient;
  vitals: any;
  aiResult: { rawResponse: string, status: string };
  handlers: {
    onInitiateVent: (params: any) => void;
    onInitiatePoison: (toxin: string, level: any) => void;
    onInitiateBurns: (severity: string, level: any) => void;
    onInitiateTrauma: (pattern: string, level: any) => void;
    onInitiateStroke: (params: any) => void;
    onInitiateACLS: (params: any) => void;
    onInitiatePediatric: (params: any) => void;
    onInitiateObstetric: (params: any) => void;
    onInitiateDisaster: (params: any) => void;
  };
}

const ICUEmergencyCommandCore: React.FC<ICUEmergencyCommandCoreProps> = ({ patient, vitals, aiResult, handlers }) => {
  const [activeModule, setActiveModule] = useState<EmergencyModule>('VENT');

  const MODULES = [
    { id: 'VENT', label: 'Ventilator IQ', icon: Wind, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'TOX', label: 'Toxicology IQ', icon: Skull, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'BURN', label: 'Burns IQ', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'TRAUMA', label: 'Trauma Bay', icon: Ambulance, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'NEURO', label: 'Acute Neuro', icon: NeuroIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'ACLS', label: 'ACLS Code', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'PEDS', label: 'Pediatric ER', icon: Baby, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'OBG', label: 'Obstetric ER', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'DISASTER', label: 'Disaster Hub', icon: Radio, color: 'text-amber-500', bg: 'bg-amber-500/10' }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* 🟩 CORE CONTAINER HEADER */}
      <div className="bg-[#111827] border border-emerald-500/20 rounded-[60px] p-10 shadow-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Siren size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-10 border-b border-white/5 pb-8 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-18 h-18 bg-emerald-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl relative">
               <Siren size={36} className="animate-pulse" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping" />
            </div>
            <div>
               <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">EMERGENCY SUPER ICU</h2>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">Institutional Command Core v6.5 • All Systems Nominal</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
             <div className="text-right">
                <p className="text-[8px] font-black text-gray-500 uppercase">Intensivist Control</p>
                <p className="text-xs font-black text-white uppercase italic">Active Oversight</p>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex items-center gap-3 px-6 py-2 bg-emerald-600/5 border border-emerald-500/20 rounded-full">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Protocol Verified</span>
             </div>
          </div>
        </div>

        {/* SUB-NAVIGATION GRID */}
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 relative z-10">
           {MODULES.map(m => (
             <button 
               key={m.id} 
               onClick={() => setActiveModule(m.id as EmergencyModule)}
               className={`flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all group ${activeModule === m.id ? 'bg-emerald-600/10 border-emerald-500/40 shadow-xl' : 'bg-[#0a0f18] border-gray-800 hover:border-emerald-500/20'}`}
             >
                <m.icon size={28} className={`${activeModule === m.id ? m.color : 'text-gray-700 group-hover:text-gray-400'} transition-all group-hover:scale-110 mb-3`} />
                <span className={`text-[8px] font-black uppercase text-center tracking-tight leading-tight ${activeModule === m.id ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`}>{m.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
         {activeModule === 'VENT' && (
           <ICUVentilatorSupportTab 
             patient={patient} vitals={vitals} aiResult={aiResult} 
             onInitiateVent={handlers.onInitiateVent} 
           />
         )}
         {activeModule === 'TOX' && (
           <PoisonCaseManagementTab 
             patient={patient} vitals={vitals} aiResult={aiResult} 
             onInitiatePoison={handlers.onInitiatePoison} 
           />
         )}
         {activeModule === 'BURN' && (
           <TraumaBurnsTab 
             patient={patient} vitals={vitals} aiResult={aiResult} 
             onInitiateBurns={handlers.onInitiateBurns} 
           />
         )}
         {activeModule === 'TRAUMA' && (
           <TraumaBayTab 
             patient={patient} vitals={vitals} aiResult={aiResult} 
             onInitiateTrauma={handlers.onInitiateTrauma} 
           />
         )}
         {activeModule === 'NEURO' && (
           <AcuteNeuroTab 
             patient={patient} vitals={vitals} aiResult={aiResult} 
             onInitiateStroke={handlers.onInitiateStroke} 
           />
         )}
         {activeModule === 'ACLS' && (
           <ACLSCodeTab 
             patient={patient} vitals={vitals} aiResult={aiResult} 
             onInitiateACLS={handlers.onInitiateACLS} 
           />
         )}
         {activeModule === 'PEDS' && (
           <PediatricEmergencyTab 
             patient={patient} vitals={vitals} aiResult={aiResult} 
             onInitiatePediatric={handlers.onInitiatePediatric} 
           />
         )}
         {activeModule === 'OBG' && (
           <ObstetricEmergencyTab 
             patient={patient} vitals={vitals} aiResult={aiResult} 
             onInitiateObstetric={handlers.onInitiateObstetric} 
           />
         )}
         {activeModule === 'DISASTER' && (
           <DisasterCommandTab 
             aiResult={aiResult} 
             onInitiateDisaster={handlers.onInitiateDisaster} 
           />
         )}
      </div>

      {/* CORE SAFETY FOOTER */}
      <div className="p-10 bg-emerald-600/5 border border-emerald-500/20 rounded-[50px] flex items-start gap-8 shadow-inner opacity-60">
          <div className="w-16 h-16 rounded-[24px] bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10 shrink-0">
             <ShieldCheck size={32} />
          </div>
          <div className="space-y-2">
             <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                Emergency Command Core Disclaimer: This unified hub integrates 9 specialized intelligence nodes for acute clinical support. All AI interpretations are ADVISORY. Treatment protocols must be verified by the lead intensivist or consultant-in-charge.
             </p>
             <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest italic">Hub: super-icu-command-core-v6.5 • Safety Status: LOCKED</p>
          </div>
      </div>
    </div>
  );
};

export default ICUEmergencyCommandCore;

import React from 'react';
import { UserRole } from '../types';
import { 
  Users, Stethoscope, Pill, Bed, FlaskConical, Scan, Receipt, 
  ShieldCheck, Activity, ChevronRight, Lock, Network, Zap, Cpu,
  HeartHandshake, ShieldX, Brain, Target
} from 'lucide-react';

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
}

const ROLES = [
  { id: UserRole.RECEPTIONIST, icon: Users, desc: 'Entry point for clinical data ingress & registry.', color: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  { id: UserRole.DOCTOR, icon: Stethoscope, desc: 'Clinical reasoning deck & high-precision diagnostics.', color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  { id: UserRole.PHARMACY, icon: Pill, desc: 'Institutional formulary & dispensing logic.', color: 'text-amber-400', glow: 'shadow-amber-500/20' },
  { id: UserRole.WARD, icon: Bed, desc: 'Real-time vitals monitoring & care coordination.', color: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
  { id: UserRole.LAB, icon: FlaskConical, desc: 'Pathological data synthesis & bio-markers.', color: 'text-pink-400', glow: 'shadow-pink-500/20' },
  { id: UserRole.RADIOLOGY, icon: Scan, desc: 'Vision nodes & spatial anatomical analysis.', color: 'text-blue-400', glow: 'shadow-blue-500/20' },
  { id: UserRole.BILLING, icon: Receipt, desc: 'Institutional revenue gates & financial audit.', color: 'text-teal-400', glow: 'shadow-teal-500/20' },
  { id: UserRole.ADMIN, icon: ShieldCheck, desc: 'System kernel, agent ethics & institutional oversight.', color: 'text-rose-400', glow: 'shadow-rose-500/20' },
  { id: UserRole.PATIENT_SUPPORT, icon: HeartHandshake, desc: 'Voice Agent • Prognosis Guide • Emotional Support • Recovery AI.', color: 'text-purple-400', glow: 'shadow-purple-500/20' },
  { id: UserRole.SECURITY_CONTROL, icon: ShieldX, desc: 'Anti-Theft • Asset Monitoring • Crash Cart Integrity • Loss Control.', color: 'text-red-400', glow: 'shadow-red-500/20' },
];

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  return (
    <div className="h-full w-full flex flex-col bg-[#020408] overflow-hidden font-['Inter'] relative">
      {/* HUD Background Lattice */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid-roles" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="0.1"/>
          </pattern>
          <rect width="100" height="100" fill="url(#grid-roles)" />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 blur-[160px] rounded-full animate-pulse" />
      </div>

      <header className="shrink-0 p-10 md:p-14 z-10 flex items-center justify-between bg-gradient-to-b from-[#020408] to-transparent">
        <div className="flex items-center gap-6 group">
          <div className="w-20 h-20 bg-cyan-600 rounded-[24px] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(6,182,212,0.4)] relative overflow-hidden transition-transform duration-700 group-hover:scale-110">
            <Target size={40} className="relative z-10 animate-cognimed-core" />
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-[0.2em] leading-none">
              C <span className="text-cyan-400 animate-pulse">O</span> G N I M E D
            </h1>
            <p className="text-[11px] text-cyan-500 font-black uppercase tracking-[0.6em] mt-3 italic">Node Context Selector</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-10 py-6 md:px-20 lg:px-32 scrollable-node scppable">
        <div className="max-w-7xl mx-auto pb-32">
          <div className="mb-20 space-y-6 text-center lg:text-left border-l-4 border-cyan-500 pl-8">
            <h2 className="text-5xl md:text-9xl font-black text-white uppercase italic tracking-tighter leading-tight">
              AUTHORIZED <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-500">INGRESS.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => onSelect(role.id)}
                className="group relative bg-[#0a0f18]/40 backdrop-blur-md border border-white/5 p-10 rounded-[60px] text-left hover:border-cyan-500/40 transition-all duration-500 hover:bg-[#0d1321] shadow-2xl flex flex-col justify-between h-[360px] overflow-hidden active:scale-[0.97]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[80px] translate-x-12 -translate-y-12 transition-transform duration-700 group-hover:translate-x-0 group-hover:translate-y-0" />
                
                <div>
                  <div className={`w-20 h-20 bg-gray-900/50 rounded-[28px] flex items-center justify-center ${role.color} mb-10 border border-white/5 shadow-inner transition-all duration-700 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-cyan-600/10`}>
                    <role.icon size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tight group-hover:text-cyan-400 transition-colors leading-none">
                    {role.id} <br/> <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-2 block">Intelligence Node</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest italic group-hover:text-gray-300 transition-colors">{role.desc}</p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.6em] mb-1">Status</span>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Core Synced</span>
                   </div>
                   <div className="p-4 bg-white/5 rounded-full group-hover:bg-cyan-600/10 transition-colors">
                      <ChevronRight size={24} className="text-gray-700 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all duration-500" />
                   </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="shrink-0 h-16 bg-[#020408]/80 border-t border-white/5 px-14 flex items-center justify-between z-20 backdrop-blur-xl">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <Cpu size={14} className="text-cyan-500" />
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.6em] italic">Processor: Stable</p>
            </div>
            <div className="flex items-center gap-3">
              <Network size={14} className="text-indigo-500" />
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.6em] italic">COGNIMED Fabric: v1.0</p>
            </div>
         </div>
         <p className="text-[10px] font-black text-gray-800 uppercase tracking-[0.3em]">COGNIMED AI CORE © 2026</p>
      </footer>
    </div>
  );
};

export default RoleSelection;
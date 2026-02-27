import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserRole } from '../../types';
import { 
  ShieldCheck, Brain, Lock, Activity, Users, 
  ChevronRight, ArrowRight, Loader2, Sparkles,
  Stethoscope, Pill, Bed, FlaskConical, Scan,
  Receipt, HeartHandshake, ShieldX, Zap, Target
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

const ROLES = [
  { id: UserRole.RECEPTIONIST, icon: Users },
  { id: UserRole.DOCTOR, icon: Stethoscope },
  { id: UserRole.PHARMACY, icon: Pill },
  { id: UserRole.WARD, icon: Bed },
  { id: UserRole.LAB, icon: FlaskConical },
  { id: UserRole.RADIOLOGY, icon: Scan },
  { id: UserRole.BILLING, icon: Receipt },
  { id: UserRole.ADMIN, icon: ShieldCheck },
  { id: UserRole.PATIENT_SUPPORT, icon: HeartHandshake },
  { id: UserRole.SECURITY_CONTROL, icon: ShieldX },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.DOCTOR);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoggingIn(true);
    // Institutional Auth Simulation
    setTimeout(() => {
      onLogin(selectedRole);
    }, 1500);
  };

  return (
    <div className="h-full w-full flex bg-[#020408] font-['Inter'] overflow-hidden relative">
      {/* Left Column: Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-between w-1/2 p-20 bg-gradient-to-br from-[#0a1f33] to-[#020408] relative"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid-auth" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#06b6d4" strokeWidth="0.1"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid-auth)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-20 h-20 bg-cyan-600 rounded-[28px] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(6,182,212,0.3)] relative overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border border-white/20 animate-spin neural-orbit-line" />
                  <div className="w-16 h-16 rounded-full border border-white/10 animate-spin neural-orbit-line" style={{ animationDirection: 'reverse' }} />
               </div>
               <div className="w-5 h-5 bg-white rounded-full animate-cognimed-core shadow-[0_0_20px_rgba(255,255,255,0.8)] relative z-10" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white italic tracking-[0.2em] uppercase leading-none">
                C <span className="text-cyan-400 animate-pulse">O</span> G N I M E D
              </h1>
              <p className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.5em] mt-2 italic">Institutional OS v1.0</p>
            </div>
          </div>

          <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-tight mb-8">
            Unified Care.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-500">Neural Intelligence.</span>
          </h2>
          
          <div className="max-w-xl space-y-6">
            <p className="text-xl text-slate-400 font-medium italic leading-relaxed">
              "A next-generation Institutional Intelligence Operating System. COGNIMED unifies clinical reasoning and operational flow under one synchronized metabolic core."
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
               {['Neural-Sync', 'Role-Secured', 'AI-Driven', 'Real-Time'].map(tag => (
                 <span key={tag} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-500">{tag}</span>
               ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 opacity-40">
           <div className="px-5 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> Encrypted Session
           </div>
           <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Master Node: COGNIMED-SYNC-Active</p>
        </div>
      </motion.div>

      {/* Right Column: Login Panel */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative"
      >
        <div className="w-full max-w-md space-y-12 animate-in slide-in-from-right-10 duration-1000">
           <div className="text-center lg:text-left">
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Authorized Ingress</h3>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Access your institutional identity node</p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-2">User Identity</label>
                    <input 
                      type="text" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Email or User ID"
                      className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-sm font-bold text-white outline-none focus:border-cyan-500 transition-all shadow-inner"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-2">Security Key</label>
                    <div className="relative">
                       <input 
                         type="password" 
                         value={password}
                         onChange={e => setPassword(e.target.value)}
                         placeholder="••••••••"
                         className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-sm font-bold text-white outline-none focus:border-cyan-500 transition-all shadow-inner tracking-[0.5em]"
                       />
                       <Lock size={18} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-700" />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-2">Access Context</label>
                    <select 
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value as UserRole)}
                      className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-sm font-black uppercase text-white outline-none focus:border-cyan-500 transition-all appearance-none"
                    >
                       {ROLES.map(role => (
                         <option key={role.id} value={role.id}>{role.id}</option>
                       ))}
                    </select>
                 </div>
              </div>

              <button 
                type="submit"
                disabled={isLoggingIn || !password}
                className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-20 text-white rounded-[32px] font-black uppercase text-xs tracking-[0.4em] shadow-4xl transition-all active:scale-95 italic border-2 border-white/10 flex items-center justify-center gap-6 group"
              >
                 {isLoggingIn ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} fill="currentColor" className="group-hover:rotate-12 transition-transform" />}
                 [ {isLoggingIn ? 'SYNCING IDENTITY...' : 'CONNECT TO CORE'} ]
              </button>
           </form>

           <div className="pt-10 border-t border-white/5 flex flex-col items-center gap-6">
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center leading-relaxed">
                SESSION ACTIVITY AUDITED BY COGNIMED GOVERNANCE.<br/> INSTITUTIONAL FIDELITY GUARANTEED.
              </p>
              <div className="flex gap-4">
                 {ROLES.slice(0, 5).map(r => (
                   <div key={r.id} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-700">
                      <r.icon size={14} />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
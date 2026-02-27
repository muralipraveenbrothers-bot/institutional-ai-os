import React, { useState, useEffect } from 'react';
import { 
  Radio, Activity, Users, TrendingUp, ShieldCheck, 
  Target, Bot, Loader2, Siren, Zap, ArrowUpRight, 
  Clock, CheckCircle2, AlertTriangle, Building2, BarChart3
} from 'lucide-react';
import { Patient, RevenueLedger } from '../../types';
import { sushrutExecutiveBriefStream } from '../../geminiService';

const InstitutionalCommandCenter: React.FC<{ patients: Patient[], revenue: RevenueLedger }> = ({ patients, revenue }) => {
  const [brief, setBrief] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' });
  
  const census = {
    total: patients.length,
    op: patients.filter(p => p.type === 'OP').length,
    ip: patients.filter(p => p.type === 'IP').length,
    icu: patients.filter(p => p.isICU).length,
    emergency: patients.filter(p => p.status === 'Critical' || p.status === 'Emergency').length
  };

  const qualitySignals = {
    pendingReports: 12,
    criticalVitals: patients.filter(p => p.icuStatus?.dangerAlert).length,
    complianceGaps: 3
  };

  const runExecutiveBrief = async () => {
    setBrief({ text: "", status: 'loading' });
    try {
      const stream = sushrutExecutiveBriefStream({ census, revenue, quality: qualitySignals });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setBrief(prev => ({ ...prev, text: fullText }));
      }
      setBrief(prev => ({ ...prev, status: 'done' }));
    } catch (e) {
      setBrief(prev => ({ ...prev, status: 'idle' }));
    }
  };

  useEffect(() => {
    runExecutiveBrief();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* HUD DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'OP Census', value: census.op, icon: Users, color: 'text-cyan-500' },
          { label: 'IP Census', value: census.ip, icon: Building2, color: 'text-indigo-500' },
          { label: 'ICU Load', value: census.icu, icon: Activity, color: 'text-red-500' },
          { label: 'Emergency', value: census.emergency, icon: Siren, color: 'text-orange-500' },
          { label: 'Revenue Yield', value: '88%', icon: TrendingUp, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#111827] border border-white/5 p-8 rounded-[40px] shadow-xl hover:border-white/10 transition-all group">
             <div className="flex items-center gap-4 mb-3">
                <stat.icon size={18} className={`${stat.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
             </div>
             <div className="text-4xl font-black text-white italic">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* LEFT: EXECUTIVE BRIEFING NODE */}
         <div className="lg:col-span-8 bg-[#111827] border border-indigo-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Radio size={300} /></div>
            
            <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8 relative z-10">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl">
                     <Bot size={36} />
                  </div>
                  <div>
                     <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Institutional Pulse Brief</h3>
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">Governance & Strategy Node v6.5</p>
                  </div>
               </div>
               <button onClick={runExecutiveBrief} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 text-gray-500">
                  <RefreshCw size={20} className={brief.status === 'loading' ? 'animate-spin' : ''} />
               </button>
            </div>

            <div className="prose prose-invert max-w-none relative z-10">
               {brief.text ? (
                 <div className="text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                    {brief.text}
                 </div>
               ) : (
                 <div className="py-20 flex flex-col items-center gap-6 opacity-40">
                    <Loader2 size={48} className="animate-spin text-indigo-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.6em]">Compiling Multi-Specialty Data Streams...</p>
                 </div>
               )}
            </div>
         </div>

         {/* RIGHT: REAL-TIME SIGNALS & BOTTLENECKS */}
         <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0a0f18] border border-white/5 p-10 rounded-[50px] shadow-2xl space-y-10">
               <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] italic border-b border-white/5 pb-6">Quality & Safety Signals</h4>
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-red-950/20 border border-red-500/20 rounded-[32px] group hover:border-red-500/40 transition-all">
                     <div className="flex items-center gap-4">
                        <Zap size={20} className="text-red-500 animate-pulse" />
                        <span className="text-sm font-black text-white uppercase italic">Critical Vitals</span>
                     </div>
                     <span className="text-2xl font-black text-red-500 italic">{qualitySignals.criticalVitals}</span>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-amber-950/20 border border-amber-500/20 rounded-[32px] group hover:border-amber-500/40 transition-all">
                     <div className="flex items-center gap-4">
                        <AlertTriangle size={20} className="text-amber-500" />
                        <span className="text-sm font-black text-white uppercase italic">Audit Gaps</span>
                     </div>
                     <span className="text-2xl font-black text-amber-500 italic">{qualitySignals.complianceGaps}</span>
                  </div>
               </div>
            </div>

            <div className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[50px] shadow-3xl space-y-8">
               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-3"><Target size={16}/> System Bottlenecks</h4>
               <div className="p-6 bg-[#0a0f18] rounded-3xl border border-gray-800 shadow-inner">
                  <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                     "Potential delay detected in Lab Verified stage. Average TAT for STAT nodes increased to 68 mins. Recommend resource audit in pathology."
                  </p>
               </div>
            </div>
         </div>
      </div>

      <div className="p-10 bg-[#0a0f18] border border-white/5 rounded-[50px] flex items-center justify-between opacity-60">
         <div className="flex items-center gap-8 text-[11px] font-black text-gray-700 uppercase tracking-widest italic">
            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> Executive Oversight Node: ACTIVE</span>
            <span className="flex items-center gap-2"><BarChart3 size={16} className="text-cyan-500" /> Read-Only Integrity Locked</span>
         </div>
         <p className="text-[9px] font-black text-gray-800 uppercase tracking-[0.4em]">Audit: COMMAND-6.5-TX</p>
      </div>
    </div>
  );
};

export default InstitutionalCommandCenter;

const RefreshCw = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

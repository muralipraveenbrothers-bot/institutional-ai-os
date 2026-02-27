import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, FileCheck,
  History, Loader2, Sparkles, Filter, Info, ChevronRight,
  ClipboardList, Search, Gavel, BarChart3, Database,
  Stethoscope, Pill, Microscope, Scissors, Droplets, Siren,
  AlertCircle
} from 'lucide-react';
// Corrected imported function name to match geminiService export
import { sushrutNABHComplianceHubStream, sushrutGenerateAuditSnapshot } from '../../geminiService';

const NABHComplianceHub: React.FC = () => {
  const [activeDomain, setActiveDomain] = useState('Patient Safety');
  const [complianceResults, setComplianceResults] = useState<Record<string, { text: string, status: string }>>({});
  const [showAuditView, setShowAuditView] = useState(false);
  const [auditSnapshot, setAuditSnapshot] = useState({ text: "", status: 'idle' });

  const domains = [
    { id: 'Patient Safety', icon: ShieldCheck, standards: 'PS.1 - PS.6' },
    { id: 'Medication Management', icon: Pill, standards: 'MOM.1 - MOM.15' },
    { id: 'Infection Control', icon: Droplets, standards: 'HIC.1 - HIC.9' },
    { id: 'Surgical Care', icon: Scissors, standards: 'COP.1 - COP.10' },
    { id: 'Documentation', icon: ClipboardList, standards: 'ROM.1 - ROM.6' },
    { id: 'Emergency Preparedness', icon: Siren, standards: 'FMS.1 - FMS.7' }
  ];

  const runComplianceCheck = async (domain: string) => {
    setActiveDomain(domain);
    setComplianceResults(prev => ({ ...prev, [domain]: { text: "", status: 'loading' } }));
    
    try {
      // Corrected function call to sushrutNABHComplianceHubStream
      const stream = sushrutNABHComplianceHubStream({ 
        domain, 
        context: "Daily clinical node activity: 42 admissions, 8 surgeries, 120 dispensing events. Identification verified 100%. One missing pre-op consent node detected." 
      });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setComplianceResults(prev => ({ ...prev, [domain]: { ...prev[domain], text: fullText } }));
      }
      setComplianceResults(prev => ({ ...prev, [domain]: { ...prev[domain], status: 'done' } }));
    } catch (err) {
      setComplianceResults(prev => ({ ...prev, [domain]: { ...prev[domain], status: 'error' } }));
    }
  };

  const handleGenerateAudit = async () => {
    setShowAuditView(true);
    setAuditSnapshot({ text: "", status: 'loading' });
    try {
      const stream = sushrutGenerateAuditSnapshot({ department: "All Departments", timeframe: "Last 30 Days" });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setAuditSnapshot(prev => ({ ...prev, text: fullText }));
      }
      setAuditSnapshot(prev => ({ ...prev, status: 'done' }));
    } catch (err) {
      setAuditSnapshot(prev => ({ ...prev, status: 'error' }));
    }
  };

  const parseParts = (text: string, marker: string) => {
    try {
      const line = text.split('\n').find(l => l.includes(marker));
      if (!line) return null;
      const payload = line.replace(marker, "").trim();
      const segments = payload.split('|').map(p => p.trim());
      const obj: any = {};
      segments.forEach(seg => {
        const splitPos = seg.indexOf(':');
        if (splitPos !== -1) {
          const k = seg.substring(0, splitPos).trim().toUpperCase();
          const v = seg.substring(splitPos + 1).trim();
          if (k) obj[k] = v;
        }
      });
      return obj;
    } catch (e) { return null; }
  };

  const currentResult = complianceResults[activeDomain];
  const parsedStatus = useMemo(() => {
    if (!currentResult?.text) return null;
    return parseParts(currentResult.text, '1. COMPLIANCE_STATUS:');
  }, [currentResult]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* HUB HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
           <div className="w-20 h-20 bg-emerald-600/10 rounded-[32px] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner relative group">
              <ShieldCheck size={40} className="group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse rounded-[32px]" />
           </div>
           <div>
              <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">NABH / JCI Guard</h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.6em] mt-4 italic">Institutional Auto-Compliance Node v1.0</p>
           </div>
        </div>
        <button 
          onClick={handleGenerateAudit}
          className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-4 italic border border-white/10"
        >
          <FileCheck size={20} /> [ Generate Audit View ]
        </button>
      </div>

      {/* COMPLIANCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {domains.map(d => {
           const result = complianceResults[d.id];
           const data = result ? parseParts(result.text, '1. COMPLIANCE_STATUS:') : null;
           const score = data?.SCORE || '0%';
           const status = data?.['0'] || 'Pending';
           
           return (
             <div 
               key={d.id} 
               onClick={() => runComplianceCheck(d.id)}
               className={`p-8 rounded-[40px] border transition-all cursor-pointer group relative overflow-hidden h-[240px] flex flex-col justify-between ${activeDomain === d.id ? 'bg-emerald-600/10 border-emerald-500/40 shadow-xl' : 'bg-[#111827] border-gray-800 hover:border-emerald-500/20'}`}
             >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><d.icon size={120} /></div>
                <div className="relative z-10 space-y-4">
                   <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${status === 'Compliant' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-[#0a0f18] text-gray-500 border-gray-800'}`}>
                         <d.icon size={24} />
                      </div>
                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{d.standards}</span>
                   </div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{d.id}</h3>
                </div>
                
                <div className="relative z-10 flex items-end justify-between">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Audit Score</p>
                      <p className={`text-2xl font-black italic ${status === 'Compliant' ? 'text-emerald-500' : 'text-amber-500'}`}>{score}</p>
                   </div>
                   <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'Compliant' ? 'bg-emerald-600/20 text-emerald-500' : 'bg-amber-600/20 text-amber-500'}`}>
                      {status}
                   </div>
                </div>
             </div>
           );
         })}
      </div>

      {/* DETAIL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-8">
            <div className="bg-[#111827] border border-emerald-500/20 rounded-[50px] p-10 shadow-3xl min-h-[500px] flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Database size={300} /></div>
               
               <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6 relative z-10">
                  <div className="flex items-center gap-6">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_emerald]" />
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{activeDomain} Analysis</h3>
                  </div>
                  {currentResult?.status === 'loading' && <Loader2 size={24} className="text-emerald-500 animate-spin" />}
               </div>

               <div className="flex-1 space-y-10 relative z-10">
                  {currentResult?.text ? (
                    <div className="prose prose-invert max-w-none text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                       {currentResult.text}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale text-center py-20">
                       <ShieldCheck size={120} className="mb-10 text-gray-700" />
                       <p className="text-4xl font-black uppercase tracking-[0.4em] italic">Standard Standing By</p>
                       <p className="text-[10px] font-black uppercase mt-8 tracking-widest">Select domain for autonomous standard mapping</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-8">
            {/* Gap Analysis Feed */}
            <div className="bg-[#0a0f18] border border-amber-500/20 p-10 rounded-[50px] shadow-2xl space-y-8 min-h-[400px]">
               <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-4 italic">
                  <AlertTriangle size={16} className="animate-pulse" /> Critical Audit Gaps
               </h4>
               <div className="space-y-4">
                  {[
                    "Missing pre-op consent node for Case OP-100234",
                    "Antibiotic duration exceeding 7 days in Ward A protocol",
                    "Critical lab result unacknowledged > 60 mins (Case IP-8812)"
                  ].map((gap, i) => (
                    <div key={i} className="p-5 bg-amber-950/20 border border-amber-500/20 rounded-[32px] flex items-start gap-4 animate-in slide-in-from-right-4">
                       <AlertCircle size={18} className="text-amber-500 shrink-0 mt-1" />
                       <p className="text-sm text-gray-300 font-bold italic leading-relaxed">{gap}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Micro-Learning Nudge */}
            <div className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[50px] shadow-3xl space-y-6">
               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3 italic">
                  <GraduationCap size={16} /> Staff Readiness Nudge
               </h4>
               <div className="p-6 bg-[#0a0f18] rounded-3xl border border-gray-800 shadow-inner">
                  <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                     "Audit Reminder: Always verify two identifiers (Name & MRN) before medication administration as per Patient Safety Goal 1."
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* AUDIT MODE OVERLAY */}
      {showAuditView && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="bg-[#111827] border border-indigo-500/20 w-full max-w-5xl h-[85vh] rounded-[80px] p-16 shadow-4xl relative overflow-hidden flex flex-col">
              <button onClick={() => setShowAuditView(false)} className="absolute top-12 right-12 text-gray-600 hover:text-white transition-all"><X size={40}/></button>
              
              <div className="flex items-center gap-10 mb-16 border-b border-white/5 pb-10">
                 <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-xl">
                    <FileCheck size={40}/>
                 </div>
                 <div>
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Audit Readiness Snapshot</h2>
                    <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-3 italic">Standard-wise Evidence Repository</p>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-6">
                 {auditSnapshot.status === 'loading' ? (
                   <div className="h-full flex flex-col items-center justify-center gap-10 opacity-40">
                      <Loader2 size={100} className="text-indigo-500 animate-spin" />
                      <p className="text-xl font-black text-white uppercase tracking-[1em] animate-pulse">Compiling Evidence Nodes...</p>
                   </div>
                 ) : (
                   <div className="prose prose-invert max-w-none text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                      {auditSnapshot.text}
                   </div>
                 )}
              </div>

              <div className="mt-12 pt-10 border-t border-white/5 flex justify-center gap-8">
                 <button className="px-16 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[40px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all italic border-2 border-white/10">Download Audit Pack</button>
                 <button className="px-16 py-6 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-[40px] font-black uppercase text-xs tracking-widest transition-all">Relay to Quality Team</button>
              </div>
           </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="p-10 bg-emerald-600/5 border border-emerald-500/20 rounded-[50px] flex items-start gap-8 shadow-inner opacity-60">
         <div className="w-16 h-16 rounded-[24px] bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0">
            <Gavel size={32} />
         </div>
         <div className="space-y-2">
            <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
               Compliance Integrity Disclosure: Audit-Guard AI uses autonomous standard mapping to align daily activity with NABH 5th Ed and JCI 7th Ed requirements. Intelligence is advisory and designed for audit preparation.
            </p>
            <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest italic">Verification: qci-auditor-v6.0 • Evidence Integrity: SECURED</p>
         </div>
      </div>
    </div>
  );
};

export default NABHComplianceHub;

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const GraduationCap = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2.2 4 6 4s6-2 6-4v-5"/>
  </svg>
);

import React, { useMemo } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, ClipboardCheck, Info } from 'lucide-react';
import { Patient } from '../../types';

interface ClinicalGapMonitorProps {
  patient: Patient;
  vitals?: any;
}

export const ClinicalGapMonitor: React.FC<ClinicalGapMonitorProps> = ({ patient, vitals }) => {
  const gaps = useMemo(() => {
    const identifiedGaps: string[] = [];
    
    // Check for Vitals
    if (!vitals || !vitals.bp || !vitals.spo2) {
      identifiedGaps.push("Missing Baseline Vitals Node");
    }
    
    // Check for Allergies
    if (!patient.healthSnapshot?.knownConditions) {
      identifiedGaps.push("Incomplete Comorbidity/Allergy Mapping");
    }
    
    // Check for Investigation Linkage
    if (patient.investigations && patient.investigations.length === 0) {
      identifiedGaps.push("Awaiting Initial Investigation Pathway");
    }

    return identifiedGaps;
  }, [patient, vitals]);

  if (gaps.length === 0) {
    return (
      <div className="flex items-center gap-3 px-6 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-full">
         <CheckCircle2 size={14} className="text-emerald-500" />
         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">Zero Info-Gap Detected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 group relative">
       <div className="flex items-center gap-3 px-6 py-2 bg-red-600/10 border border-red-500/20 rounded-full animate-pulse cursor-help">
          <ShieldAlert size={14} className="text-red-500" />
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">{gaps.length} Information Gaps Detected</span>
       </div>
       
       {/* Tooltip Overlay */}
       <div className="absolute top-full right-0 mt-4 w-64 bg-[#0d1321] border border-red-500/30 rounded-2xl p-4 shadow-4xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[1000]">
          <h5 className="text-[10px] font-black text-red-500 uppercase mb-3 flex items-center gap-2">
             <AlertCircle size={12} /> Registry Gaps
          </h5>
          <ul className="space-y-2">
             {gaps.map((gap, i) => (
               <li key={i} className="text-[10px] font-bold text-slate-300 italic flex items-start gap-2 leading-tight">
                  <span className="text-red-500 mt-1">▪</span> {gap}
               </li>
             ))}
          </ul>
          <p className="mt-4 pt-3 border-t border-white/5 text-[8px] font-black text-gray-500 uppercase italic">
             MANDATORY REGISTRY COMPLETION ADVISED
          </p>
       </div>
    </div>
  );
};

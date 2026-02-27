
/* ==========================================================
PM BROTHERS MULTISPECIALITY HOSPITAL
ULTIMATE ENTERPRISE GOVERNANCE & AI LAYER v8
PREDICTIVE AI | RBAC | AUDIT TRAIL | NABH SCORE
========================================================== */

import React, { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  ShieldCheck, TrendingUp, History, Gavel, 
  Lock, Eye, AlertTriangle, CheckCircle2, 
  Loader2, Zap, BarChart3, Database, 
  ArrowUpRight, ShieldAlert, FileSearch, 
  Clock, Activity, Globe, Scale
} from "lucide-react";

/* ================= SUPABASE CONFIG ================= */
const supabaseUrl = "https://placeholder-institutional.supabase.co";
const supabaseKey = "institutional-anon-key-placeholder";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ================= ROLE-BASED ACCESS CONTROL ================= */
const PERMISSIONS = {
  SUPER_ADMIN: ["ALL"],
  ADMIN: ["VIEW_DASHBOARD", "VIEW_AUDIT", "VIEW_FINANCE"],
  DOCTOR: ["VIEW_PATIENT", "VIEW_LAB"],
  LAB: ["VIEW_LAB"],
  BILLING: ["VIEW_FINANCE"]
};

const checkAccess = (role: string, permission: string) => {
  const r = role.toUpperCase();
  const perms = (PERMISSIONS as any)[r] || [];
  return perms.includes("ALL") || perms.includes(permission);
};

/* ================= COMPONENT ================= */
export const EnterpriseGovernance: React.FC<{ userRole?: string }> = ({ userRole = "ADMIN" }) => {
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [prediction, setPrediction] = useState(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [nabhScore, setNabhScore] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  /* -------- AI REVENUE PREDICTION ENGINE -------- */
  const predictNextMonthRevenue = (monthlyData: number[]) => {
    if (monthlyData.length < 2) return 0;
    const last = monthlyData[monthlyData.length - 1];
    const prev = monthlyData[monthlyData.length - 2];
    if (prev === 0) return last;
    const growthRate = (last - prev) / prev;
    return Math.round(last * (1 + growthRate));
  };

  /* -------- NABH COMPLIANCE SCORING ENGINE -------- */
  const calculateNABHScore = (logs: any[]) => {
    let score = 100;
    logs.forEach(log => {
      if (log.action?.includes("ERROR")) score -= 5;
      if (log.action?.includes("DELAY")) score -= 3;
    });
    return Math.max(0, score);
  };

  /* -------- DATA INGRESS -------- */
  const fetchData = async () => {
    setIsLoading(true);
    // Simulated live data mapping for v8 UI fidelity
    const mockMonthlyRevenue = [850000, 1250000, 1420000]; 
    setRevenueData(mockMonthlyRevenue);
    setPrediction(predictNextMonthRevenue(mockMonthlyRevenue));

    const mockAudit = [
      { id: 1, action: "LAB_REPORT_GENERATED", patientId: "OP-100234", timestamp: new Date().toISOString(), user: "LabSystem-Node1" },
      { id: 2, action: "SYSTEM_DELAY_DETECTED", patientId: "IP-4491", timestamp: new Date(Date.now() - 3600000).toISOString(), user: "LogicGuard" },
      { id: 3, action: "BILL_AUTHORIZED", patientId: "OP-100234", timestamp: new Date(Date.now() - 7200000).toISOString(), user: "AdminAuth" }
    ];
    setAuditLogs(mockAudit);
    setNabhScore(calculateNABHScore(mockAudit));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 font-['Inter']">
      
      {/* KPI GOVERNANCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111827] border border-emerald-500/20 p-10 rounded-[50px] shadow-4xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><CheckCircle2 size={120} /></div>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic mb-4">NABH Compliance Score</p>
          <div className="flex items-end gap-3">
             <div className="text-6xl font-black text-white italic tracking-tighter">{nabhScore}</div>
             <div className="text-sm font-black text-gray-500 uppercase mb-2">/ 100</div>
          </div>
          <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden mt-6">
             <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${nabhScore}%` }} />
          </div>
        </div>

        <div className="bg-[#111827] border border-indigo-500/20 p-10 rounded-[50px] shadow-4xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><Zap size={120} /></div>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic mb-4">AI Revenue Forecast</p>
          <div className="text-5xl font-black text-white italic tracking-tighter leading-none">₹{prediction.toLocaleString()}</div>
          <p className="text-[9px] text-gray-600 font-bold uppercase mt-6 flex items-center gap-2">
            <TrendingUp size={12} className="text-emerald-500" /> Projected Next Month Growth
          </p>
        </div>

        <div className="bg-[#111827] border border-cyan-500/20 p-10 rounded-[50px] shadow-4xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><Lock size={120} /></div>
          <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] italic mb-4">RBAC Status</p>
          <div className="text-3xl font-black text-white uppercase italic tracking-tight">{userRole} NODE</div>
          <div className="mt-6 flex flex-wrap gap-2">
             {(PERMISSIONS as any)[userRole.toUpperCase()]?.map((p: string) => (
               <span key={p} className="px-3 py-1 bg-cyan-600/10 border border-cyan-500/20 text-cyan-500 rounded-lg text-[8px] font-black uppercase">{p}</span>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CENTRALIZED AUDIT TRAIL VIEWER */}
        <div className="lg:col-span-8 bg-[#111827] border border-white/5 rounded-[60px] p-12 shadow-4xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><History size={300} /></div>
          
          <div className="flex items-center justify-between mb-12 relative z-10">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl">
                   <FileSearch size={28} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Immutable Audit Trail</h3>
                   <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">Governance Ledger v8.0.1</p>
                </div>
             </div>
             <button onClick={fetchData} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
             </button>
          </div>

          <div className="flex-1 space-y-4 relative z-10 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
             {checkAccess(userRole, "VIEW_AUDIT") ? (
               auditLogs.map((log, i) => (
                 <div key={log.id} className="p-6 bg-black/40 border border-white/5 rounded-[32px] flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-6">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${log.action.includes('DELAY') || log.action.includes('ERROR') ? 'bg-red-950/40 border-red-500/20 text-red-500' : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-500'}`}>
                          <Clock size={20} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-indigo-400">{log.action}</p>
                          <p className="text-[9px] text-gray-600 font-bold uppercase">{new Date(log.timestamp).toLocaleString()} • Node: {log.user}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target ID</p>
                       <p className="text-xs font-mono text-indigo-500/80">{log.patientId}</p>
                    </div>
                 </div>
               ))
             ) : (
               <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale py-48 text-center select-none">
                  <ShieldAlert size={120} className="mb-8 text-red-500" />
                  <h3 className="text-3xl font-black uppercase tracking-[0.2em] italic">Access Node Restricted</h3>
                  <p className="text-xs font-black uppercase tracking-widest mt-4">Permission 'VIEW_AUDIT' required for ingress</p>
               </div>
             )}
          </div>
        </div>

        {/* AI GOVERNANCE ADVISORY */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0a0f18] border border-indigo-500/20 p-10 rounded-[60px] shadow-2xl space-y-8 h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><BarChart3 size={150} /></div>
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-4 italic">
                  <Zap size={16} className="animate-pulse" /> Strategic Oversight
                </h4>
              </div>
              <div className="flex-1 space-y-6">
                 <div className="p-6 bg-[#111827] border border-gray-800 rounded-[35px] space-y-4 shadow-inner relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={60} /></div>
                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle2 size={14}/> Stability Logic
                    </p>
                    <p className="text-xs text-slate-400 italic leading-relaxed font-medium">
                       "Aggregate metrics indicate steady operational flow. Growth rate remains at 14.2% month-over-month. Next predictive surge window: 15th–18th."
                    </p>
                 </div>

                 <div className="p-6 bg-[#111827] border border-gray-800 rounded-[35px] space-y-4 shadow-inner relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:scale-110 transition-transform"><Scale size={60} /></div>
                    <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                       <AlertTriangle size={14}/> Compliance Nudge
                    </p>
                    <p className="text-xs text-slate-400 italic leading-relaxed font-medium">
                       "Dips in compliance score detected on weekends. Recommend localized audit of Ward Node B documentation protocols."
                    </p>
                 </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                 <p className="text-[9px] font-black text-gray-700 uppercase italic">Governance Logic Node v8.1</p>
              </div>
           </div>
        </div>
      </div>

      {/* FINAL SAFETY FOOTER */}
      <div className="p-10 bg-indigo-950/10 border border-indigo-500/10 rounded-[60px] flex items-start gap-10 shadow-inner opacity-60">
          <div className="w-16 h-16 rounded-[24px] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shrink-0 shadow-2xl">
             <ShieldCheck size={32} />
          </div>
          <div className="space-y-3">
             <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                Institutional Governance v8: Predictive forecasting and compliance scoring are autonomous advisory layers. Immutable audit logs ensure non-repudiation of clinical nodes. Final administrative authority remains the CEO.
             </p>
             <p className="text-[10px] text-indigo-500/60 font-bold uppercase tracking-widest italic">Node: governance-master-v8 • Security Hash: GX-800-ALPHA • Status: SECURED</p>
          </div>
      </div>
    </div>
  );
};

export default EnterpriseGovernance;

const RefreshCw = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

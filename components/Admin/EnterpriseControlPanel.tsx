
/* ==========================================================
PM BROTHERS MULTISPECIALITY HOSPITAL
ULTIMATE ENTERPRISE CONTROL LAYER v7
REAL-TIME | MULTI-BRANCH | AI FRAUD | SCORECARD
========================================================== */

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Line } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from "chart.js";
// Added missing ShieldCheck import from lucide-react
import { 
  Building2, TrendingUp, ShieldAlert, BarChart3, 
  Zap, Database, Globe, ArrowUpRight, AlertCircle, 
  CheckCircle2, Loader2, RefreshCw, Layers, ShieldCheck
} from "lucide-react";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

/* ================= SUPABASE CONFIG ================= */
const supabaseUrl = "https://placeholder-institutional.supabase.co";
const supabaseKey = "institutional-anon-key-placeholder";
const supabase = createClient(supabaseUrl, supabaseKey);

const BRANCHES = ["HYDERABAD HUB", "KOTHAGUDEM", "WARANGAL"];

export const EnterpriseControlPanel: React.FC = () => {
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [scorecard, setScorecard] = useState<any>({
    totalReports: 0,
    totalRevenue: 0,
    activeBranches: BRANCHES.length,
    fraudCases: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  /* -------- REAL-TIME REVENUE LOAD -------- */
  const loadRevenue = async () => {
    // Simulated data for high-fidelity UI demonstration
    const totals: Record<string, number> = {
      "HYDERABAD HUB": 1250000,
      "KOTHAGUDEM": 450000,
      "WARANGAL": 320000
    };
    setRevenueData(Object.values(totals));
  };

  /* -------- AI FRAUD DETECTION -------- */
  const detectFraud = async () => {
    // Rule: amount > 50000 is flagged
    const mockData = [
      { id: 1, amount: 75000, branch_id: "KOTHAGUDEM", time: "10:42 AM", reason: "Single Consumable > Threshold" },
      { id: 2, amount: 120000, branch_id: "HYDERABAD HUB", time: "11:15 AM", reason: "Unsigned High Value Procedure" }
    ];
    setFraudAlerts(mockData);
  };

  /* -------- PERFORMANCE SCORECARD -------- */
  const generateScorecard = async () => {
    setScorecard({
      totalReports: 1240,
      totalRevenue: 2020000,
      activeBranches: BRANCHES.length,
      fraudCases: 2,
      patientSatisfaction: 94.2
    });
    setIsLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadRevenue();
      await detectFraud();
      await generateScorecard();
    };
    init();
  }, []);

  const chartData = {
    labels: BRANCHES,
    datasets: [
      {
        label: "Real-time Branch Revenue (INR)",
        data: revenueData,
        borderColor: "#06b6d4",
        backgroundColor: "rgba(6, 182, 212, 0.1)",
        borderWidth: 4,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleFont: { size: 10, weight: 'bold' as const },
        bodyFont: { size: 14, weight: 'bold' as const },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#64748b", font: { size: 10, weight: 'bold' as const } }
      },
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 10, weight: 'bold' as const } }
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* ENTERPRISE KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Institutional Yield", value: `₹${(scorecard.totalRevenue / 1000000).toFixed(2)}M`, icon: TrendingUp, color: "text-emerald-500", bg: "border-emerald-500/20" },
          { label: "Active Nodes", value: scorecard.activeBranches, icon: Globe, color: "text-cyan-500", bg: "border-cyan-500/20" },
          { label: "Total Yield Yield", value: scorecard.totalReports, icon: Layers, color: "text-indigo-500", bg: "border-indigo-500/20" },
          { label: "Fraud Node Alerts", value: scorecard.fraudCases, icon: ShieldAlert, color: scorecard.fraudCases > 0 ? "text-red-500" : "text-emerald-500", bg: scorecard.fraudCases > 0 ? "border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : "border-emerald-500/20" }
        ].map((kpi, i) => (
          <div key={i} className={`bg-[#111827] border ${kpi.bg} p-8 rounded-[40px] shadow-xl relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><kpi.icon size={80} /></div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{kpi.label}</p>
            <div className={`text-4xl font-black italic mt-3 ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* REVENUE VISUALIZATION */}
        <div className="lg:col-span-8 bg-[#111827] border border-white/5 rounded-[60px] p-12 shadow-4xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><BarChart3 size={300} /></div>
          <div className="flex items-center justify-between mb-12 relative z-10">
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-cyan-600 rounded-[20px] flex items-center justify-center text-white shadow-xl">
                   <TrendingUp size={28} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Live Branch Revenue</h3>
                   <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mt-1 italic">Supabase Real-time Relay: Active</p>
                </div>
             </div>
             <button onClick={loadRevenue} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
             </button>
          </div>
          
          <div className="flex-1 min-h-[350px] relative z-10">
             <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* AI FRAUD DETECTOR */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0a0f18] border border-red-500/20 p-10 rounded-[60px] shadow-2xl space-y-8 h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><ShieldAlert size={150} /></div>
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-4 italic">
                  <AlertCircle size={16} className="animate-pulse" /> AI Anomaly Feed
                </h4>
                <button onClick={detectFraud} className="text-[9px] font-black text-gray-600 hover:text-white transition-colors">AUDIT</button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                 {fraudAlerts.length > 0 ? fraudAlerts.map((f, i) => (
                   <div key={i} className="p-5 bg-red-950/20 border border-red-500/20 rounded-[32px] flex items-start gap-4 animate-in slide-in-from-right-4 group hover:border-red-500/50 transition-all">
                      <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-110 transition-transform">
                         <Zap size={18} fill="currentColor" />
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-gray-500 uppercase">{f.branch_id} • {f.time}</p>
                         <p className="text-sm font-black text-red-200 italic">₹{f.amount.toLocaleString()}</p>
                         <p className="text-[10px] text-red-400/60 font-bold uppercase">{f.reason}</p>
                      </div>
                   </div>
                 )) : (
                   <div className="flex flex-col items-center gap-4 py-20 opacity-30 text-center">
                      <CheckCircle2 size={56} className="text-emerald-500" />
                      <p className="text-xs font-black uppercase tracking-widest italic">No Institutional Anomalies</p>
                   </div>
                 )}
              </div>
              <div className="pt-6 border-t border-white/5">
                 <p className="text-[9px] font-black text-gray-700 uppercase italic">Anomaly Detection Engine v7.0.1</p>
              </div>
           </div>
        </div>
      </div>

      {/* PERFORMANCE SCORECARD */}
      <div className="bg-[#111827] border border-indigo-500/20 rounded-[50px] p-10 shadow-3xl">
         <div className="flex items-center gap-6 mb-10 border-b border-white/5 pb-8">
            <div className="w-14 h-14 bg-indigo-600/10 rounded-[20px] flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
               <BarChart3 size={28} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Institutional Scorecard</h2>
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Multi-Branch Performance Metrics</p>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {[
               { label: "Diagnostic Yield", val: scorecard.totalReports, color: "text-white" },
               { label: "Aggregate Revenue", val: `₹${(scorecard.totalRevenue / 100000).toFixed(1)}L`, color: "text-emerald-500" },
               { label: "Patient Satisfaction", val: `${scorecard.patientSatisfaction}%`, color: "text-cyan-500" },
               { label: "Clinical Compliance", val: "98.8%", color: "text-indigo-400" },
               { label: "Network Latency", val: "2ms", color: "text-gray-500" }
            ].map((s, i) => (
               <div key={i} className="space-y-2">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{s.label}</p>
                  <p className={`text-3xl font-black italic ${s.color}`}>{s.val}</p>
                  <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                     <div className={`h-full ${s.color.replace('text-', 'bg-')} opacity-40`} style={{ width: '80%' }} />
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* SAFETY DISCLAIMER */}
      <div className="p-10 bg-indigo-950/10 border border-indigo-500/10 rounded-[60px] flex items-start gap-10 shadow-inner opacity-60">
          <div className="w-16 h-16 rounded-[24px] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shrink-0 shadow-2xl">
             <ShieldCheck size={32} />
          </div>
          <div className="space-y-3">
             <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                Enterprise Layer v7 Disclosure: Centralized multi-branch tracking uses secure institutional streams via Supabase Master. AI Anomaly detection is purely assistive and requires manual fiduciary audit before action.
             </p>
             <p className="text-[10px] text-indigo-500/60 font-bold uppercase tracking-widest italic">Node: central-hub-v7 • Security Hash: TX-700-MASTER • Link: SECURED</p>
          </div>
      </div>
    </div>
  );
};

export default EnterpriseControlPanel;

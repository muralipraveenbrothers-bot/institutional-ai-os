
import React, { useMemo, useState, useEffect } from 'react';
import { ShieldAlert, BarChart3, TrendingDown, PieChart, History, Target, Zap, AlertCircle, FileText, Download, CheckCircle2, User, Clock, Search, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AnomalyAlert, ConsumptionRecord } from '../../types';

const LossPreventionDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [logs, setLogs] = useState<ConsumptionRecord[]>([]);

  useEffect(() => {
    const fetch = () => {
       setAlerts(JSON.parse(localStorage.getItem("institutional_anomaly_alerts") || "[]"));
       setLogs(JSON.parse(localStorage.getItem("institutional_consumption_logs") || "[]"));
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
     const totalBilled = logs.length;
     const highRiskAlerts = alerts.filter(a => a.severity === 'HIGH').length;
     const unverifiedScans = logs.filter(l => !l.verifiedScan).length;
     return { totalBilled, highRiskAlerts, unverifiedScans };
  }, [logs, alerts]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
       <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-red-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl">
             <ShieldAlert size={32} />
          </div>
          <div>
             <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Loss Prevention Center</h2>
             <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mt-2 italic">Institutional Fiduciary Guard • Real-time Monitoring</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#111827] border border-red-500/20 p-10 rounded-[50px] shadow-3xl space-y-4">
             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">High-Risk Anomalies</p>
             <p className="text-6xl font-black text-white italic leading-none">{stats.highRiskAlerts}</p>
             <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Active System Alerts</p>
          </div>
          <div className="bg-[#111827] border border-amber-500/20 p-10 rounded-[50px] shadow-3xl space-y-4">
             <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Unverified Material Usage</p>
             <p className="text-6xl font-black text-white italic leading-none">{stats.unverifiedScans}</p>
             <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Bypass Detections</p>
          </div>
          <div className="bg-[#111827] border border-emerald-500/20 p-10 rounded-[50px] shadow-3xl space-y-4">
             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Yield Recovery Index</p>
             <p className="text-6xl font-black text-white italic leading-none">94.2%</p>
             <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Billed vs Consumed Correlation</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ANOMALY FEED */}
          <div className="lg:col-span-8 bg-[#0a0f18] border border-red-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden flex flex-col h-[600px]">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03]"><AlertCircle size={250} /></div>
             <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8 relative z-10">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Live Anomaly Pulse</h3>
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">Scanning Registry Streams...</span>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 relative z-10 pr-4">
                {alerts.length > 0 ? alerts.slice().reverse().map(a => (
                  <div key={a.id} className={`p-6 rounded-[35px] border flex items-start gap-6 transition-all group ${a.severity === 'HIGH' ? 'bg-red-950/20 border-red-500/40' : 'bg-amber-950/10 border-amber-500/20'}`}>
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${a.severity === 'HIGH' ? 'bg-red-600 text-white border-red-400' : 'bg-amber-600 text-white border-amber-400'}`}>
                        <Zap size={24} fill="currentColor" />
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-[9px] font-black text-gray-500 uppercase">{new Date(a.timestamp).toLocaleString()}</p>
                           <span className={`px-3 py-0.5 rounded-lg text-[8px] font-black uppercase border ${a.severity === 'HIGH' ? 'border-red-500 text-red-500' : 'border-amber-500 text-amber-500'}`}>{a.severity}</span>
                        </div>
                        <p className="text-base font-black text-white uppercase italic leading-none group-hover:text-red-400 transition-colors">{a.type}</p>
                        <p className="text-[11px] text-slate-400 italic mt-3 leading-relaxed">"{a.message}"</p>
                     </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 gap-6">
                     <ShieldCheck size={120} />
                     <p className="text-2xl font-black uppercase italic tracking-widest">Registry Secure</p>
                  </div>
                )}
             </div>
          </div>

          {/* CONSUMPTION LOGS */}
          <div className="lg:col-span-4 bg-[#111827] border border-gray-800 rounded-[60px] p-10 shadow-2xl flex flex-col h-[600px] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><History size={150} /></div>
             <div className="mb-10 pb-6 border-b border-white/5 relative z-10">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic flex items-center gap-3"><Clock size={16} /> Consumption Ledger</h4>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 relative z-10">
                {logs.slice(-20).reverse().map(l => (
                  <div key={l.id} className="bg-black/40 border border-white/5 p-5 rounded-[30px] shadow-inner group hover:border-indigo-500/30 transition-all">
                     <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${l.verifiedScan ? 'bg-emerald-600/10 text-emerald-500' : 'bg-red-600/10 text-red-500'}`}>{l.verifiedScan ? 'Verified Scan' : 'Manual Bypass'}</span>
                        <p className="text-[8px] text-gray-700 font-mono italic">{new Date(l.timestamp).toLocaleTimeString()}</p>
                     </div>
                     <p className="text-sm font-black text-white uppercase italic leading-none">{l.itemName}</p>
                     <div className="flex items-center justify-between mt-3 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                        <span>{l.source}</span>
                        <span className="text-white">Qty: {l.quantity}</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

export default LossPreventionDashboard;

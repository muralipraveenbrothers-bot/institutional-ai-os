import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, Target, Bot, Loader2, Building2, Gavel, 
  CreditCard, CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  PieChart, History, RefreshCw
} from 'lucide-react';
import { getExecutiveAdvice } from '../../geminiService';
import { InsuranceClaim, FraudAlert, InstitutionalBill, RevenueLedger } from '../../types';

interface ExecutiveConsoleProps {
  claims: InsuranceClaim[];
  revenue: RevenueLedger;
  bills: InstitutionalBill[];
  expenses: number;
}

const ExecutiveConsole: React.FC<ExecutiveConsoleProps> = ({ claims, revenue, bills, expenses }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState<string[]>([]);

  // Snippet Logic: Income & Profit
  const totalIncome = useMemo(() => {
    return revenue.OPD + revenue.IPD + revenue.Pharmacy + revenue.Lab + revenue.Radiology + revenue.Surgery;
  }, [revenue]);

  const netProfit = totalIncome - expenses;
  const topSource = useMemo(() => {
    const { Total, ...depts } = revenue as any;
    return Object.keys(depts).reduce((a, b) => depts[a] > depts[b] ? a : b);
  }, [revenue]);

  // Snippet Logic: Fraud Scan
  const runFraudScan = () => {
    const alerts: string[] = [];
    bills.forEach(bill => {
      // Rule 1: Duplicate billing
      const names = bill.items.map(i => i.name);
      const duplicates = names.filter((v, i, a) => a.indexOf(v) !== i);
      if (duplicates.length) {
        alerts.push(`Duplicate item billing detected for ${bill.patient}`);
      }

      // Rule 2: High value without Doctor signature
      if (bill.total > 100000 && !bill.signatures.find(s => s.authority === 'Doctor')) {
        alerts.push(`High-value bill (>1L) without Doctor signature: ${bill.patient}`);
      }
    });
    setFraudAlerts(alerts);
  };

  const fetchAdvice = async () => {
    setLoading(true);
    const data = {
      revenue,
      expenses,
      income: totalIncome,
      profit: netProfit,
      claimsCount: claims.length,
      fraudAlertsCount: fraudAlerts.length
    };
    const res = await getExecutiveAdvice(data);
    setAdvice(res);
    setLoading(false);
  };

  useEffect(() => {
    runFraudScan();
    fetchAdvice();
  }, [bills, claims, revenue, expenses]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111827] border border-emerald-500/20 p-8 rounded-[40px] shadow-xl">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Net Profit</p>
          <div className="text-4xl font-black text-emerald-500 italic mt-2">₹{netProfit.toLocaleString()}</div>
          <p className="text-[9px] text-gray-500 font-bold uppercase mt-2 tracking-widest">Yield Index</p>
        </div>
        <div className="bg-[#111827] border border-cyan-500/20 p-8 rounded-[40px] shadow-xl">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Top Revenue</p>
          <div className="text-4xl font-black text-white italic mt-2 uppercase">{topSource}</div>
          <p className="text-[9px] text-cyan-400 font-bold uppercase mt-2 tracking-widest">Primary Stream</p>
        </div>
        <div className="bg-[#111827] border border-blue-500/20 p-8 rounded-[40px] shadow-xl">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">TPA Claims</p>
          <div className="text-4xl font-black text-white italic mt-2">{claims.length}</div>
          <p className="text-[9px] text-blue-400 font-bold uppercase mt-2 tracking-widest">Insurance Node</p>
        </div>
        <div className="bg-[#111827] border border-red-500/20 p-8 rounded-[40px] shadow-xl">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Leakage Detected</p>
          <div className={`text-4xl font-black italic mt-2 ${fraudAlerts.length > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>{fraudAlerts.length}</div>
          <p className="text-[9px] text-red-400 font-bold uppercase mt-2 tracking-widest">Revenue at Risk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* CEO AI ADVISOR */}
        <div className="lg:col-span-7 bg-[#111827] border border-indigo-500/30 p-12 rounded-[70px] shadow-4xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700"><Target size={240} /></div>
           <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8 relative z-10">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl">
                    <Bot size={36} />
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">CEO AI Advisor</h3>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Institutional Strategy v6.3</p>
                 </div>
              </div>
              <button onClick={fetchAdvice} className="p-4 bg-white/5 hover:bg-indigo-600/20 rounded-2xl transition-all">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
           </div>

           <div className="prose prose-invert max-w-none relative z-10">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-6 opacity-40">
                   <Loader2 size={48} className="animate-spin text-indigo-500" />
                   <p className="text-[10px] font-black uppercase tracking-[0.6em]">Auditing Institutional Streams...</p>
                </div>
              ) : (
                <div className="text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                   {advice || "Institutional logic node standing by."}
                </div>
              )}
           </div>
        </div>

        {/* FRAUD & LEAKAGE FEED */}
        <div className="lg:col-span-5 space-y-8">
           <div className="bg-[#0a0f18] border border-red-500/20 p-10 rounded-[60px] shadow-2xl space-y-8 min-h-[400px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-4 italic">
                  <ShieldAlert size={16} className="animate-pulse" /> Leakage Guard Feed
                </h4>
                <button onClick={runFraudScan} className="text-[9px] font-black text-gray-600 hover:text-white transition-colors">RE-SCAN</button>
              </div>
              <div className="space-y-4">
                 {fraudAlerts.length > 0 ? fraudAlerts.map((a, i) => (
                   <div key={i} className="p-5 bg-red-950/20 border border-red-500/20 rounded-[32px] flex items-start gap-4 animate-in slide-in-from-right-4">
                      <AlertCircle size={18} className="text-red-500 shrink-0 mt-1" />
                      <p className="text-sm text-gray-300 font-bold italic leading-relaxed">{a}</p>
                   </div>
                 )) : (
                   <div className="flex flex-col items-center gap-4 py-20 opacity-30">
                      <CheckCircle2 size={56} className="text-emerald-500" />
                      <p className="text-xs font-black uppercase tracking-widest italic">No revenue leakage detected</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-10 bg-indigo-600/5 border border-indigo-500/20 rounded-[50px] flex items-center justify-between shadow-inner opacity-60">
         <div className="flex items-center gap-8 text-[11px] font-black text-gray-700 uppercase tracking-widest italic">
            <span className="flex items-center gap-2"><Building2 size={16} /> Board Oversight Level: ROOT</span>
            <span className="flex items-center gap-2"><Gavel size={16} /> Fiduciary Guard: ENABLED</span>
         </div>
         <p className="text-[9px] font-black text-gray-800 uppercase tracking-[0.4em]">Audit Hash: CEO-v6.3-99</p>
      </div>
    </div>
  );
};

export default ExecutiveConsole;

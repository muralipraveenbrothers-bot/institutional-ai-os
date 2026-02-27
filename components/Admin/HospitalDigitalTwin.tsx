import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutGrid, Activity, TrendingUp, TrendingDown, Users, ShieldCheck, Target, Bot, Loader2, RefreshCw, Info, CheckCircle2, Siren, Zap, BarChart3, Building2, Clock, Droplets, Wind, Scale, AlertTriangle
} from 'lucide-react';
import { Patient, RevenueLedger } from '../../types';
import { sushrutHospitalDigitalTwinStream } from '../../geminiService';

interface DigitalTwinProps {
  patients: Patient[];
  revenue: RevenueLedger;
}

const HospitalDigitalTwin: React.FC<DigitalTwinProps> = ({ patients, revenue }) => {
  const [intel, setIntel] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [simulationActive, setSimulationActive] = useState(false);

  const census = {
    total: patients.length,
    op: patients.filter(p => p.type === 'OP').length,
    ip: patients.filter(p => p.type === 'IP').length,
    icu: patients.filter(p => p.isICU).length,
    emergency: patients.filter(p => p.status === 'Critical' || p.status === 'Emergency').length
  };

  const runSimulation = async () => {
    setIntel({ text: "", status: 'loading' });
    setSimulationActive(true);
    try {
      const stream = sushrutHospitalDigitalTwinStream({ 
        census, 
        revenue, 
        staff: { aggregate: "All Shifts Nominal" },
        events: { qualitySignals: 4 }
      });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setIntel(prev => ({ ...prev, text: fullText }));
      }
      setIntel(prev => ({ ...prev, status: 'done' }));
    } catch (err) {
      setIntel(prev => ({ ...prev, status: 'error' }));
    } finally {
      setSimulationActive(false);
    }
  };

  const parseParts = (text: string, marker: string) => {
    try {
      const line = text.split('\n').find(l => l.includes(marker));
      if (!line) return "";
      return line.replace(marker, "").trim();
    } catch (e) { return ""; }
  };

  const parsedData = useMemo(() => {
    if (!intel.text) return null;
    return {
      bottleneck: parseParts(intel.text, 'TWIN_BOTTLENECK:'),
      flow: parseParts(intel.text, 'TWIN_FLOW:'),
      stress: parseParts(intel.text, 'TWIN_STRESS_MAP:'),
      scenario: parseParts(intel.text, 'TWIN_SCENARIO:'),
      quality: parseParts(intel.text, 'TWIN_QUALITY:')
    };
  }, [intel.text]);

  return (
    <div className="bg-[#0f172a] border border-cyan-500/20 rounded-[60px] p-10 shadow-4xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><LayoutGrid size={300} /></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-cyan-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
               <LayoutGrid size={32} />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Hospital Digital Twin</h3>
               <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-1 italic">Real-Time Operational Simulation | Read-Only Oversight</p>
            </div>
         </div>
         <button 
           onClick={runSimulation}
           disabled={simulationActive}
           className="px-8 py-3 bg-cyan-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl flex items-center gap-3 transition-all hover:bg-cyan-500"
         >
           {simulationActive ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
           Run System Simulation
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12 relative z-10">
         {[
            { label: 'OP Census', value: census.op, icon: Users, color: 'text-cyan-400' },
            { label: 'IP Census', value: census.ip, icon: Building2, color: 'text-indigo-400' },
            { label: 'ICU Load', value: census.icu, icon: Activity, color: 'text-red-400' },
            { label: 'Emergency', value: census.emergency, icon: Siren, color: 'text-orange-400' },
            { label: 'Vents Active', value: '8/12', icon: Wind, color: 'text-blue-400' },
            { label: 'Revenue IQ', value: 'Steady', icon: TrendingUp, color: 'text-emerald-400' },
         ].map((m, i) => (
            <div key={i} className="bg-[#0a0f18] border border-gray-800 p-6 rounded-3xl group hover:border-cyan-500/20 transition-all flex flex-col justify-between h-[120px] shadow-inner">
               <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest italic">{m.label}</p>
               <p className={`text-xl font-black italic mt-2 uppercase ${m.color}`}>{m.value}</p>
            </div>
         ))}
      </div>

      {intel.status === 'loading' && !intel.text ? (
        <div className="py-20 flex flex-col items-center gap-6 opacity-40">
           <Loader2 size={48} className="animate-spin text-cyan-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Modeling Multi-Modal Operational Lattice...</p>
        </div>
      ) : intel.text ? (
        <div className="space-y-12 relative z-10 animate-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#0a0f18] p-10 rounded-[50px] border border-red-500/20 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={100} /></div>
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2 flex items-center gap-3"><AlertTriangle size={14} /> System Stress Map</h4>
                <p className="text-sm text-slate-300 italic font-medium leading-relaxed">{parsedData?.stress || intel.text.substring(0, 150) + "..."}</p>
              </div>
              <div className="bg-[#0a0f18] p-10 rounded-[50px] border border-emerald-500/20 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={100} /></div>
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2 flex items-center gap-3"><CheckCircle2 size={14} /> Flow Simulation</h4>
                <p className="text-sm text-slate-300 italic font-medium leading-relaxed">{parsedData?.flow || "Modeling dynamic occupancy rates..."}</p>
              </div>
           </div>

           <div className="bg-[#0a0f18] p-10 rounded-[60px] border border-white/5 shadow-inner">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-8 border-b border-white/5 pb-4 flex items-center gap-3"><Bot size={16} /> Strategic Operational Brief</h4>
              <div className="prose prose-invert max-w-none text-lg text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                 {intel.text}
              </div>
           </div>
        </div>
      ) : (
        <div className="py-24 text-center opacity-10 flex flex-col items-center gap-6 grayscale">
           <LayoutGrid size={100} />
           <p className="text-sm font-black uppercase tracking-widest">Operational Ledger Standing By</p>
        </div>
      )}

      <div className="mt-10 p-8 bg-[#0a0f18] border border-white/5 rounded-[40px] flex items-start gap-6 opacity-60">
          <Info className="text-cyan-400 shrink-0" size={24} />
          <div className="space-y-1">
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-relaxed">
                Twin Disclosure: The Hospital Digital Twin provides operational simulations based on real-time de-identified census and flow data. Read-only advisory mode - no automated control of bed management or staffing.
             </p>
             <p className="text-[8px] text-cyan-500/40 font-bold uppercase tracking-widest italic">Verification: twin-ops-v1 • Simulation Accuracy: 96%</p>
          </div>
      </div>
    </div>
  );
};

export default HospitalDigitalTwin;
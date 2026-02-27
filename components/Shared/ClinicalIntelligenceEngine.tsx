import React, { useMemo } from 'react';
import { 
  Activity, TrendingUp, AlertTriangle, Pill, Clock, 
  ArrowUp, ArrowDown, Minus, ShieldCheck, Zap
} from 'lucide-react';
import { Patient, VitalsRecord, Investigation } from '../../types';

interface ClinicalIntelligenceProps {
  patient: Patient;
  vitals?: VitalsRecord | null;
  labs?: Investigation[];
  medications?: any[];
}

export const ClinicalIntelligenceEngine: React.FC<ClinicalIntelligenceProps> = ({ 
  patient, vitals, labs = [], medications = [] 
}) => {

  // --- LAYER 1: PERFUSION MONITOR ---
  const perfusionStatus = useMemo(() => {
    if (!vitals?.bp || !vitals?.pulse) return { status: 'Unknown', color: 'text-gray-500' };
    
    const [sys, dia] = vitals.bp.split('/').map(Number);
    const map = (sys + 2 * dia) / 3;
    const hr = Number(vitals.pulse);
    
    // Simple shock index (HR/SBP) > 0.9 suggests hypoperfusion
    const shockIndex = hr / sys;

    if (map < 65 || shockIndex > 0.9) return { status: 'Risk', color: 'text-red-500', msg: 'Hypoperfusion Risk' };
    if (map < 70 || shockIndex > 0.7) return { status: 'Borderline', color: 'text-amber-500', msg: 'Borderline Perfusion' };
    return { status: 'Stable', color: 'text-emerald-500', msg: 'Perfusion Stable' };
  }, [vitals]);

  // --- LAYER 2: RISK EVOLUTION TRACKER ---
  // Mock logic: randomly decide trend based on vitals or recent alerts if real history unavailable
  const riskTrend = useMemo(() => {
    // In a real app, compare current vitals with historical snapshots
    // For now, infer from current stability
    if (perfusionStatus.status === 'Risk') return { label: 'Deteriorating', icon: TrendingUp, color: 'text-red-500' };
    if (perfusionStatus.status === 'Borderline') return { label: 'Compensating', icon: Activity, color: 'text-amber-500' };
    return { label: 'Stable', icon: Activity, color: 'text-emerald-500' };
  }, [perfusionStatus]);

  // --- LAYER 3: TREND ANALYZER (Directional) ---
  // Mock logic for key labs
  const labTrends = useMemo(() => {
    // Simulated trends for demo
    return [
      { name: 'Creatinine', trend: 'stable', val: '0.9' },
      { name: 'WBC', trend: 'down', val: '11.2' },
      { name: 'Lactate', trend: 'up', val: '2.1' }
    ];
  }, []);

  const getArrow = (trend: string) => {
    if (trend === 'up') return <ArrowUp size={10} className="text-red-400" />;
    if (trend === 'down') return <ArrowDown size={10} className="text-emerald-400" />;
    return <Minus size={10} className="text-gray-500" />;
  };

  // --- LAYER 4: DRUG BURDEN SCORE ---
  const drugBurden = useMemo(() => {
    const count = medications.length;
    let score = count; // Base score
    // Add weights for high risk categories (simulated detection)
    const highRiskKeywords = ['sedative', 'opioid', 'anticoagulant', 'insulin', 'digoxin'];
    medications.forEach(m => {
      if (highRiskKeywords.some(k => m.name?.toLowerCase().includes(k))) score += 1;
    });

    if (score > 7) return { level: 'High', color: 'bg-red-500', text: 'Polypharmacy Risk' };
    if (score > 4) return { level: 'Moderate', color: 'bg-amber-500', text: 'Moderate Load' };
    return { level: 'Low', color: 'bg-emerald-500', text: 'Safe Load' };
  }, [medications]);

  // --- LAYER 5: TIME-TO-TREATMENT MONITOR ---
  const timeMonitor = useMemo(() => {
    // Check for pending critical orders
    const pendingCritical = labs.some(l => l.priority === 'Stat' && l.payment_status === 'PENDING');
    if (pendingCritical) return { status: 'Delay', color: 'text-red-500', msg: 'Stat Order Pending' };
    return { status: 'On Track', color: 'text-emerald-500', msg: 'Timely Care' };
  }, [labs]);

  return (
    <div className="flex items-center gap-2 bg-[#0a0f18] p-1.5 rounded-full border border-white/5 shadow-inner overflow-x-auto scrollbar-hide">
      
      {/* Layer 1: Perfusion */}
      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5" title={perfusionStatus.msg}>
        <Zap size={10} className={perfusionStatus.color} />
        <span className={`text-[8px] font-black uppercase tracking-widest ${perfusionStatus.color}`}>{perfusionStatus.status}</span>
      </div>

      {/* Layer 2: Risk Evolution */}
      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5" title={`Condition: ${riskTrend.label}`}>
        <riskTrend.icon size={10} className={riskTrend.color} />
        <span className={`text-[8px] font-black uppercase tracking-widest ${riskTrend.color}`}>{riskTrend.label}</span>
      </div>

      {/* Layer 4: Drug Burden */}
      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5" title={drugBurden.text}>
        <Pill size={10} className="text-indigo-400" />
        <div className={`w-1.5 h-1.5 rounded-full ${drugBurden.color}`} />
        <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">{drugBurden.level} Burden</span>
      </div>

      {/* Layer 5: Time Monitor */}
      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5" title={timeMonitor.msg}>
        <Clock size={10} className={timeMonitor.color} />
        <span className={`text-[8px] font-black uppercase tracking-widest ${timeMonitor.color}`}>{timeMonitor.status}</span>
      </div>

      {/* Layer 3: Mini Trend Ticker */}
      <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-white/5 rounded-full border border-white/5 ml-2">
         {labTrends.map((t, i) => (
           <div key={i} className="flex items-center gap-1">
              <span className="text-[7px] font-bold text-gray-500 uppercase">{t.name}</span>
              {getArrow(t.trend)}
           </div>
         ))}
      </div>

    </div>
  );
};

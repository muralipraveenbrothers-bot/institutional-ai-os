
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Activity, TrendingUp, AlertTriangle, ShieldCheck, 
  FileText, CheckCircle2, AlertCircle, Info, TrendingDown,
  LayoutGrid, Stethoscope, Banknote, ArrowUpRight, Scale,
  BookOpen, Building2, Radar, Siren, Microscope, LineChart, Lightbulb,
  FlaskConical, Brain, Save, Eraser, FileCheck, Database, Zap,
  Sparkles
} from 'lucide-react';

const QualityAnalyticsHub: React.FC = () => {
  // --- EXISTING MOCK DATA ---
  const [readmissionStats] = useState({
    totalDischarges: 120,
    readmitted7d: 6,
    readmitted30d: 12,
    avgLOS: 4.2,
    highRiskPatients: 18
  });

  const [nabhMetrics] = useState({
    infectionRate: 1.4,
    medicationErrors: 2,
    falls: 1,
    consentCompliance: 98,
    dischargeCompliance: 96,
    mortalityRate: 0.8
  });

  const [alerts, setAlerts] = useState<string[]>([]);

  // --- NEW MOCK DATA FOR ADVANCED ANALYTICS ---
  const deptQualityData = [
    { dept: "General Medicine", infection: 1.2, readmission: 6, compliance: 97 },
    { dept: "General Surgery", infection: 1.8, readmission: 9, compliance: 95 },
    { dept: "Orthopedics", infection: 0.9, readmission: 4, compliance: 98 },
    { dept: "OBG & Gynae", infection: 1.1, readmission: 5, compliance: 99 },
    { dept: "Pediatrics", infection: 0.7, readmission: 3, compliance: 99 }
  ];

  const doctorOutcomesData = [
    { doctor: "Dr. Murali", cases: 120, success: 96, complications: 3 },
    { doctor: "Dr. Anitha", cases: 95, success: 93, complications: 6 },
    { doctor: "Dr. Rajesh", cases: 140, success: 98, complications: 2 }
  ];

  const costOutcomeData = [
    { procedure: "Appendectomy", cost: 25000, success: 98 },
    { procedure: "Hernia Repair", cost: 32000, success: 97 },
    { procedure: "Total Knee Replacement", cost: 180000, success: 95 },
    { procedure: "LSCS (C-Section)", cost: 45000, success: 99 }
  ];

  // --- NEW MOCK DATA FOR REVIEW & PREDICTION ---
  const monthlyQualityData = {
    month: "Current Month",
    discharges: 420,
    readmission30d: 32,
    infectionRate: 1.6,
    mortalityRate: 0.9,
    consentCompliance: 97,
    dischargeCompliance: 95,
    criticalIncidents: 3
  };

  const departmentHeadData = [
    { dept: "Medicine", admissions: 120, readmission: 6, infection: 1.4, alerts: 1 },
    { dept: "Surgery", admissions: 98, readmission: 10, infection: 1.9, alerts: 2 },
    { dept: "Orthopedics", admissions: 75, readmission: 4, infection: 0.8, alerts: 0 },
    { dept: "OBG", admissions: 90, readmission: 5, infection: 1.1, alerts: 1 }
  ];

  // --- NEW RESEARCH & BOARD METRICS ---
  const [researchMetrics] = useState({
    ongoingStudies: 12,
    completedStudies: 8,
    publications: 15,
    indexedPublications: 9,
    citations: 124,
    conferencePresentations: 18,
    ethicsApprovals: 10,
    clinicalAudits: 22
  });

  const [boardKPIs] = useState({
    occupancyRate: 78,
    avgLOS: 4.1,
    readmission30d: 7.6,
    infectionRate: 1.5,
    mortalityRate: 0.9,
    patientSatisfaction: 92,
    revenueGrowth: 14,
    costPerCase: 38500,
    staffAttrition: 6
  });

  // --- RESEARCH HYPOTHESIS BUILDER STATE ---
  const [researchInput, setResearchInput] = useState({
    specialty: "",
    population: "",
    condition: "",
    intervention: "",
    comparison: "",
    outcome: "",
    studyType: "Observational"
  });
  
  const [hypothesisResult, setHypothesisResult] = useState<{text: string, rationale: string} | null>(null);
  const [feasibilityResult, setFeasibilityResult] = useState<{level: string, advice: string, color: string} | null>(null);

  useEffect(() => {
    const newAlerts = [];
    if (readmissionStats.readmitted30d > 10) newAlerts.push("High 30-day readmission rate detected (Needs Review)");
    if (nabhMetrics.infectionRate > 1.0) newAlerts.push("Infection rate nearing NABH threshold");
    if (nabhMetrics.consentCompliance < 99) newAlerts.push("Consent documentation gap identified in 2% of cases");
    
    // Advanced Logic Checks
    deptQualityData.forEach(d => {
        if (d.infection > 1.5) newAlerts.push(`${d.dept}: High infection rate (${d.infection}%)`);
        if (d.compliance < 96) newAlerts.push(`${d.dept}: Protocol compliance dip`);
    });

    setAlerts(newAlerts);
  }, [readmissionStats, nabhMetrics]);

  const rate7 = ((readmissionStats.readmitted7d / readmissionStats.totalDischarges) * 100).toFixed(1);
  const rate30 = ((readmissionStats.readmitted30d / readmissionStats.totalDischarges) * 100).toFixed(1);

  // Helper for Heatmap Color
  const getHeatmapColor = (val: number, type: 'infection' | 'readmission' | 'compliance') => {
    if (type === 'infection') return val > 1.5 ? 'text-red-500 bg-red-500/10' : val > 1.0 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';
    if (type === 'readmission') return val > 8 ? 'text-red-500 bg-red-500/10' : val > 5 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';
    if (type === 'compliance') return val < 95 ? 'text-red-500 bg-red-500/10' : val < 98 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';
    return 'text-gray-400';
  };

  // --- NEW ANALYTICS LOGIC ---
  const monthlySummary = useMemo(() => {
    return `Monthly Quality Review Summary:

Total discharges: ${monthlyQualityData.discharges}.
30-day readmissions: ${monthlyQualityData.readmission30d}.
Hospital-acquired infection rate: ${monthlyQualityData.infectionRate}%.
Mortality rate: ${monthlyQualityData.mortalityRate}%.
Consent documentation compliance: ${monthlyQualityData.consentCompliance}%.
Discharge documentation compliance: ${monthlyQualityData.dischargeCompliance}%.
Reported critical incidents: ${monthlyQualityData.criticalIncidents}.

Overall quality performance is ${
  monthlyQualityData.infectionRate < 2 && monthlyQualityData.consentCompliance > 95
    ? "within acceptable NABH benchmarks."
    : "requiring focused quality improvement."
}`;
  }, []);

  const predictiveRisks = useMemo(() => {
    let risks: string[] = [];
    departmentHeadData.forEach(d => {
      if (d.readmission > 8) risks.push(`Alert: ${d.dept}: Rising readmission trend detected`);
      if (d.infection > 2) risks.push(`Alert: ${d.dept}: Infection rate approaching threshold`);
      if (d.alerts > 1) risks.push(`Alert: ${d.dept}: Multiple unresolved quality alerts`);
    });
    if (monthlyQualityData.criticalIncidents > 2) risks.push("Alert: Hospital-wide: Increased critical incidents this month");
    return risks;
  }, []);

  const boardInsights = useMemo(() => {
    let insights = [];
    if (boardKPIs.readmission30d > 8) insights.push("Readmission rate needs strategic intervention");
    if (boardKPIs.occupancyRate < 70) insights.push("Bed utilization below optimal capacity");
    if (boardKPIs.patientSatisfaction < 90) insights.push("Patient experience improvement required");
    if (boardKPIs.staffAttrition > 8) insights.push("Staff retention strategies needed");
    return insights.length ? insights : ["Overall hospital performance is stable and well aligned with benchmarks."];
  }, [boardKPIs]);

  // --- RESEARCH BUILDER FUNCTIONS ---
  const generateHypothesis = () => {
    const text = `In ${researchInput.population || '[target population]'} patients with ${researchInput.condition || '[medical condition]'}, the use of ${researchInput.intervention || '[intervention]'} compared to ${researchInput.comparison || '[standard care/comparison]'} will result in improved ${researchInput.outcome || '[primary outcome]'}.`;
    const rationale = `This ${researchInput.studyType} study proposal within the ${researchInput.specialty || 'General'} department is structured to address clinical outcomes relevant to current patient care protocols.`;
    setHypothesisResult({ text, rationale });
  };

  const checkFeasibility = () => {
    let points = 0;
    if (researchInput.population) points++;
    if (researchInput.condition) points++;
    if (researchInput.intervention) points++;
    if (researchInput.outcome) points++;
    if (researchInput.studyType) points++;

    let level = "LOW";
    let advice = "Refine question further. Define clear variables for all PICO fields.";
    let color = "text-red-500";

    if (points >= 3) {
      level = "MODERATE";
      advice = "Feasible with departmental support. Verify ethics committee requirements.";
      color = "text-amber-500";
    }
    if (points >= 5) {
      level = "HIGH";
      advice = "Strong candidate for ethics submission and protocol development.";
      color = "text-emerald-500";
    }
    setFeasibilityResult({ level, advice, color });
  };

  const exportDraft = () => {
    if (!hypothesisResult) return;
    alert("Research draft saved to local clipboard. Submit to Department HOD for ethics review.");
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. MONTHLY EXECUTIVE SUMMARY */}
      <div className="bg-[#111827] border border-blue-500/20 rounded-[50px] p-10 shadow-3xl">
         <div className="flex items-center gap-6 mb-8">
            <div className="w-14 h-14 bg-blue-600/10 rounded-[20px] flex items-center justify-center text-blue-500 border border-blue-500/20">
               <BookOpen size={28} />
            </div>
            <div>
               <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Monthly Quality Review</h2>
               <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">AI-Generated Executive Brief</p>
            </div>
         </div>
         <div className="bg-[#0a0f18] p-8 rounded-[32px] border border-gray-800 shadow-inner">
            <pre className="text-sm text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-scrollbar">
               {monthlySummary}
            </pre>
         </div>
      </div>

      {/* 2. ADVANCED COST & LOS OPTIMIZATION HUD */}
      <div className="bg-[#111827] border border-emerald-500/20 rounded-[50px] p-10 shadow-3xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Zap size={240} /></div>
         <div className="flex items-center gap-6 mb-8">
            <div className="w-14 h-14 bg-emerald-600/10 rounded-[20px] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
               <Database size={28} />
            </div>
            <div>
               <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">LOS & Cost Benchmarking</h2>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Institutional Efficiency Node</p>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            {[
               { label: 'Avg LOS', current: '4.1d', bench: '3.8d', delta: '-0.3d' },
               { label: 'Case Cost', current: '₹38.5k', bench: '₹35.2k', delta: '-₹3.3k' },
               { label: 'Wait Time', current: '2.2h', bench: '1.5h', delta: '-0.7h' },
               { label: 'Efficiency', current: '82%', bench: '90%', delta: '+8%' },
            ].map((m, i) => (
               <div key={i} className="bg-[#0a0f18] p-6 rounded-[32px] border border-gray-800 space-y-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{m.label}</p>
                  <div className="flex items-end justify-between">
                     <p className="text-2xl font-black text-white italic">{m.current}</p>
                     <p className="text-[10px] font-black text-emerald-500 italic">{m.delta}</p>
                  </div>
                  <p className="text-[8px] font-bold text-gray-700 uppercase">Bench: {m.bench}</p>
               </div>
            ))}
         </div>
      </div>

      {/* 3. BOARD LEVEL & RESEARCH DASHBOARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Research Metrics */}
          <div className="bg-[#111827] border border-purple-500/20 rounded-[50px] p-10 shadow-3xl flex flex-col">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 bg-purple-600/10 rounded-[20px] flex items-center justify-center text-purple-500 border border-purple-500/20">
                <Microscope size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Research & Academia</h2>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mt-1">Clinical Innovation Node</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: 'Ongoing Studies', value: researchMetrics.ongoingStudies },
                 { label: 'Publications', value: researchMetrics.publications },
                 { label: 'Citations', value: researchMetrics.citations },
                 { label: 'Ethics Approvals', value: researchMetrics.ethicsApprovals },
               ].map((m, i) => (
                 <div key={i} className="bg-[#0a0f18] p-5 rounded-[24px] border border-gray-800 group hover:border-purple-500/20 transition-all">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{m.label}</p>
                    <p className="text-2xl font-black text-white italic mt-2">{m.value}</p>
                 </div>
               ))}
               <div className="col-span-2 bg-[#0a0f18] p-5 rounded-[24px] border border-gray-800 flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Indexed (PubMed)</span>
                  <span className="text-xl font-black text-purple-400 italic">{researchMetrics.indexedPublications}</span>
               </div>
            </div>
          </div>

          {/* Board Level KPIs */}
          <div className="bg-[#111827] border border-amber-500/20 rounded-[50px] p-10 shadow-3xl flex flex-col">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 bg-amber-600/10 rounded-[20px] flex items-center justify-center text-amber-500 border border-amber-500/20">
                <LineChart size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Board Strategic KPIs</h2>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mt-1">Executive Overview</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0a0f18] p-5 rounded-[24px] border border-gray-800">
                     <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Revenue Growth</p>
                     <p className="text-2xl font-black text-emerald-500 italic mt-1">+{boardKPIs.revenueGrowth}%</p>
                  </div>
                  <div className="bg-[#0a0f18] p-5 rounded-[24px] border border-gray-800">
                     <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Occupancy</p>
                     <p className="text-2xl font-black text-white italic mt-1">{boardKPIs.occupancyRate}%</p>
                  </div>
               </div>
               
               <div className="bg-[#0a0f18] p-6 rounded-[32px] border border-gray-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={48} /></div>
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Lightbulb size={12} /> Strategic Insights
                  </h4>
                  <ul className="space-y-2">
                     {boardInsights.map((insight, i) => (
                        <li key={i} className="text-xs font-medium text-slate-300 italic flex items-start gap-2">
                           <span className="text-amber-500 mt-1">▪</span> {insight}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
          </div>
      </div>

      {/* 4. GLOBAL METRICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Readmission Analytics */}
          <div className="bg-[#111827] border border-cyan-500/20 rounded-[50px] p-10 shadow-3xl flex flex-col">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 bg-cyan-600/10 rounded-[20px] flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                <TrendingUp size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Readmission Radar</h2>
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mt-1">Global Return Rate</p>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
               <div className="bg-[#0a0f18] p-5 rounded-[24px] border border-gray-800">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Discharges</p>
                  <p className="text-3xl font-black text-white italic mt-2">{readmissionStats.totalDischarges}</p>
               </div>
               <div className="bg-[#0a0f18] p-5 rounded-[24px] border border-gray-800">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Avg LOS</p>
                  <p className="text-3xl font-black text-white italic mt-2">{readmissionStats.avgLOS}d</p>
               </div>
               <div className="bg-[#0a0f18] p-5 rounded-[24px] border border-gray-800 relative overflow-hidden col-span-2">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">30-Day Readmit Rate</p>
                  <div className="flex items-end gap-2 mt-1">
                     <p className="text-4xl font-black text-red-500 italic">{rate30}%</p>
                     <p className="text-xs font-bold text-gray-600 mb-1">Target: &lt;5%</p>
                  </div>
               </div>
            </div>
          </div>

          {/* NABH Metrics */}
          <div className="bg-[#111827] border border-emerald-500/20 rounded-[50px] p-10 shadow-3xl flex flex-col">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 bg-emerald-600/10 rounded-[20px] flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">NABH Compliance</h2>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Safety Protocols</p>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
               {[
                 { label: 'Infection (HAI)', value: `${nabhMetrics.infectionRate}%`, color: 'text-orange-500' },
                 { label: 'Med Errors', value: nabhMetrics.medicationErrors, color: 'text-red-500' },
                 { label: 'Falls', value: nabhMetrics.falls, color: 'text-yellow-500' },
                 { label: 'Compliance', value: `${nabhMetrics.consentCompliance}%`, color: 'text-emerald-500' },
               ].map((m, i) => (
                 <div key={i} className="bg-[#0a0f18] p-5 rounded-[24px] border border-gray-800">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{m.label}</p>
                    <p className={`text-2xl font-black italic mt-2 ${m.color}`}>{m.value}</p>
                 </div>
               ))}
            </div>
          </div>
      </div>

      {/* 5. DEPARTMENT HEAD DASHBOARD */}
      <div className="bg-[#111827] border border-purple-500/20 rounded-[50px] p-10 shadow-3xl">
         <div className="flex items-center gap-6 mb-8">
            <Building2 size={24} className="text-purple-500" />
            <h3 className="text-lg font-black text-white uppercase italic tracking-widest">Department Head Dashboard</h3>
         </div>
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                     <th className="p-4">Department</th>
                     <th className="p-4 text-center">Admissions</th>
                     <th className="p-4 text-center">Readmission %</th>
                     <th className="p-4 text-center">Infection %</th>
                     <th className="p-4 text-center">Active Alerts</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-800/50">
                  {departmentHeadData.map((d, i) => (
                     <tr key={i} className="group hover:bg-white/5 transition-all">
                        <td className="p-4 text-xs font-bold text-white">{d.dept}</td>
                        <td className="p-4 text-center text-xs font-black text-gray-300">{d.admissions}</td>
                        <td className="p-4 text-center">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black ${getHeatmapColor(d.readmission, 'readmission')}`}>
                              {d.readmission}%
                           </span>
                        </td>
                        <td className="p-4 text-center">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black ${getHeatmapColor(d.infection, 'infection')}`}>
                              {d.infection}%
                           </span>
                        </td>
                        <td className="p-4 text-center">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black ${d.alerts > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              {d.alerts}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* 6. RESEARCH HYPOTHESIS BUILDER */}
      <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-10 shadow-3xl animate-in slide-in-from-bottom-6">
         <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-6">
            <div className="w-14 h-14 bg-indigo-600/10 rounded-[20px] flex items-center justify-center text-indigo-500 border border-indigo-500/20">
               <FlaskConical size={28} />
            </div>
            <div>
               <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Research Hypothesis Workbench</h2>
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">AI-Assisted PICO Generator</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div>
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">Specialty</label>
                     <input type="text" value={researchInput.specialty} onChange={e => setResearchInput({...researchInput, specialty: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none" placeholder="e.g. Surgery" />
                  </div>
                  <div>
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">Study Type</label>
                     <select value={researchInput.studyType} onChange={e => setResearchInput({...researchInput, studyType: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none">
                        <option>Observational</option>
                        <option>Randomized Controlled Trial</option>
                        <option>Prospective Cohort</option>
                        <option>Retrospective Audit</option>
                     </select>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div>
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">Population</label>
                     <input type="text" value={researchInput.population} onChange={e => setResearchInput({...researchInput, population: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none" placeholder="e.g. Adults > 40 with Diabetes" />
                  </div>
                  <div>
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">Intervention</label>
                     <input type="text" value={researchInput.intervention} onChange={e => setResearchInput({...researchInput, intervention: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none" placeholder="e.g. New Drug Protocol" />
                  </div>
                  <div>
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">Comparison</label>
                     <input type="text" value={researchInput.comparison} onChange={e => setResearchInput({...researchInput, comparison: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none" placeholder="e.g. Standard Care" />
                  </div>
                  <div>
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">Outcome</label>
                     <input type="text" value={researchInput.outcome} onChange={e => setResearchInput({...researchInput, outcome: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none" placeholder="e.g. Reduced LOS" />
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button onClick={generateHypothesis} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                     <Brain size={16} /> Generate Logic
                  </button>
                  <button onClick={checkFeasibility} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                     <FileCheck size={16} /> Check Feasibility
                  </button>
               </div>
            </div>

            <div className="flex flex-col gap-6">
               {hypothesisResult && (
                 <div className="bg-[#0a0f18] border border-indigo-500/20 rounded-[32px] p-8 shadow-inner animate-in slide-in-from-right-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <FileText size={14} /> Draft Hypothesis
                    </h4>
                    <p className="text-sm text-slate-300 italic font-medium leading-relaxed mb-6">"{hypothesisResult.text}"</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Rationale</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{hypothesisResult.rationale}</p>
                    
                    <button onClick={exportDraft} className="mt-6 w-full py-3 border border-indigo-500/20 text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-900/10 transition-all flex items-center justify-center gap-2">
                       <Save size={14} /> Save Draft to Workbench
                    </button>
                 </div>
               )}

               {feasibilityResult && (
                 <div className={`p-6 rounded-[32px] border ${feasibilityResult.level === 'HIGH' ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-amber-900/10 border-amber-500/30'} animate-in slide-in-from-bottom-2`}>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Feasibility Score</span>
                       <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${feasibilityResult.level === 'HIGH' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>{feasibilityResult.level}</span>
                    </div>
                    <p className={`text-xs font-bold italic ${feasibilityResult.color}`}>{feasibilityResult.advice}</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* 7. PREDICTIVE RISK ALERTS */}
      <div className="bg-[#111827] border border-red-500/30 rounded-[50px] p-10 shadow-3xl">
         <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
            {/* Fixed: Sparkles icon was not imported */}
            <Sparkles size={16} className="animate-pulse" /> Predictive Risk Alerts (Early Warning)
         </h3>
         <div className="space-y-4">
            {predictiveRisks.length > 0 ? predictiveRisks.map((risk, i) => (
              <div key={i} className="flex items-center gap-4 p-5 bg-red-950/20 border border-red-500/30 rounded-[24px] animate-in slide-in-from-left-4">
                 <Siren size={20} className="text-red-500 shrink-0 animate-pulse" />
                 <p className="text-sm font-bold text-red-200 italic">{risk}</p>
              </div>
            )) : (
              <div className="flex items-center gap-4 p-5 bg-emerald-950/10 border border-emerald-500/20 rounded-[24px]">
                 <CheckCircle2 size={20} className="text-emerald-500" />
                 <p className="text-sm font-bold text-emerald-200 italic">No significant predictive risks detected at this time.</p>
              </div>
            )}
         </div>
         <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3 text-gray-500">
            <Info size={14} />
            <p className="text-[9px] font-black uppercase tracking-widest italic">Predictive alerts are early-warning indicators only. Final decisions rest with the Quality & Clinical Governance Committee.</p>
         </div>
      </div>
    </div>
  );
};

export default QualityAnalyticsHub;

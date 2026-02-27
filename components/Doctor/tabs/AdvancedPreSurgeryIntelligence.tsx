
import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronRight, Plus, X, Loader2, Sparkles, 
  ShieldAlert, Layers, Droplets, ShieldCheck, Biohazard, Brain
} from 'lucide-react';
import { sushrutPreSurgeryAnalysisStream, sushrutPathophysiologyStream } from '../../../geminiService';

interface AdvancedPreSurgeryProps {
  patient: any;
}

const PRE_SURGERY_COMORBIDITIES = ['HTN', 'DM', 'Thyroid', 'Asthma', 'CAD', 'CKD', 'Stroke', 'Liver Disease'];

const AdvancedPreSurgeryIntelligence: React.FC<AdvancedPreSurgeryProps> = ({ patient }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPatho, setShowPatho] = useState(false);
  const [selectedComorbidities, setSelectedComorbidities] = useState<string[]>(
    patient.healthSnapshot?.knownConditions ? patient.healthSnapshot.knownConditions.split(',').map((c: string) => c.trim()) : []
  );
  const [preSurgeryMeds, setPreSurgeryMeds] = useState<any[]>([]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [analysis, setAnalysis] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [patho, setPatho] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });

  const addMed = () => {
    if (newMedName) {
      setPreSurgeryMeds([...preSurgeryMeds, { name: newMedName, dose: newMedDose, freq: newMedFreq, action: 'Continue' }]);
      setNewMedName(""); setNewMedDose(""); setNewMedFreq("");
    }
  };

  const runAnalysis = async () => {
    setAnalysis({ text: "", status: 'loading' });
    try {
      const stream = sushrutPreSurgeryAnalysisStream({ patient, comorbidities: selectedComorbidities, medications: preSurgeryMeds });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setAnalysis(prev => ({ ...prev, text: fullText }));
      }
      setAnalysis(prev => ({ ...prev, status: 'done' }));
    } catch (e) { setAnalysis(prev => ({ ...prev, status: 'error' })); }
  };

  const runPatho = async () => {
    setPatho({ text: "", status: 'loading' });
    try {
      const stream = sushrutPathophysiologyStream({ patient, procedure: patient.chiefComplaint, comorbidities: selectedComorbidities });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setPatho(prev => ({ ...prev, text: fullText }));
      }
      setPatho(prev => ({ ...prev, status: 'done' }));
    } catch (e) { setPatho(prev => ({ ...prev, status: 'error' })); }
  };

  const parsedAnalysis = useMemo(() => {
    if (!analysis.text) return {};
    const data: Record<string, string> = {};
    const markers = ['SECTION 1', 'SECTION 2', 'SECTION 3', 'SECTION 4', 'SECTION 5'];
    markers.forEach((m, idx) => {
      const start = analysis.text.indexOf(m);
      if (start === -1) return;
      let end = analysis.text.length;
      for (const nextM of markers.slice(idx + 1)) {
        const pos = analysis.text.indexOf(nextM);
        if (pos !== -1 && pos < end) end = pos;
      }
      data[m] = analysis.text.substring(start, end).trim();
    });
    return data;
  }, [analysis.text]);

  return (
    <div className="bg-[#111827] border border-blue-500/20 rounded-[40px] p-8 shadow-4xl relative overflow-hidden">
       <button 
         onClick={() => setShowAdvanced(!showAdvanced)}
         className="w-full py-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl text-blue-300 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 transition-all"
       >
          {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          ADVANCED PRE-SURGERY INTELLIGENCE
       </button>

       {showAdvanced && (
         <div className="mt-8 space-y-8 animate-in slide-in-from-top-4">
            <div>
               <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3">Comorbidity Matrix</h4>
               <div className="flex flex-wrap gap-2">
                  {PRE_SURGERY_COMORBIDITIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedComorbidities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${selectedComorbidities.includes(c) ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#0a0f18] text-gray-500 border-gray-800'}`}
                    >
                       {c}
                    </button>
                  ))}
               </div>
            </div>

            <div className="bg-[#0a0f18] p-6 rounded-3xl border border-gray-800">
               <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Medication Details</h4>
               <div className="flex flex-wrap gap-3 mb-6">
                  <input value={newMedName} onChange={e => setNewMedName(e.target.value)} placeholder="Drug" className="bg-black/40 border border-gray-800 rounded-lg px-4 py-2 text-[10px] text-white w-32" />
                  <input value={newMedDose} onChange={e => setNewMedDose(e.target.value)} placeholder="Dose" className="bg-black/40 border border-gray-800 rounded-lg px-4 py-2 text-[10px] text-white w-20" />
                  <button onClick={addMed} className="p-2 bg-blue-600 text-white rounded-lg"><Plus size={14}/></button>
               </div>
               <div className="space-y-2">
                  {preSurgeryMeds.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] text-gray-400 bg-white/5 p-3 rounded-xl border border-white/5">
                       <span>{m.name} ({m.dose})</span>
                       <button onClick={() => setPreSurgeryMeds(prev => prev.filter((_, idx) => idx !== i))}><X size={12}/></button>
                    </div>
                  ))}
               </div>
            </div>

            <div className="flex justify-center">
               <button onClick={runAnalysis} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase italic shadow-xl flex items-center gap-2">
                  {analysis.status === 'loading' ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} 
                  Generate Pre-Surgery Audit
               </button>
            </div>

            {analysis.text && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                 <div className="bg-black/20 p-6 rounded-3xl border border-red-500/20">
                    <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldAlert size={14} /> Fail Prevention</h5>
                    <div className="text-[11px] text-slate-300 italic whitespace-pre-wrap">{parsedAnalysis['SECTION 3']}</div>
                 </div>
                 <div className="bg-black/20 p-6 rounded-3xl border border-indigo-500/20">
                    <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={14} /> Patho Staging</h5>
                    <div className="text-[11px] text-slate-300 italic whitespace-pre-wrap">{parsedAnalysis['SECTION 4']}</div>
                 </div>
              </div>
            )}

            <button 
              onClick={() => setShowPatho(!showPatho)}
              className="w-full py-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-purple-300 font-black uppercase text-[9px] flex items-center justify-center gap-2"
            >
               {showPatho ? <ChevronDown size={12}/> : <ChevronRight size={12}/>} Pathophysiology & Molecular Sync
            </button>

            {showPatho && (
              <div className="space-y-6 animate-in fade-in">
                 <div className="flex justify-center">
                    <button onClick={runPatho} className="px-8 py-2 bg-purple-600 text-white rounded-lg text-[8px] font-black uppercase">Initialize Molecular Logic</button>
                 </div>
                 {patho.text && (
                    <div className="p-6 bg-[#0a0f18] border border-purple-500/20 rounded-[35px] text-[12px] italic text-slate-300 whitespace-pre-wrap font-mono custom-markdown-rendering shadow-inner">
                       {patho.text}
                    </div>
                 )}
              </div>
            )}
         </div>
       )}
    </div>
  );
};

export default AdvancedPreSurgeryIntelligence;


import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, Brain, Activity, Target, ShieldCheck, Microscope, 
  AlertTriangle, CheckCircle2, ChevronDown, 
  ChevronRight, Volume2, Loader2, Sparkles, X, Info,
  Layers, Dna, Biohazard, Orbit, FlaskConical, Pill, ArrowDown, RefreshCw
} from 'lucide-react';
import { Patient, PathoStep, PathoSymptom, PathoDeepDive } from '../../../types';
import { sushrutPathoInteractionStream, sushrutDeepDiveSymptom, speakText } from '../../../geminiService';

interface PathoModuleProps {
  patient: Patient;
  onAnalysisUpdate?: (text: string) => void;
}

const PathophysiologyModule: React.FC<PathoModuleProps> = ({ patient, onAnalysisUpdate }) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [deepDiveSymptom, setDeepDiveSymptom] = useState<PathoDeepDive | null>(null);
  const [loadingSymptom, setLoadingSymptom] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('V2');
  const [analysis, setAnalysis] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' });

  const runAnalysis = async (level: string = 'V2') => {
    setSelectedLevel(level);
    setAnalysis({ text: "", status: 'loading' });
    setDeepDiveSymptom(null);
    try {
      const stream = sushrutPathoInteractionStream({ patient, level });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setAnalysis(prev => ({ ...prev, text: fullText }));
        if (onAnalysisUpdate) onAnalysisUpdate(fullText);
      }
      setAnalysis(prev => ({ ...prev, status: 'done' }));
    } catch (e) {
      setAnalysis(prev => ({ ...prev, status: 'idle' }));
    }
  };

  useEffect(() => {
    if (analysis.status === 'idle') runAnalysis();
  }, [patient.id]);

  const parsedSymptoms = useMemo(() => {
    const list: { name: string, reason: string, solution: string }[] = [];
    if (analysis.text) {
      const sections = analysis.text.split(/SIGN\/SYMPTOM\s*:/i).filter(s => s.trim());
      sections.forEach(s => {
        const name = s.split('\n')[0].replace(/^[*\-\s]+/, '').trim();
        const reason = s.match(/REASON\s*\(Pathophysiology\)\s*:\s*([^]*?)(?=\n|SOLUTION|$)/i)?.[1]?.trim();
        const solution = s.match(/SOLUTION\s*\(Therapeutic Step\)\s*:\s*([^]*?)(?=\n|$)/i)?.[1]?.trim();
        if (name) list.push({ name, reason: reason || "", solution: solution || "" });
      });
    }
    return list;
  }, [analysis.text]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-10 font-['Inter']">
      
      {/* 🧬 SECTION: REASON & SOLUTION MAPPING */}
      <div className="bg-[#111827] border border-cyan-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><Orbit size={350} /></div>
        
        <div className="flex items-center justify-between mb-16 border-b border-white/5 pb-8 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-cyan-600 rounded-[22px] flex items-center justify-center text-white shadow-xl animate-pulse">
               <Brain size={32} />
            </div>
            <div>
               <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Clinical Reason & Solution Node</h2>
               <p className="text-[10px] text-cyan-500 uppercase font-black mt-2 tracking-[0.5em] italic">Mapping Signs/Symptoms to Molecular Management</p>
            </div>
          </div>
          <button onClick={() => runAnalysis(selectedLevel)} className="p-5 bg-white/5 hover:bg-cyan-600 transition-all rounded-2xl border border-white/5 text-gray-500 hover:text-white shadow-xl group active:scale-95">
             <RefreshCw size={22} className={analysis.status === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>

        {analysis.status === 'loading' && !analysis.text ? (
          <div className="py-32 flex flex-col items-center gap-10 opacity-40">
             <div className="relative">
                <Loader2 size={100} className="animate-spin text-cyan-500" />
                <div className="absolute inset-0 flex items-center justify-center"><Dna size={32} className="animate-pulse text-indigo-500" /></div>
             </div>
             <p className="text-[14px] font-black uppercase tracking-[1em] animate-pulse">Tracing Pathological Reasons...</p>
          </div>
        ) : (
          <div className="space-y-8 relative z-10">
            {parsedSymptoms.map((symp, idx) => (
              <div key={idx} className="bg-[#0a0f18] border border-gray-800 p-10 rounded-[45px] hover:border-cyan-500/30 transition-all shadow-inner group">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest italic">New Observation Detected</span>
                       <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter mt-1">{symp.name}</h4>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-700 group-hover:text-cyan-400 transition-colors"><Zap size={24}/></div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-3">
                          <Brain size={14} className="text-indigo-500" /> Pathophysiological Reason
                       </p>
                       <p className="text-lg text-slate-300 font-medium italic leading-relaxed">"{symp.reason}"</p>
                    </div>
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-3">
                          <CheckCircle2 size={14} className="text-emerald-500" /> Therapeutic Solution
                       </p>
                       <div className="bg-emerald-600/5 border border-emerald-500/20 p-6 rounded-3xl">
                          <p className="text-lg text-emerald-50 font-black italic">"{symp.solution}"</p>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-12 bg-[#05070a] border border-white/5 rounded-[60px] flex items-start gap-12 shadow-inner opacity-60">
          <div className="w-18 h-18 rounded-[28px] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shrink-0 shadow-4xl animate-pulse">
             <ShieldCheck size={42} />
          </div>
          <div className="space-y-4">
             <p className="text-lg font-black text-white uppercase italic tracking-tight leading-relaxed text-left">
                Doctor's Clinical Helper: Reason and Solution mapping is a direct synthesis of available clinical knowledge to assist in decision making. All management steps are subject to final physician release.
             </p>
          </div>
      </div>
    </div>
  );
};

export default PathophysiologyModule;

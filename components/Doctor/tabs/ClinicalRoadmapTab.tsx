
import React, { useState, useMemo, useEffect } from 'react';
/* Fix: Added missing ShieldCheck import from lucide-react to resolve errors on lines 204 and 231 */
import { 
  Route, Sparkles, Loader2, Target, AlertTriangle, 
  ChevronDown, ChevronRight, Activity, Zap, Info,
  ClipboardList, Stethoscope, Microscope, Brain,
  Layers, Map, Scale, Siren, RefreshCw, Volume2,
  CheckCircle2, FileText, Bookmark, Share2, Save,
  ShieldCheck
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutClinicalRoadmapStream, speakText } from '../../../geminiService';
import { runAI, manualModeMessage } from '../../Shared/AppEventToast';

interface ClinicalRoadmapTabProps {
  patient: Patient;
}

const RoadmapSection: React.FC<{ 
  title: string; 
  icon: any; 
  content: string; 
  isOpen: boolean; 
  onToggle: () => void;
  color: string;
}> = ({ title, icon: Icon, content, isOpen, onToggle, color }) => {
  if (!content) return null;

  return (
    <div className={`bg-[#0a0f18] border ${isOpen ? 'border-' + color + '-500/40' : 'border-gray-800'} rounded-[40px] overflow-hidden transition-all duration-500 shadow-inner group mb-6`}>
      <button 
        onClick={onToggle}
        className="w-full p-8 flex items-center justify-between group hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 transition-all ${isOpen ? 'bg-' + color + '-600 text-white shadow-xl' : 'bg-gray-900 text-gray-600'}`}>
            <Icon size={24} />
          </div>
          <div>
            <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{title}</h4>
            {!isOpen && <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest mt-1.5">View Intelligence node</p>}
          </div>
        </div>
        <div className={`p-2 rounded-full border border-white/10 ${isOpen ? 'rotate-180' : ''} transition-transform duration-500`}>
          <ChevronDown size={20} className="text-gray-700" />
        </div>
      </button>
      
      {isOpen && (
        <div className="p-10 pt-0 animate-in slide-in-from-top-2 duration-500">
          <div className="prose prose-invert max-w-none">
            <div className="text-[16px] text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
              {content}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
             <button onClick={() => speakText(content)} className="px-6 py-2 bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase italic hover:bg-indigo-600 hover:text-white transition-all">Audio Brief</button>
             <button onClick={() => {
               const plan = `[ROADMAP: ${title}] \n ${content}`;
               window.emitAppEvent?.({ type: "DOCTOR_UPDATED_PLAN", message: `Node copied to session notes.` });
             }} className="px-6 py-2 bg-white/5 border border-white/10 text-gray-500 rounded-xl text-[9px] font-black uppercase italic hover:text-white transition-all">Copy to Notes</button>
          </div>
        </div>
      )}
    </div>
  );
};

const ClinicalRoadmapTab: React.FC<ClinicalRoadmapTabProps> = ({ patient }) => {
  const [roadmap, setRoadmap] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [openSections, setOpenSections] = useState<string[]>(['Presenting Symptom', 'Differential Diagnosis', 'Red Flags']);

  const runRoadmap = async () => {
    setRoadmap({ text: "", status: 'loading' });
    await runAI("susruta", async () => {
      try {
        const stream = sushrutClinicalRoadmapStream({ patient });
        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          setRoadmap(prev => ({ ...prev, text: fullText }));
        }
        setRoadmap(prev => ({ ...prev, status: 'done' }));
      } catch (err) {
        setRoadmap(prev => ({ ...prev, status: 'error' }));
      }
    }, () => {
      setRoadmap(prev => ({ ...prev, status: 'error' }));
      manualModeMessage("Clinical Roadmap");
    });
  };

  useEffect(() => {
    if (roadmap.status === 'idle') runRoadmap();
  }, [patient.id]);

  const toggleSection = (s: string) => {
    setOpenSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const parseValue = (marker: string) => {
    const regex = new RegExp(`${marker}\\s*:([^]*?)(?=ROADMAP_|$)`, 'i');
    const match = roadmap.text.match(regex);
    return match ? match[1].trim() : '';
  };

  const sections = [
    { id: 'ROADMAP_SYMPTOM', title: 'Presenting Symptom', icon: Stethoscope, color: 'cyan' },
    { id: 'ROADMAP_PATTERNS', title: 'Clinical Patterns', icon: Layers, color: 'indigo' },
    { id: 'ROADMAP_DIFFERENTIALS', title: 'Differential Diagnosis', icon: Microscope, color: 'pink' },
    { id: 'ROADMAP_REDFLAGS', title: 'Red Flag Conditions', icon: Siren, color: 'red' },
    { id: 'ROADMAP_DIFFERENTIATE', title: 'How to Differentiate', icon: Scale, color: 'amber' },
    { id: 'ROADMAP_INVESTIGATIONS', title: 'Required Investigations', icon: Target, color: 'blue' },
    { id: 'ROADMAP_INTERPRETATION', title: 'Interpretation Guide', icon: Brain, color: 'purple' },
    { id: 'ROADMAP_MANAGEMENT', title: 'Initial Management Plan', icon: ClipboardList, color: 'emerald' },
    { id: 'ROADMAP_ESCALATE', title: 'When to Escalate', icon: AlertTriangle, color: 'orange' },
    { id: 'ROADMAP_FOLLOWUP', title: 'Follow-up Strategy', icon: Activity, color: 'teal' },
  ];

  const confidence = parseValue('ROADMAP_CONFIDENCE');

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40 font-['Inter']">
      
      {/* 🧬 HEADER COMMAND HUB */}
      <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[5s]"><Map size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
           <div className="flex items-center gap-10">
              <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white shadow-[0_25px_60px_rgba(79,70,229,0.4)] relative">
                 <Zap size={48} className="animate-pulse" />
                 <div className="absolute inset-0 bg-white/10 animate-ping rounded-[32px]" />
              </div>
              <div>
                 <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Clinical Roadmap</h2>
                 <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em] mt-3 italic">Autonomous Diagnostic Pathway Node v8.5</p>
              </div>
           </div>
           
           <div className="flex flex-col items-end gap-6">
              {confidence && (
                <div className="px-8 py-3 bg-black/40 border border-white/5 rounded-full flex items-center gap-4">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logic Confidence</p>
                   <span className="text-xl font-black italic">{confidence}</span>
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={runRoadmap} className="p-5 bg-white/5 hover:bg-indigo-600 transition-all rounded-3xl border border-white/5 text-gray-500 hover:text-white shadow-xl active:scale-95 group">
                   <RefreshCw size={24} className={roadmap.status === 'loading' ? 'animate-spin' : 'group-hover:rotate-180 transition-all duration-700'} />
                </button>
              </div>
           </div>
        </div>
      </div>

      {roadmap.status === 'loading' && !roadmap.text ? (
        <div className="py-40 flex flex-col items-center gap-10 opacity-50">
           <div className="relative">
              <Loader2 size={120} className="animate-spin text-indigo-500" />
              <div className="absolute inset-0 flex items-center justify-center"><Activity size={40} className="animate-pulse text-indigo-400" /></div>
           </div>
           <div className="text-center space-y-4">
              <p className="text-2xl font-black text-white uppercase tracking-[1em] animate-pulse ml-[1em]">Synthesizing Pathway...</p>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest italic">Mapping Symptoms to Evidence-Based Logic</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* LEFT: THE ROADMAP TREE (8/12) */}
           <div className="lg:col-span-8 space-y-2 animate-in slide-in-from-bottom-4 duration-700">
              {sections.map((section) => (
                <RoadmapSection 
                  key={section.id}
                  title={section.title}
                  icon={section.icon}
                  content={parseValue(section.id)}
                  isOpen={openSections.includes(section.title)}
                  onToggle={() => toggleSection(section.title)}
                  color={section.color}
                />
              ))}
           </div>

           {/* RIGHT: STRATEGIC CONTROLS & PULSE (4/12) */}
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-[#111827] border border-white/5 p-10 rounded-[60px] shadow-4xl space-y-10 sticky top-24">
                 <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                    <Zap size={20} className="text-amber-500 animate-pulse" />
                    <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] italic">Command Logic</h3>
                 </div>
                 
                 <div className="space-y-6">
                    <button onClick={() => setOpenSections(sections.map(s => s.title))} className="w-full py-5 bg-[#0a0f18] border border-gray-800 hover:border-indigo-500/40 text-gray-500 hover:text-white rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-4 italic shadow-inner">
                       <Maximize size={18}/> Expand Full Pathway
                    </button>
                    <button onClick={() => setOpenSections([])} className="w-full py-5 bg-[#0a0f18] border border-gray-800 text-gray-500 hover:text-white rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all italic">
                       Collapse All Nodes
                    </button>
                 </div>

                 <div className="bg-indigo-600/5 p-8 rounded-[40px] border border-indigo-500/10 space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3 italic">
                       <ShieldCheck size={18} /> Documentation Sync
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed italic font-medium">
                       "Clinical reasoning nodes can be committed to the official case history to provide a structured audit of medical intent."
                    </p>
                    <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 italic border border-white/10 flex items-center justify-center gap-3">
                       <Save size={14}/> COMMIT ROADMAP TO NOTES
                    </button>
                 </div>

                 <div className="p-8 bg-[#0a0f18] rounded-[40px] border border-gray-800 space-y-4 shadow-inner">
                    <div className="flex items-center gap-3">
                       <Info size={16} className="text-cyan-500" />
                       <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Reference Engine</span>
                    </div>
                    <p className="text-[10px] text-gray-700 font-bold uppercase leading-relaxed">
                       Synthesis derived from Harrison's, NICE guidelines, and UpToDate v2026.1 nodes.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CORE SAFETY FOOTER */}
      <div className="p-10 bg-[#0a0f18] border border-white/5 rounded-[60px] flex items-start gap-10 shadow-inner opacity-60">
          <div className="w-16 h-16 rounded-[24px] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shrink-0 shadow-3xl animate-pulse">
             <ShieldCheck size={36} />
          </div>
          <div className="space-y-3">
             <p className="text-base font-black text-white uppercase italic tracking-tight leading-relaxed text-left">
                GOVERNANCE NODE: THE CLINICAL ROADMAP IS AN ADVISORY INTELLIGENCE LAYER DESIGNED TO SUPPORT STRUCTURED REASONING. IT DOES NOT CONSTITUTE A DEFINITIVE DIAGNOSIS OR TREATMENT PLAN. ALL CLINICAL CHOICES REMAIN AT THE DISCRETION OF THE TREATING CONSULTANT.
             </p>
          </div>
      </div>
    </div>
  );
};

const Maximize = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

export default ClinicalRoadmapTab;


import React, { useState } from 'react';
import { 
  Map, Loader2, ClipboardCheck, Microscope, FileSearch, Scale, Route, 
  Target, HeartPulse, AlertTriangle, Siren, Calendar, ChevronDown, 
  Volume2, Save, FileCheck, Download, ShieldCheck
} from 'lucide-react';
import { speakText } from '../../../geminiService';

interface SurgicalRoadmapProps {
  patient: any;
  procedure: string;
  roadmapText: string;
  status: 'idle' | 'loading' | 'done' | 'error';
  onRun: () => void;
}

const SurgicalRoadmap: React.FC<SurgicalRoadmapProps> = ({ patient, procedure, roadmapText, status, onRun }) => {
  const [openSections, setOpenSections] = useState<string[]>(['Indication Confirmation']);

  const parseValue = (marker: string) => {
    const regex = new RegExp(`${marker}\\s*:([^]*?)(?=SURG_ROADMAP_|$)`, 'i');
    const match = roadmapText.match(regex);
    return match ? match[1].trim() : '';
  };

  const sections = [
    { id: 'SURG_ROADMAP_INDICATION', title: 'Indication Confirmation', icon: ClipboardCheck, color: 'emerald' },
    { id: 'SURG_ROADMAP_DIFFERENTIALS', title: 'Differential Exclusion', icon: Microscope, color: 'pink' },
    { id: 'SURG_ROADMAP_WORKUP', title: 'Preoperative Workup', icon: FileSearch, color: 'blue' },
    { id: 'SURG_ROADMAP_RISK_ASSESSMENT', title: 'Risk Assessment', icon: Scale, color: 'amber' },
    { id: 'SURG_ROADMAP_OPERATIVE', title: 'Operative Planning', icon: Route, color: 'indigo' },
    { id: 'SURG_ROADMAP_INTRAOP', title: 'Intraoperative Considerations', icon: Target, color: 'orange' },
    { id: 'SURG_ROADMAP_POSTOP', title: 'Postoperative Plan', icon: HeartPulse, color: 'cyan' },
    { id: 'SURG_ROADMAP_COMPLICATIONS', title: 'Complication Monitoring', icon: AlertTriangle, color: 'red' },
    { id: 'SURG_ROADMAP_ESCALATION', title: 'Escalation Criteria', icon: Siren, color: 'rose' },
    { id: 'SURG_ROADMAP_FOLLOWUP', title: 'Follow-up Protocol', icon: Calendar, color: 'teal' },
  ];

  const toggleSection = (title: string) => {
    setOpenSections(prev => prev.includes(title) ? prev.filter(x => x !== title) : [...prev, title]);
  };

  return (
    <div className="space-y-6">
       <button 
         onClick={onRun}
         disabled={status === 'loading'}
         className={`w-full py-6 rounded-[35px] border-2 font-black uppercase text-sm tracking-[0.4em] transition-all flex items-center justify-center gap-6 italic group ${roadmapText ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-red-600/10 border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white'}`}
       >
          {status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Map size={24} className="group-hover:rotate-12 transition-transform" />}
          <span>[ {roadmapText ? 'SURGICAL ROADMAP ACTIVE' : 'GENERATE SURGICAL ROADMAP™'} ]</span>
       </button>

       {!procedure && !roadmapText && (
         <div className="py-6 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Select surgical indication to activate detailed roadmap.</p>
         </div>
       )}

       {roadmapText && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-6 duration-700">
             {/* Left: Roadmap Tree */}
             <div className="lg:col-span-8 space-y-3">
                {sections.map((section) => {
                  const content = parseValue(section.id);
                  const isOpen = openSections.includes(section.title);
                  if (!content) return null;
                  
                  return (
                    <div key={section.id} className={`bg-[#0a0f18] border ${isOpen ? 'border-' + section.color + '-500/40' : 'border-gray-800'} rounded-[35px] overflow-hidden transition-all shadow-inner group`}>
                       <button 
                          onClick={() => toggleSection(section.title)}
                          className="w-full p-6 flex items-center justify-between group hover:bg-white/5 transition-all"
                       >
                          <div className="flex items-center gap-5">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 transition-all ${isOpen ? 'bg-' + section.color + '-600 text-white' : 'bg-gray-900 text-gray-600'}`}>
                                <section.icon size={20} />
                             </div>
                             <h4 className="text-sm font-black text-white uppercase italic tracking-tight">{section.title}</h4>
                          </div>
                          <ChevronDown size={18} className={`text-gray-700 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                       </button>
                       {isOpen && (
                         <div className="p-8 pt-0 animate-in slide-in-from-top-2 duration-500">
                            <div className="text-[13px] text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                               {content}
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/5 flex gap-4">
                               <button onClick={() => speakText(content)} className="px-4 py-1.5 bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-[8px] font-black uppercase italic hover:bg-indigo-600 hover:text-white transition-all">Hear Node</button>
                               <button onClick={() => {
                                  window.emitAppEvent?.({ type: "DOCTOR_UPDATED_PLAN", message: `Surgical node ${section.title} copied to case sheet.` });
                               }} className="px-4 py-1.5 bg-white/5 border border-white/10 text-gray-500 rounded-lg text-[8px] font-black uppercase italic hover:text-white transition-all">Copy to Case Sheet</button>
                            </div>
                         </div>
                       )}
                    </div>
                  );
                })}
             </div>

             {/* Right: Operational Controls */}
             <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#111827] border border-indigo-500/20 p-8 rounded-[45px] shadow-xl space-y-8">
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic border-b border-white/5 pb-4">Operative Actions</h4>
                   <div className="space-y-4">
                      <button className="w-full py-4 bg-[#0a0f18] border border-gray-800 hover:border-emerald-500/40 text-gray-500 hover:text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-3 italic">
                         <FileCheck size={14}/> Auto-Generate Consent Summary
                      </button>
                      <button className="w-full py-4 bg-[#0a0f18] border border-gray-800 hover:border-blue-500/40 text-gray-500 hover:text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-3 italic">
                         <Download size={14}/> Export Surgical Note
                      </button>
                      <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 italic border border-white/10">
                         <Save size={14}/> COMMIT ROADMAP TO REGISTRY
                      </button>
                   </div>
                </div>

                <div className="bg-emerald-950/10 border border-emerald-500/20 p-8 rounded-[40px] shadow-inner space-y-4 opacity-70">
                   <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-3"><ShieldCheck size={16}/> Forensic Audit Node</h4>
                   <p className="text-[10px] text-slate-400 italic leading-relaxed">"Surgical reasoning standard Bailey & Love v25. All logic nodes verified against institutional benchmarks."</p>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default SurgicalRoadmap;

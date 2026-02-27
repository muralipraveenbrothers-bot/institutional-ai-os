import React, { useState, useMemo, useEffect } from 'react';
import { 
  Dna, Sparkles, Loader2, Info, ShieldAlert, Zap, 
  Volume2, BookOpen, GraduationCap, Microscope, 
  FlaskConical, AlertTriangle, CheckCircle2, RefreshCw,
  Search, Target, TrendingUp, History, Brain, Pill, Scale, Activity, Droplets
} from 'lucide-react';
import { Patient } from '../../../types';
import { sushrutGenomicsIntelligenceHubStream, speakText } from '../../../geminiService';

interface GenomicsIntelligenceHubProps {
  patient: Patient;
}

const GenomicsIntelligenceHub: React.FC<GenomicsIntelligenceHubProps> = ({ patient }) => {
  const [geneticContext, setGeneticContext] = useState("");
  const [teachingMode, setTeachingMode] = useState(false);
  const [synthesis, setSynthesis] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [activeInternalTab, setActiveInternalTab] = useState<'interactions' | 'therapies' | 'predictions' | 'patho' | 'delivery'>('interactions');

  const runGenomicsSynthesis = async () => {
    setSynthesis({ text: "", status: 'loading' });
    try {
      const stream = sushrutGenomicsIntelligenceHubStream({ patient, geneticContext, teachingMode });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setSynthesis(prev => ({ ...prev, text: fullText }));
      }
      setSynthesis(prev => ({ ...prev, status: 'done' }));
    } catch (err) {
      setSynthesis(prev => ({ ...prev, status: 'error' }));
    }
  };

  const parseParts = (line: string, marker: string) => {
    try {
      const payload = line?.replace(marker, "") || "";
      const segments = payload.split('|').map(p => p.trim());
      const obj: any = {};
      segments.forEach(seg => {
        const splitPos = seg.indexOf(':');
        if (splitPos !== -1) {
          const k = seg.substring(0, splitPos).trim().toLowerCase();
          const v = seg.substring(splitPos + 1).trim();
          if (k) obj[k] = v;
        }
      });
      return obj;
    } catch (e) { return null; }
  };

  const parsedData = useMemo(() => {
    if (!synthesis.text) return null;
    const sections: {
      interactions: any[];
      therapies: any[];
      responses: any[];
      future: any[];
      pathomorph: string;
      delivery: string;
    } = { interactions: [], therapies: [], responses: [], future: [], pathomorph: "", delivery: "" };
    const lines = synthesis.text.split('\n');
    
    let inPatho = false;
    let inDelivery = false;
    lines.forEach(line => {
      if (line.includes('GD_INTERACTION:')) sections.interactions.push(parseParts(line, 'GD_INTERACTION:'));
      else if (line.includes('PT_OPTION:')) sections.therapies.push(parseParts(line, 'PT_OPTION:'));
      else if (line.includes('PT_RESPONSE:')) sections.responses.push(parseParts(line, 'PT_RESPONSE:'));
      else if (line.includes('PT_FUTURE:')) sections.future.push(parseParts(line, 'PT_FUTURE:'));
      else if (line.includes('MOLECULAR THERAPY DELIVERY:')) { inDelivery = true; inPatho = false; }
      else if (line.includes('MOLECULAR PATHOPHYSIOLOGY:')) { inPatho = true; inDelivery = false; }
      else if (inPatho) {
        if (line.trim().length > 0 && !line.includes('Awareness only')) sections.pathomorph += line + '\n';
      }
      else if (inDelivery) {
        if (line.trim().length > 0) sections.delivery += line + '\n';
      }
    });
    return sections;
  }, [synthesis.text]);

  const handleExplain = (text: string) => {
    if (text) speakText(text, 'Zephyr');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* 1. INPUT HUD */}
      <div className="bg-[#111827] border border-emerald-500/20 rounded-[50px] p-10 shadow-4xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Dna size={300} /></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4 relative z-10">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-600 rounded-[22px] flex items-center justify-center text-white shadow-xl">
                 <Dna size={32} />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Precision Medicine Hub</h2>
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Molecular & Genomics Node v2.0</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setTeachingMode(!teachingMode)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${teachingMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg italic' : 'text-gray-600 hover:text-white'}`}
              >
                 <GraduationCap size={14} /> {teachingMode ? 'TEACHING MODE: ON' : 'TEACHING MODE: OFF'}
              </button>
              <button 
                onClick={runGenomicsSynthesis}
                disabled={synthesis.status === 'loading'}
                className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-4 italic border border-white/10"
              >
                 {synthesis.status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} 
                 [ Run Molecular Analysis ]
              </button>
           </div>
        </div>

        <div className="space-y-4 relative z-10">
           <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-4 italic flex items-center gap-2">
              <Info size={14} className="text-emerald-500" /> Molecular Context / Known Markers (Optional)
           </label>
           <textarea 
             value={geneticContext}
             onChange={e => setGeneticContext(e.target.value)}
             className="w-full h-32 bg-[#0a0f18] border border-gray-800 rounded-[40px] p-8 text-sm text-slate-300 italic outline-none focus:border-emerald-500 shadow-inner transition-all custom-scrollbar"
             placeholder="Enter known mutations (e.g. KRAS G12D), family history of toxicity, or molecular subtypes..."
           />
        </div>
      </div>

      {synthesis.status === 'loading' ? (
        <div className="py-24 flex flex-col items-center gap-8 opacity-40">
           <div className="relative">
              <Loader2 size={64} className="animate-spin text-emerald-500" />
              <div className="absolute inset-0 flex items-center justify-center"><Dna size={24} className="animate-pulse text-indigo-500" /></div>
           </div>
           <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse">Modeling Genetic Pathways...</p>
        </div>
      ) : parsedData ? (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
           
           {/* NAV TABS */}
           <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-white/5 shadow-inner overflow-x-auto scrollbar-hide">
              {[
                { id: 'interactions', label: 'Gene-Drug Interactions', icon: AlertTriangle },
                { id: 'therapies', label: 'Precision Therapies', icon: Pill },
                { id: 'delivery', label: 'Therapy Delivery', icon: Droplets },
                { id: 'predictions', label: 'Future & Response', icon: TrendingUp },
                { id: 'patho', label: 'Molecular Patho', icon: Brain }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveInternalTab(tab.id as any)}
                  className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeInternalTab === tab.id ? 'bg-emerald-600 text-white shadow-lg italic' : 'text-gray-600 hover:text-white'}`}
                >
                   <tab.icon size={14} /> {tab.label}
                </button>
              ))}
           </div>

           <div className="min-h-[400px]">
              {activeInternalTab === 'interactions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                   {parsedData.interactions?.map((i, idx) => (
                     <div key={idx} className="bg-[#111827] border border-amber-500/20 p-8 rounded-[40px] shadow-xl space-y-4 group hover:border-amber-500/40 transition-all">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                           <span className="text-xl font-black text-white uppercase italic tracking-tight">{i.drug}</span>
                           <span className="px-3 py-1 bg-amber-600/10 text-amber-500 border border-amber-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest">Gene: {i.gene}</span>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-amber-500/60 uppercase">Impact Node</p>
                           <p className="text-sm font-bold text-slate-200 italic">{i.impact}</p>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed italic border-t border-white/5 pt-4">"{i.note}"</p>
                     </div>
                   ))}
                </div>
              )}

              {activeInternalTab === 'therapies' && (
                <div className="space-y-6 animate-in fade-in">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {parsedData.therapies?.map((t, idx) => (
                        <div key={idx} className="bg-[#111827] border border-cyan-500/20 p-8 rounded-[40px] shadow-xl flex flex-col justify-between group hover:border-cyan-500/40 transition-all">
                           <div className="space-y-6">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{t.drug}</p>
                                    <p className="text-[10px] font-black text-cyan-500 uppercase mt-2 tracking-widest">{t.type}</p>
                                 </div>
                                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${t.evid === 'Level A' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-black/40 text-gray-500 border border-white/5'}`}>{t.evid} Evidence</span>
                              </div>
                              <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                 <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Availability</p>
                                 <p className="text-xs font-bold text-slate-300 italic">{t.avail}</p>
                              </div>
                           </div>
                           <button className="mt-8 w-full py-4 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-cyan-600 hover:text-white transition-all shadow-xl">Inquire Acquisition</button>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeInternalTab === 'delivery' && (
                <div className="bg-[#0a0f18] border border-emerald-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden animate-in fade-in">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12"><Droplets size={300} /></div>
                   <div className="flex items-center gap-6 mb-10 pb-6 border-b border-white/5 relative z-10">
                      <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                         <Droplets size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Molecular Therapy Delivery</h3>
                   </div>
                   <div className="prose prose-invert max-w-none relative z-10">
                      <div className="text-lg text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                         {parsedData.delivery || "Synthesizing administration protocols..."}
                      </div>
                   </div>
                   <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
                     <button 
                       onClick={() => handleExplain(parsedData.delivery)}
                       className="px-14 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[40px] font-black uppercase text-xs tracking-[0.4em] shadow-4xl transition-all active:scale-95 flex items-center justify-center gap-5 border border-white/10 italic"
                     >
                       <Volume2 size={28} /> [ Explain Delivery Node ]
                     </button>
                   </div>
                </div>
              )}

              {activeInternalTab === 'predictions' && (
                <div className="space-y-12 animate-in fade-in">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] italic px-4">Biomarker Response Trends</h4>
                         {parsedData.responses?.map((r, idx) => (
                           <div key={idx} className="bg-[#0a0f18] p-8 rounded-[40px] border border-indigo-500/10 shadow-inner space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className="text-lg font-black text-white uppercase italic">{r.marker}</span>
                                 <span className={`text-[10px] font-black uppercase italic ${r.trend === 'Responder' ? 'text-emerald-500' : 'text-red-400'}`}>{r.trend} Profile</span>
                              </div>
                              <p className="text-xs text-slate-400 italic leading-relaxed">"{r.mechanism}"</p>
                           </div>
                         ))}
                      </div>
                      <div className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[50px] shadow-3xl space-y-8">
                         <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3"><RefreshCw size={16} /> Future Approaches & New Targets</h4>
                         <div className="space-y-6">
                            {parsedData.future?.map((f, idx) => (
                              <div key={idx} className="flex items-start gap-5 group">
                                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform"><Microscope size={24}/></div>
                                 <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center">
                                       <p className="text-sm font-black text-white uppercase italic">{f.therapy || f.target}</p>
                                       <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{f.status || 'Active Trial'}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic leading-relaxed">{f.impact || f.rationale}</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeInternalTab === 'patho' && (
                <div className="bg-[#0a0f18] border border-emerald-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden animate-in fade-in">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12"><Brain size={300} /></div>
                   <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                      <div className="flex items-center gap-6">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_emerald]" />
                         <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Molecular Pathophysiology Explorer</h3>
                      </div>
                      <button 
                        onClick={() => handleExplain(parsedData.pathomorph)}
                        className="px-8 py-3 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-xl flex items-center gap-3"
                      >
                        <Volume2 size={16} /> Explain Logic
                      </button>
                   </div>
                   <div className="prose prose-invert max-w-none relative z-10">
                      <div className="text-lg text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                         {parsedData.pathomorph || "Molecule node standby."}
                      </div>
                   </div>
                </div>
              )}
           </div>

           <div className="mt-12 p-10 bg-indigo-900/10 border border-indigo-500/10 rounded-[50px] flex items-start gap-8 shadow-inner">
              <div className="w-16 h-16 rounded-[24px] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10 shrink-0">
                 <FlaskConical size={32} />
              </div>
              <div className="space-y-2">
                 <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                    Institutional Disclaimer: Precision Medicine nodes provide context-aware genomic insights. Awareness only – testing required to confirm clinical status. Final therapeutic decisions rest with the Consultant Specialist.
                 </p>
                 <p className="text-[10px] text-indigo-500/60 font-bold uppercase tracking-widest italic">Protocol: precision-md-v2 • Molecular Sync: {teachingMode ? 'ACTIVE' : 'READY'}</p>
              </div>
           </div>

        </div>
      ) : (
        <div className="py-40 text-center opacity-10 flex flex-col items-center grayscale select-none">
           <Microscope size={120} className="mb-10 text-gray-700" />
           <p className="text-5xl font-black uppercase tracking-[0.8em] italic">Precision Standby</p>
           <p className="text-[11px] font-black uppercase mt-12 tracking-[0.5em] text-gray-600 italic">Initialize molecular node for targeted insights</p>
        </div>
      )}
    </div>
  );
};

export default GenomicsIntelligenceHub;
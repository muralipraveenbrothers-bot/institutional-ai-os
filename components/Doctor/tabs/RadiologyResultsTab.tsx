import React, { useState, useMemo } from 'react';
import { 
  Scan, Clock, CheckCircle2, Eye, Sparkles, AlertTriangle, 
  Target, Volume2, ShieldCheck, Siren, FileText, Image as ImageIcon,
  ArrowUpRight, Info, ChevronRight, LayoutGrid, Zap, Maximize, Loader2,
  Lock, ExternalLink, Database, Link, Microscope, HelpCircle
} from 'lucide-react';
import { Patient, Investigation } from '../../../types';
import { speakText, generateRadiologyAdvisorySummary, sushrutRadiologyCorrelationStream } from '../../../geminiService';

interface RadiologyResultsTabProps {
  patient: Patient;
}

const RadiologyResultsTab: React.FC<RadiologyResultsTabProps> = ({ patient }) => {
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [acknowledgedInvs, setAcknowledgedInvs] = useState<string[]>([]);
  
  // ADD-ON B: Correlation States
  const [isCorrelating, setIsCorrelating] = useState(false);
  const [correlationText, setCorrelationText] = useState("");
  const [showCorrelation, setShowCorrelation] = useState(false);

  const radiologyInvs = useMemo(() => {
    return (patient.investigations || []).filter(inv => inv.type === 'RADIOLOGY');
  }, [patient]);

  const selectedInv = useMemo(() => {
    return radiologyInvs.find(inv => inv.id === selectedInvId);
  }, [radiologyInvs, selectedInvId]);

  const handleRunAiSummary = async (reportText: string) => {
    setIsSynthesizing(true);
    setAiSummary(null);
    try {
      const summary = await generateRadiologyAdvisorySummary(reportText);
      setAiSummary(summary);
    } catch (e) {
      setAiSummary("Synthesis failure. Please review full report.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleRunCorrelation = async (reportText: string) => {
    setIsCorrelating(true);
    setCorrelationText("");
    setShowCorrelation(true);
    try {
      const stream = sushrutRadiologyCorrelationStream({ findings: reportText, patient });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setCorrelationText(fullText);
      }
    } catch (e) {
      setCorrelationText("Correlation Node Link Down. Manual review mandatory.");
    } finally {
      setIsCorrelating(false);
    }
  };

  const handleAcknowledge = (id: string) => {
    setAcknowledgedInvs(prev => [...prev, id]);
    window.emitAppEvent?.({
      type: "DOCTOR_APPROVED",
      message: `Critical Finding Acknowledged for ${patient.name}`
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* HUD HEADER */}
      <div className="bg-[#111827] border border-blue-500/20 rounded-[60px] p-10 shadow-3xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Scan size={300} /></div>
        <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-8 mb-4">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
                <Scan size={36} />
              </div>
              <div>
                 <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Imaging Registry</h2>
                 <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mt-2 italic">Institutional Multi-Modality Lattice</p>
              </div>
           </div>
           <div className="flex items-center gap-4 px-6 py-2 bg-black/40 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_cyan]" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Vision-Node Sync: Stable</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
           {radiologyInvs.map(inv => {
             const isCritical = inv.radiologyDetails?.report?.critical;
             const isAck = acknowledgedInvs.includes(inv.id);
             return (
              <div 
                key={inv.id} 
                onClick={() => setSelectedInvId(inv.id)}
                className={`p-8 rounded-[45px] border transition-all cursor-pointer group flex flex-col justify-between h-[250px] relative overflow-hidden ${selectedInvId === inv.id ? 'bg-blue-600/10 border-blue-500/40 shadow-xl ring-1 ring-blue-500/20' : 'bg-[#0a0f18] border-gray-800 hover:border-blue-500/30 hover:bg-[#0d1321]'}`}
              >
                 {isCritical && !isAck && (
                   <div className="absolute top-0 right-0 p-4 animate-pulse"><AlertTriangle size={32} className="text-red-500/40" /></div>
                 )}
                 <div className="flex justify-between items-start relative z-10">
                    <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center border transition-all ${inv.result_status === 'COMPLETED' ? (isCritical ? 'bg-red-600/20 border-red-500/40 text-red-500' : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-500') : 'bg-gray-900 border-gray-800 text-gray-700 group-hover:text-blue-400 group-hover:border-blue-500/30'}`}>
                       <ImageIcon size={28} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${inv.payment_status === 'PAID' ? 'bg-emerald-600/20 text-emerald-500' : 'bg-orange-600/20 text-orange-500'}`}>
                          {inv.payment_status}
                       </span>
                    </div>
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight truncate leading-none group-hover:text-blue-400 transition-colors">{inv.name}</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase mt-3 tracking-widest italic">{inv.radiologyDetails?.modality || 'Imaging'} Node • {inv.id.slice(-6)}</p>
                 </div>
                 <div className="flex items-center justify-between border-t border-white/5 pt-5 relative z-10">
                    <div className="flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full ${inv.result_status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_12px_emerald]' : 'bg-gray-800'}`} />
                       <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">{inv.result_status}</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-800 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
                 </div>
              </div>
             );
           })}
           {radiologyInvs.length === 0 && (
             <div className="col-span-3 py-32 text-center opacity-10 grayscale flex flex-col items-center gap-8 border-4 border-dashed border-white/5 rounded-[60px]">
                <LayoutGrid size={120} />
                <div className="space-y-2">
                   <p className="text-2xl font-black uppercase tracking-[0.5em] italic">Imagery Standby</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest">No imaging orders released for this clinical node</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* DYNAMIC RESULTS VIEW */}
      {selectedInv && (
        <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-1000">
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* LEFT: IMAGES & ANNOTATIONS */}
              <div className="lg:col-span-7 space-y-10">
                 <div className="bg-[#0a0f18] border border-gray-800 rounded-[70px] overflow-hidden shadow-4xl p-6 aspect-square flex items-center justify-center bg-black relative group shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.2)_0%,transparent_100%)]" />
                    {selectedInv.radiologyDetails?.images?.length ? (
                      <div className="relative w-full h-full animate-in zoom-in-95 duration-1000">
                         <img src={selectedInv.radiologyDetails.images[0].url} className="w-full h-full object-contain filter brightness-110 contrast-125" alt="Clinical Scan" />
                         <div className="absolute inset-0 pointer-events-none p-12">
                            <div className="w-full h-full border border-blue-500/10 rounded-full flex items-center justify-center">
                               <div className="px-6 py-2.5 bg-blue-600/80 backdrop-blur-xl rounded-full border border-blue-400/30 text-white shadow-2xl scale-110">
                                  <div className="flex items-center gap-3">
                                     <Target size={14} className="animate-pulse" />
                                     <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Analytical Region Focus</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="text-center opacity-10 grayscale flex flex-col items-center gap-8">
                         <ImageIcon size={120} />
                         <p className="text-4xl font-black uppercase italic tracking-[0.2em]">imagery pending</p>
                      </div>
                    )}
                    <div className="absolute bottom-10 right-10 flex gap-4">
                       <button className="p-5 bg-black/60 backdrop-blur-xl text-white hover:bg-blue-600 rounded-3xl border border-white/10 transition-all shadow-4xl group"><Maximize size={24} className="group-hover:scale-110 transition-transform"/></button>
                       <button className="p-5 bg-black/60 backdrop-blur-xl text-white hover:bg-blue-600 rounded-3xl border border-white/10 transition-all shadow-4xl group"><ExternalLink size={24} className="group-hover:scale-110 transition-transform"/></button>
                    </div>
                 </div>
                 
                 {/* ADD-ON B: RADIOLOGY–CLINICAL CORRELATION INTELLIGENCE */}
                 <div className="bg-[#111827] border border-cyan-500/20 rounded-[60px] p-10 shadow-3xl space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Link size={150} className="text-cyan-500" /></div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-6 relative z-10">
                       <div className="flex items-center gap-4">
                          <Microscope size={20} className="text-cyan-400"/>
                          <h4 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.5em] italic">Clinical–Imaging Correlation</h4>
                       </div>
                       <button 
                         onClick={() => handleRunCorrelation(selectedInv.radiologyDetails?.report?.text || "")}
                         disabled={isCorrelating || !selectedInv.radiologyDetails?.report?.text}
                         className={`px-6 py-2 bg-cyan-600/10 text-[10px] font-black text-cyan-400 hover:bg-cyan-600 hover:text-white border border-cyan-500/20 rounded-full uppercase tracking-widest transition-all italic ${isCorrelating ? 'animate-pulse' : ''}`}
                       >
                          {isCorrelating ? <Loader2 size={12} className="animate-spin" /> : '[ CORRELATE FINDINGS ]'}
                       </button>
                    </div>
                    
                    <div className="min-h-[150px] relative z-10 flex flex-col justify-center">
                       {correlationText ? (
                         <div className="prose prose-invert max-w-none text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                            {correlationText}
                         </div>
                       ) : isCorrelating ? (
                         <div className="flex flex-col items-center justify-center py-10 gap-6 opacity-40">
                            <Zap size={40} className="text-cyan-500 animate-pulse" />
                            <p className="text-[10px] font-black text-white uppercase tracking-[0.6em] animate-pulse">Cross-Referencing Symptoms & Labs...</p>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center gap-4 opacity-20">
                            <HelpCircle size={48} />
                            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-center">Awaiting report synthesis for correlation mapping</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* RIGHT: REPORT & AI ADVISORY */}
              <div className="lg:col-span-5 space-y-10 flex flex-col h-full">
                 {selectedInv.result_status === 'COMPLETED' ? (
                   <>
                     <div className={`bg-[#0a0f18] border rounded-[70px] p-12 flex-1 shadow-4xl space-y-12 relative overflow-hidden transition-all duration-700 ${selectedInv.radiologyDetails?.report?.critical ? 'border-red-500/40 shadow-red-500/5' : 'border-emerald-500/30'}`}>
                        {selectedInv.radiologyDetails?.report?.critical && (
                          <div className="absolute top-0 right-0 p-10 opacity-[0.03] animate-pulse"><Siren size={250} className="text-red-500" /></div>
                        )}
                        <div className="flex items-center justify-between border-b border-white/5 pb-8 relative z-10">
                           <div className="flex items-center gap-8">
                              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-2xl ${selectedInv.radiologyDetails?.report?.critical ? 'bg-red-600' : 'bg-emerald-600'}`}>
                                 <FileText size={32} />
                              </div>
                              <div>
                                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Radiological Synthesis</h3>
                                 <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em] mt-2">Certified: {selectedInv.radiologyDetails?.report?.radiologistName}</p>
                              </div>
                           </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 relative z-10 max-h-[400px]">
                           <div className="prose prose-invert max-w-none text-lg text-slate-200 font-medium italic leading-relaxed whitespace-pre-wrap font-mono drop-shadow-md">
                              {selectedInv.radiologyDetails?.report?.text}
                           </div>
                        </div>

                        {selectedInv.radiologyDetails?.report?.critical && (
                          <div className="relative z-10 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                             <div className="bg-red-600/10 border-2 border-red-500/40 p-8 rounded-[40px] flex items-center gap-8 shadow-2xl shadow-red-500/10">
                                <AlertTriangle size={36} className="text-red-500 animate-pulse" />
                                <p className="text-base font-black text-red-100 uppercase italic tracking-tight leading-tight">CRITICAL PATH DETECTED: <br/>Consultant Action Required</p>
                             </div>
                             {!acknowledgedInvs.includes(selectedInv.id) ? (
                               <button 
                                 onClick={() => handleAcknowledge(selectedInv.id)}
                                 className="w-full py-7 bg-red-600 hover:bg-red-500 text-white rounded-[40px] font-black uppercase text-xs tracking-[0.4em] shadow-[0_25px_60px_rgba(220,38,38,0.4)] transition-all active:scale-95 italic border-2 border-white/10"
                               >
                                  [ ACKNOWLEDGE CRITICAL FINDING ]
                               </button>
                             ) : (
                               <div className="bg-emerald-600/20 border border-emerald-500/40 p-5 rounded-[30px] flex items-center justify-center gap-4 animate-in zoom-in-95">
                                  <ShieldCheck size={20} className="text-emerald-500" />
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Acknowledged at {new Date().toLocaleTimeString()}</span>
                               </div>
                             )}
                          </div>
                        )}
                     </div>

                     <div className="bg-[#111827] border border-blue-500/20 rounded-[60px] p-10 shadow-3xl space-y-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.04] group-hover:scale-110 transition-transform duration-[4s]"><Sparkles size={150} /></div>
                        <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-6">
                           <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] flex items-center gap-4 italic"><Sparkles size={20} className="animate-pulse" /> AI Synthesis Advisory</h4>
                           <button 
                             onClick={() => handleRunAiSummary(selectedInv.radiologyDetails?.report?.text || "")}
                             disabled={isSynthesizing}
                             className="px-6 py-2 bg-blue-600/10 text-[10px] font-black text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 rounded-full uppercase tracking-widest transition-all italic shadow-xl"
                           >
                              {isSynthesizing ? <Loader2 size={12} className="animate-spin" /> : '[ SYNC AI BRIEF ]'}
                           </button>
                        </div>
                        
                        <div className="min-h-[120px] relative z-10 flex flex-col justify-center px-4">
                           {aiSummary || selectedInv.radiologyDetails?.report?.aiSummary ? (
                             <div className="text-[17px] text-slate-300 italic leading-relaxed font-medium animate-in fade-in duration-1000 drop-shadow-sm">
                                "{aiSummary || selectedInv.radiologyDetails?.report?.aiSummary}"
                             </div>
                           ) : (
                             <p className="text-[11px] text-gray-700 font-bold uppercase tracking-[0.4em] text-center italic">Initialize advisory synthesis for clinician brief</p>
                           )}
                        </div>
                     </div>
                   </>
                 ) : (
                   <div className="flex-1 bg-[#0d1321]/40 border-2 border-dashed border-gray-800 rounded-[70px] flex flex-col items-center justify-center text-center p-16 animate-in zoom-in-95 duration-700">
                      <div className="w-32 h-32 bg-gray-900 rounded-[45px] flex items-center justify-center mb-10 shadow-2xl relative">
                         <Clock size={64} className="text-gray-700 animate-spin" style={{animationDuration: '10s'}} />
                      </div>
                      <h3 className="text-4xl font-black text-white uppercase tracking-widest italic leading-none">Node Processing</h3>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-[0.4em] mt-8 leading-relaxed max-w-xs">Radiology workstation is processing modality streams. <br/> Availability window: 30-45m</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default RadiologyResultsTab;
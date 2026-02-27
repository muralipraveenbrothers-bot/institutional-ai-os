import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, User, ShieldCheck, Loader2, Sparkles, Zap, MessageSquare, 
  Stethoscope, Microscope, Scan, Scale, ClipboardList, TrendingUp
} from 'lucide-react';
import { Patient } from '../../../types';
// Corrected imported function name from sushrutMDTBoardStream to sushrutMDTBoardTabStream
import { sushrutMDTBoardTabStream } from '../../../geminiService';
import { runAI, manualModeMessage } from '../../Shared/AppEventToast';

interface MDTBoardTabProps {
  patient: Patient;
  analysisContext?: string;
}

const MDTBoardTab: React.FC<MDTBoardTabProps> = ({ patient, analysisContext = "" }) => {
  const [boardResult, setBoardResult] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [boardResult.text]);

  const runMDTBoard = async (level: 'V1' | 'V2' | 'V3') => {
    setSelectedLevel(level);
    await runAI("susruta", async () => {
      setBoardResult({ text: "", status: 'loading' });
      
      try {
        // Corrected function call to sushrutMDTBoardTabStream
        const stream = sushrutMDTBoardTabStream({ patient, level });
        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          setBoardResult(prev => ({ ...prev, text: fullText }));
        }
        setBoardResult(prev => ({ ...prev, status: 'done' }));
      } catch (err) {
        setBoardResult({ text: "AI Board synchronization timeout. Proceeding with manual peer review protocol.", status: 'error' });
      }
    }, () => {
      setBoardResult({ text: "AI Board Offline. Accessing manual peer review protocol.", status: 'error' });
      manualModeMessage("MDT Board");
    });
  };

  const specialists = [
    { name: 'Dr. Susruta (Chair)', icon: User, color: 'bg-indigo-600', role: 'Clinical Lead' },
    { name: 'Dr. Varma', icon: Stethoscope, color: 'bg-emerald-600', role: 'Surgical Node' },
    { name: 'Radiology Lead', icon: Scan, color: 'bg-blue-600', role: 'Imaging Expert' },
    { name: 'Pathology Node', icon: Microscope, color: 'bg-pink-600', role: 'Diagnostic Lead' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-40">
      <div className="bg-[#111827] border border-orange-500/20 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Users size={300} /></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-12 border-b border-white/5 pb-10 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 bg-orange-600 rounded-[36px] flex items-center justify-center text-white shadow-[0_25px_70px_rgba(249,115,22,0.3)]">
               <Users size={48} />
            </div>
            <div>
               <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">MDT Board Mode</h2>
               <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.5em] mt-3 italic">Multi-Agent Consensus Node v6.2</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-3 bg-black/40 p-2 rounded-[30px] border border-orange-500/20 shadow-2xl">
              {['V1', 'V2', 'V3'].map((lvl) => (
                <button 
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl as any)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLevel === lvl ? 'bg-orange-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
                >
                  {lvl} {lvl === 'V1' ? 'QUICK' : lvl === 'V2' ? 'DETAILED' : 'ADVANCED'}
                </button>
              ))}
            </div>
            <button 
              onClick={() => runMDTBoard(selectedLevel)}
              disabled={boardResult.status === 'loading'}
              className="px-14 py-6 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white font-black uppercase text-xs tracking-widest rounded-[30px] transition-all flex items-center gap-5 border border-white/10 shadow-2xl italic"
            >
              {boardResult.status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />}
              [ INITIATE {selectedLevel} BOARD ]
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 relative z-10">
           {specialists.map((s, i) => (
             <div key={i} className="bg-black/40 border border-white/5 p-6 rounded-[32px] flex flex-col items-center text-center gap-3 group hover:border-orange-500/30 transition-all">
                <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
                   <s.icon size={28} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-white uppercase tracking-tight leading-none">{s.name}</p>
                   <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">{s.role}</p>
                </div>
             </div>
           ))}
        </div>

        <div className="space-y-10 relative z-10">
           {(boardResult.text || boardResult.status === 'loading') ? (
             <div className="bg-[#05070a] border border-orange-500/20 rounded-[50px] p-12 shadow-inner relative animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between border-b border-white/5 pb-8 mb-10">
                   <div className="flex items-center gap-5">
                      <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse shadow-[0_0_15px_orange]" />
                      <span className="text-[11px] font-black text-orange-700 uppercase tracking-[0.5em]">{selectedLevel} Board-Certified Synthesis</span>
                   </div>
                   {boardResult.status === 'loading' && <Loader2 size={24} className="text-orange-500 animate-spin" />}
                </div>
                
                <div ref={scrollRef} className="max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
                  <div className="prose prose-invert max-w-none">
                     <div className="text-base text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                        {boardResult.text || "Synchronizing multi-specialist nodes..."}
                     </div>
                  </div>
                </div>

                {boardResult.status === 'done' && (
                  <div className="mt-12 pt-10 border-t border-white/5 flex flex-col items-center gap-8">
                     <div className="bg-orange-600/5 border border-orange-500/10 p-6 rounded-[32px] inline-flex items-center gap-5">
                        <ShieldCheck size={24} className="text-emerald-500/60" />
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic text-center leading-relaxed">
                          MDT Board consensus modeled on institutional standard guidelines (Level {selectedLevel}).
                        </p>
                     </div>
                     <button className="px-10 py-5 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-[30px] font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">
                        Export Board Notes
                     </button>
                  </div>
                )}
             </div>
           ) : (
             <div className="py-24 text-center opacity-10 flex flex-col items-center gap-8 border-4 border-dashed border-white/5 rounded-[60px]">
                <Scale size={100} className="text-gray-500" />
                <div className="space-y-4">
                   <h3 className="text-3xl font-black uppercase tracking-[0.4em] italic">Board Room Idle</h3>
                   <p className="text-sm font-medium uppercase tracking-[0.3em]">Assemble multi-disciplinary nodes for complex case resolution</p>
                </div>
             </div>
           )}
        </div>
      </div>

      <div className="p-10 bg-orange-600/5 border border-orange-500/20 rounded-[48px] flex items-start gap-8 shadow-inner">
          <div className="w-14 h-14 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-500/10 shrink-0">
             <ClipboardList size={32} />
          </div>
          <div className="space-y-2">
             <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                MDT Multi-Agent Protocol: Simulates the interaction between specialized reasoning engines to provide a 360° clinical view, prioritizing safety and conflicting interpretation alerts.
             </p>
             <p className="text-[10px] text-orange-700 font-bold uppercase tracking-widest italic">Institutional Peer Review v6.2</p>
          </div>
      </div>
    </div>
  );
};

export default MDTBoardTab;
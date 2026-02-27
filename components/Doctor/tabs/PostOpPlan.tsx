
import React from 'react';
import { HeartPulse, CheckCircle2 } from 'lucide-react';

interface PostOpPlanProps {
  parsedSections: Record<string, string>;
  isApproved: boolean;
  onApprove: () => void;
  procedure: string;
}

const PostOpPlan: React.FC<PostOpPlanProps> = ({ parsedSections, isApproved, onApprove, procedure }) => {
  if (!parsedSections['POST-OPERATIVE PLAN']) return (
    <div className="p-10 border-2 border-dashed border-gray-800 rounded-[40px] text-center opacity-20">
       <p className="text-[10px] font-black uppercase tracking-widest italic">Awaiting surgical synthesis to generate post-op node.</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
       <div className="bg-[#111827] border border-emerald-500/20 rounded-[40px] p-10 shadow-4xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><HeartPulse size={200} /></div>
          <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
             <HeartPulse size={24} className="text-emerald-500" />
             <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Post-Operative Recovery Protocol</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
             <div className="bg-[#05070a] p-8 rounded-[30px] border border-white/5 shadow-inner">
                <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-4">Care Strategy</h4>
                <div className="text-[13px] text-slate-300 italic leading-relaxed whitespace-pre-wrap font-mono">
                   {parsedSections['POST-OPERATIVE PLAN']}
                </div>
             </div>
             <div className="bg-[#05070a] p-8 rounded-[30px] border border-white/5 shadow-inner">
                <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4">Expected Outcomes</h4>
                <div className="text-[13px] text-slate-300 italic leading-relaxed whitespace-pre-wrap font-mono">
                   {parsedSections['EXPECTED OUTCOMES'] || "Monitoring for standard physiological recovery trajectory."}
                </div>
             </div>
          </div>
       </div>

       <div className="bg-[#111827] border border-indigo-500/20 rounded-[40px] p-10 shadow-3xl text-center">
          <div className="max-w-xl mx-auto space-y-4 mb-8">
             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Clinical Authorization</h2>
             <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Confirmation locks path and dispatches prep tasks to Ward/OT.</p>
          </div>

          <button 
             onClick={onApprove}
             disabled={isApproved || !procedure}
             className={`w-full py-8 rounded-[35px] font-black uppercase text-sm tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-6 italic border-2 ${isApproved ? 'bg-emerald-600 text-white border-emerald-400 shadow-xl' : 'bg-[#0a0f18] border-gray-800 text-gray-700 hover:border-indigo-500/30'}`}
          >
             {isApproved ? (
                <>
                   <CheckCircle2 size={32} className="animate-in zoom-in" /> 
                   <span>PATHWAY SECURED</span>
                </>
             ) : (
                <span>[ AUTHORIZE SURGERY NODE ]</span>
             )}
          </button>
       </div>
    </div>
  );
};

export default PostOpPlan;

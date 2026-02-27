
import React from 'react';
import { Target, Info, Loader2 } from 'lucide-react';

interface SurgicalOverviewProps {
  patient: any;
  roadmapText: string;
  status: 'idle' | 'loading' | 'done' | 'error';
}

const SurgicalOverview: React.FC<SurgicalOverviewProps> = ({ patient, roadmapText, status }) => {
  const parseValue = (marker: string) => {
    const regex = new RegExp(`${marker}\\s*:([^]*?)(?=OVERVIEW_|SURG_ROADMAP_|$)`, 'i');
    const match = roadmapText.match(regex);
    return match ? match[1].trim() : '';
  };

  return (
    <div className="p-8 bg-[#0a0f18] border border-indigo-500/20 rounded-[40px] shadow-inner">
       <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
             <Target className="text-indigo-400" size={24} />
             <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Surgical Overview</h3>
          </div>
          <div className="px-4 py-1 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-[8px] font-black text-indigo-400 uppercase tracking-[0.4em]">Pre-Operative Summary</div>
       </div>

       {status === 'idle' && !roadmapText ? (
          <div className="py-10 flex flex-col items-center justify-center text-center opacity-30">
             <Info size={48} className="text-gray-600 mb-4" />
             <p className="text-xs font-black uppercase tracking-widest text-gray-500">Procedure not selected yet. Clinical indication required.</p>
          </div>
       ) : status === 'loading' && !roadmapText ? (
          <div className="py-10 flex flex-col items-center justify-center gap-4">
             <Loader2 size={32} className="animate-spin text-indigo-500" />
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Modeling Operative Overview...</p>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                   <p className="text-[8px] font-black text-gray-600 uppercase mb-2">Primary Indication</p>
                   <p className="text-sm font-black text-white italic">{parseValue('OVERVIEW_INDICATION') || 'Indication Locked'}</p>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                   <p className="text-[8px] font-black text-gray-600 uppercase mb-2">Surgical Urgency</p>
                   <p className="text-sm font-black text-emerald-400 italic">{parseValue('OVERVIEW_URGENCY') || 'Standard'}</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-red-500/30 transition-all">
                   <p className="text-[8px] font-black text-gray-600 uppercase mb-2">Physiological Severity</p>
                   <p className="text-sm font-black text-red-400 italic">{parseValue('OVERVIEW_SEVERITY') || 'Stable'}</p>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-all">
                   <p className="text-[8px] font-black text-gray-600 uppercase mb-2">Institutional Risk Level</p>
                   <p className="text-sm font-black text-amber-400 italic">{parseValue('OVERVIEW_RISK') || 'Low'}</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                   <p className="text-[8px] font-black text-indigo-400 uppercase mb-2">Pre-op Optimization</p>
                   <p className="text-[11px] text-slate-300 italic font-medium leading-relaxed">"{parseValue('OVERVIEW_OPTIMIZATION')}"</p>
                </div>
                <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 group hover:bg-indigo-600/20 transition-all">
                   <p className="text-[8px] font-black text-indigo-400 uppercase mb-2">Planned Approach</p>
                   <p className="text-sm font-black text-white italic">{parseValue('OVERVIEW_APPROACH') || 'Standard'}</p>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default SurgicalOverview;


import React from 'react';
import { Brain, ArrowUpRight, Loader2, Layers } from 'lucide-react';
import { SurgicalOption } from '../../../types';

interface ProcedureSelectionProps {
  specialty: string;
  setSpecialty: (s: string) => void;
  procedure: string;
  setProcedure: (p: string) => void;
  extractedProcs: SurgicalOption[];
  isExtracting: boolean;
  onSelectRec: (rec: SurgicalOption) => void;
}

const SPECIALTIES = [ 
  'General Surgery', 'Orthopedics', 'OBG', 'Surgical Gastroenterology', 
  'Neurosurgery', 'Urology', 'ENT', 'Plastic Surgery', 'Onco Surgery', 'Others' 
];

const COMMON_PROCEDURES: Record<string, string[]> = {
  'General Surgery': ['Laparoscopic Cholecystectomy', 'Appendectomy', 'Open Hernia Repair', 'Mastectomy', 'Haemorrhoidectomy'],
  'Orthopedics': ['Total Knee Replacement', 'Total Hip Replacement', 'Arthroscopy', 'ORIF Fracture Fixation'],
  'OBG': ['LSCS (C-Section)', 'Total Abdominal Hysterectomy', 'Myomectomy', 'Ovarian Cystectomy'],
};

const ProcedureSelection: React.FC<ProcedureSelectionProps> = ({ 
  specialty, setSpecialty, procedure, setProcedure, extractedProcs, isExtracting, onSelectRec 
}) => {
  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic flex items-center gap-2">
             <Brain size={16} /> Surgical Registry Controls
          </p>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isExtracting ? (
            <div className="col-span-2 p-10 bg-black/20 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-4">
               <Loader2 size={32} className="animate-spin text-indigo-500" />
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Extracting possibilities from roadmap...</p>
            </div>
          ) : extractedProcs.length > 0 ? extractedProcs.map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => onSelectRec(item)}
              className={`p-6 rounded-[35px] border transition-all text-left group relative overflow-hidden flex flex-col justify-center ${procedure === item.procedure ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl ring-1 ring-indigo-500/20' : 'bg-[#0a0f18] border-gray-800 hover:border-indigo-500/20'}`}
            >
               <div className="flex justify-between items-center relative z-10">
                  <div>
                    <p className="text-sm font-black text-white uppercase italic group-hover:text-indigo-400 transition-colors leading-none">{item.procedure}</p>
                    <p className="text-[8px] text-gray-600 font-bold uppercase mt-2">{item.specialty}</p>
                  </div>
                  <ArrowUpRight size={20} className="text-gray-800 group-hover:text-indigo-500 transition-all" />
               </div>
            </button>
          )) : null}
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-2 italic">Specialty</label>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-white outline-none focus:border-indigo-500 appearance-none shadow-inner">
               {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-2 italic">Target Procedure</label>
            <input list="procedures-list" value={procedure} onChange={e => setProcedure(e.target.value)} placeholder="Designate Procedure..." className="w-full bg-[#0a0f18] border border-gray-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-white outline-none focus:border-indigo-500 shadow-inner" />
            <datalist id="procedures-list">{(COMMON_PROCEDURES[specialty] || []).map(p => <option key={p} value={p} />)}</datalist>
          </div>
       </div>
    </div>
  );
};

export default ProcedureSelection;

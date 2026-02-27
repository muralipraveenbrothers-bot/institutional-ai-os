
import React, { useState } from "react";
import { 
  PhoneForwarded, FileBarChart, Star, CheckCircle, 
  UserPlus, ClipboardList, Zap, MessageSquare, 
  Printer, Download, ShieldCheck, Heart, ChevronRight
} from "lucide-react";
import { speakText } from "../../geminiService";

export const ReceptionAdvancedLayer: React.FC = () => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleCallPatient = (token: number | string, cabin: string) => {
    speakText(`Token ${token}, proceed to ${cabin}.`, "Zephyr");
  };

  const generateDailyReportPDF = () => {
    alert("Generating Institutional Summary Node...");
  };

  const submitFeedback = () => {
    if (!comment.trim()) return;
    speakText("Feedback synchronized.", "Zephyr");
    setComment("");
    alert("Feedback Submitted ✅");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      
      {/* 1. CABIN DISPATCH */}
      <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] shadow-2xl space-y-6">
        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] italic flex items-center gap-3 border-b border-white/5 pb-4"><PhoneForwarded size={16}/> Cabin Dispatch</h3>
        <div className="space-y-3">
           {[
             { label: "Consultation Room 1", token: "A-101" },
             { label: "Consultation Room 2", token: "B-202" },
             { label: "Diagnostics Wing", token: "T-303" }
           ].map((cabin, i) => (
             <button 
               key={i}
               onClick={() => handleCallPatient(cabin.token, cabin.label)}
               className="w-full p-4 bg-black/40 border border-gray-800 rounded-2xl flex items-center justify-between group hover:border-indigo-500/40 transition-all active:scale-95"
             >
                <div className="text-left">
                   <p className="text-[9px] font-black text-gray-700 uppercase">{cabin.label}</p>
                   <p className="text-xs font-black text-white italic mt-1">Dispatching: {cabin.token}</p>
                </div>
                <Zap size={12} className="text-gray-800 group-hover:text-indigo-500 transition-colors" />
             </button>
           ))}
        </div>
      </div>

      {/* 2. DAILY SUMMARY */}
      <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] shadow-2xl flex flex-col justify-between">
        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] italic flex items-center gap-3 border-b border-white/5 pb-4"><FileBarChart size={16}/> Daily Summary</h3>
        <div className="py-6">
           <p className="text-xs text-slate-500 italic leading-relaxed">
             Institutional audit of today's registry flow, concerns, and feedback scores.
           </p>
        </div>
        <button 
          onClick={generateDailyReportPDF}
          className="w-full py-4 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all italic flex items-center justify-center gap-3"
        >
           <Printer size={16} /> [ Export Daily PDF ]
        </button>
      </div>

      {/* 3. FEEDBACK NODE */}
      <div className="bg-[#111827] border border-white/5 p-8 rounded-[40px] shadow-2xl space-y-4">
        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] italic flex items-center gap-3 border-b border-white/5 pb-4"><Star size={16}/> Experience Node</h3>
        
        <div className="space-y-4">
           <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
              <span className="text-[8px] font-black text-gray-700 uppercase">Rating</span>
              <div className="flex gap-1">
                 {[1, 2, 3, 4, 5].map(v => (
                   <button key={v} onClick={() => setRating(v)} className={`w-5 h-5 flex items-center justify-center ${rating >= v ? 'text-amber-500' : 'text-gray-800'}`}><Star size={12} fill={rating >= v ? "currentColor" : "none"} /></button>
                 ))}
              </div>
           </div>
           <textarea
             value={comment}
             onChange={(e) => setComment(e.target.value)}
             placeholder="Sentiment data..."
             className="w-full h-16 bg-black/40 border border-gray-800 rounded-xl p-4 text-[10px] italic text-slate-400 outline-none focus:border-indigo-500 transition-all shadow-inner resize-none"
           />
           <button onClick={submitFeedback} disabled={!comment.trim()} className="w-full py-3 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all italic">Submit Feedback</button>
        </div>
      </div>
    </div>
  );
};

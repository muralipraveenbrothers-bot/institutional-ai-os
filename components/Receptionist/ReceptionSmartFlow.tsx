
import React, { useState, useEffect } from "react";
import { 
  Ticket, Volume2, TrendingUp, MessageSquare, Plus, 
  ChevronRight, CheckCircle2, AlertTriangle, UserPlus, Zap, Clock, 
  Target, Activity, Sparkles, Send, SquareDashedBottom
} from "lucide-react";
import { speakText } from "../../geminiService";

export const ReceptionSmartFlow: React.FC<{ variant?: 'TOKENS' | 'CONCERNS' }> = ({ variant }) => {
  const [currentToken, setCurrentToken] = useState<number>(() => 
    Number(localStorage.getItem("current_token")) || 0
  );
  const [queue, setQueue] = useState<number[]>(() => 
    JSON.parse(localStorage.getItem("token_queue") || "[]")
  );
  const [complaintText, setComplaintText] = useState("");

  useEffect(() => {
    localStorage.setItem("current_token", currentToken.toString());
    localStorage.setItem("token_queue", JSON.stringify(queue));
  }, [currentToken, queue]);

  const generateToken = () => {
    const newToken = currentToken + 1;
    setCurrentToken(newToken);
    setQueue(prev => [...prev, newToken]);
    speakText("New token generated.", "Zephyr");
  };

  const callNext = () => {
    if (queue.length === 0) return;
    const next = queue[0];
    setQueue(prev => prev.slice(1));
    speakText(`Token number ${next}, please come forward.`, "Zephyr");
  };

  const submitConcern = () => {
    if (!complaintText.trim()) return;
    const complaints = JSON.parse(localStorage.getItem("complaints") || "[]");
    complaints.push({ text: complaintText, time: new Date().toISOString(), status: "Pending" });
    localStorage.setItem("complaints", JSON.stringify(complaints));
    speakText("Concern registered.", "Zephyr");
    setComplaintText("");
    alert("Concern Logged ✅");
  };

  if (variant === 'TOKENS') {
    return (
      <div className="bg-[#111827] border border-white/5 p-10 rounded-[50px] shadow-3xl space-y-10 relative overflow-hidden h-full flex flex-col justify-between">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none"><Ticket size={180} /></div>
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
           <Ticket className="text-cyan-500" size={20} />
           <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.4em] italic">Token Ingress</h3>
        </div>
        <div className="flex items-end justify-between">
           <div>
              <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-1 italic">Active Queue</p>
              <p className="text-6xl font-black text-white italic">{queue.length}</p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-1 italic">Master Count</p>
              <p className="text-2xl font-black text-cyan-400 italic">#{currentToken}</p>
           </div>
        </div>
        
        <div className="flex gap-4 pt-6">
           <button onClick={generateToken} className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 italic">New Token</button>
           <button onClick={callNext} disabled={queue.length === 0} className="flex-1 py-5 bg-[#0a0f18] border border-gray-800 text-gray-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-30 italic">Call Next</button>
        </div>
      </div>
    );
  }

  if (variant === 'CONCERNS') {
    return (
      <div className="bg-[#111827] border border-white/5 p-10 rounded-[50px] shadow-3xl space-y-8 h-full flex flex-col justify-between">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none"><MessageSquare size={180} /></div>
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
           <MessageSquare className="text-indigo-400" size={20} />
           <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.4em] italic">Concern Registry</h3>
        </div>
        
        <textarea
          value={complaintText}
          onChange={(e) => setComplaintText(e.target.value)}
          placeholder="Register patient concern for AI prioritization..."
          className="w-full h-24 bg-black/40 border border-gray-800 rounded-2xl p-6 text-sm italic text-slate-300 outline-none focus:border-indigo-500 transition-all shadow-inner resize-none"
        />

        <button
          onClick={submitConcern}
          disabled={!complaintText.trim()}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-4 italic active:scale-95"
        >
          <Zap size={14} fill="currentColor" /> Dispatch Concern
        </button>
      </div>
    );
  }

  return null;
};


import React, { useState } from 'react';
import { 
  Smile, Star, Heart, CheckCircle2, X, Bot, 
  MessageCircle, Mic, Square, Loader2, Send, Handshake
} from 'lucide-react';
import { processHumanInput } from '../../HumanVoiceLayer';

interface PSISurveyProps {
  onClose: () => void;
  department: string;
}

const SatisfactionSurvey: React.FC<PSISurveyProps> = ({ onClose, department }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [isDone, setIsDone] = useState(false);

  const questions = [
    "Did you feel properly cared for today?",
    "Were the medical explanations clear to you?",
    "Was our hospital staff polite and helpful?",
    "Do you trust this hospital for your future care?"
  ];

  const handleScore = (val: number) => {
    const newScores = [...scores, val];
    setScores(newScores);
    
    if (step < questions.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      processHumanInput("", questions[nextStep]);
    } else {
      setIsDone(true);
      const avg = newScores.reduce((a, b) => a + b, 0) / newScores.length;
      // In real app, persist this to PSI registry
      console.log(`PSI Logged: ${avg.toFixed(1)} for ${department}`);
    }
  };

  const startSurvey = () => {
    setStep(0);
    processHumanInput("", questions[0]);
  };

  return (
    <div className="fixed inset-0 z-[8000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-[#111827] border border-emerald-500/20 w-full max-w-2xl rounded-[60px] shadow-4xl p-12 overflow-hidden relative">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-600 hover:text-white transition-all"><X size={32}/></button>
        
        {!isDone ? (
          <div className="space-y-12 py-10 text-center">
             <div className="w-24 h-24 bg-emerald-600/10 rounded-[32px] mx-auto flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner mb-6">
                <Smile size={48} />
             </div>
             <div className="space-y-4">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">Patient Satisfaction Index</p>
                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Your feedback Matters</h3>
             </div>

             {step === 0 && scores.length === 0 ? (
               <button onClick={startSurvey} className="px-16 py-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] font-black uppercase text-base tracking-[0.3em] italic shadow-2xl transition-all">
                  Begin Quick Survey
               </button>
             ) : (
               <div className="space-y-12 animate-in slide-in-from-bottom-8">
                  <div className="bg-[#0a0f18] p-10 rounded-[40px] border border-gray-800 shadow-inner">
                     <p className="text-2xl font-black text-white italic leading-tight italic">"{questions[step]}"</p>
                  </div>
                  <div className="flex justify-center gap-6">
                     {[1, 2, 3, 4, 5].map(v => (
                       <button 
                         key={v}
                         onClick={() => handleScore(v)}
                         className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 text-2xl font-black text-gray-500 hover:bg-emerald-600 hover:border-emerald-400 hover:text-white transition-all active:scale-90"
                       >
                         {v}
                       </button>
                     ))}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Rate 1 to 5</span>
                     <div className="h-1 w-20 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(step / questions.length) * 100}%` }} />
                     </div>
                  </div>
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-12 py-16 text-center animate-in zoom-in-95">
             <div className="w-24 h-24 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                <CheckCircle2 size={56} />
             </div>
             <div className="space-y-4">
                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Thank You</h3>
                <p className="text-gray-500 font-medium italic text-sm">Your response is anonymously synchronized with institutional PSI benchmarks.</p>
             </div>
             <button onClick={onClose} className="px-16 py-5 bg-gray-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-700 transition-all">Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SatisfactionSurvey;

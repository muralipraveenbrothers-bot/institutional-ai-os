
import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Sparkles, Clock, Megaphone, Volume2, HeartPulse, UserCheck, ShieldCheck, Activity,
  TrendingUp, Timer, ClipboardCheck
} from "lucide-react";
import { speakText } from "../../geminiService";

interface MasterLayerProps {
  waitingCount: number;
  activePatients: number;
  lastAction?: string; 
  onClearAction: () => void;
}

const STAFF_MOTIVATIONS = [
  "టీం, మీ అంకితభావం రోగుల ప్రాణాలను కాపాడుతుంది. గర్వంగా పని చేయండి. (Team, your dedication saves lives.)",
  "మంచి చిరునవ్వుతో రోగులను పలకరించండి. అది వారికి సగం ధైర్యాన్ని ఇస్తుంది. (A smile is half the cure.)",
  "ప్రతి పేషెంట్ ఒక ప్రాణం. మన సేవే వారి ప్రాణధారం. (Every patient is a priority.)",
  "నిర్వహణలో క్రమశిక్షణే మన ఆసుపత్రి కీర్తికి ఆధారం. (Discipline is our reputation.)",
  "Team, precision in registration is the first step to patient safety. Let's make every detail count!",
  "Excellent work on managing the morning rush. Your efficiency makes a difference.",
  "Institutional success is built on the care you provide today. You are doing great."
];

const HEALTH_TIPS = [
  { te: "ప్రతిరోజూ కనీసం 3 లీటర్ల నీరు త్రాగండి. ఇది మీ మూత్రపిండాల ఆరోగ్యానికి చాలా మంచిది.", en: "Drink at least 3 liters of water daily for peak kidney health.", hi: "गुर्दे के स्वास्थ्य के लिए प्रतिदिन 3 लीटर पानी पिएं।" },
  { te: "ఉప్పు వాడకం తగ్గించండి. దీనివల్ల రక్తపోటు నియంత్రణలో ఉంటుంది.", en: "Reduce salt intake to keep blood pressure under control.", hi: "रक्तचाप को नियंत्रित करने के लिए नमक कम खाएं।" },
  { te: "రోజుకు 30 నిమిషాలు నడవడం గుండె ఆరోగ్యానికి ఎంతో మేలు చేస్తుంది.", en: "30 minutes of walking daily keeps your heart young.", hi: "स्वस्थ हृदय के लिए प्रतिदिन 30 मिनट टहलें।" },
  { te: "రాత్రివేళ 7 గంటల నిద్ర మీ రోగనిరోధక శక్తిని పెంచుతుంది.", en: "7 hours of sleep at night boosts your immune recovery.", hi: "प्रतिरक्षा के लिए रात में 7 घंटे की नींद लें।" }
];

export const ReceptionAIMasterLayer: React.FC<MasterLayerProps> = ({ 
  waitingCount, 
  activePatients, 
  onClearAction 
}) => {
  const [currentTip, setCurrentTip] = useState<string>("");
  const [showGreetingCard, setShowGreetingCard] = useState(false);
  const shownMotivations = useRef<Set<number>>(new Set());
  const shownTips = useRef<Set<number>>(new Set());

  const announce = (isManualTrigger = false) => {
    // 🧠 NON-REPETITIVE LOGIC
    let motivationIdx;
    do {
      motivationIdx = Math.floor(Math.random() * STAFF_MOTIVATIONS.length);
      if (shownMotivations.current.size >= STAFF_MOTIVATIONS.length) shownMotivations.current.clear();
    } while (shownMotivations.current.has(motivationIdx));
    shownMotivations.current.add(motivationIdx);

    let tipIdx;
    do {
      tipIdx = Math.floor(Math.random() * HEALTH_TIPS.length);
      if (shownTips.current.size >= HEALTH_TIPS.length) shownTips.current.clear();
    } while (shownTips.current.has(tipIdx));
    shownTips.current.add(tipIdx);

    const tipObj = HEALTH_TIPS[tipIdx];
    const motivation = STAFF_MOTIVATIONS[motivationIdx];
    
    const lang = Math.random() > 0.3 ? 'te' : 'en';
    const tip = tipObj[lang as keyof typeof tipObj];
    
    const fullSpeech = isManualTrigger 
      ? `Attention Staff: ${motivation}. For our visitors: ${tip}`
      : `Wellness Pulse: ${tip}`;
    
    setCurrentTip(tip);
    if (isManualTrigger) setShowGreetingCard(true);
    speakText(fullSpeech, "Zephyr", lang === 'te' ? 'Telugu' : 'English');
  };

  useEffect(() => {
    const handleTrigger = () => announce(true);
    window.addEventListener('mitra-trigger-greeting', handleTrigger);
    return () => window.removeEventListener('mitra-trigger-greeting', handleTrigger);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* 📈 RECEPTION PERFORMANCE METRICS */}
      <div className="bg-[#111827] border border-white/5 p-6 rounded-[40px] shadow-xl space-y-6">
         <h4 className="text-[9px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5 pb-3 italic flex items-center gap-2">
           <TrendingUp size={14} className="text-cyan-500" /> Operational Yield
         </h4>
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <p className="text-[8px] font-black text-gray-700 uppercase">Avg Reg Time</p>
               <p className="text-xl font-black text-white italic">42s</p>
            </div>
            <div className="space-y-1">
               <p className="text-[8px] font-black text-gray-700 uppercase">Success Rate</p>
               <p className="text-xl font-black text-emerald-500 italic">99.8%</p>
            </div>
         </div>
      </div>

      {/* 🎭 DYNAMIC GREETING CARD (MODAL-LIKE INSET) */}
      {showGreetingCard && (
        <div className="bg-indigo-600 border border-indigo-400 p-8 rounded-[40px] shadow-4xl animate-in zoom-in-95 duration-500 relative overflow-hidden group">
           <button onClick={() => setShowGreetingCard(false)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
              <X size={12} className="text-white" />
           </button>
           <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform"><Megaphone size={100} /></div>
           <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.3em] mb-4 italic">Suggested Communication</p>
           <p className="text-lg font-black text-white italic leading-tight">
              "{currentTip}"
           </p>
           <div className="mt-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-xl">
                 <Volume2 size={16} />
              </div>
              <span className="text-[8px] font-black text-indigo-100 uppercase tracking-widest">Broadcast Active</span>
           </div>
        </div>
      )}

      {/* FLOW INTELLIGENCE NUDGE */}
      <div className="bg-[#111827] border border-white/5 p-6 rounded-[35px] shadow-lg flex items-center gap-4 group">
         <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
            <Activity size={20} />
         </div>
         <div>
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block italic">Lattice Pulse</span>
            <p className="text-[11px] font-medium text-slate-300 italic leading-tight">
               {waitingCount > 3 ? "Load Rising. Prioritize triage dispatch." : "Registry Flow: Optimal."}
            </p>
         </div>
      </div>

    </div>
  );
};

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

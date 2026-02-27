
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, BrainCircuit, ShieldCheck, Mic, Bot, TrendingUp, Clock, 
  ClipboardList, Activity, AlertTriangle, CheckCircle2, TrendingDown,
  Lock, Languages, Calendar, Zap, Loader2, Sparkles, AlertCircle,
  Eye, Cpu, Network, Radio, Target, Info, Package, ThumbsUp, ThumbsDown, MessageSquare, Send, RefreshCw, MicOff, Volume2, Headphones,
  Activity as Pulse, ShieldAlert, ZapOff, CheckCircle, Barcode, Timer, Users, HeartPulse, Signal, Activity as PulseIcon,
  Smile, Heart, MessageCircle, Handshake, Quote, Star, UserPlus, HelpCircle, FileText, Bookmark, ClipboardCheck, Coffee,
  BookOpen, HeartHandshake, Scale, Anchor, Lightbulb, Compass, UserCircle, Briefcase, Sparkle, Target as FocusIcon,
  ChevronRight, VolumeX, EyeOff, Ear
} from 'lucide-react';
import { UserRole, Patient } from '../../types';
/* Fix: Removed non-existent export connectAgentLive and unused isSafeMode */
import { generateAgentInsight } from '../../geminiService';

interface AgentDrawerProps {
  agentId: string | null;
  onClose: () => void;
  role: UserRole;
  patients: Patient[];
}

const STATUS_CONFIG: Record<string, any> = {
  active: { color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  safe: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  urgent: { color: 'text-red-500', bg: 'bg-red-500/20' },
  pulsing: { color: 'text-purple-500', bg: 'bg-purple-500/10' },
  offline: { color: 'text-red-600', bg: 'bg-red-600/10' }
};

const ConflictAlert: React.FC<{ level: 1|2|3|4, trigger: string, reframe: string }> = ({ level, trigger, reframe }) => {
  const configs = {
    1: { label: '🔴 BLAME DETECTED', color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle },
    2: { label: '🟠 IDENTITY THREAT', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: ShieldAlert },
    3: { label: '🔵 EMOTIONAL ESCALATION', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Pulse },
    4: { label: '⚫ HIGH-RISK CONFLICT', color: 'text-gray-200', bg: 'bg-gray-800/80', icon: Lock }
  };
  const config = configs[level];
  return (
    <div className={`${config.bg} border border-gray-800 p-8 rounded-[40px] space-y-6 animate-in slide-in-from-right-4 duration-500`}>
       <div className="flex items-center justify-between">
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${config.color}`}>{config.label}</p>
          <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Mic Sensor Active</span>
       </div>
       <div className="space-y-4">
          <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Trigger Word</p>
          <p className="text-sm text-gray-400 italic">"{trigger}"</p>
       </div>
       <div className="pt-4 border-t border-gray-800 space-y-4">
          <p className="text-[9px] text-emerald-500 uppercase font-black tracking-widest">AI REFRAME (SAY THIS NOW)</p>
          <p className="text-sm text-white font-black italic">"{reframe}"</p>
       </div>
    </div>
  );
};

const AgentDrawer: React.FC<AgentDrawerProps> = ({ agentId, onClose, role, patients }) => {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Insights' | 'Conflict' | 'OSCE' | 'Coach'>('Insights');

  const fetchInsight = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const res = await generateAgentInsight(agentId, role, { patients: patients.length });
      setInsight(res);
    } finally {
      setLoading(false);
    }
  }, [agentId, role, patients]);

  useEffect(() => { fetchInsight(); }, [fetchInsight, agentId]);

  if (!agentId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-md md:max-w-xl bg-[#111827] border-r h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-700 border-gray-800">
        
        <div className="p-10 border-b border-gray-800 flex items-center justify-between bg-[#1a212f]/30">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-[28px] bg-cyan-600 flex items-center justify-center text-white shadow-2xl"><Bot size={40} /></div>
            <div>
              <h3 className="text-white text-3xl font-black tracking-tighter uppercase italic">{agentId} Node</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-500 mt-2">Institutional Relational Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-gray-800/50 hover:bg-red-600/20 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
        </div>

        {agentId === 'Mitra' && (
          <div className="px-10 py-4 bg-[#0a0f18]/40 border-b border-gray-800 flex gap-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'Insights', icon: Activity },
              { id: 'Conflict', icon: AlertTriangle },
              { id: 'Coach', icon: Ear },
              { id: 'OSCE', icon: Briefcase }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'text-cyan-500 border-cyan-500' : 'text-gray-600 border-transparent hover:text-gray-300'}`}
              >
                <tab.icon size={12} /> {tab.id}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center animate-pulse"><Loader2 className="animate-spin text-cyan-500" size={48} /></div>
          ) : (
            <div className="space-y-14">
              {activeTab === 'Conflict' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
                   <h5 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.4em] px-2 flex items-center gap-3"><Signal size={16} /> Language Escalation Monitor</h5>
                   <ConflictAlert level={1} trigger="Why didn't you follow the handover protocol? It's your fault." reframe="We seem to have different understandings of the protocol. Let's look at it together." />
                   <ConflictAlert level={2} trigger="That junior is incompetent and irresponsible." reframe="Mistakes like this are tough. Let's understand what led to this so we can prevent it." />
                </div>
              )}

              {activeTab === 'Coach' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-5 duration-700">
                   <div className="bg-cyan-600/5 border border-cyan-500/20 p-12 rounded-[60px] space-y-8 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-10"><Ear size={100} /></div>
                      <div className="flex items-center gap-4 text-cyan-500"><Sparkle size={32} /><h4 className="text-2xl font-black uppercase tracking-tight italic text-white">Live Ward Whisper</h4></div>
                      <p className="text-sm text-gray-400 font-medium italic">"Lower your voice. I will provide one sentence at a time to maintain trust."</p>
                      
                      <div className="space-y-6 pt-6">
                         <div className="p-6 bg-[#0a0f18] rounded-[32px] border border-gray-800">
                            <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-2">Say This Now</p>
                            <p className="text-sm text-white font-black italic">"I can see how upsetting this situation is for you. Let's align."</p>
                         </div>
                         <div className="p-6 bg-red-600/5 rounded-[32px] border border-red-500/20">
                            <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-2">Avoid This</p>
                            <p className="text-sm text-gray-400 italic">"I was just doing my job." (Defensive intent bypasses their impact)</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'OSCE' && (
                <div className="space-y-10">
                   <h5 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.4em] px-2 flex items-center gap-3"><Briefcase size={16} /> Objective Structured Training</h5>
                   <div className="space-y-4">
                      {[
                        { title: 'Angry Relative (CT Delay)', station: 'Station 1', pass: 'YES' },
                        { title: 'Junior Error Disclosure', station: 'Station 2', pass: 'PENDING' },
                        { title: 'Nurse-Doctor Roster Clash', station: 'Station 3', pass: 'NO' },
                      ].map((s, i) => (
                        <div key={i} className="p-8 bg-[#0a0f18] rounded-[40px] border border-gray-800 flex items-center justify-between group hover:border-purple-500/30 transition-all cursor-pointer">
                           <div>
                              <p className="text-sm font-black text-white uppercase tracking-tight italic">{s.title}</p>
                              <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">{s.station}</p>
                           </div>
                           <div className={`text-[10px] font-black px-4 py-1.5 rounded-xl border ${s.pass === 'YES' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : s.pass === 'NO' ? 'text-red-500 border-red-500/20 bg-red-500/10' : 'text-gray-500 border-gray-800'}`}>
                              {s.pass === 'YES' ? 'QUALIFIED' : s.pass === 'NO' ? 'RESIT REQ' : 'START NOW'}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'Insights' && (
                <>
                  <div className="bg-[#0a0f18] p-10 rounded-[48px] border border-gray-800 shadow-inner grid grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <div className="flex justify-between items-center"><Smile size={24} className="text-emerald-500" /><span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Psych Safety</span></div>
                         <div className="text-4xl font-black text-white tracking-tighter">9.9/10</div>
                         <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[99%]" /></div>
                      </div>
                      <div className="space-y-6 border-l border-gray-800 pl-8">
                         <div className="flex justify-between items-center"><ShieldCheck size={24} className="text-blue-500" /><span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Compliance</span></div>
                         <div className="text-4xl font-black text-white tracking-tighter">MAXIMAL</div>
                      </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDrawer;

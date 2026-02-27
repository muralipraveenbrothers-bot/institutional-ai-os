import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, Mic, Activity, Info, Scale, 
  Check, X, Sparkles, ArrowRight, Save, ShieldCheck,
  Thermometer, Droplets, Wind, HelpCircle, Volume2,
  Bug, Zap, AlertCircle, Smile, Heart, VolumeX,
  Stethoscope, Ghost, Brain, TrendingUp,
  // Added missing components to fix build errors
  CheckCircle2, ShieldAlert
} from 'lucide-react';
import { HealthSnapshot, Patient } from '../../types';
import { speakText } from '../../geminiService';

interface HealthSnapshotFormProps {
  patient: Patient;
  onSave: (snapshot: HealthSnapshot) => void;
  onCancel: () => void;
}

const PAIN_METAPHORS = [
  { 
    score: 0, 
    label: "నొప్పి లేదు", 
    desc: "No Pain", 
    metaphor: "Plainness",
    icon: Smile, 
    color: "text-emerald-500", 
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30"
  },
  { 
    score: 2, 
    label: "చీమ కుట్టినట్లు", 
    desc: "Like an Ant bite", 
    metaphor: "Cheema Kuttinattu",
    icon: Bug, 
    color: "text-green-500", 
    bg: "bg-green-500/10",
    border: "border-green-500/30"
  },
  { 
    score: 5, 
    label: "తేలు కుట్టినట్లు", 
    desc: "Like a Scorpion sting", 
    metaphor: "Telu Kuttinattu",
    icon: Zap, 
    color: "text-amber-500", 
    bg: "bg-amber-500/10",
    border: "border-amber-500/30"
  },
  { 
    score: 8, 
    label: "ఎముక విరిగినట్లు", 
    desc: "Like a Bone break", 
    metaphor: "Emuka Viriginattu",
    icon: Activity, 
    color: "text-orange-500", 
    bg: "bg-orange-500/10", 
    border: "border-orange-500/30"
  },
  { 
    score: 10, 
    label: "ప్రాణం పోతున్నంత నొప్పి", 
    desc: "Unbearable / Life-threatening", 
    metaphor: "Pranam Pothunnatha Nopi",
    icon: AlertCircle, 
    color: "text-red-500", 
    bg: "bg-red-500/10",
    border: "border-red-500/30"
  },
];

const HealthSnapshotForm: React.FC<HealthSnapshotFormProps> = ({ patient, onSave, onCancel }) => {
  const [snapshot, setSnapshot] = useState<Partial<HealthSnapshot>>({
    complaint: patient.chiefComplaint || '',
    painScale: 0,
    bp: '',
    sugar: '',
    temp: '',
    pulse: '',
    spo2: '',
    height: '',
    weight: '',
    knownConditions: ''
  });

  const [isRecording, setIsRecording] = useState(false);
  const [showPainGuide, setShowPainGuide] = useState(true); // Default visible for emphasis
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const startPainGuide = () => {
    setIsAiSpeaking(true);
    speakText(
      "నమస్కారం. మీ నొప్పి ఎంతగా ఉందో తెలుసుకోవడానికి నాకు సహాయం చేయండి. చీమ కుట్టినట్లు ఉందా? తేలు కుట్టినట్లు ఉందా? ఎముక విరిగినట్లు ఉందా? లేక తట్టుకోలేనంతగా ఉందా?", 
      "Zephyr"
    );
    setTimeout(() => setIsAiSpeaking(false), 8000);
  };

  const selectPainMetaphor = (score: number, teluguLabel: string) => {
    setSnapshot({ ...snapshot, painScale: score });
    speakText(`${score} స్కోరు నమోదు చేయబడింది.`, "Zephyr");
  };

  const handleSave = () => {
    const finalSnapshot: HealthSnapshot = {
      ...snapshot,
      timestamp: new Date().toISOString()
    } as HealthSnapshot;
    onSave(finalSnapshot);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-1000 pb-48 font-['Inter']">
      
      {/* 🔴 HEADER HUB */}
      <div className="bg-[#111827] border border-cyan-500/30 rounded-[60px] p-12 shadow-4xl relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><HeartPulse size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10 border-b border-white/5 pb-8 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-cyan-600 rounded-[28px] flex items-center justify-center text-white shadow-3xl relative overflow-hidden group">
              <HeartPulse size={40} className="relative z-10 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Nurse Triage Node</h2>
              <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.6em] mt-3 italic">Initial Clinical Registry v7.2</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-6 py-2 bg-cyan-600/5 border border-cyan-500/20 rounded-full text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">
              Patient: {patient.name}
            </div>
            <button onClick={onCancel} className="p-4 bg-white/5 hover:bg-red-600/20 text-gray-500 hover:text-red-500 rounded-2xl transition-all border border-white/5">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
          <div className="lg:col-span-8 space-y-10">
            {/* COMPLAINT INPUT */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] ml-1 flex items-center gap-3 italic">
                <Info size={16} className="text-cyan-500" /> Chief Complaint (Transcription)
              </label>
              <div className="relative group">
                <textarea 
                  value={snapshot.complaint}
                  onChange={e => setSnapshot({...snapshot, complaint: e.target.value})}
                  className="w-full bg-[#0a0f18] border border-gray-800 rounded-[45px] p-10 text-2xl text-white font-medium italic outline-none focus:border-cyan-500 transition-all shadow-inner resize-none min-h-[180px] placeholder:opacity-5"
                  placeholder="Tell me what happened..."
                />
                <button 
                  onClick={() => setIsRecording(!isRecording)}
                  className={`absolute right-8 bottom-8 w-20 h-20 rounded-[30px] flex items-center justify-center transition-all shadow-4xl ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-800 hover:bg-cyan-600'} text-white`}
                >
                  <Mic size={32} />
                </button>
              </div>
            </div>

            {/* 🔴 REDESIGNED MASTER PAIN CALCULATOR (VISIBLE & FUNCTIONAL) */}
            <div className="bg-[#0a0f18] border border-indigo-500/20 p-12 rounded-[60px] space-y-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[5s]"><Zap size={250} /></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                      <TrendingUp size={24} className="text-indigo-500" /> AI Pain Intensity Calculator
                   </h3>
                   <button 
                     type="button"
                     onClick={startPainGuide}
                     className={`flex items-center gap-4 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest italic border ${isAiSpeaking ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
                   >
                      {isAiSpeaking ? <Volume2 size={16} /> : <HelpCircle size={16} />} 
                      Ask Patient (Telugu AI)
                   </button>
                </div>
                <div className="text-right">
                   <span className={`text-7xl font-black italic tracking-tighter ${snapshot.painScale! >= 7 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                    {snapshot.painScale}<span className="text-2xl text-gray-800 ml-2">/10</span>
                  </span>
                  <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] mt-2">Validated Score</p>
                </div>
              </div>

              {/* 📊 LARGE SLIDER */}
              <div className="px-6 relative z-10">
                <input 
                  type="range" min="0" max="10" step="1"
                  value={snapshot.painScale}
                  onChange={e => setSnapshot({...snapshot, painScale: parseInt(e.target.value)})}
                  className="w-full accent-indigo-600 h-4 bg-gray-900 rounded-full appearance-none cursor-pointer shadow-inner"
                />
                <div className="flex justify-between mt-6 text-[9px] font-black text-gray-700 uppercase tracking-[0.5em] italic">
                  <span>No Pain</span>
                  <span className="text-amber-500/40">Moderate</span>
                  <span className="text-red-500/40">Severe</span>
                </div>
              </div>

              {/* 🧬 TELUGU METAPHOR MATRIX (ONE-TOUCH ENTRY) */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                {PAIN_METAPHORS.map((m, i) => (
                  <button 
                    key={i}
                    type="button"
                    onClick={() => selectPainMetaphor(m.score, m.label)}
                    className={`p-6 rounded-[35px] border transition-all flex flex-col items-center text-center gap-4 group ${snapshot.painScale === m.score ? m.bg + ' ' + m.border + ' scale-105 shadow-xl' : 'bg-black/40 border-gray-800 hover:border-indigo-500/30'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.color} bg-black/60 shadow-inner group-hover:scale-110 transition-transform`}>
                       <m.icon size={24} />
                    </div>
                    <div className="space-y-1">
                       <p className="text-sm font-black text-white italic leading-tight">{m.label}</p>
                       <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest">{m.desc}</p>
                    </div>
                    <div className={`text-xl font-black italic ${m.color}`}>{m.score}</div>
                  </button>
                ))}
              </div>

              <div className="bg-indigo-600/5 p-6 rounded-[35px] border border-indigo-500/10 flex items-center gap-6 opacity-60 relative z-10">
                 <Brain size={24} className="text-indigo-400 shrink-0" />
                 <p className="text-[10px] font-bold text-gray-500 uppercase italic leading-relaxed">
                   "ILLITERATE/RURAL PROTOCOL: Patient communicates using cultural metaphors. AI maps internal physiology to the numerical 0-10 scale."
                 </p>
              </div>
            </div>
          </div>

          {/* 🟢 VITALS SIDEBAR */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0a0f18] border border-emerald-500/20 p-10 rounded-[60px] space-y-8 shadow-inner">
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                <Activity size={18} /> Vital Node
              </h4>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-gray-600 uppercase ml-2">Temp Node</label>
                    <input type="text" placeholder="98.4 F" value={snapshot.temp} onChange={e => setSnapshot({...snapshot, temp: e.target.value})} className="w-full bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-cyan-500 transition-all shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-gray-600 uppercase ml-2">Pulse Node</label>
                    <input type="text" placeholder="72" value={snapshot.pulse} onChange={e => setSnapshot({...snapshot, pulse: e.target.value})} className="w-full bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-cyan-500 transition-all shadow-inner" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-gray-600 uppercase ml-2">BP (sys/dia)</label>
                    <input type="text" placeholder="120/80" value={snapshot.bp} onChange={e => setSnapshot({...snapshot, bp: e.target.value})} className="w-full bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-cyan-500 transition-all shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-gray-600 uppercase ml-2">SpO2 Node</label>
                    <input type="text" placeholder="98%" value={snapshot.spo2} onChange={e => setSnapshot({...snapshot, spo2: e.target.value})} className="w-full bg-[#111827] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-cyan-500 transition-all shadow-inner" />
                  </div>
                </div>
                <div className="h-px bg-white/5" />
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-gray-600 uppercase ml-2">Known Comorbidities</label>
                  <textarea 
                    value={snapshot.knownConditions}
                    onChange={e => setSnapshot({...snapshot, knownConditions: e.target.value})}
                    className="w-full bg-[#111827] border border-gray-800 rounded-[35px] p-6 text-xs text-slate-300 italic outline-none focus:border-cyan-500 transition-all min-h-[140px] shadow-inner"
                    placeholder="Diabetes, Hypertension..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#111827] border border-white/5 p-8 rounded-[50px] shadow-xl text-center space-y-4">
               <ShieldCheck size={32} className="text-emerald-500 mx-auto" />
               <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-loose">
                 Institutional Sync: <br/> Triage data is read-only for medical residents.
               </p>
            </div>
          </div>
        </div>

        {/* 🏁 ACTION GATES */}
        <div className="mt-12 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
          <div className="flex gap-4">
             <div className="p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                <CheckCircle2 size={24} className="text-emerald-500" />
                <div>
                   <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">Security Hash</p>
                   <p className="text-[10px] font-black text-white mt-1">TRIAGE-SEC-LOCK</p>
                </div>
             </div>
          </div>
          <div className="flex gap-6">
            <button 
              onClick={onCancel}
              className="px-12 py-6 bg-gray-900 text-gray-600 rounded-[40px] font-black uppercase text-xs tracking-widest hover:text-white transition-all italic"
            >
              Abort Triage
            </button>
            <button 
              onClick={handleSave}
              className="px-24 py-8 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[50px] font-black uppercase text-sm tracking-[0.4em] shadow-[0_30px_80px_rgba(6,182,212,0.3)] transition-all active:scale-95 italic border-2 border-white/10 flex items-center gap-6"
            >
              <Save size={24} /> [ DISPATCH TO DOCTOR ]
            </button>
          </div>
        </div>
      </div>
      
      {/* ⚠️ SYSTEM DISCLAIMER */}
      <div className="mt-10 p-10 bg-black/40 border border-white/5 rounded-[60px] flex items-start gap-10 shadow-inner opacity-50">
          <ShieldAlert size={32} className="text-indigo-500/40 shrink-0" />
          <p className="text-[11px] font-black text-gray-500 uppercase italic tracking-tight leading-relaxed text-left">
             DISCLAIMER: AI PAIN INTENSITY CALCULATOR IS AN ADVISORY TOOL FOR STAFF COMMUNICATION. FINAL CLINICAL EVALUATION MUST BE PERFORMED BY THE CONSULTANT NODE. NO MEDICAL TREATMENT SHOULD BE INITIATED SOLELY ON AI SCORES.
          </p>
      </div>

    </div>
  );
};

export default HealthSnapshotForm;
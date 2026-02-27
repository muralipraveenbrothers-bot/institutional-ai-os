
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Activity, Sparkles, Loader2, CheckCircle2, Info, ChevronRight, 
  Zap, AlertTriangle, BookOpen, Layers, Library, ChevronDown, ListFilter, 
  ShieldCheck, Microscope, Cpu, BarChart3, TrendingUp, TrendingDown, History, Globe, Target,
  Scale, Book, MapPin, Clock, ListChecks, Pill, Droplets, MessageSquare, 
  Mic, Volume2, ShieldAlert, FileText, ClipboardList, Eye, Box, AlertCircle,
  Table, BarChart, HeartPulse, Scale as BalanceIcon, Clipboard, HelpCircle,
  Edit3, RefreshCw, GraduationCap, Brain, CheckSquare, Square, Plus, Image as ImageIcon,
  Check, X, ShieldPlus, ClipboardCheck, ArrowUpRight, ZapOff, Wind, 
  ShieldCheck as ShieldIcon, Anchor, Target as FocusIcon, Compass, Printer, Save,
  Package, Barcode, Shield, LayoutGrid, BoxSelect, Maximize, Orbit, Play, Gamepad2,
  Search, Thermometer, FlaskConical, Stethoscope, Briefcase, Code, Dna, FileSearch, Biohazard,
  Route, Map, Siren, Calendar, FileCheck, Download
} from 'lucide-react';
import { Patient, SurgicalOption } from '../../../types';
import { extractProceduresFromSynthesis, speakText, sushrutSurgicalRoadmapStream } from '../../../geminiService';
import { approveClinicalContentGuarded, runAI, manualModeMessage } from '../../Shared/AppEventToast';

// --- IMPORT NEW COMPONENTS ---
import SurgicalOverview from "./SurgicalOverview";
import SurgicalRoadmap from "./SurgicalRoadmap";
import AdvancedPreSurgeryIntelligence from "./AdvancedPreSurgeryIntelligence";
import ProcedureSelection from "./ProcedureSelection";
import PostOpPlan from "./PostOpPlan";

/* ==========================================================
   DOCTOR DASHBOARD – SURGICAL HUB ULTIMATE v25.0
   FINAL CORRECT STRUCTURE: PERSISTENT VISIBILITY GATES
   ========================================================== */

interface SurgicalPlanningTabProps {
  patient: Patient;
  aiResult: { rawResponse: string; status: string };
  onInitiateSurgery: (params: { 
    specialty: string, 
    procedure: string, 
    approach: string,
    level: 'V1' | 'V2' | 'V3',
    comorbidities: string[],
    allergies: string,
    scenario: string,
    manualMeds: string
  }) => void;
  latestSynthesis?: string;
}

const SurgicalPlanningTab: React.FC<SurgicalPlanningTabProps> = ({ 
  patient, 
  aiResult, 
  onInitiateSurgery, 
  latestSynthesis = "" 
}) => {
  const [specialty, setSpecialty] = useState('General Surgery');
  const [procedure, setProcedure] = useState('');
  const [selectedApproach, setSelectedApproach] = useState('Laparoscopic');
  const [selectedLevel, setSelectedLevel] = useState<'V1' | 'V2' | 'V3'>('V2');
  const [isApproved, setIsApproved] = useState(false);

  // --- ROADMAP STATE ---
  const [roadmap, setRoadmap] = useState({ text: "", status: 'idle' as 'idle' | 'loading' | 'done' | 'error' });
  
  // --- RECOMMENDATION STATE ---
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedProcs, setExtractedProcs] = useState<SurgicalOption[]>([]);

  useEffect(() => {
    const runExtraction = async () => {
      setIsExtracting(true);
      try {
        const res = await extractProceduresFromSynthesis(latestSynthesis || patient.chiefComplaint);
        if (Array.isArray(res)) setExtractedProcs(res);
      } finally { setIsExtracting(false); }
    };
    runExtraction();
  }, [latestSynthesis, patient.id]);

  const runSurgicalRoadmap = async () => {
    if (!procedure) {
      alert("Please select a procedure from the registry first.");
      return;
    }
    setRoadmap({ text: "", status: 'loading' });
    await runAI("susruta", async () => {
      try {
        const stream = sushrutSurgicalRoadmapStream({ patient, procedure });
        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          setRoadmap(prev => ({ ...prev, text: fullText }));
        }
        setRoadmap(prev => ({ ...prev, status: 'done' }));
      } catch (err) { setRoadmap(prev => ({ ...prev, status: 'error' })); }
    }, () => {
      setRoadmap(prev => ({ ...prev, status: 'error' }));
      manualModeMessage("Surgical Roadmap");
    });
  };

  const parsedSections = useMemo(() => {
    if (!aiResult.rawResponse) return {};
    const sections: Record<string, string> = {};
    const markers = [ 
      'POST-OPERATIVE PLAN', 'EXPECTED OUTCOMES', 'POST-OP ANTIBIOTICS', 'POST-OP ANALGESICS'
    ];
    
    markers.forEach((m, idx) => {
      const regex = new RegExp(`${m}\\s*:`, 'i');
      const match = aiResult.rawResponse.match(regex);
      if (!match) return;
      const start = match.index! + match[0].length;
      let end = aiResult.rawResponse.length;
      markers.forEach(nextM => {
        if (nextM === m) return;
        const nextRegex = new RegExp(`${nextM}\\s*:`, 'i');
        const nextMatch = aiResult.rawResponse.substring(start).match(nextRegex);
        if (nextMatch) {
          const potentialEnd = start + nextMatch.index!;
          if (potentialEnd < end) end = potentialEnd;
        }
      });
      sections[m] = aiResult.rawResponse.substring(start, end).trim();
    });
    return sections;
  }, [aiResult.rawResponse]);

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-40 scrollable-node">
      
      {/* 1️⃣ SURGICAL OVERVIEW – ALWAYS VISIBLE */}
      <div className="space-y-6">
        <SurgicalOverview 
          patient={patient} 
          roadmapText={roadmap.text} 
          status={roadmap.status} 
        />
      </div>

      {/* 2️⃣ SURGICAL ROADMAP – ALWAYS VISIBLE */}
      <div className="space-y-6">
        <SurgicalRoadmap 
          patient={patient} 
          procedure={procedure} 
          roadmapText={roadmap.text} 
          status={roadmap.status}
          onRun={runSurgicalRoadmap}
        />
      </div>

      {/* 3️⃣ ADVANCED PRE-SURGERY INTELLIGENCE */}
      <div className="space-y-6">
        <AdvancedPreSurgeryIntelligence patient={patient} />
      </div>

      {/* 4️⃣ PROCEDURE SELECTION */}
      <div className="space-y-6 bg-[#111827] border border-indigo-500/20 rounded-[40px] p-8 shadow-4xl">
        <ProcedureSelection 
          specialty={specialty} setSpecialty={setSpecialty}
          procedure={procedure} setProcedure={setProcedure}
          extractedProcs={extractedProcs} isExtracting={isExtracting}
          onSelectRec={(rec) => { setSpecialty(rec.specialty); setProcedure(rec.procedure); }}
        />
        
        <div className="pt-8 mt-8 border-t border-white/5">
           <button 
             onClick={() => {
                if (!procedure) { alert("Select procedure from registry."); return; }
                onInitiateSurgery({ 
                  specialty, procedure, approach: selectedApproach, scenario: "", manualMeds: "", level: selectedLevel,
                  comorbidities: [], allergies: 'None reported'
                });
             }}
             disabled={aiResult.status === 'loading' || !procedure} 
             className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-6 border border-white/10 italic group"
           >
             {aiResult.status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />} 
             <span>[ INITIATE SURGICAL SYNTHESIS ]</span>
           </button>
        </div>
      </div>

      {/* 5️⃣ POST-OP PLAN */}
      <div className="space-y-6">
        <PostOpPlan 
          parsedSections={parsedSections} 
          isApproved={isApproved} 
          procedure={procedure}
          onApprove={() => { if(approveClinicalContentGuarded()) setIsApproved(true); }} 
        />
      </div>

      {/* CORE SAFETY FOOTER */}
      <div className="p-8 bg-[#0a0f18] border border-white/5 rounded-[40px] flex items-start gap-8 shadow-inner opacity-50">
          <ShieldCheck size={28} className="text-indigo-500/40 shrink-0 mt-1" />
          <p className="text-xs font-black text-white uppercase italic tracking-tight leading-relaxed text-left">
             DISCLAIMER: AI PROVIDES ADVISORY NODES ONLY. INTERVENTIONS REMAIN THE SOLE RESPONSIBILITY OF THE OPERATING CONSULTANT.
          </p>
      </div>
    </div>
  );
};

export default SurgicalPlanningTab;

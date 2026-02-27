
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, CheckCircle2, Info, AlertTriangle, ClipboardList, ShieldCheck } from "lucide-react";

/* ---------- GLOBAL EVENT BUS ---------- */
export type AppEvent = {
  type:
    | "REGISTERED"
    | "ADMISSION_CONFIRMED"
    | "BILL_GENERATED"
    | "PAYMENT_DONE"
    | "INVESTIGATION_ORDERED"
    | "REPORT_UPLOADED"
    | "MEDICATION_DRAFTED"
    | "DOCTOR_UPDATED_PLAN"
    | "DOCTOR_APPROVED";
  message: string;
  severity?: 'info' | 'success' | 'warning';
};

declare global {
  interface Window {
    __APP_EVENTS__?: AppEvent[];
    emitAppEvent?: (event: AppEvent) => void;
    __WORKFLOW__?: {
      registered: boolean;
      billGenerated: boolean;
      paymentDone: boolean;
      investigationOrdered: boolean;
      reportUploaded: boolean;
      medicationDrafted: boolean;
      doctorApproved: boolean;
    };
    __AI_STATUS__?: {
      susruta: boolean;
      mitra: boolean;
      pragnya: boolean;
    };
    __QUIET_SYNTHESIS__?: {
      enabled: boolean;
      lastOutput?: string;
    };
    __DISCUSS_MODE__?: {
      enabled: boolean;
      history: { question: string; answer: string }[];
    };
    __VOICE__?: {
      speaking: boolean;
      paused: boolean;
      utterance?: SpeechSynthesisUtterance;
    };
    __MDT_BOARD__?: {
      enabled: boolean;
      lastTranscript?: string;
    };
    __EVOLUTION__?: {
      mode: "STABLE" | "DEV";
      allowNewFeatures: boolean;
      allowPromptChanges: boolean;
      allowModelChanges: boolean;
    };
    __FEATURES__?: {
      voiceAdvanced: boolean;
      surgeryIntelligence: boolean;
      outcomeTrackingDesign: boolean;
      uiPolish: boolean;
    };
  }
}

/* ---------- INIT EVENT STORE ---------- */
if (typeof window !== 'undefined' && !window.__APP_EVENTS__) {
  window.__APP_EVENTS__ = [];
}

/* ---------- EVENT EMITTER ---------- */
if (typeof window !== 'undefined') {
  window.emitAppEvent = function (event: AppEvent) {
    window.__APP_EVENTS__!.push(event);
    window.dispatchEvent(new Event("APP_EVENT"));
  };
}

/* ---------- FEATURE REGISTRY INITIALIZATION ---------- */
if (typeof window !== 'undefined' && !window.__FEATURES__) {
  window.__FEATURES__ = {
    voiceAdvanced: true,
    surgeryIntelligence: true,
    outcomeTrackingDesign: true,
    uiPolish: true,
  };
}

export function isFeatureEnabled(
  feature:
    | "voiceAdvanced"
    | "surgeryIntelligence"
    | "outcomeTrackingDesign"
    | "uiPolish"
) {
  if (typeof window === 'undefined') return false;
  return window.__FEATURES__?.[feature] === true;
}

export function enableFeature(feature: keyof NonNullable<Window["__FEATURES__"]>) {
  if (typeof window === 'undefined') return;
  window.__FEATURES__![feature] = true;
  console.log(`✅ Feature enabled: ${feature}`);
}

export function disableFeature(feature: keyof NonNullable<Window["__FEATURES__"]>) {
  if (typeof window === 'undefined') return;
  window.__FEATURES__![feature] = false;
  console.log(`⛔ Feature disabled: ${feature}`);
}

/* ---------- EVENT TOAST UI ---------- */
export function AppEventToast() {
  const [event, setEvent] = useState<AppEvent | null>(null);

  useEffect(() => {
    const handler = () => {
      const next = window.__APP_EVENTS__?.shift();
      if (next) setEvent(next);
    };

    window.addEventListener("APP_EVENT", handler);
    return () => window.removeEventListener("APP_EVENT", handler);
  }, []);

  useEffect(() => {
    if (event) {
      const timer = setTimeout(() => setEvent(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [event]);

  const getIcon = () => {
    if (!event) return null;
    if (!event.type) return <Info className="text-indigo-400" size={20} />;
    switch(event.type) {
      case 'DOCTOR_APPROVED':
        return <ShieldCheck className="text-emerald-400" size={20} />;
      case 'PAYMENT_DONE':
      case 'REGISTERED':
      case 'ADMISSION_CONFIRMED':
        return <CheckCircle2 className="text-emerald-400" size={20} />;
      case 'REPORT_UPLOADED':
      case 'INVESTIGATION_ORDERED':
        return <Bell className="text-cyan-400" size={20} />;
      case 'BILL_GENERATED':
        return <AlertTriangle className="text-amber-400" size={20} />;
      case 'DOCTOR_UPDATED_PLAN':
        return <ClipboardList className="text-indigo-400" size={20} />;
      default:
        return <Info className="text-indigo-400" size={20} />;
    }
  };

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          style={{
            position: "fixed",
            bottom: 80,
            right: 24,
            zIndex: 10000,
            background: "rgba(11, 18, 32, 0.95)",
            backdropFilter: "blur(16px)",
            color: "#e5e7eb",
            padding: "18px 24px",
            borderRadius: "24px",
            boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "14px",
            minWidth: "320px",
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div className="shrink-0 p-3 bg-white/5 rounded-2xl">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <strong className="block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-1.5">
              {(event.type || "SYSTEM_EVENT").replace("_", " ")}
            </strong>
            <div className="text-[13px] font-bold italic text-white leading-tight">
              {event.message}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ======================================================
   HARD STOP GUARDS (WORKFLOW SAFETY)
   ====================================================== */

if (typeof window !== 'undefined' && !window.__WORKFLOW__) {
  window.__WORKFLOW__ = {
    registered: false,
    billGenerated: false,
    paymentDone: false,
    investigationOrdered: false,
    reportUploaded: false,
    medicationDrafted: false,
    doctorApproved: false,
  };
}

function guard(condition: boolean, message: string): boolean {
  if (!condition) {
    alert("⛔ Action blocked: " + message);
    return false;
  }
  return true;
}

export function markRegistered() {
  if (typeof window !== 'undefined' && window.__WORKFLOW__) {
    window.__WORKFLOW__.registered = true;
  }
}

export function approveClinicalContentGuarded() {
  if (typeof window === 'undefined' || !window.__WORKFLOW__) return false;
  window.__WORKFLOW__.doctorApproved = true;
  window.emitAppEvent?.({ type: "DOCTOR_APPROVED", message: "Clinical content authorized by Consultant" });
  return true;
}

export function generateBillGuarded() {
  if (typeof window === 'undefined' || !window.__WORKFLOW__) return false;
  if (!guard(window.__WORKFLOW__.registered, "Patient not registered")) return false;
  if (!guard(window.__WORKFLOW__.doctorApproved, "Clinical content pending doctor approval")) return false;
  window.__WORKFLOW__.billGenerated = true;
  window.emitAppEvent?.({ type: "BILL_GENERATED", message: "Bill generated successfully" });
  return true;
}

export function markPaymentDone() {
  if (typeof window === 'undefined' || !window.__WORKFLOW__) return false;
  if (!guard(window.__WORKFLOW__.billGenerated, "Bill not generated")) return false;
  window.__WORKFLOW__.paymentDone = true;
  window.emitAppEvent?.({ type: "PAYMENT_DONE", message: "Payment verified" });
  return true;
}

export function orderInvestigationGuarded() {
  if (typeof window === 'undefined' || !window.__WORKFLOW__) return false;
  if (!guard(window.__WORKFLOW__.paymentDone, "Payment not completed")) return false;
  window.__WORKFLOW__.investigationOrdered = true;
  window.emitAppEvent?.({ type: "INVESTIGATION_ORDERED", message: "Investigations ordered" });
  return true;
}

export function uploadReportGuarded() {
  if (typeof window === 'undefined' || !window.__WORKFLOW__) return false;
  if (!guard(window.__WORKFLOW__.investigationOrdered, "No investigation order found")) return false;
  window.__WORKFLOW__.reportUploaded = true;
  window.emitAppEvent?.({ type: "REPORT_UPLOADED", message: "Report uploaded and sent to doctor" });
  return true;
}

export function draftMedicationGuarded() {
  if (typeof window === 'undefined' || !window.__WORKFLOW__) return false;
  if (!guard(window.__WORKFLOW__.paymentDone, "Consultation payment not completed")) return false;
  window.__WORKFLOW__.medicationDrafted = true;
  window.emitAppEvent?.({ type: "MEDICATION_DRAFTED", message: "Medication draft prepared" });
  return true;
}

export function resetWorkflow() {
  if (typeof window !== 'undefined') {
    window.__WORKFLOW__ = {
      registered: false,
      billGenerated: false,
      paymentDone: false,
      investigationOrdered: false,
      reportUploaded: false,
      medicationDrafted: false,
      doctorApproved: false,
    };
  }
}

/* ======================================================
   GRACEFUL FAILURE + AI OFF FALLBACK
   ====================================================== */

if (typeof window !== 'undefined' && !window.__AI_STATUS__) {
  window.__AI_STATUS__ = { susruta: true, mitra: true, pragnya: true };
}

export async function runAI(agent: "susruta" | "mitra" | "pragnya", task: Function, fallback?: Function) {
  try {
    if (typeof window === 'undefined') return null;
    if (!window.__AI_STATUS__?.[agent]) {
      console.warn(`⚠️ ${agent} AI is OFF`);
      fallback?.();
      return null;
    }
    return await task();
  } catch (e: any) {
    console.error(`❌ ${agent} AI failed`, e);
    
    // Handle API key issues specifically
    if (e?.message?.includes("Requested entity was not found") && typeof window !== 'undefined' && window.aistudio) {
      alert("Institutional API Key session expired or invalid. Please re-authenticate.");
      window.aistudio.openSelectKey();
    }

    if (typeof window !== 'undefined' && window.__AI_STATUS__) window.__AI_STATUS__[agent] = false;
    window.emitAppEvent?.({ type: "DOCTOR_UPDATED_PLAN", message: `${agent.toUpperCase()} AI paused. Manual mode active.` });
    fallback?.();
    return null;
  }
}

export function manualModeMessage(role: string) {
  alert(`ℹ️ ${role} mode continues.\nAI assistance temporarily unavailable.\nNo workflow is blocked.`);
}

/* ======================================================
   QUIET SYNTHESIS MODE
   ====================================================== */

if (typeof window !== 'undefined' && !window.__QUIET_SYNTHESIS__) {
  window.__QUIET_SYNTHESIS__ = { enabled: true };
}

export function initiateQuietSynthesis(context: {
  symptoms: string[];
  vitals?: any;
  labs?: any;
  imaging?: any;
  provisionalDx?: string[];
}) {
  if (typeof window === 'undefined') return;
  if (!window.__QUIET_SYNTHESIS__?.enabled) {
    alert("Quiet Synthesis is disabled.");
    return;
  }

  const synthesis = `
QUIET SYNTHESIS (Doctor-only)

1. Most likely explanations based on data:
${context.provisionalDx?.join(", ") || "—"}

2. Important rule-outs to consciously exclude:
• Alternate organ system involvement
• Atypical presentation
• Medication-induced causes

3. What may be missing:
• One key history point
• One focused exam
• One targeted investigation

4. Evidence alignment:
• Does the current plan match standard evidence?
• If not, what is the acceptable deviation?

5. Clinical caution:
• One thing not to miss
• One thing not to over-treat
`;

  if (window.__QUIET_SYNTHESIS__) window.__QUIET_SYNTHESIS__.lastOutput = synthesis;

  window.emitAppEvent?.({
    type: "DOCTOR_UPDATED_PLAN",
    message: "Quiet Synthesis generated for review",
  });

  return synthesis;
}

export function getLastQuietSynthesis() {
  if (typeof window === 'undefined') return "No synthesis yet.";
  return window.__QUIET_SYNTHESIS__?.lastOutput || "No synthesis yet.";
}

/* ======================================================
   DISCUSS MODE (DOCTOR ↔ AI)
   ====================================================== */

if (typeof window !== 'undefined' && !window.__DISCUSS_MODE__) {
  window.__DISCUSS_MODE__ = {
    enabled: true,
    history: [],
  };
}

export function discussWithSusruta(
  doctorQuestion: string,
  context: {
    symptoms?: string[];
    provisionalDx?: string[];
    labs?: any;
    imaging?: any;
    plan?: string[];
  }
) {
  if (typeof window === 'undefined') return;
  if (!window.__DISCUSS_MODE__?.enabled) {
    alert("Discuss mode is disabled.");
    return;
  }

  const answer = `
SUSRUTA DISCUSS RESPONSE (Doctor-only)

Question:
"${doctorQuestion}"

Reasoned Perspective:
• Based on current context, this question is valid.
• Consider consistency with symptoms and progression.
• Balance probability vs risk, not just likelihood.

Evidence Lens:
• Is there guideline support?
• Is this a common vs dangerous miss?
• Are we anchoring too early?

Counter-view:
• If this assumption is wrong, what changes?
• What single test or exam could clarify?

Final Note:
This is a discussion aid, not a directive.
Clinical judgment remains final.
`;

  window.__DISCUSS_MODE__?.history.push({
    question: doctorQuestion,
    answer,
  });

  window.emitAppEvent?.({
    type: "DOCTOR_UPDATED_PLAN",
    message: "Discuss mode response ready for review",
  });

  return answer;
}

export function getDiscussHistory() {
  if (typeof window === 'undefined') return [];
  return window.__DISCUSS_MODE__?.history || [];
}

export function clearDiscussHistory() {
  if (typeof window !== 'undefined' && window.__DISCUSS_MODE__) {
    window.__DISCUSS_MODE__.history = [];
  }
}

/* ======================================================
   DOCTOR VOICE MODE (CONTROLLED)
   ====================================================== */

if (typeof window !== 'undefined' && !window.__VOICE__) {
  window.__VOICE__ = {
    speaking: false,
    paused: false,
  };
}

export function speakToDoctor(text: string) {
  if (typeof window === 'undefined') return;
  stopSpeaking(); 

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.lang = "en-US";

  utterance.onstart = () => {
    if (window.__VOICE__) window.__VOICE__.speaking = true;
    window.dispatchEvent(new CustomEvent('doctor-voice-change', { detail: { speaking: true, paused: false } }));
  };

  utterance.onend = () => {
    if (window.__VOICE__) {
        window.__VOICE__.speaking = false;
        window.__VOICE__.paused = false;
    }
    window.dispatchEvent(new CustomEvent('doctor-voice-change', { detail: { speaking: false, paused: false } }));
  };

  if (window.__VOICE__) {
    window.__VOICE__.utterance = utterance;
    window.__VOICE__.speaking = true;
    window.__VOICE__.paused = false;
  }

  speechSynthesis.speak(utterance);
}

export function pauseSpeaking() {
  if (typeof window === 'undefined') return;
  if (speechSynthesis.speaking) {
    speechSynthesis.pause();
    if (window.__VOICE__) window.__VOICE__.paused = true;
    window.dispatchEvent(new CustomEvent('doctor-voice-change', { detail: { speaking: true, paused: true } }));
  }
}

export function resumeSpeaking() {
  if (typeof window === 'undefined') return;
  if (speechSynthesis.paused) {
    speechSynthesis.resume();
    if (window.__VOICE__) window.__VOICE__.paused = false;
    window.dispatchEvent(new CustomEvent('doctor-voice-change', { detail: { speaking: true, paused: false } }));
  }
}

export function stopSpeaking() {
  if (typeof window === 'undefined') return;
  speechSynthesis.cancel();
  if (window.__VOICE__) {
    window.__VOICE__.speaking = false;
    window.__VOICE__.paused = false;
    window.__VOICE__.utterance = undefined;
  }
  window.dispatchEvent(new CustomEvent('doctor-voice-change', { detail: { speaking: false, paused: false } }));
}

export function stopDoctorVoice() {
  stopSpeaking();
}

export function handleVoiceCommand(command: string) {
  const cmd = (command || "").toLowerCase();
  if (cmd.includes("stop") || cmd.includes("silence") || cmd.includes("pause")) pauseSpeaking();
  if (cmd.includes("resume") || cmd.includes("continue")) resumeSpeaking();
  if (cmd.includes("exit") || cmd.includes("close")) stopSpeaking();
}

/* ======================================================
   MDT BOARD MODE (MULTI-AGENT)
   ====================================================== */

if (typeof window !== 'undefined' && !window.__MDT_BOARD__) {
  window.__MDT_BOARD__ = {
    enabled: true,
  };
}

export function initiateMDTBoard(context: {
  patient: string;
  history: string;
  investigations: string;
}) {
  if (typeof window === 'undefined') return;
  if (!window.__MDT_BOARD__?.enabled) {
    alert("MDT Board Mode is disabled.");
    return;
  }

  const discussion = `
--- MULTI-DISCIPLINARY TEAM BOARD TRANSCRIPT ---
PATIENT NODE: ${context.patient}
DATE: ${new Date().toLocaleDateString()}

[SURGICAL LEAD]: 
"From a procedural standpoint, the anatomical margins are the primary concern. We need clear visualization before committing to an elective approach. Are the radiology nodes optimized?"

[RADIOLOGY LEAD]:
"Current imaging suggests localized shift. I recommend a contrast-enhanced repeat if markers remain elevated. The shadow in RLQ requires dynamic assessment."

[PATHOLOGY LEAD]:
"Markers are borderline. Serial sampling every 6 hours is indicated to detect acute temporal trends. I suspect inflammatory lag."

[CLINICAL CHAIR]:
"We have a split between conservative monitoring and active intervention. 
Consensus Action: Repeat imaging in 4 hours. Start serial markers. 
Surgeon to remain on high standby for emergency conversion if vitals deviate."

FINAL BOARD STATUS: ACTIVE OVERSIGHT
`;

  if (window.__MDT_BOARD__) window.__MDT_BOARD__.lastTranscript = discussion;

  window.emitAppEvent?.({
    type: "DOCTOR_UPDATED_PLAN",
    message: "MDT Board synthesis ready for review",
  });

  return discussion;
}

export function getMDTTranscript() {
  if (typeof window === 'undefined') return "No discussion recorded.";
  return window.__MDT_BOARD__?.lastTranscript || "No discussion recorded.";
}

/* ======================================================
   SUSRUTA — CONTROLLED EVOLUTION MODE
   ====================================================== */

if (typeof window !== 'undefined' && !window.__EVOLUTION__) {
  window.__EVOLUTION__ = {
    mode: "STABLE",
    allowNewFeatures: false,
    allowPromptChanges: false,
    allowModelChanges: false,
  };
}

export function enableDevMode() {
  if (typeof window === 'undefined') return;
  window.__EVOLUTION__ = {
    mode: "DEV",
    allowNewFeatures: true,
    allowPromptChanges: true,
    allowModelChanges: true,
  };
  window.dispatchEvent(new CustomEvent('evolution-mode-change', { detail: { mode: "DEV" } }));
  alert("🛠️ DEV MODE ENABLED — You can add new features safely");
}

export function enableStableMode() {
  if (typeof window === 'undefined') return;
  window.__EVOLUTION__ = {
    mode: "STABLE",
    allowNewFeatures: false,
    allowPromptChanges: false,
    allowModelChanges: false,
  };
  window.dispatchEvent(new CustomEvent('evolution-mode-change', { detail: { mode: "STABLE" } }));
  alert("🔒 STABLE MODE — Doctors see only trusted behavior");
}

export function canEvolve(featureName: string) {
  if (typeof window === 'undefined' || !window.__EVOLUTION__) return false;
  if (window.__EVOLUTION__.mode === "DEV") {
    console.log(`🧪 DEV MODE: ${featureName} allowed`);
    return true;
  }
  console.warn(`⚠️ ${featureName} blocked in STABLE mode (doctor safety)`);
  alert(`⚠️ ${featureName} is hidden from doctors.\nEnable DEV MODE to test.`);
  return false;
}

export function isDevMode() {
  if (typeof window === 'undefined') return false;
  return window.__EVOLUTION__?.mode === "DEV";
}

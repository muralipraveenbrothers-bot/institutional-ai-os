
import React, { useState, useEffect } from "react";

/* ---------- GLOBAL INSTITUTIONAL STATE ---------- */
export type MitraIntent = 'REGISTRATION' | 'BILLING' | 'INVESTIGATION' | 'GENERAL' | 'ACTION' | 'UNKNOWN';
export type RegistrationField = 'NAME' | 'AGE' | 'GENDER' | 'PHONE' | 'COMPLAINT' | 'COMPLETE' | 'NONE';

export const MitraContext = {
  activeDashboard: "NONE" as string,
  listening: false,
  paused: false,
  isSpeaking: false,
  isActive: false,
  workflow: 'NONE' as RegistrationField,
  currentForm: {
    name: "",
    age: "",
    gender: "",
    mobile: "",
    complaint: "",
    intent: "UNKNOWN" as MitraIntent
  }
};

/* ---------- HARD STOP (ABSOLUTE RELIABILITY) ---------- */
export function HARD_STOP_MITRA() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  if ((window as any).mitraRecognition) {
    try {
      (window as any).mitraRecognition.onresult = null;
      (window as any).mitraRecognition.onend = null;
      (window as any).mitraRecognition.abort();
    } catch (e) {}
    (window as any).mitraRecognition = null;
  }

  MitraContext.listening = false;
  MitraContext.paused = false;
  MitraContext.isSpeaking = false;
  MitraContext.isActive = false;
  MitraContext.workflow = 'NONE';

  window.dispatchEvent(new CustomEvent('mitra-state-change', { detail: { isActive: false, isSpeaking: false } }));
  window.dispatchEvent(new CustomEvent('mitra-hard-stop'));
  
  console.log("⛔ MITRA NODE: HARD STOP EXECUTED");
}

/* ---------- DASHBOARD LIFECYCLE ---------- */
export function onDashboardEnter(name: string) {
  console.log(`[Mitra] Syncing Node Context: ${name}`);
  MitraContext.activeDashboard = name;
  HARD_STOP_MITRA();
}

export function onDashboardExit() {
  console.log("[Mitra] Node Disconnect.");
  MitraContext.activeDashboard = "NONE";
  HARD_STOP_MITRA();
}

/* ---------- INTENT & COMMANDS ---------- */
export function detectIntent(text: string): MitraIntent {
  const t = text.toLowerCase();
  if (t.match(/register|name|enroll|join|new patient/i)) return "REGISTRATION";
  if (t.match(/bill|payment|amount|cost|receipt|money/i)) return "BILLING";
  if (t.match(/test|lab|report|scan|blood|x-ray|mri/i)) return "INVESTIGATION";
  if (t.match(/ointment|medicine|tablet|pills|syrup/i)) return "ACTION";
  if (t.match(/hello|help|who are you|hi/i)) return "GENERAL";
  return "UNKNOWN";
}

export function handleGlobalCommand(text: string): boolean {
  const t = text.toLowerCase().trim();

  if (t.includes("stop") || t.includes("aapu") || t.includes("silence")) {
    HARD_STOP_MITRA();
    return true;
  }

  if (t.includes("pause") || t.includes("agu")) {
    MitraContext.paused = true;
    window.dispatchEvent(new CustomEvent('mitra-pause'));
    return true;
  }

  if (t.includes("resume") || t.includes("start") || t.includes("continue")) {
    MitraContext.paused = false;
    window.dispatchEvent(new CustomEvent('mitra-resume'));
    return true;
  }

  return false;
}

/* ---------- FORM DATA EXTRACTION ---------- */
export function extractFormData(text: string) {
  const t = text.toLowerCase();
  let updated = false;

  // Simple extraction logic for workflow fields
  if (MitraContext.workflow === 'NAME' || t.includes("my name is")) {
    const name = t.includes("my name is") ? t.split("my name is")[1].trim() : t.trim();
    if (name.length > 2) {
      MitraContext.currentForm.name = name;
      updated = true;
    }
  }

  if (MitraContext.workflow === 'AGE' || t.includes("i am") && t.includes("years old")) {
    const ageMatch = t.match(/\d+/);
    if (ageMatch) {
      MitraContext.currentForm.age = ageMatch[0];
      updated = true;
    }
  }

  if (MitraContext.workflow === 'PHONE' || t.match(/\b\d{10}\b/)) {
    const phoneMatch = t.match(/\b\d{10}\b/);
    if (phoneMatch) {
      MitraContext.currentForm.mobile = phoneMatch[0];
      updated = true;
    }
  }

  if (MitraContext.workflow === 'COMPLAINT') {
    if (t.length > 5) {
      MitraContext.currentForm.complaint = t;
      updated = true;
    }
  }

  if (updated) {
    window.dispatchEvent(new CustomEvent('mitra-form-update', { detail: MitraContext.currentForm }));
  }
}

export function setMitraWorkflow(field: RegistrationField) {
  MitraContext.workflow = field;
  window.dispatchEvent(new CustomEvent('mitra-workflow-change', { detail: field }));
}

/* ---------- SHARED UI COMPONENT (REACTIVE) ---------- */
export const MitraFloatingControls: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = (e: any) => {
      const active = e.detail?.isActive ?? MitraContext.isActive;
      const speaking = e.detail?.isSpeaking ?? MitraContext.isSpeaking;
      setIsVisible(active || speaking);
    };

    window.addEventListener('mitra-state-change', updateVisibility);
    window.addEventListener('mitra-hard-stop', () => setIsVisible(false));

    return () => {
      window.removeEventListener('mitra-state-change', updateVisibility);
      window.removeEventListener('mitra-hard-stop', () => setIsVisible(false));
    };
  }, []);

  if (!isVisible) return null;

  return React.createElement(
    "div",
    {
      className: "fixed bottom-6 right-6 z-[9999] flex gap-3 bg-black/80 backdrop-blur-xl p-3 rounded-[24px] border border-white/10 shadow-3xl animate-in fade-in slide-in-from-bottom-4 duration-500"
    },
    React.createElement(
      "button",
      {
        onClick: () => window.dispatchEvent(new CustomEvent('mitra-request-start')),
        className: "px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center gap-2"
      },
      "▶ Start"
    ),
    React.createElement(
      "button",
      {
        onClick: HARD_STOP_MITRA,
        className: "px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center gap-2 border border-red-500/20"
      },
      "⏹ Stop"
    )
  );
};

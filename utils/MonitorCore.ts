/* ======================================================
   MONITORING & ALERTS CORE v1 (HOSPITAL SAFE)
   ====================================================== */

declare global {
  interface Window {
    __MONITOR__?: {
      events: {
        time: string;
        type: string;
        message: string;
        severity: "INFO" | "WARN" | "CRITICAL";
      }[];
    };
  }
}

/* ---------- INIT ---------- */
if (typeof window !== 'undefined' && !window.__MONITOR__) {
  window.__MONITOR__ = {
    events: [],
  };
}

/* ---------- LOG EVENT ---------- */
export function logEvent(
  type: string,
  message: string,
  severity: "INFO" | "WARN" | "CRITICAL" = "INFO"
) {
  if (typeof window === 'undefined') return;

  const entry = {
    time: new Date().toLocaleString(),
    type,
    message,
    severity,
  };

  window.__MONITOR__!.events.push(entry);

  // Keep last 200 events only
  if (window.__MONITOR__!.events.length > 200) {
    window.__MONITOR__!.events.shift();
  }

  // CRITICAL → Immediate alert
  if (severity === "CRITICAL") {
    alert("🚨 CRITICAL ALERT:\n" + message);
  }

  // Dispatch event for UI components to listen to
  window.dispatchEvent(new CustomEvent('monitor-update', { detail: entry }));
}

/* ======================================================
   AUTO MONITORS (SAFE HOOKS)
   ====================================================== */

/* ---------- AI FAILURE ---------- */
export function monitorAIError(agent: string, error?: any) {
  logEvent(
    "AI_FAILURE",
    `${agent} AI stopped responding or encountered an exception.`,
    "CRITICAL"
  );
  console.error(`[Monitor] AI Failure: ${agent}`, error);
}

/* ---------- VOICE STUCK ---------- */
export function monitorVoiceStuck(state: string) {
  if (state !== "IDLE") {
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.__VOICE_HARDWARE_LOCK__?.state === state) {
        logEvent(
          "VOICE_STUCK",
          `Voice hardware locked in ${state} state for >8s`,
          "WARN"
        );
      }
    }, 8000);
  }
}

/* ---------- DASHBOARD BLANK ---------- */
export function monitorBlankScreen(dashboardName: string) {
  logEvent(
    "UI_BLANK",
    `${dashboardName} dashboard loaded without content`,
    "CRITICAL"
  );
}

/* ---------- WORKFLOW DELAY ---------- */
export function monitorWorkflowDelay(
  step: string,
  minutes: number
) {
  if (minutes > 30) {
    logEvent(
      "WORKFLOW_DELAY",
      `${step} delayed by ${minutes} minutes`,
      "WARN"
    );
  }
}

/* ---------- LAB / RADIOLOGY DELAY ---------- */
export function monitorReportDelay(testName: string, hours: number) {
  if (hours > 6) {
    logEvent(
      "REPORT_DELAY",
      `${testName} report delayed (${hours} hrs)`,
      "WARN"
    );
  }
}

/* ---------- STAFF RESPONSE ---------- */
export function monitorStaffInaction(
  role: string,
  task: string,
  minutes: number
) {
  if (minutes > 20) {
    logEvent(
      "STAFF_INACTION",
      `${role} did not act on ${task}`,
      "WARN"
    );
  }
}

/* ======================================================
   ADMIN VIEW HELPERS
   ====================================================== */

export function getRecentAlerts() {
  if (typeof window === 'undefined') return [];
  return window.__MONITOR__!.events.filter(
    e => e.severity !== "INFO"
  );
}

export function getAllLogs() {
  if (typeof window === 'undefined') return [];
  return window.__MONITOR__!.events;
}

export function clearLogs() {
  if (typeof window === 'undefined') return;
  window.__MONITOR__!.events = [];
  window.dispatchEvent(new Event('monitor-update'));
}

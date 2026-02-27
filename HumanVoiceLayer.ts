/* ======================================================
   LANGUAGE AUTO-DETECT + EMOTIONAL INTELLIGENCE v1
   ====================================================== */

declare global {
  interface Window {
    __HUMAN_LAYER__?: {
      language: "en-US" | "te-IN";
      emotion: "CALM" | "ANXIOUS" | "ANGRY";
    };
  }
}

/* ---------- INIT ---------- */
if (typeof window !== 'undefined' && !window.__HUMAN_LAYER__) {
  window.__HUMAN_LAYER__ = {
    language: "en-US",
    emotion: "CALM",
  };
}

/* ---------- LANGUAGE AUTO-DETECT ---------- */
export function detectLanguage(text: string) {
  if (typeof window === 'undefined') return "en-US";
  const teluguPattern = /[ఀ-౿]/; // Telugu Unicode block

  window.__HUMAN_LAYER__!.language = teluguPattern.test(text)
    ? "te-IN"
    : "en-US";

  return window.__HUMAN_LAYER__!.language;
}

/* ---------- EMOTION DETECTION ---------- */
export function detectEmotion(text: string) {
  if (typeof window === 'undefined') return "CALM";
  const angryWords = ["why", "delay", "angry", "not done", "complaint", "waste", "unfair", "expensive"];
  const anxiousWords = ["worried", "fear", "tension", "scared", "safe", "okay", "help", "please"];

  const lower = text.toLowerCase();

  if (angryWords.some(w => lower.includes(w))) {
    window.__HUMAN_LAYER__!.emotion = "ANGRY";
  } else if (anxiousWords.some(w => lower.includes(w))) {
    window.__HUMAN_LAYER__!.emotion = "ANXIOUS";
  } else {
    window.__HUMAN_LAYER__!.emotion = "CALM";
  }

  return window.__HUMAN_LAYER__!.emotion;
}

/* ---------- EMOTION-AWARE SPEECH STYLE ---------- */
export function humanSpeak(text: string) {
  if (typeof window === 'undefined') return;
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const lang = window.__HUMAN_LAYER__!.language;
  const emotion = window.__HUMAN_LAYER__!.emotion;

  utterance.lang = lang;

  // Emotion-based tuning (VERY IMPORTANT)
  if (emotion === "ANGRY") {
    utterance.rate = 0.78;   // slower to de-escalate
    utterance.pitch = 0.85;  // deeper, calming
  } else if (emotion === "ANXIOUS") {
    utterance.rate = 0.82;
    utterance.pitch = 1.0;   // reassuring, standard pitch
  } else {
    utterance.rate = 0.9;
    utterance.pitch = 0.95;
  }

  speechSynthesis.speak(utterance);
}

/* ---------- MASTER ENTRY (USE THIS) ---------- */
export function processHumanInput(
  userText: string,
  responseText: string
) {
  detectLanguage(userText);
  detectEmotion(userText);

  humanSpeak(responseText);
}

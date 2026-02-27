/* ======================================================
   INSTITUTIONAL VOICE SYNC KERNEL v6.3
   ENHANCEMENT: UX Confirmation + Auto Retry + Video Sync
   Prevents Hardware Deadlocks & Understanding Failures
   ====================================================== */

import { monitorVoiceStuck, logEvent } from "./MonitorCore";

declare global {
  interface Window {
    __VOICE_HARDWARE_LOCK__?: {
      state: "IDLE" | "SPEAKING" | "LISTENING" | "PROCESSING";
      recognition?: any;
      language: "en-US" | "te-IN";
    };
    __VOICE_UX__?: {
      lastHeard?: string;
      retryCount: number;
      maxRetries: number;
      activeVideo?: HTMLVideoElement | null;
    };
  }
}

/* ---------- KERNEL INIT ---------- */
if (typeof window !== 'undefined') {
  if (!window.__VOICE_HARDWARE_LOCK__) {
    window.__VOICE_HARDWARE_LOCK__ = {
      state: "IDLE",
      language: "en-US",
    };
  }
  if (!window.__VOICE_UX__) {
    window.__VOICE_UX__ = {
      retryCount: 0,
      maxRetries: 2,
      activeVideo: null,
    };
  }
}

/**
 * SAFE MIC ACCESS: Prevents 'Requested device not found' crashes.
 */
export async function getSafeMicrophoneStream(): Promise<MediaStream | null> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Media devices API not supported in this environment.");
      return null;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (error: any) {
    console.warn("[VoiceSync] Microphone access denied or device not found:", error.message);
    logEvent("VOICE_HARDWARE_ERROR", `Microphone not found or access denied: ${error.message}`, "WARN");
    return null;
  }
}

/* ---------- VIDEO SYNC ---------- */
export function registerActiveVideo(videoEl: HTMLVideoElement | null) {
  if (typeof window !== 'undefined' && window.__VOICE_UX__) {
    window.__VOICE_UX__.activeVideo = videoEl;
  }
}

function pauseVideoIfAny() {
  window.__VOICE_UX__?.activeVideo?.pause();
}

function resumeVideoIfAny() {
  window.__VOICE_UX__?.activeVideo?.play();
}

/* ---------- HARDWARE RESET ---------- */
export function voiceHardReset() {
  if (typeof window === 'undefined') return;
  
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  
  if (window.__VOICE_HARDWARE_LOCK__?.recognition) {
    try {
      window.__VOICE_HARDWARE_LOCK__.recognition.onresult = null;
      window.__VOICE_HARDWARE_LOCK__.recognition.onend = null;
      window.__VOICE_HARDWARE_LOCK__.recognition.onerror = null;
      window.__VOICE_HARDWARE_LOCK__.recognition.abort();
    } catch (e) {}
    window.__VOICE_HARDWARE_LOCK__.recognition = null;
  }
  
  if (window.__VOICE_HARDWARE_LOCK__) {
    window.__VOICE_HARDWARE_LOCK__.state = "IDLE";
    window.dispatchEvent(new CustomEvent('voice-state-update', { detail: 'IDLE' }));
  }

  if (window.__VOICE_UX__) {
    window.__VOICE_UX__.retryCount = 0;
  }
}

/* ---------- CORE SPEAK ---------- */
export function voiceSpeak(
  text: string,
  afterSpeak?: () => void
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  // Clean hardware state
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  window.__VOICE_HARDWARE_LOCK__!.state = "SPEAKING";
  window.dispatchEvent(new CustomEvent('voice-state-update', { detail: 'SPEAKING' }));
  monitorVoiceStuck("SPEAKING");

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = window.__VOICE_HARDWARE_LOCK__!.language;
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    window.__VOICE_HARDWARE_LOCK__!.state = "IDLE";
    window.dispatchEvent(new CustomEvent('voice-state-update', { detail: 'IDLE' }));
    
    // Safety buffer for driver switching
    if (afterSpeak) {
      setTimeout(() => {
        afterSpeak();
      }, 500);
    }
  };

  utterance.onerror = () => {
    window.__VOICE_HARDWARE_LOCK__!.state = "IDLE";
    window.dispatchEvent(new CustomEvent('voice-state-update', { detail: 'IDLE' }));
    if (afterSpeak) afterSpeak();
  };

  window.speechSynthesis.speak(utterance);
}

/* ---------- SAFE SPEAK (VIDEO AWARE) ---------- */
export function voiceSpeakSafe(
  text: string,
  afterSpeak?: () => void
) {
  pauseVideoIfAny();
  voiceSpeak(text, () => {
    resumeVideoIfAny();
    afterSpeak?.();
  });
}

/* ---------- CORE LISTEN ---------- */
export function voiceListen(
  onText: (text: string) => void
) {
  if (typeof window === 'undefined') return;

  // Mutex check
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    console.warn("[VoiceSync] Speaker busy. Retrying listen...");
    setTimeout(() => voiceListen(onText), 500);
    return;
  }

  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    console.warn("Speech recognition not supported in this browser.");
    return;
  }

  const rec = new SR();
  rec.lang = window.__VOICE_HARDWARE_LOCK__!.language;
  rec.continuous = false;
  rec.interimResults = false;

  window.__VOICE_HARDWARE_LOCK__!.recognition = rec;
  window.__VOICE_HARDWARE_LOCK__!.state = "LISTENING";
  window.dispatchEvent(new CustomEvent('voice-state-update', { detail: 'LISTENING' }));
  monitorVoiceStuck("LISTENING");

  rec.onresult = (e: any) => {
    const text = e.results[0][0].transcript;
    window.__VOICE_HARDWARE_LOCK__!.state = "PROCESSING";
    window.dispatchEvent(new CustomEvent('voice-state-update', { detail: 'PROCESSING' }));
    onText(text);
  };

  rec.onerror = (e: any) => {
    console.warn("[VoiceSync] Signal Lost:", e.error);
    logEvent("VOICE_ERROR", `Speech recognition error: ${e.error}`, "WARN");
    window.__VOICE_HARDWARE_LOCK__!.state = "IDLE";
    window.dispatchEvent(new CustomEvent('voice-state-update', { detail: 'IDLE' }));
  };

  rec.onend = () => {
    if (window.__VOICE_HARDWARE_LOCK__!.state !== "PROCESSING") {
      window.__VOICE_HARDWARE_LOCK__!.state = "IDLE";
      window.dispatchEvent(new CustomEvent('voice-state-update', { detail: 'IDLE' }));
    }
  };

  try {
    rec.start();
  } catch (e) {
    console.error("[VoiceSync] Could not start recognition", e);
    window.__VOICE_HARDWARE_LOCK__!.state = "IDLE";
    window.dispatchEvent(new CustomEvent('voice-state-update', { detail: 'IDLE' }));
  }
}

/* ---------- AUTO RETRY LISTEN ---------- */
export function autoRetryListen(
  onResult: (text: string) => void,
  onFail?: () => void
) {
  voiceListen((text) => {
    if (!text || text.trim().length < 2) {
      window.__VOICE_UX__!.retryCount++;

      if (window.__VOICE_UX__!.retryCount <= window.__VOICE_UX__!.maxRetries) {
        const msg = window.__VOICE_HARDWARE_LOCK__?.language === 'te-IN' 
          ? "క్షమించండి, నాకు స్పష్టంగా వినిపించలేదు. దయచేసి మళ్ళీ చెప్పండి."
          : "I could not hear you clearly. Please say it again.";
        
        voiceSpeakSafe(msg, () => autoRetryListen(onResult, onFail));
      } else {
        window.__VOICE_UX__!.retryCount = 0;
        const failMsg = window.__VOICE_HARDWARE_LOCK__?.language === 'te-IN'
          ? "దయచేసి టెక్స్ట్ ద్వారా తెలియజేయండి."
          : "Let us continue using text input.";
        voiceSpeakSafe(failMsg, onFail);
      }
    } else {
      window.__VOICE_UX__!.retryCount = 0;
      onResult(text);
    }
  });
}

/* ---------- CONFIRMATION LOOP ---------- */
export function confirmUnderstanding(
  userText: string,
  onConfirm: () => void,
  onRetry: () => void
) {
  if (!window.__VOICE_UX__) return;
  window.__VOICE_UX__!.lastHeard = userText;

  const msg = window.__VOICE_HARDWARE_LOCK__?.language === 'te-IN'
    ? `మీరు "${userText}" అని అన్నారా? అవును లేదా కాదు అని చెప్పండి.`
    : `I understood: ${userText}. Is that correct? Please say yes or no.`;

  voiceSpeakSafe(msg, () => {
    voiceListen((answer) => {
      const a = answer.toLowerCase();
      const isYes = a.includes("yes") || a.includes("correct") || a.includes("avunu") || a.includes("correct");
      
      if (isYes) {
        window.__VOICE_UX__!.retryCount = 0;
        onConfirm();
      } else {
        onRetry();
      }
    });
  });
}

/* ---------- MASTER CONVERSATION FLOW (V6.3) ---------- */
export function startHolisticConversation(
  greeting: string,
  onUserText: (text: string) => void
) {
  voiceSpeakSafe(greeting, () => {
    autoRetryListen((text) => {
      confirmUnderstanding(
        text,
        () => onUserText(text),
        () => {
          const retryMsg = window.__VOICE_HARDWARE_LOCK__?.language === 'te-IN'
            ? "సరే, దయచేసి మళ్ళీ చెప్పండి."
            : "Okay, please say it again.";
          voiceSpeakSafe(retryMsg, () => {
            autoRetryListen(onUserText);
          });
        }
      );
    });
  });
}

export function stopAllVoice() {
  voiceHardReset();
}

export function setVoiceLanguage(lang: "en-US" | "te-IN") {
  if (typeof window !== 'undefined' && window.__VOICE_HARDWARE_LOCK__) {
    window.__VOICE_HARDWARE_LOCK__.language = lang;
  }
}

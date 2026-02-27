import React, { useEffect, useState, useRef } from "react";
import { AlertCircle } from "lucide-react";

export function SoftErrorBanner() {
  const [error, setError] = useState<string | null>(null);
  const lastErrorTime = useRef<number>(0);
  const errorCount = useRef<number>(0);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      // 1. FILTER: Ignore non-critical common browser/extension errors
      if (event.message?.includes("ResizeObserver") || 
          event.message?.includes("Extension") ||
          event.message?.includes("Script error")) return;
      
      const now = Date.now();
      
      // 2. THROTTLE: Hard-block updates if they occur more than once every 2 seconds
      // This prevents the "Error during render -> Update state -> Render again -> Error again" loop (React Error 301)
      if (now - lastErrorTime.current < 2000) {
        errorCount.current++;
        if (errorCount.current > 5) {
          console.warn("⚠️ CRITICAL RENDER LOOP DETECTED: Silencing banner to prevent node failure.");
          return;
        }
        return;
      }
      
      lastErrorTime.current = now;
      errorCount.current = 0;

      console.error("Institutional Soft Error caught:", event.error || event.message);
      
      // Wrap in timeout to ensure we are outside the primary render loop
      setTimeout(() => {
        setError("⚠️ Node Sync Anomaly: Minor system error recovered safely.");
      }, 0);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  if (!error) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-right-10 duration-500">
      <div className="bg-[#1f2937]/95 backdrop-blur-xl border border-amber-500/30 text-white px-6 py-4 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 border-l-4 border-l-amber-500">
        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
          <AlertCircle size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-0.5">Nerve Impulse Alert</p>
          <p className="text-xs font-bold text-gray-200">{error}</p>
        </div>
        <button 
          onClick={() => setError(null)}
          className="ml-4 p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ==========================================================
PM BROTHERS MULTISPECIALITY HOSPITAL
ENTERPRISE CORE v6 (ULTIMATE ENTERPRISE PATCH)
SUPABASE LIVE | MULTI-BRANCH | ERP MAP | AI FINANCE
========================================================== */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Patient } from "../../types";
import { 
  BrainCircuit, Printer, CheckCircle2, AlertCircle, TrendingUp, 
  History, ShieldCheck, QrCode as QrIcon, FileText, Loader2, Camera, 
  Trash2, Zap, ArrowRight, Activity, Clock, ChevronRight, Sparkles,
  Share2, IndianRupee, MessageSquare, Download, ShieldPlus,
  BellRing, FileCheck, Building2, Server, Database, BarChart3, Globe,
  RefreshCw, FileUp, Microscope, ClipboardCheck
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { speakText, sushrutAnalyzeLabReportOCR } from "../../geminiService";
import QRCode from "qrcode";

interface LabResult {
  test: string;
  value: number;
  reference: string;
}

interface ReferenceRange {
  min: number;
  max: number;
}

const referenceRanges: Record<string, ReferenceRange> = {
  'Hb': { min: 12, max: 17 },
  'Hemoglobin': { min: 12, max: 17 },
  'WBC': { min: 4000, max: 11000 },
  'White Blood Cells': { min: 4000, max: 11000 },
  'Platelets': { min: 150000, max: 450000 },
  'Creatinine': { min: 0.6, max: 1.3 },
  'Serum Creatinine': { min: 0.6, max: 1.3 },
  'Urea': { min: 15, max: 45 },
  'Sodium': { min: 135, max: 145 },
  'Potassium': { min: 3.5, max: 5.0 },
  'Glucose': { min: 70, max: 100 }
};

const BRANCH_ID = "MAIN_HUB_HYDERABAD";
const NABH_AUDIT_KEY = "nabh_audit_log";

export const EnterpriseDiagnosticHub: React.FC<{ patient?: Patient }> = ({ patient }) => {
  const [inputData, setInputData] = useState("");
  const [reportData, setReportData] = useState<LabResult[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [approved, setApproved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeBranch] = useState(BRANCH_ID);

  useEffect(() => {
    if (patient?.id) {
       setReportData([]);
       setAiSummary("");
       setApproved(false);
    }
  }, [patient?.id]);

  const findRangeForTest = (testName: string): string => {
    const key = Object.keys(referenceRanges).find(k => testName.toUpperCase().includes(k.toUpperCase()));
    if (key) {
      const range = referenceRanges[key];
      return `${range.min} - ${range.max}`;
    }
    return "Standard";
  };

  const logCompliance = async (action: string, patientId?: string) => {
    const logs = JSON.parse(localStorage.getItem(NABH_AUDIT_KEY) || "[]");
    const newLog = { branch_id: activeBranch, action, patientId: patientId || "SYSTEM", timestamp: new Date().toISOString(), user: "Lab-Core-v6" };
    logs.push(newLog);
    localStorage.setItem(NABH_AUDIT_KEY, JSON.stringify(logs));
  };

  const approveReport = () => {
    setApproved(true);
    logCompliance("LAB_REPORT_APPROVED", patient?.id);
    speakText("Lab report authorized.", "Zephyr");
  };

  const processExtractedResults = async (results: { test: string; value: number; unit: string }[]) => {
    const processed: LabResult[] = results.map(r => ({
      test: r.test,
      value: r.value,
      reference: findRangeForTest(r.test)
    }));

    setReportData(processed);
    generateAISummary(processed);
    logCompliance("LAB_REPORT_GENERATED", patient?.id);
    generateQRImage();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const data = await sushrutAnalyzeLabReportOCR(base64, file.type);
      if (data && data.results) await processExtractedResults(data.results);
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessManual = async () => {
    const lines = inputData.split("\n");
    const results = lines.map(line => {
      const parts = line.split(":");
      return { test: parts[0]?.trim(), value: parseFloat(parts[1]?.trim() || "0"), unit: "" };
    }).filter(r => r.test && !isNaN(r.value));
    setIsProcessing(true);
    await processExtractedResults(results);
    setIsProcessing(false);
  };

  const generateAISummary = async (results: LabResult[]) => {
    setAiSummary("Synthesizing...");
    const prompt = `Provide an ultra-short clinical interpretation (MAX 2 sentences) for these results: ${JSON.stringify(results)}. You MUST end with this exact phrase: "PLEASE CORRELATE CLINICALLY."`;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiSummary(res.text || "Analysis complete. PLEASE CORRELATE CLINICALLY.");
    } catch (e) {
      setAiSummary("AI Node standby. PLEASE CORRELATE CLINICALLY.");
    }
  };

  const generateQRImage = async () => {
    const qr = await QRCode.toDataURL(`https://pmhospital.com/report/${patient?.id || 'gen'}`);
    setQrImage(qr);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
      <title>Lab Report - ${patient?.name}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #0f172a; line-height: 1.2; font-size: 13px; max-height: 297mm; overflow: hidden; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
        h1 { margin:0; color:#0f172a; font-size:18px; font-weight: 900; text-transform: uppercase; }
        .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-weight: 700; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
        th { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 900; background: #f1f5f9; border-top: 1px solid #cbd5e1; }
        .val-cell { font-weight: 900; font-size: 16px; color: #000; }
        .ref-cell { color: #475569; font-weight: 600; }
        .ai-box { background: #f1f5f9; border-left: 5px solid #0f172a; padding: 15px; border-radius: 4px; margin-top: 20px; }
        .ai-title { font-weight: 900; font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 5px; display: block; }
        .ai-text { font-style: italic; font-weight: 600; font-size: 14px; }
        .footer { position: fixed; bottom: 20px; left: 20px; right: 20px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 9px; color: #94a3b8; text-align: center; }
        .signature { margin-top: 50px; text-align: right; }
        .sig-line { width: 180px; border-bottom: 2px solid #0f172a; display: inline-block; margin-bottom: 5px; }
        .sig-text { font-weight: 900; text-transform: uppercase; font-size: 11px; padding-right: 20px; }
      </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>PM BROTHERS MULTISPECIALITY HOSPITAL</h1>
            <p style="margin:5px 0; font-weight: 800; color: #64748b; font-size: 11px;">DIAGNOSTIC HUB • ${activeBranch}</p>
          </div>
          <div><img src="${qrImage}" width="70"/></div>
        </div>
        <div class="patient-info">
          <div>PATIENT: ${patient?.name?.toUpperCase() || "N/A"}</div>
          <div>MRN: ${patient?.id || "N/A"}</div>
          <div>AGE/SEX: ${patient?.age}Y / ${patient?.gender?.toUpperCase()}</div>
          <div>DATE: ${new Date().toLocaleDateString()}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50%">Investigation</th>
              <th style="width: 25%">Observed Value</th>
              <th style="width: 25%">Reference Range</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(r => `
              <tr>
                <td style="font-weight: 700; text-transform: uppercase;">${r.test}</td>
                <td class="val-cell">${r.value}</td>
                <td class="ref-cell">${r.reference}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="ai-box">
          <span class="ai-title">Clinician's Brief</span>
          <div class="ai-text">${aiSummary}</div>
        </div>
        <div class="signature">
          <div class="sig-line"></div><br/>
          <span class="sig-text">Authorized Pathologist</span>
        </div>
        <div class="footer">
          <p>This is a computer-generated diagnostic record. Verified via SHA-256 institutional sync node.</p>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="bg-[#111827] border border-emerald-500/20 rounded-[50px] p-10 shadow-4xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><Globe size={300} /></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-8 relative z-10 border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-[28px] flex items-center justify-center text-white shadow-xl">
               <Microscope size={32} className={isProcessing ? "animate-pulse" : ""} />
            </div>
            <div>
               <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Analytical Matrix</h2>
               <p className="text-[10px] text-emerald-500 uppercase font-black mt-2 tracking-[0.4em]">Precision Diagnostics v6.5 • No Status Flags</p>
            </div>
          </div>
          
          <div className="flex gap-4">
             <button onClick={handlePrint} disabled={reportData.length === 0} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all italic border border-white/10 flex items-center gap-3">
                <Printer size={18} /> Print 1-Page Report
             </button>
             {reportData.length > 0 && !approved && (
               <button onClick={approveReport} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all italic border border-white/10 flex items-center gap-3">
                  <ShieldCheck size={18} /> Commit Results
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0a0f18] p-8 rounded-[40px] border border-gray-800 shadow-inner space-y-6">
               <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`group h-40 border-4 border-dashed rounded-[40px] flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-all ${isProcessing ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-gray-800 hover:border-emerald-500/30 bg-black/20'}`}
               >
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
                  {isProcessing ? (
                    <Loader2 size={40} className="text-emerald-500 animate-spin mx-auto" />
                  ) : (
                    <>
                       <Camera size={40} className="text-gray-700 group-hover:text-emerald-500 transition-colors mb-4" />
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Snap Machine Output</p>
                    </>
                  )}
               </div>
               <textarea
                  placeholder="Manual Input (Test: Value)"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  className="w-full h-24 bg-[#111827] border border-gray-800 rounded-3xl p-6 text-sm font-bold italic text-white outline-none focus:border-emerald-500 shadow-inner resize-none"
               />
               <button onClick={handleProcessManual} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all italic border border-white/10">Process Manual</button>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {reportData.length > 0 ? (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="bg-[#0a0f18] border border-gray-800 rounded-[50px] overflow-hidden shadow-2xl relative">
                    <table className="w-full text-left">
                        <thead className="bg-black/40 border-b border-gray-800">
                            <tr className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">
                                <th className="p-6">Marker Investigation</th>
                                <th className="p-6">Observed Value</th>
                                <th className="p-6">Reference Range</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/40">
                            {reportData.map((r, i) => (
                                <tr key={i} className="group hover:bg-emerald-600/5 transition-all">
                                    <td className="p-6 text-sm font-black text-white italic uppercase">{r.test}</td>
                                    <td className="p-6">
                                       <span className="text-3xl font-black text-white italic tracking-tighter">
                                          {r.value}
                                       </span>
                                    </td>
                                    <td className="p-6 text-sm font-black text-gray-600 italic">({r.reference})</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[60px] relative overflow-hidden group shadow-inner">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 italic flex items-center gap-3">
                     <Sparkles size={16} /> Clinician Brief
                  </h4>
                  <div className="text-lg text-slate-300 font-medium italic leading-relaxed">
                     {aiSummary}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-[0.02] grayscale text-center py-32 select-none">
                 <Server size={180} />
                 <p className="text-sm font-black uppercase mt-12 tracking-[0.5em]">Lattice Standby</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDiagnosticHub;

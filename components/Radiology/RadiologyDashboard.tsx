
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Scan, Clock, CheckCircle2, Search, FileUp, Activity, Sparkles, User, Filter, 
  CheckCircle, Image as ImageIcon, Loader2, X, LogOut, AlertTriangle, Lock, Eye,
  Maximize, ZoomIn, ZoomOut, Contrast, Ruler, Target, ShieldCheck, Siren,
  ChevronRight, ArrowLeft, UploadCloud, Info, Check, ShieldAlert,
  Edit3, Printer, Database, FileText, Layers, MousePointer2, ListFilter,
  Move, Square, RefreshCcw, Zap, Key
} from 'lucide-react';
import { sushrutRadiologyVisionStream, generateRadiologyAdvisorySummary, speakText } from '../../geminiService';
import { Patient, Investigation, RadiologyImage, RadiologyAnnotation, RadiologyReport } from '../../types';
import { uploadReportGuarded } from '../Shared/AppEventToast';

/* ==========================================================
RADIOLOGY DASHBOARD ORDER RESTORE PATCH
NO DELETION | NO REGRESSION
========================================================== */

const RadiologyOrderRestore: React.FC<{ onSync: (orders: any[]) => void }> = ({ onSync }) => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = () => {
      const possibleKeys = [
        "department_orders",
        "doctor_investigation_orders",
        "enterprise_lab_reports",
        "investigation_registry",
        "universal_store"
      ];

      let radiologyOrders: any[] = [];

      possibleKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "[]");
          if (!Array.isArray(data)) return;

          data.forEach(order => {
            const department = order.department || order.category || order.type || "";
            const name = order.testName || order.item_name || order.name || "";

            /* Detect radiology items like USG, CECT, MRI, XRAY */
            if (
              department.toLowerCase().includes("radio") ||
              name.toLowerCase().includes("usg") ||
              name.toLowerCase().includes("cect") ||
              name.toLowerCase().includes("mri") ||
              name.toLowerCase().includes("xray") ||
              name.toLowerCase().includes("scan")
            ) {
              // Avoid duplicates if same order appears in multiple keys
              if (!radiologyOrders.find(o => o.patientId === order.patientId && (o.testName === name || o.name === name))) {
                radiologyOrders.push(order);
              }
            }
          });
        } catch (e) {
          console.error(`Error reading registry key: ${key}`, e);
        }
      });

      setOrders(radiologyOrders);
      onSync(radiologyOrders);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // 5s heartbeat sync
    return () => clearInterval(interval);
  }, [onSync]);

  if (orders.length === 0) return null;

  return (
    <div className="mb-8 p-6 bg-blue-950/20 border border-blue-500/30 rounded-[40px] shadow-2xl animate-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-4 mb-6">
        <Database className="text-blue-400" size={20} />
        <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Pending Registry Orders (USG/CECT/MRI)</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order, i) => (
          <div key={i} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
               <Zap size={12} className="text-blue-400 animate-pulse" />
            </div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">{order.patientId}</p>
            <p className="text-xs font-bold text-white uppercase truncate">{order.testName || order.item_name || order.name}</p>
            <p className="text-[8px] text-gray-600 font-black uppercase mt-1 tracking-widest">Synced from Institutional Node</p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface RadiologyDashboardProps {
  patients?: Patient[];
  onLogout?: () => void;
  onUpdateInvestigation?: (patientId: string, invId: string, updates: Partial<Investigation>) => void;
}

const RadiologyDashboard: React.FC<RadiologyDashboardProps> = ({ 
  patients = [], 
  onLogout, 
  onUpdateInvestigation 
}) => {
  const [activeView, setActiveView] = useState<'WORKLIST' | 'VIEWER' | 'ADMIN'>('WORKLIST');
  const [activeFilter, setActiveFilter] = useState<'Pending' | 'In Progress' | 'Completed'>('In Progress');
  const [modalityFilter, setModalityFilter] = useState<'ALL' | 'X-Ray' | 'USG' | 'CT' | 'MRI'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Viewer State
  const [selectedStudy, setSelectedStudy] = useState<any | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [contrast, setContrast] = useState(100);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFindings, setAiFindings] = useState<string>("");
  const [reportText, setReportText] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [activeTool, setActiveTool] = useState<'pointer' | 'measure' | 'roi' | 'pan'>('pointer');

  // Registry Fallback State
  const [legacyOrders, setLegacyOrders] = useState<any[]>([]);

  // Mapping all Radiology investigations from global patients registry + Registry Fallback
  const allRadiologyOrders = useMemo(() => {
    const stateOrders = (patients || []).flatMap(p => 
      (p.investigations || [])
        .filter(inv => inv.type === 'RADIOLOGY')
        .map(inv => ({ 
          ...inv, 
          patientName: p.name, 
          patientId: p.id, 
          age: p.age, 
          gender: p.gender, 
          complaint: p.chiefComplaint,
          radiologyDetails: inv.radiologyDetails || {
            modality: inv.name.toLowerCase().includes('ct') ? 'CT' : inv.name.toLowerCase().includes('mri') ? 'MRI' : inv.name.toLowerCase().includes('usg') ? 'USG' : 'X-Ray',
            bodyPart: 'Anatomical Node',
            images: [],
            annotations: []
          }
        }))
    );

    const legacyMapped = legacyOrders.map((lo, idx) => {
      const name = lo.testName || lo.item_name || lo.name || "Radiology Procedure";
      const modality = name.toLowerCase().includes('ct') ? 'CT' : name.toLowerCase().includes('mri') ? 'MRI' : name.toLowerCase().includes('usg') ? 'USG' : 'X-Ray';
      
      return {
        id: `LEGACY-RAD-${idx}-${lo.patientId}`,
        test_id: `R-${idx}`,
        name: name,
        type: 'RADIOLOGY' as const,
        priority: lo.priority || 'Routine',
        price: lo.rate || 2500,
        payment_status: 'PAID', // Legacy assumed authorized if it reached registry
        result_status: 'LOCKED' as const,
        expectedTurnaround: '6h',
        patientName: `NODE-${lo.patientId?.slice(-4) || 'UNK'}`,
        patientId: lo.patientId,
        age: 0,
        gender: 'U',
        complaint: 'Registry Entry',
        radiologyDetails: {
          modality: modality as any,
          bodyPart: 'Referral Focus',
          images: [],
          annotations: []
        },
        isLegacy: true
      };
    }).filter(lo => !stateOrders.some(so => (so.name === lo.name || so.test_id === lo.test_id) && so.patientId === lo.patientId));

    return [...stateOrders, ...legacyMapped];
  }, [patients, legacyOrders]);

  const filteredOrders = useMemo(() => {
    return allRadiologyOrders.filter(inv => {
      const matchesSearch = inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           inv.patientId.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const matchesModality = modalityFilter === 'ALL' || inv.radiologyDetails.modality === modalityFilter;
      if (!matchesModality) return false;

      if (activeFilter === 'Pending') return inv.payment_status === 'PENDING';
      if (activeFilter === 'In Progress') return inv.payment_status === 'PAID' && inv.result_status === 'LOCKED';
      if (activeFilter === 'Completed') return inv.result_status === 'COMPLETED';
      return true;
    });
  }, [allRadiologyOrders, activeFilter, modalityFilter, searchTerm]);

  // Actions
  const handleOpenStudy = (inv: any) => {
    setSelectedStudy(inv);
    setReportText(inv.radiologyDetails?.report?.text || "");
    setIsCritical(inv.radiologyDetails?.report?.critical || false);
    setAiFindings(inv.radiologyDetails?.report?.aiSummary || "");
    setActiveView('VIEWER');
  };

  const handleSelectKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedStudy) return;
    
    const newImages: RadiologyImage[] = Array.from(files).map((f: File, i) => ({
      id: `IMG-${Date.now()}-${i}`,
      url: URL.createObjectURL(f),
      version: 1,
      timestamp: new Date().toISOString(),
      operatorId: 'TECH-ROOT',
      modality: selectedStudy.radiologyDetails.modality
    }));

    const updatedDetails = {
      ...selectedStudy.radiologyDetails,
      images: [...selectedStudy.radiologyDetails.images, ...newImages]
    };

    onUpdateInvestigation?.(selectedStudy.patientId, selectedStudy.id, { radiologyDetails: updatedDetails });
    setSelectedStudy({ ...selectedStudy, radiologyDetails: updatedDetails });
  };

  const handleRunAiVision = async () => {
    if (!selectedStudy?.radiologyDetails?.images?.length) return;
    
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        alert("Institutional Policy: Personalized API Key selection is mandatory for Advanced Vision Analysis.");
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsAnalyzing(true);
    setAiFindings("");
    
    try {
      const images = selectedStudy.radiologyDetails.images.map((img: any) => img.url);
      const stream = sushrutRadiologyVisionStream({ 
        images, 
        clinicalContext: `Patient presents with ${selectedStudy.complaint}. Modality: ${selectedStudy.radiologyDetails.modality}. Area: ${selectedStudy.radiologyDetails.bodyPart}` 
      });
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setAiFindings(fullText);
      }
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found")) {
        alert("API Key Verification Failed. Resetting key node.");
        if ((window as any).aistudio) await (window as any).aistudio.openSelectKey();
      }
      setAiFindings("Vision Node Communication Failure.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinalizeReport = () => {
    if (!selectedStudy || !reportText) return;
    if (!uploadReportGuarded()) return;

    const report: RadiologyReport = {
      id: `REP-${Date.now()}`,
      text: reportText,
      status: 'Finalized',
      radiologistName: 'Dr. Radiologist (HUB)',
      critical: isCritical,
      timestamp: new Date().toISOString(),
      aiSummary: aiFindings.substring(0, 300)
    };

    const updatedDetails = { ...selectedStudy.radiologyDetails, report };

    onUpdateInvestigation?.(selectedStudy.patientId, selectedStudy.id, { 
      result_status: 'COMPLETED',
      radiologyDetails: updatedDetails
    });

    if (isCritical) {
      speakText(`Critical radiology finding detected. Alert dispatched.`, 'Fenrir');
    }

    setActiveView('WORKLIST');
    setSelectedStudy(null);
  };

  const WorklistNode = () => (
    <div className="flex flex-col h-full bg-[#020408] animate-in fade-in duration-700">
      <div className="p-8 border-b border-white/5 bg-[#070b14]/50 backdrop-blur-xl shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl relative group">
              <Scan size={32} />
              <div className="absolute inset-0 bg-white/10 animate-pulse rounded-[22px]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Diagnostic Vision Hub</h1>
              <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.5em] mt-2 italic">Institutional Imaging Node v6.5</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input 
                type="text" placeholder="Search Patient ID / Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="bg-[#0a0f18] border border-gray-800 rounded-2xl pl-12 pr-6 py-3 text-xs text-white focus:outline-none focus:border-blue-500 w-full md:w-80 shadow-inner"
              />
            </div>
            <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-gray-800">
               {['Pending', 'In Progress', 'Completed'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveFilter(tab as any)}
                   className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === tab ? 'bg-blue-600 text-white shadow-xl italic' : 'text-gray-600 hover:text-white'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>
            <div className="flex items-center gap-2">
              {onLogout && (
                <button onClick={onLogout} className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-xl"><LogOut size={18} /></button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
           {['ALL', 'X-Ray', 'USG', 'CT', 'MRI'].map(mod => (
             <button 
               key={mod} onClick={() => setModalityFilter(mod as any)}
               className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${modalityFilter === mod ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' : 'bg-transparent border-gray-800 text-gray-600 hover:text-gray-400'}`}
             >
                {mod}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        
        {/* 🧬 UNIVERSAL RADIOLOGY ORDER RESTORE NODE */}
        {activeFilter === 'In Progress' && <RadiologyOrderRestore onSync={setLegacyOrders} />}

        <div className="bg-[#111827] border border-gray-800 rounded-[40px] overflow-hidden shadow-4xl mt-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0a0f18]/50 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <th className="p-6">Study Details</th>
                <th className="p-6">Patient Node</th>
                <th className="p-6">Modality</th>
                <th className="p-6 text-center">Priority</th>
                <th className="p-6 text-center">Wait (TAT)</th>
                <th className="p-6 text-right">Operational State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {filteredOrders.map((inv) => (
                <tr key={inv.id} className="group hover:bg-blue-600/5 transition-all">
                  <td className="p-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${inv.priority === 'Urgent' || inv.priority === 'Stat' ? 'bg-red-900/20 text-red-500 border-red-500/20' : 'bg-gray-900 text-gray-600 border-gray-800 group-hover:bg-blue-600 group-hover:text-white'}`}>
                        <ImageIcon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white italic uppercase leading-none">{inv.name}</p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase mt-2 tracking-widest">{inv.radiologyDetails.bodyPart}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-black text-slate-300 uppercase leading-none">{inv.patientName}</p>
                    <p className="text-[9px] text-gray-700 font-mono mt-2">{inv.patientId}</p>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase italic">{inv.radiologyDetails.modality}</span>
                  </td>
                  <td className="p-6 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase ${inv.priority === 'Urgent' || inv.priority === 'Stat' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                       {inv.priority}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                     <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-gray-400 font-mono italic">34m</span>
                        <div className="w-12 h-1 bg-gray-900 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: '60%'}} /></div>
                     </div>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => handleOpenStudy(inv)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 italic border border-white/10"
                    >
                      {activeFilter === 'Completed' ? 'Review & Sync' : 'Initialize Workspace'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="py-40 text-center opacity-10 grayscale flex flex-col items-center gap-6">
               <Database size={100} />
               <p className="text-3xl font-black uppercase tracking-[0.4em] italic">Worklist node standby</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ViewerNode = () => {
    if (!selectedStudy) return null;
    const currentImg = selectedStudy.radiologyDetails.images[activeImageIdx];

    return (
      <div className="h-full flex flex-col bg-black animate-in fade-in duration-700">
        <header className="h-20 border-b border-white/5 bg-[#070b14]/90 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-50">
           <div className="flex items-center gap-8">
              <button onClick={() => setActiveView('WORKLIST')} className="p-3 bg-white/5 text-gray-500 hover:text-white rounded-xl transition-all border border-white/10"><ArrowLeft size={20}/></button>
              <div>
                 <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedStudy.patientName}</h2>
                    <span className="px-3 py-1 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase italic">{selectedStudy.radiologyDetails.modality} Station</span>
                 </div>
                 <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.5em] mt-2 italic">Vision Pulse: {selectedStudy.id}</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-gray-800 shadow-inner">
                 <button onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))} className="p-2.5 text-gray-500 hover:text-white transition-colors"><ZoomOut size={16}/></button>
                 <span className="px-4 py-2 text-[10px] font-black text-gray-300 font-mono w-14 text-center">{Math.round(zoomLevel * 100)}%</span>
                 <button onClick={() => setZoomLevel(prev => Math.min(4, prev + 0.1))} className="p-2.5 text-gray-500 hover:text-white transition-colors"><ZoomIn size={16}/></button>
              </div>
              <button onClick={() => setContrast(prev => prev === 100 ? 160 : 100)} className={`p-3.5 rounded-xl transition-all shadow-xl border border-white/5 ${contrast > 100 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`} title="Toggle Enhancement"><Contrast size={18}/></button>
              <button 
                onClick={onLogout}
                className="p-3.5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-white/5"
                title="Node Exit"
              >
                <LogOut size={18} />
              </button>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
           {/* Workstation Toolbar */}
           <div className="w-20 border-r border-white/5 bg-[#070b14] flex flex-col items-center py-10 gap-8 shrink-0">
              <button onClick={() => setActiveTool('pointer')} className={`p-4 rounded-2xl transition-all shadow-xl border ${activeTool === 'pointer' ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-800/50 text-gray-600 border-white/5 hover:text-gray-400'}`}><MousePointer2 size={24}/></button>
              <button onClick={() => setActiveTool('pan')} className={`p-4 rounded-2xl transition-all border ${activeTool === 'pan' ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-800/50 text-gray-600 border-white/5 hover:text-gray-400'}`}><Move size={24}/></button>
              <button onClick={() => setActiveTool('measure')} className={`p-4 rounded-2xl transition-all border ${activeTool === 'measure' ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-800/50 text-gray-600 border-white/5 hover:text-gray-400'}`}><Ruler size={24}/></button>
              <button onClick={() => setActiveTool('roi')} className={`p-4 rounded-2xl transition-all border ${activeTool === 'roi' ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-800/50 text-gray-600 border-white/5 hover:text-gray-400'}`}><Target size={24}/></button>
              <div className="h-px w-10 bg-white/5" />
              <button className="p-4 bg-gray-800/50 text-gray-600 hover:text-white rounded-2xl transition-all border border-white/5"><Maximize size={24}/></button>
              
              <div className="mt-auto mb-10 flex flex-col gap-4">
                 <button onClick={handleRunAiVision} disabled={isAnalyzing || !selectedStudy.radiologyDetails.images.length} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isAnalyzing ? 'bg-cyan-600 text-white animate-pulse' : 'bg-gray-900 border border-cyan-500/20 text-cyan-500 hover:bg-cyan-600 hover:text-white'} shadow-2xl`}>
                    {isAnalyzing ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                 </button>
              </div>
           </div>

           {/* High-Fidelity Canvas Area */}
           <div className="flex-1 bg-[#020408] relative flex items-center justify-center overflow-hidden">
              {/* Scanline Effect Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,128,0.06))] bg-[length:100%_2px,3px_100%]" />
              
              {selectedStudy.radiologyDetails.images.length > 0 ? (
                <div 
                  className="relative transition-all duration-300 ease-out"
                  style={{ transform: `scale(${zoomLevel})`, filter: `contrast(${contrast}%) brightness(1.1)` }}
                >
                   <img 
                     src={currentImg.url} 
                     className="max-h-[85vh] w-auto shadow-[0_0_150px_rgba(0,0,0,0.8)] border border-white/5 rounded-sm" 
                     alt="Clinical DICOM Output"
                   />
                   
                   {/* Corner Labels (Traditional DICOM) */}
                   <div className="absolute top-4 left-4 text-[8px] font-mono text-gray-500 uppercase flex flex-col gap-1 pointer-events-none">
                      <span>SERIES: 101</span>
                      <span>FRAME: {activeImageIdx + 1} / {selectedStudy.radiologyDetails.images.length}</span>
                      <span>SLICE: 0.5mm</span>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-12 animate-in fade-in duration-1000">
                   <div className="w-40 h-40 bg-[#0a0f18] border-2 border-dashed border-gray-800 rounded-[50px] flex items-center justify-center text-gray-700 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-500/5 group-hover:scale-150 transition-transform duration-[5s]" />
                      <UploadCloud size={80} className="relative z-10 group-hover:translate-y-[-5px] transition-transform" />
                   </div>
                   <div className="text-center space-y-6">
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Station Entry Idle</h3>
                      <p className="text-gray-600 font-black uppercase text-[10px] tracking-[0.5em] italic">Ingress mandatory to initialize Vision Hub</p>
                      <input type="file" id="radiology-upload" className="hidden" multiple onChange={handleFileUpload} />
                      <label htmlFor="radiology-upload" className="mt-8 inline-flex items-center gap-5 bg-blue-600 text-white px-14 py-6 rounded-[35px] font-black uppercase text-xs tracking-[0.4em] shadow-[0_20px_60px_rgba(37,99,235,0.3)] hover:bg-blue-500 cursor-pointer transition-all active:scale-95 italic border-2 border-white/10">
                         [ INTAKE MODALITY SERIES ]
                      </label>
                   </div>
                </div>
              )}
           </div>

           {/* Reporting & Intelligence Workspace */}
           <div className="w-[500px] border-l border-white/5 bg-[#0a0f18] flex flex-col shrink-0 overflow-y-auto custom-scrollbar shadow-2xl">
              <div className="p-10 space-y-12 pb-40">
                 
                 {/* Clinical Summary Module */}
                 <div className="bg-[#111827] border border-gray-800 p-8 rounded-[40px] space-y-6 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-[4s]"><FileText size={100}/></div>
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                       <FileText size={16} /> Clinical Triage context
                    </h4>
                    <p className="text-sm text-slate-200 italic font-medium leading-relaxed drop-shadow-sm">"{selectedStudy.complaint}"</p>
                 </div>

                 {/* Formal Reporting Workstation */}
                 <div className="bg-[#111827] border border-gray-800 p-10 rounded-[60px] space-y-10 shadow-4xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-8 mb-2">
                       <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.5em] italic flex items-center gap-4"><Edit3 size={20} className="text-blue-500"/> Report Narrator</h4>
                       <button 
                         onClick={() => setIsCritical(!isCritical)}
                         className={`flex items-center gap-3 px-6 py-2.5 rounded-full border transition-all ${isCritical ? 'bg-red-600 border-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.6)] animate-pulse' : 'bg-gray-900 border-gray-800 text-gray-700 hover:text-red-400'}`}
                       >
                          <Siren size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">CRITICAL FINDING</span>
                       </button>
                    </div>
                    
                    <div className="space-y-6">
                       <textarea 
                        value={reportText}
                        onChange={e => setReportText(e.target.value)}
                        className="w-full h-80 bg-[#0a0f18] border border-gray-800 rounded-[45px] p-10 text-[15px] text-slate-200 italic leading-relaxed focus:border-blue-500 outline-none transition-all shadow-inner custom-scrollbar"
                        placeholder="Enter formalized radiological findings..."
                       />
                    </div>
                    
                    <button 
                      onClick={handleFinalizeReport}
                      disabled={!reportText || selectedStudy.result_status === 'COMPLETED'}
                      className="w-full py-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white rounded-[50px] font-black uppercase text-sm tracking-[0.4em] shadow-4xl transition-all active:scale-95 italic border-2 border-white/10"
                    >
                      [ AUTHORIZE & SIGN-OFF ]
                    </button>
                 </div>

              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#020408] font-['Inter'] relative overflow-hidden">
       {activeView === 'WORKLIST' ? <WorklistNode /> : <ViewerNode />}
    </div>
  );
};

export default RadiologyDashboard;

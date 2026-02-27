
import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Scan, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  X,
  Sparkles,
  Search,
  Eye
} from 'lucide-react';
import { Report } from '../../../types';

const ReportsOCRTab: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const handleFileUpload = (file: File) => {
    const newReport: Report = {
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      uploadDate: new Date().toLocaleDateString(),
      status: 'Uploading',
      type: 'Radiology'
    };
    setReport(newReport);

    setTimeout(() => {
      setReport(prev => prev ? { ...prev, status: 'Processing' } : null);
      
      setTimeout(() => {
        setReport(prev => prev ? { 
          ...prev, 
          status: 'Completed',
          extractedData: [
            { finding: 'Appendix Diameter', value: '9 mm (Dilated)', isAbnormal: true, confidence: 98 },
            { finding: 'Periappendiceal Fat', value: 'Stranding Present', isAbnormal: true, confidence: 95 },
            { finding: 'Fecalith', value: 'Visible in lumen', isAbnormal: true, confidence: 92 },
            { finding: 'Free Fluid', value: 'Minimal pelvic fluid', isAbnormal: false, confidence: 88 }
          ]
        } : null);
      }, 2500);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-cyan-400 uppercase tracking-tighter flex items-center gap-3 italic">
          <Scan className="w-6 h-6" />
          MediCare Vision OCR
        </h2>
        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
          Sushrut-Vision Node Active
        </span>
      </div>

      {!report && (
        <div 
          className={`
            border-4 border-dashed rounded-[40px] p-16 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-inner
            ${isDragging ? 'border-cyan-500 bg-cyan-500/5 scale-105' : 'border-gray-800 hover:border-gray-700 bg-[#111827]/40'}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
        >
          <div className="bg-[#0a0f18] p-8 rounded-[32px] mb-8 border border-gray-800 shadow-2xl">
            <UploadCloud size={48} className="text-cyan-500" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
            Drop Clinical Reports
          </h3>
          <p className="text-sm text-gray-500 mt-4 max-w-xs font-bold uppercase tracking-widest leading-relaxed">
            AI extracts data, detects abnormalities, and updates probability matrix.
          </p>
          <input 
            type="file" 
            className="hidden" 
            onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} 
            id="file-upload"
          />
          <label 
            htmlFor="file-upload" 
            className="mt-10 px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl cursor-pointer shadow-2xl shadow-cyan-600/20 transition-all active:scale-95"
          >
            Select DICOM / PDF
          </label>
        </div>
      )}

      {report && report.status !== 'Completed' && (
        <div className="bg-[#111827] rounded-[40px] border border-gray-800 p-20 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-cyan-600/5 animate-pulse" />
          <Loader2 size={64} className="text-cyan-500 animate-spin mb-8 relative z-10" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tight italic relative z-10">
            {report.status === 'Uploading' ? 'Uploading Node...' : 'Sushrut Vision Analyzing...'}
          </h3>
          <p className="text-sm text-gray-500 mt-4 font-bold uppercase tracking-widest relative z-10">
            Scanning layers for pathological markers
          </p>
        </div>
      )}

      {report && report.status === 'Completed' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between bg-[#1a212f]/40 p-6 rounded-[32px] border border-gray-800 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-600/10 rounded-2xl flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-lg font-black text-white tracking-tight uppercase italic">{report.fileName}</p>
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">Processed Just Now • {report.type}</p>
              </div>
            </div>
            <button 
              onClick={() => setReport(null)} 
              className="text-gray-700 hover:text-white p-3 hover:bg-gray-800 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="bg-[#111827] rounded-[40px] border border-cyan-500/30 overflow-hidden shadow-3xl">
            <div className="bg-cyan-600/5 px-8 py-5 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Sparkles size={18} className="text-cyan-500" />
                 <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">AI Extracted Evidence</h3>
              </div>
              <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Confidence: HIGH (98%)</span>
            </div>
            
            <div className="divide-y divide-gray-800/50">
              {report.extractedData?.map((data, index) => (
                <div key={index} className="p-8 flex items-center justify-between hover:bg-[#1a212f]/20 transition-all group">
                  <div>
                    <p className="text-lg font-black text-white uppercase tracking-tight italic group-hover:text-cyan-400 transition-colors">{data.finding}</p>
                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">
                      Match Reliability: {data.confidence}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black italic ${data.isAbnormal ? 'text-red-500' : 'text-emerald-500'}`}>
                      {data.value}
                    </p>
                    {data.isAbnormal && (
                      <span className="inline-flex items-center gap-2 text-[9px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-lg mt-2 uppercase tracking-widest animate-pulse border border-red-500/20">
                        <AlertCircle size={12} /> ABNORMAL FINDING
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1a212f]/30 p-8 flex justify-end gap-6 border-t border-gray-800">
              <button className="text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-widest transition-all">
                Escalate for Review
              </button>
              <button className="flex items-center gap-3 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest px-10 py-4 rounded-2xl shadow-2xl shadow-cyan-600/20 transition-all active:scale-95">
                <CheckCircle2 size={18} />
                Accept Findings & Update Matrix
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-black text-gray-700 uppercase tracking-widest px-4">
             <Eye size={16} /> Findings synchronized with DDx Matrix & Patient History
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsOCRTab;

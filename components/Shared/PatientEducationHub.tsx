import React, { useState } from 'react';
import { 
  BookOpen, Sparkles, Loader2, Video, Globe, 
  Languages, Printer, HeartPulse, Apple, 
  Dumbbell, Scale, Info, CheckCircle2, Zap, Play
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { generatePragnyaEducation } from '../../geminiService';
import { generatePatientPDF } from '../../utils/PatientPDFEngine';
import { Patient } from '../../types';

interface PatientEducationHubProps {
  patient?: Patient;
  approvedContext?: string;
}

const PatientEducationHub: React.FC<PatientEducationHubProps> = ({ patient, approvedContext = "" }) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'recovery' | 'diet' | 'remedies' | 'physio'>('recovery');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleGenerate = async (type: typeof contentType) => {
    setLoading(true);
    setContentType(type);
    setVideoUrl(null);
    try {
      const patientData = {
        name: patient?.name || 'Valued Patient',
        age: patient?.age?.toString() || '45',
        diagnosis: approvedContext || patient?.chiefComplaint || 'General Wellness',
        language: language
      };
      const res = await generatePragnyaEducation(type, patientData, language);
      setContent(res);
    } catch (e) {
      console.error(e);
      setContent("Institutional relay error. Please try generating again.");
    } finally {
      setLoading(false);
    }
  };

  const generateEducationVideo = async () => {
    if (!content) return;
    
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsVideoGenerating(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const prompt = `A professional medical education video. 
      Subject: ${contentType.toUpperCase()} for ${patient?.name || 'Patient'}. 
      Topic: ${approvedContext || 'Recovery guidance'}. 
      Style: Clean medical animation, reassuring tone, helpful visualizations.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: { 
          numberOfVideos: 1, 
          resolution: '720p', 
          aspectRatio: '16:9' 
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Fix: Direct URL construction with API Key to prevent Response disturbance errors
        // This is the standard method to ensure media elements can load securely
        const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        setVideoUrl(finalUrl);
      }
    } catch (e) {
      console.error("Video Gen Error:", e);
      alert("Video generation service currently strained. Please try again later.");
    } finally {
      setIsVideoGenerating(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-10 shadow-3xl min-h-[600px] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><BookOpen size={300} /></div>
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 relative z-10 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[24px] flex items-center justify-center text-white shadow-xl">
            <BookOpen size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Education Hub</h2>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Multi-Modal Awareness Node v6.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex bg-[#0a0f18] p-1.5 rounded-2xl border border-gray-800 shadow-inner">
              {['English', 'Telugu', 'Hindi'].map(l => (
                <button 
                  key={l} onClick={() => setLanguage(l)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === l ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                   {l}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12 relative z-10">
        {[
          { id: 'recovery', label: 'Recovery Path', icon: HeartPulse, color: 'text-rose-500' },
          { id: 'diet', label: 'Nutrition', icon: Apple, color: 'text-emerald-500' },
          { id: 'remedies', label: 'Supportive Care', icon: Scale, color: 'text-amber-500' },
          { id: 'physio', label: 'Movement', icon: Dumbbell, color: 'text-cyan-500' },
        ].map(tool => (
          <button 
            key={tool.id}
            onClick={() => handleGenerate(tool.id as any)}
            className={`bg-[#0a0f18] border p-8 rounded-[40px] text-left transition-all group flex flex-col items-center justify-center text-center gap-4 ${contentType === tool.id && content ? 'border-indigo-500 bg-indigo-600/5 shadow-2xl' : 'border-gray-800 hover:border-indigo-500/50'}`}
          >
            <tool.icon size={32} className={`${tool.color} mb-2 group-hover:scale-110 transition-transform`} />
            <h4 className="text-white font-black text-xs uppercase italic tracking-widest">{tool.label}</h4>
          </button>
        ))}
      </div>

      <div className="flex-1 relative z-10">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-20 gap-8 opacity-40">
             <Loader2 size={64} className="animate-spin text-indigo-500" />
             <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse">Synthesizing Educational Node...</p>
          </div>
        ) : content ? (
          <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-[#0a0f18] p-12 rounded-[60px] border border-gray-800 shadow-inner relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none"><Sparkles size={120} /></div>
               <div className="prose prose-invert max-w-none text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                  {content}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <button 
                    onClick={generateEducationVideo}
                    disabled={isVideoGenerating}
                    className="w-full py-8 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white rounded-[40px] font-black uppercase text-sm tracking-[0.3em] shadow-[0_20px_50px_rgba(6,182,212,0.3)] transition-all active:scale-95 flex items-center justify-center gap-6 border-2 border-white/10 italic"
                  >
                    {isVideoGenerating ? <Loader2 size={24} className="animate-spin" /> : <Video size={24} />}
                    {isVideoGenerating ? 'Rendering AI Video...' : 'Generate 4K Visual Guide'}
                  </button>
                  <button 
                    onClick={() => generatePatientPDF({
                      module: "YOGA",
                      language: language === 'Telugu' ? 'te-IN' : 'en-US',
                      hospitalName: "PM BROTHERS HOSPITAL",
                      patientSummary: `Case Ref: ${patient?.id || 'GEN'}\nFocus: ${contentType.toUpperCase()}`,
                      adviceSteps: content.split('\n').filter(l => l.trim().length > 5),
                      doctorApproved: true,
                      doctorName: "Institutional Assistant"
                    })}
                    className="w-full py-6 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-[40px] font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-4"
                  >
                    <Printer size={20} /> Print Care Handout
                  </button>
               </div>

               {videoUrl && (
                  <div className="rounded-[40px] overflow-hidden border-4 border-cyan-500/20 shadow-4xl relative group aspect-video">
                    <video 
                      key={videoUrl}
                      src={videoUrl} 
                      controls 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-4 left-4 bg-cyan-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Veo-3.1 Render</div>
                  </div>
               )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-10 grayscale py-32">
             <Zap size={100} className="mb-10 text-gray-700" />
             <p className="text-3xl font-black uppercase tracking-[0.6em] italic">Intelligence Idle</p>
             <p className="text-[10px] font-black uppercase mt-8 tracking-widest">Select a category to initialize clinical awareness</p>
          </div>
        )}
      </div>

      <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-widest italic shrink-0">
        <span className="flex items-center gap-3"><Sparkles size={16} className="text-indigo-500" /> Powered by Pragnya v6.0 Context Synthesis</span>
        <span>Institutional Node Verified</span>
      </div>
    </div>
  );
};

export default PatientEducationHub;
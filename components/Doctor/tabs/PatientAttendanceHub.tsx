import React, { useState } from 'react';
import { 
  Users, Scale, Apple, HeartPulse, Dumbbell, 
  CheckCircle2, XCircle, Loader2, FileText, 
  Languages, Printer, Send, ShieldAlert,
  ChevronRight, Brain, AlertCircle, Info, Video, Sparkles, Play
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { generatePragnyaEducation } from '../../../geminiService';
import { generatePatientPDF } from '../../../utils/PatientPDFEngine';

const PatientAttendanceHub: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'recovery' | 'diet' | 'remedies' | 'physio'>('recovery');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);

  const [patientData, setPatientData] = useState({
    name: 'Rajesh Kumar',
    age: '45',
    gender: 'Male',
    diagnosis: 'Type 2 Diabetes',
    region: 'Telangana',
    language: 'Telugu',
    weight: '78kg',
    waterIntake: '1.5L'
  });

  const handleGenerate = async (type: typeof contentType) => {
    setLoading(true);
    setContentType(type);
    setVideoUrl(null);
    try {
      const res = await generatePragnyaEducation(type, patientData, patientData.language);
      setContent(res);
      setStep(3);
    } catch (e) {
      console.error(e);
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
    // Create new instance per instruction to ensure latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const prompt = `A professional medical education video for a patient named ${patientData.name}. 
      Topic: ${contentType}. Content summary: ${content.substring(0, 300)}. 
      Visual style: Clean, clinical animation, helpful and empathetic tone.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Fix: Use the URL directly with API key to prevent "disturbed response body" errors
        // Letting the browser handle the fetch internally for the video element is more robust.
        const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        setVideoUrl(finalUrl);
      }
    } catch (e) {
      console.error("Video Gen Error:", e);
      alert("Institutional Video Engine overloaded. Reverting to text-node.");
    } finally {
      setIsVideoGenerating(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-indigo-500/20 rounded-[60px] p-10 shadow-3xl space-y-12 animate-in fade-in duration-700 pb-20">
       <div className="flex items-center justify-between border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-xl">
                <Users size={32} />
             </div>
             <div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Attendance Education Hub</h3>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 italic">Patient Empowerment Node v6.0</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[9px] font-black text-gray-500 uppercase">Active Profile</p>
                <p className="text-sm font-black text-white italic">{patientData.name}</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[
            { id: 'recovery', label: 'Recovery Path', icon: HeartPulse, color: 'text-rose-500' },
            { id: 'diet', label: 'Personal Diet', icon: Apple, color: 'text-emerald-500' },
            { id: 'remedies', label: 'Home Support', icon: Scale, color: 'text-amber-500' },
            { id: 'physio', label: 'Movement Plan', icon: Dumbbell, color: 'text-cyan-500' }
          ].map(tool => (
            <button 
              key={tool.id}
              onClick={() => handleGenerate(tool.id as any)}
              disabled={loading}
              className={`bg-[#0a0f18] border p-8 rounded-[40px] transition-all group flex flex-col items-center gap-4 ${contentType === tool.id && content ? 'border-indigo-500 bg-indigo-600/5' : 'border-gray-800 hover:border-indigo-500/50'}`}
            >
               <tool.icon size={36} className={`${tool.color} group-hover:scale-110 transition-transform`} />
               <span className="text-white font-black uppercase italic tracking-widest text-[11px]">{tool.label}</span>
            </button>
          ))}
       </div>

       <div className="flex-1 min-h-[400px]">
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center py-20 gap-8">
                <Loader2 size={64} className="text-indigo-500 animate-spin" />
                <p className="text-[14px] font-black text-white uppercase tracking-[0.5em] animate-pulse">Syncing Education Logic...</p>
             </div>
          ) : content ? (
             <div className="space-y-10 animate-in slide-in-from-bottom-8">
                <div className="bg-[#0a0f18] p-12 rounded-[60px] border border-gray-800 shadow-inner relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.02]"><Sparkles size={120} /></div>
                   <div className="prose prose-invert max-w-none text-xl text-slate-300 font-medium italic leading-relaxed whitespace-pre-wrap font-mono custom-markdown-rendering">
                      {content}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <button 
                        onClick={generateEducationVideo}
                        disabled={isVideoGenerating}
                        className="w-full py-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-[40px] font-black uppercase text-sm tracking-[0.3em] shadow-3xl transition-all active:scale-95 flex items-center justify-center gap-6 border-2 border-white/10 italic"
                      >
                        {isVideoGenerating ? <Loader2 size={24} className="animate-spin" /> : <Video size={24} />}
                        {isVideoGenerating ? 'Rendering AI Guide...' : 'Generate Clinical Video'}
                      </button>
                      <button 
                        onClick={() => generatePatientPDF({
                          module: "HOME_CARE",
                          language: patientData.language === 'Telugu' ? 'te-IN' : 'en-US',
                          hospitalName: "PM BROTHERS HOSPITAL",
                          patientSummary: `Patient: ${patientData.name}\nDiagnosis: ${patientData.diagnosis}`,
                          adviceSteps: content.split('\n').filter(l => l.trim().length > 5),
                          doctorApproved: true,
                          doctorName: "Institutional Node"
                        })}
                        className="w-full py-6 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-[40px] font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-4"
                      >
                        <Printer size={20} /> Print Patient Handout
                      </button>
                   </div>

                   {videoUrl && (
                      <div className="rounded-[40px] overflow-hidden border-4 border-indigo-500/20 shadow-4xl relative group aspect-video">
                        <video 
                          key={videoUrl}
                          src={videoUrl} 
                          controls 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Veo-3.1 Render</div>
                      </div>
                   )}
                </div>
             </div>
          ) : (
             <div className="py-32 text-center opacity-10 flex flex-col items-center gap-8 grayscale">
                <Brain size={120} />
                <p className="text-4xl font-black uppercase tracking-[0.5em] italic">Knowledge Node Idle</p>
             </div>
          )}
       </div>

       <div className="p-10 bg-indigo-600/5 border border-indigo-500/10 rounded-[48px] flex items-start gap-8 shadow-inner opacity-60">
          <Info className="text-indigo-400 shrink-0" size={24} />
          <div className="space-y-2">
             <p className="text-sm font-black text-white uppercase italic tracking-tight leading-relaxed">
                Institutional Awareness Protocol: Education nodes utilize Pragnya v6.0 synthesis to generate patient-facing guidance. All AI outputs must be physically released by the treating consultant.
             </p>
          </div>
       </div>
    </div>
  );
};

export default PatientAttendanceHub;
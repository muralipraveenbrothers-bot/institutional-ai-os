
import React, { useState, useMemo, useRef } from 'react';
import { Patient } from '../../types';
import { 
  User, X, UserPlus, Waves, Mic, Loader2, Save, Trash2, ArrowLeft, Bot, Camera, Sparkles
} from 'lucide-react';
import { markRegistered } from '../Shared/AppEventToast';
import { speakText, sushrutScanRegistrationHandwriting } from '../../geminiService';

const RegistrationForm: React.FC<{ 
  onSubmit: (patient: Patient) => void, 
  onReset?: () => void
}> = ({ onSubmit, onReset }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', phone: '', chiefComplaint: '', mrn: ''
  });
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const finalizeRegistration = () => {
    const id = formData.mrn || `UHID-${Date.now().toString().slice(-8)}`;
    const newPatient: Patient = {
      id, mrNumber: id, name: formData.name || 'Unknown', age: parseInt(formData.age) || 0,
      gender: formData.gender, phone: formData.phone || '',
      chiefComplaint: formData.chiefComplaint || 'Routine',
      type: 'OP', status: 'Waiting', regStatus: 'REGISTERED',
      registeredAt: new Date().toISOString(), isConsultationPaid: false,
      investigations: [], medications: []
    };
    markRegistered();
    onSubmit(newPatient);
  };

  const handleVoiceIntake = () => {
    setIsVoiceActive(true);
    // Dispatch system-wide event for Mitra Voice Controller
    window.dispatchEvent(new CustomEvent('mitra-request-start'));
    speakText("Initializing Voice Intake Hub. Please state the patient's full name when the pulse begins.", "Zephyr");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const data = await sushrutScanRegistrationHandwriting(base64, file.type);
        if (data) {
          setFormData({
            ...formData,
            name: data.name || formData.name,
            age: data.age?.toString() || formData.age,
            gender: data.gender || formData.gender,
            phone: data.phone || formData.phone,
            chiefComplaint: data.chiefComplaint || formData.chiefComplaint
          });
          speakText("Information extracted and translated from image. Registration fields synchronized.", "Zephyr");
        }
      } catch (err) {
        alert("Extraction Node Interrupted. Please ensure image clarity or enter manually.");
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 font-['Inter'] animate-in slide-in-from-bottom-8">
      <div className="bg-[#111827] border border-gray-800 rounded-[60px] p-12 shadow-4xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none"><UserPlus size={300} /></div>
        
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8 relative z-10">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-cyan-600/10 rounded-[24px] flex items-center justify-center text-cyan-500 border border-cyan-500/20 shadow-inner">
                <UserPlus size={32} />
              </div>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">New Registry Ingress</h2>
           </div>
           <div className="flex gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className={`px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 italic transition-all ${isScanning ? 'animate-pulse opacity-50' : ''}`}
              >
                 {isScanning ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />} 
                 [ {isScanning ? 'SCANNING...' : 'SCAN / PHOTO'} ]
              </button>
              <button 
                onClick={handleVoiceIntake}
                disabled={isScanning}
                className={`px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 italic transition-all ${isVoiceActive ? 'animate-pulse ring-4 ring-emerald-500/20' : ''}`}
              >
                 <Waves size={20} /> [ START VOICE INTAKE ]
              </button>
              <button onClick={onReset} className="p-4 bg-white/5 hover:bg-red-600/20 text-gray-500 hover:text-red-500 rounded-2xl transition-all border border-white/5"><X size={24}/></button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
            <div className={`space-y-4 transition-all duration-700 ${isScanning ? 'opacity-40 grayscale scale-95' : ''}`}>
                <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest ml-4 italic">Full Legal Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-xl font-black italic text-white outline-none focus:border-cyan-500 shadow-inner" placeholder="Enter name..." />
            </div>
            <div className={`grid grid-cols-2 gap-6 transition-all duration-700 ${isScanning ? 'opacity-40 grayscale scale-95' : ''}`}>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest ml-4 italic">Age</label>
                    <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-xl font-black italic text-white outline-none" />
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest ml-4 italic">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-sm font-black text-white outline-none focus:border-cyan-500 appearance-none">
                       <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                </div>
            </div>
            <div className={`space-y-4 transition-all duration-700 ${isScanning ? 'opacity-40 grayscale scale-95' : ''}`}>
                <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest ml-4 italic">Mobile Registry</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-xl font-black italic text-white outline-none" placeholder="10-digit number" />
            </div>
            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-4 italic">Pre-assigned MRN (If any)</label>
                <input value={formData.mrn} onChange={e => setFormData({...formData, mrn: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-3xl px-8 py-5 text-sm font-mono text-gray-400 outline-none" placeholder="AUTO-GENERATE" />
            </div>
            <div className={`md:col-span-2 space-y-4 transition-all duration-700 ${isScanning ? 'opacity-40 grayscale scale-95' : ''}`}>
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-4 italic">Initial Chief Complaint</label>
                <textarea value={formData.chiefComplaint} onChange={e => setFormData({...formData, chiefComplaint: e.target.value})} className="w-full bg-[#0a0f18] border border-gray-800 rounded-[45px] p-10 text-lg italic text-slate-300 outline-none focus:border-cyan-500 h-40 shadow-inner" placeholder="Primary reason for visit..." />
            </div>
            <div className="md:col-span-2 pt-10">
              <button 
                onClick={finalizeRegistration} 
                disabled={!formData.name || !formData.phone || isScanning}
                className="w-full py-10 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-20 text-white rounded-[60px] font-black uppercase text-xl tracking-[0.5em] italic shadow-[0_30px_80px_rgba(6,182,212,0.3)] transition-all active:scale-95 border-2 border-white/10"
              >
                [ COMMIT REGISTRY ]
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;

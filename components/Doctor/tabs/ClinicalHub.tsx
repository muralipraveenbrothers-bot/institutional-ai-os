
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, Trash2, CheckCircle2, AlertCircle, 
  Activity, Target, Clock, User, ShieldCheck, Save,
  Stethoscope, Pill, Scissors, HeartPulse, ListChecks
} from 'lucide-react';
import { Patient, Diagnosis, TreatmentPlan } from '../../../types';
import { clinicalModule } from '../../../ClinicalDataModule';

interface ClinicalHubProps {
  patient: Patient;
}

const ClinicalHub: React.FC<ClinicalHubProps> = ({ patient }) => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);

  // New Diagnosis Form State
  const [newDx, setNewDx] = useState<Omit<Diagnosis, 'id' | 'identifiedAt'>>({
    code: '',
    description: '',
    type: 'PRIMARY',
    status: 'SUSPECTED',
    identifiedBy: 'Dr. Root'
  });

  // New Treatment Plan Form State
  const [newPlan, setNewPlan] = useState<Omit<TreatmentPlan, 'id' | 'lastUpdated' | 'startDate'>>({
    patientId: patient.id,
    goals: [''],
    interventions: [{ type: 'MEDICATION', description: '', status: 'PLANNED' }]
  });

  useEffect(() => {
    const data = clinicalModule.getPatientClinicalData(patient.id);
    setDiagnoses(data.diagnoses);
    setTreatmentPlans(data.treatmentPlans);
  }, [patient.id]);

  const handleAddDiagnosis = () => {
    const dx = clinicalModule.addDiagnosis(patient.id, newDx);
    setDiagnoses(prev => [...prev, dx]);
    setShowAddDiagnosis(false);
    setNewDx({ code: '', description: '', type: 'PRIMARY', status: 'SUSPECTED', identifiedBy: 'Dr. Root' });
  };

  const handleCreatePlan = () => {
    const plan = clinicalModule.createTreatmentPlan(patient.id, newPlan);
    setTreatmentPlans(prev => [...prev, plan]);
    setShowAddPlan(false);
    setNewPlan({ patientId: patient.id, goals: [''], interventions: [{ type: 'MEDICATION', description: '', status: 'PLANNED' }] });
  };

  const updateDxStatus = (id: string, status: Diagnosis['status']) => {
    clinicalModule.updateDiagnosisStatus(patient.id, id, status);
    setDiagnoses(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-40">
      
      {/* --- DIAGNOSES SECTION --- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
              <Stethoscope size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Diagnostic Registry</h3>
              <p className="text-[10px] text-indigo-500/60 font-black uppercase mt-1 tracking-widest">Clinical Identification Node</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddDiagnosis(!showAddDiagnosis)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl transition-all flex items-center gap-2"
          >
            <Plus size={14} /> [ ADD DIAGNOSIS ]
          </button>
        </div>

        {showAddDiagnosis && (
          <div className="bg-[#111827] border border-indigo-500/20 rounded-[40px] p-8 shadow-4xl animate-in slide-in-from-top-4 duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">ICD Code / Reference</label>
                <input 
                  value={newDx.code} onChange={e => setNewDx({...newDx, code: e.target.value})}
                  className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-indigo-500 outline-none transition-all shadow-inner" 
                  placeholder="e.g. K35.80"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Clinical Description</label>
                <input 
                  value={newDx.description} onChange={e => setNewDx({...newDx, description: e.target.value})}
                  className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-indigo-500 outline-none transition-all shadow-inner" 
                  placeholder="e.g. Acute Appendicitis"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Diagnosis Type</label>
                <select 
                  value={newDx.type} onChange={e => setNewDx({...newDx, type: e.target.value as any})}
                  className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-indigo-500 outline-none transition-all shadow-inner appearance-none"
                >
                  <option value="PRIMARY">Primary</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="DIFFERENTIAL">Differential</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Initial Status</label>
                <select 
                  value={newDx.status} onChange={e => setNewDx({...newDx, status: e.target.value as any})}
                  className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-indigo-500 outline-none transition-all shadow-inner appearance-none"
                >
                  <option value="SUSPECTED">Suspected</option>
                  <option value="CONFIRMED">Confirmed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowAddDiagnosis(false)} className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">Cancel</button>
              <button onClick={handleAddDiagnosis} className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl transition-all">Commit Diagnosis</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diagnoses.map(dx => (
            <div key={dx.id} className="bg-[#0a0f18] border border-white/5 rounded-[35px] p-8 shadow-inner group hover:border-indigo-500/20 transition-all relative overflow-hidden">
              <div className={`absolute top-0 right-0 px-4 py-1 text-[8px] font-black uppercase tracking-widest italic rounded-bl-xl ${dx.status === 'CONFIRMED' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                {dx.status}
              </div>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">{dx.code}</p>
              <h4 className="text-lg font-black text-white uppercase italic tracking-tight mb-4">{dx.description}</h4>
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <User size={12} className="text-gray-600" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase">{dx.identifiedBy}</span>
                </div>
                <div className="flex gap-2">
                  {dx.status !== 'CONFIRMED' && (
                    <button onClick={() => updateDxStatus(dx.id, 'CONFIRMED')} className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle2 size={14} /></button>
                  )}
                  {dx.status !== 'RULED_OUT' && (
                    <button onClick={() => updateDxStatus(dx.id, 'RULED_OUT')} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {diagnoses.length === 0 && (
            <div className="col-span-full py-20 bg-[#0a0f18] border border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center opacity-30">
              <ClipboardList size={48} className="text-gray-600 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">No active diagnoses in registry</p>
            </div>
          )}
        </div>
      </section>

      {/* --- TREATMENT PLANS SECTION --- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
              <ListChecks size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Therapeutic Roadmap</h3>
              <p className="text-[10px] text-emerald-500/60 font-black uppercase mt-1 tracking-widest">Intervention Strategy Node</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddPlan(!showAddPlan)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl transition-all flex items-center gap-2"
          >
            <Plus size={14} /> [ CREATE PLAN ]
          </button>
        </div>

        {showAddPlan && (
          <div className="bg-[#111827] border border-emerald-500/20 rounded-[40px] p-8 shadow-4xl animate-in slide-in-from-top-4 duration-500 space-y-8">
            <div className="space-y-4">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Clinical Goals</label>
              {newPlan.goals.map((goal, idx) => (
                <div key={idx} className="flex gap-4">
                  <input 
                    value={goal} onChange={e => {
                      const updated = [...newPlan.goals];
                      updated[idx] = e.target.value;
                      setNewPlan({...newPlan, goals: updated});
                    }}
                    className="flex-1 bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-emerald-500 outline-none transition-all shadow-inner" 
                    placeholder="e.g. Stabilize hemodynamics"
                  />
                  {idx === newPlan.goals.length - 1 && (
                    <button onClick={() => setNewPlan({...newPlan, goals: [...newPlan.goals, '']})} className="p-4 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all"><Plus size={20}/></button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Interventions</label>
              {newPlan.interventions.map((int, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select 
                    value={int.type} onChange={e => {
                      const updated = [...newPlan.interventions];
                      updated[idx].type = e.target.value as any;
                      setNewPlan({...newPlan, interventions: updated});
                    }}
                    className="bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-emerald-500 outline-none transition-all shadow-inner appearance-none"
                  >
                    <option value="MEDICATION">Medication</option>
                    <option value="SURGERY">Surgery</option>
                    <option value="PROCEDURE">Procedure</option>
                    <option value="THERAPY">Therapy</option>
                    <option value="DIET">Diet</option>
                  </select>
                  <input 
                    value={int.description} onChange={e => {
                      const updated = [...newPlan.interventions];
                      updated[idx].description = e.target.value;
                      setNewPlan({...newPlan, interventions: updated});
                    }}
                    className="md:col-span-2 bg-[#0a0f18] border border-gray-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-emerald-500 outline-none transition-all shadow-inner" 
                    placeholder="Describe intervention..."
                  />
                </div>
              ))}
              <button onClick={() => setNewPlan({...newPlan, interventions: [...newPlan.interventions, { type: 'MEDICATION', description: '', status: 'PLANNED' }]})} className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-all flex items-center gap-2 mt-2">
                <Plus size={12}/> Add Intervention
              </button>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
              <button onClick={() => setShowAddPlan(false)} className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">Cancel</button>
              <button onClick={handleCreatePlan} className="px-10 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase italic shadow-xl transition-all">Activate Plan</button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {treatmentPlans.map(plan => (
            <div key={plan.id} className="bg-[#0a0f18] border border-white/5 rounded-[45px] p-10 shadow-inner group hover:border-emerald-500/20 transition-all">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-1/3 space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">{plan.id}</p>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-600 uppercase">
                      <Clock size={12} /> {new Date(plan.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Clinical Goals</p>
                    <ul className="space-y-2">
                      {plan.goals.map((g, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-slate-300 italic font-medium">
                          <Target size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="lg:w-2/3 space-y-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Intervention Stack</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan.interventions.map((int, i) => (
                      <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-3xl flex items-start gap-4 group-hover:bg-emerald-600/5 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-gray-500 border border-white/5">
                          {int.type === 'MEDICATION' && <Pill size={18} />}
                          {int.type === 'SURGERY' && <Scissors size={18} />}
                          {int.type === 'PROCEDURE' && <Activity size={18} />}
                          {int.type === 'THERAPY' && <HeartPulse size={18} />}
                          {int.type === 'DIET' && <ShieldCheck size={18} />}
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">{int.type}</p>
                          <p className="text-xs font-bold text-white uppercase italic leading-tight">{int.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <div className={`w-2 h-2 rounded-full ${int.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-[8px] font-black text-gray-600 uppercase">{int.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Last Updated: {new Date(plan.lastUpdated).toLocaleString()}</p>
                <button className="px-6 py-2 bg-white/5 border border-white/10 text-gray-500 rounded-xl text-[9px] font-black uppercase italic hover:text-white transition-all flex items-center gap-2">
                  <Save size={12} /> Update Plan Node
                </button>
              </div>
            </div>
          ))}
          {treatmentPlans.length === 0 && (
            <div className="py-20 bg-[#0a0f18] border border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center opacity-30">
              <Activity size={48} className="text-gray-600 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">No active treatment plans in registry</p>
            </div>
          )}
        </div>
      </section>

      {/* --- SAFETY FOOTER --- */}
      <div className="p-8 bg-[#0a0f18] border border-white/5 rounded-[40px] flex items-start gap-8 shadow-inner opacity-50">
        <ShieldCheck size={28} className="text-indigo-500/40 shrink-0 mt-1" />
        <p className="text-xs font-black text-white uppercase italic tracking-tight leading-relaxed text-left">
          DISCLAIMER: CLINICAL DATA NODES ARE AUTHORITATIVE RECORDS. ALL ENTRIES ARE AUDITED AND LINKED TO THE RESPONSIBLE CONSULTANT'S CREDENTIALS.
        </p>
      </div>
    </div>
  );
};

export default ClinicalHub;

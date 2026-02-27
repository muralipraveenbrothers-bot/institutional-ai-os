
import React, { useState } from 'react';
import { Patient } from '../../types';
// Added ShieldCheck to the lucide-react imports
import { Search, Filter, MoreHorizontal, User, Lock, ShieldCheck } from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
}

const PatientList: React.FC<PatientListProps> = ({ patients }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const maskName = (name: string) => {
    if (name.length <= 2) return name + "***";
    return name.substring(0, 2) + "***";
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase italic tracking-tight">Patient Directory</h1>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Institution-Wide Registry Node</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search patients..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-[#111827] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>
          <button className="p-2.5 bg-[#111827] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1f2937]/30 border-b border-gray-800">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Patient (Masked)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">MR Number</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-[#1a212f]/40 transition-all cursor-pointer group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1f2937] rounded-xl flex items-center justify-center text-gray-500 group-hover:text-cyan-400 transition-colors">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white tracking-tight">{maskName(patient.name)}</p>
                      <p className="text-[10px] text-gray-500 font-black uppercase">{patient.age}y • {patient.gender}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                  {patient.id}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    patient.type === 'IP' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {patient.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                    <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">{patient.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                   {!patient.isConsultationPaid && <Lock size={14} className="text-red-500/40 inline-block mr-4"/>}
                  <button className="text-gray-600 hover:text-white transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPatients.length === 0 && (
          <div className="py-20 text-center bg-[#0a0f18]/30">
            <p className="text-gray-500 text-sm font-black uppercase tracking-[0.3em]">No registry nodes found</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-yellow-500/50 text-[9px] font-black uppercase tracking-widest">
         <ShieldCheck size={12}/> Names masked per institutional data minimization policy
      </div>
    </div>
  );
};

export default PatientList;

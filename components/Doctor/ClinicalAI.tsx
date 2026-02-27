
import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Activity, 
  Pill, 
  FileText, 
  Info, 
  Mic, 
  Send,
  BrainCircuit,
  MessageSquare,
  History as HistoryIcon,
  ChevronDown
} from 'lucide-react';
import { askSusruta } from '../../geminiService';

const ClinicalAI: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState('Ask Question');

  const handleAsk = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await askSusruta(query);
      setResponse(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const TOOLS = [
    { title: 'Pathophysiology', icon: Activity, desc: 'Disease mechanism' },
    { title: 'Drug MOA', icon: Pill, desc: 'Mechanism of action' },
    { title: 'Protocols', icon: FileText, desc: 'Treatment guidelines' },
    { title: 'Ask Question', icon: Info, desc: 'Custom query' },
  ];

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Clinical Knowledge</h1>
           <p className="text-gray-500">Access verified clinical literature and pathophysiology through Gemini AI.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="p-3 bg-[#111827] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all">
             <HistoryIcon size={20} />
           </button>
           <button className="p-3 bg-[#111827] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all">
             <BookOpen size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left Column: Tools & Input */}
        <div className="col-span-5 space-y-6">
          <div className="bg-[#111827] border border-gray-800 p-8 rounded-3xl space-y-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
                   <BrainCircuit size={24} />
                 </div>
                 <h2 className="text-lg font-bold text-white">Clinical Assistant</h2>
               </div>
               <div className="flex items-center gap-2 text-[10px] bg-cyan-600/10 text-cyan-500 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                  <Sparkles size={12} /> PM BROTHERS AI
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {TOOLS.map((tool) => (
                 <button 
                   key={tool.title}
                   onClick={() => setSelectedTool(tool.title)}
                   className={`flex flex-col p-4 rounded-2xl border transition-all text-left group ${
                     selectedTool === tool.title 
                       ? 'bg-cyan-600 border-cyan-500 shadow-xl shadow-cyan-600/10' 
                       : 'bg-[#1a212f] border-gray-800 hover:border-gray-700'
                   }`}
                 >
                    <tool.icon size={20} className={`mb-3 transition-colors ${selectedTool === tool.title ? 'text-white' : 'text-cyan-500'}`} />
                    <h4 className={`text-sm font-bold ${selectedTool === tool.title ? 'text-white' : 'text-gray-200'}`}>{tool.title}</h4>
                    <p className={`text-[10px] mt-1 ${selectedTool === tool.title ? 'text-cyan-100' : 'text-gray-500'}`}>{tool.desc}</p>
                 </button>
               ))}
            </div>

            <div className="space-y-4">
              <div className="relative">
                <textarea 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Ask ${selectedTool.toLowerCase()} question...`}
                  className="w-full bg-[#0a0f18] border border-gray-800 rounded-2xl p-5 pt-6 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all resize-none min-h-[120px]"
                ></textarea>
                <div className="absolute right-4 bottom-4 flex gap-3">
                   <button className="p-2 text-gray-500 hover:text-white transition-colors"><Mic size={18} /></button>
                </div>
              </div>
              <button 
                onClick={handleAsk}
                disabled={isLoading || !query.trim()}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/20"
              >
                 {isLoading ? <RotateCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                 {isLoading ? 'Processing Query...' : 'Ask Clinical AI'}
              </button>
            </div>
          </div>

          <div className="bg-[#111827]/50 border border-gray-800 p-6 rounded-2xl flex items-center justify-between text-gray-500">
             <div className="flex items-center gap-3">
               <Info size={18} className="text-yellow-500/50" />
               <p className="text-xs">Evidence-based clinical literature used for reasoning.</p>
             </div>
             <ChevronDown size={16} />
          </div>
        </div>

        {/* Right Column: AI Output */}
        <div className="col-span-7 flex flex-col min-h-0">
          <div className="flex-1 bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
             <div className="p-6 border-b border-gray-800 bg-[#1a212f]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-cyan-600/10 rounded-lg flex items-center justify-center text-cyan-500">
                      <MessageSquare size={18} />
                   </div>
                   <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Clinical Response</h3>
                </div>
                {response && <button className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Copy Report</button>}
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {!response && !isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center text-gray-700 mb-6">
                      <BrainCircuit size={40} />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">Awaiting Clinical Query</h3>
                    <p className="text-sm text-gray-500 max-w-xs leading-relaxed">Select a knowledge tool and enter a medical topic to receive in-depth AI insights.</p>
                  </div>
                ) : isLoading ? (
                  <div className="space-y-6">
                     <div className="flex gap-4">
                        <div className="w-8 h-8 bg-gray-800 rounded-lg shrink-0 animate-pulse"></div>
                        <div className="flex-1 space-y-3 pt-2">
                           <div className="h-4 bg-gray-800 rounded w-1/4 animate-pulse"></div>
                           <div className="h-4 bg-gray-800 rounded w-full animate-pulse"></div>
                           <div className="h-4 bg-gray-800 rounded w-full animate-pulse"></div>
                           <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse"></div>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="bg-cyan-600/5 border border-cyan-600/10 rounded-2xl p-6 mb-8">
                       <h4 className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                         <Activity size={12} /> Response Summary
                       </h4>
                       <div className="prose prose-invert max-w-none prose-sm">
                          <p className="text-gray-200 leading-relaxed text-base font-medium whitespace-pre-wrap">
                            {response}
                          </p>
                       </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><HistoryIcon size={12} /> Just Now</span>
                       <span className="flex items-center gap-1.5"><BookOpen size={12} /> Evidence Level A</span>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RotateCw = ({ className, size }: { className?: string, size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export default ClinicalAI;

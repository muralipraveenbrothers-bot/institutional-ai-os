
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, 
  RefreshCw, CheckCircle2, ChevronDown, ChevronUp, 
  Target, Info, ArrowRight, Zap, Loader2, Bot,
  Package, Truck, DollarSign, ListChecks
} from 'lucide-react';
import { Medication, DistributorProfile, PmaiInsight } from '../../types';
import { getPmaiInsights } from '../../geminiService';

interface PmaiInsightsPanelProps {
  inventory: Medication[];
  distributors: DistributorProfile[];
}

const PmaiInsightsPanel: React.FC<PmaiInsightsPanelProps> = ({ inventory, distributors }) => {
  const [insights, setInsights] = useState<PmaiInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchInsights = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await getPmaiInsights(inventory, distributors);
      setInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getIcon = (type: PmaiInsight['type']) => {
    switch (type) {
      case 'Distributor': return <Truck className="text-blue-500" size={20} />;
      case 'Margin': return <TrendingUp className="text-emerald-500" size={20} />;
      case 'Replacement': return <RefreshCw className="text-indigo-500" size={20} />;
      case 'Stock': return <Package className="text-amber-500" size={20} />;
      case 'Trend': return <Zap className="text-cyan-500" size={20} />;
      default: return <Sparkles className="text-indigo-500" size={20} />;
    }
  };

  const getSeverityColor = (severity: PmaiInsight['severity']) => {
    switch (severity) {
      case 'High': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="bg-[#111827] border border-indigo-500/20 rounded-[40px] overflow-hidden shadow-4xl animate-in fade-in duration-700">
      <div 
        className="p-8 border-b border-white/5 flex items-center justify-between bg-[#1a212f]/40 cursor-pointer hover:bg-[#1a212f]/60 transition-all"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <Bot size={28} className={loading ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">PM AI Insights</h2>
              {insights.length > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-lg uppercase animate-pulse">
                  {insights.length} New
                </span>
              )}
            </div>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">Autonomous Business Intelligence Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={(e) => { e.stopPropagation(); fetchInsights(); }} 
            className="p-3 bg-white/5 hover:bg-indigo-600/20 rounded-xl text-gray-400 hover:text-white transition-all shadow-inner"
            title="Refresh Insights"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {isCollapsed ? <ChevronDown className="text-gray-600" /> : <ChevronUp className="text-gray-600" />}
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-8 space-y-6">
          {loading && insights.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-6 opacity-40">
              <Loader2 size={48} className="animate-spin text-indigo-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Analyzing Financial Lattice...</p>
            </div>
          ) : insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.map((insight) => (
                <div 
                  key={insight.id} 
                  className="bg-[#0a0f18] border border-gray-800 rounded-[32px] p-6 hover:border-indigo-500/30 transition-all flex flex-col h-full shadow-inner group"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:bg-indigo-600/10 group-hover:text-indigo-400 transition-all">
                      {getIcon(insight.type)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getSeverityColor(insight.severity)}`}>
                        {insight.severity}
                      </span>
                      <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">{insight.type}</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <h4 className="text-sm font-black text-white uppercase italic group-hover:text-indigo-400 transition-colors leading-tight">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                      {insight.description}
                    </p>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                       <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Impact Analysis</p>
                       <p className="text-[11px] text-slate-300 font-medium">{insight.impact}</p>
                    </div>
                  </div>

                  {insight.potentialSavings && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-emerald-500">
                       <span className="text-[9px] font-black uppercase tracking-widest">💰 Potential Gain</span>
                       <span className="text-xs font-black italic">{insight.potentialSavings}</span>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Suggested Action</p>
                    <div className="flex items-center justify-between group/action cursor-pointer">
                       <span className="text-[11px] text-white font-bold italic">{insight.action}</span>
                       <ArrowRight size={14} className="text-gray-700 group-hover/action:translate-x-1 group-hover/action:text-indigo-400 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center opacity-20 grayscale flex flex-col items-center gap-4">
               <Info size={48} className="text-gray-600" />
               <p className="text-xs font-black uppercase tracking-widest">No sufficient data available to generate AI insights.</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-gray-700 uppercase tracking-widest italic opacity-60">
            <span className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-500" /> Powered by Pharma-IQ Engine v6.5</span>
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PmaiInsightsPanel;

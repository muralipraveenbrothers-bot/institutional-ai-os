import React from 'react';
import { motion } from 'motion/react';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  BrainCircuit, 
  FileText, 
  Activity,
  Stethoscope,
  Pill,
  Database, 
  Target,
  Package,
  Bed,
  FlaskConical,
  Scan,
  Receipt,
  UserCheck,
  Cpu,
  ArrowRightLeft,
  CalendarDays,
  Power,
  ShieldCheck,
  Bot,
  TrendingUp,
  Clock,
  ClipboardList,
  Mic,
  HeartPulse,
  User,
  ShieldAlert,
  Zap,
  Network,
  Waves,
  HeartHandshake,
  ShieldX,
  Scale,
  GraduationCap,
  Smile,
  ZapOff,
  History,
  Info,
  Brain,
  Orbit
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onAgentClick: (agentId: string) => void;
  activeAgent: string | null;
}

const AGENTS = [
  { 
    id: 'Mitra', 
    icon: Bot, 
    color: 'text-emerald-500', 
    glow: 'group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    function: 'Relational Guard',
    desc: 'Facilitating patient intake and staff harmony.',
    status: 'Live Sync'
  },
  { 
    id: 'Susruta', 
    icon: BrainCircuit, 
    color: 'text-cyan-500', 
    glow: 'group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    function: 'Clinical Reasoning',
    desc: 'Diagnostic inference and evidence-based plans.',
    status: 'Logic Active'
  },
  { 
    id: 'Samanvaya', 
    icon: HeartHandshake, 
    color: 'text-indigo-500', 
    glow: 'group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]',
    function: 'Behavioral Support',
    desc: 'Coaching, parenting strategies, and CBT-informed care.',
    status: 'Calm Pulse'
  },
  { 
    id: 'Pragnya', 
    icon: Network, 
    color: 'text-purple-500', 
    glow: 'group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    function: 'Collective Awareness',
    desc: 'Institutional oversight and workflow self-healing.',
    status: 'Oversight On'
  },
  { 
    id: 'Kubera', 
    icon: Zap, 
    color: 'text-amber-500', 
    glow: 'group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    function: 'Financial Gatekeeper',
    desc: 'Monitoring revenue flow and cost transparency.',
    status: 'Gates Secure'
  },
];

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onTabChange, onLogout, onAgentClick, activeAgent }) => {
  const getNavItems = () => {
    const common = [{ id: 'Dashboard', icon: LayoutDashboard }];

    switch (role) {
      case UserRole.RECEPTIONIST:
        return [...common, { id: 'Register Patient', icon: UserPlus }, { id: 'Patient List', icon: Users }];
      case UserRole.DOCTOR:
        return [...common, { id: 'Patients', icon: Users }, { id: 'Clinical AI', icon: BrainCircuit }, { id: 'Reports', icon: FileText }];
      case UserRole.PHARMACY:
        return [...common, { id: 'Stock Management', icon: Package }, { id: 'Prescriptions', icon: Pill }];
      case UserRole.WARD:
        return [...common, { id: 'Patients', icon: Bed }, { id: 'Vitals', icon: Stethoscope }];
      case UserRole.LAB:
        return [...common, { id: 'Orders', icon: FlaskConical }, { id: 'Reports', icon: FileText }];
      case UserRole.RADIOLOGY:
        return [...common, { id: 'Orders', icon: Scan }, { id: 'Reports', icon: FileText }];
      case UserRole.BILLING:
        return [...common, { id: 'Gate Control', icon: Receipt }, { id: 'Revenue Reports', icon: FileText }];
      case UserRole.ADMIN:
        return [
          ...common, 
          { id: 'Staff Attendance', icon: UserCheck }, 
          { id: 'AI Agents', icon: Cpu },
          { id: 'Flow Management', icon: ArrowRightLeft },
          { id: 'Appointments', icon: CalendarDays }
        ];
      case UserRole.PATIENT_SUPPORT:
        return [
          ...common,
          { id: 'Voice Care', icon: Waves },
          { id: 'Finance Counsel', icon: Scale },
          { id: 'Wellness AI', icon: HeartPulse },
          { id: 'Staff Trainer', icon: GraduationCap }
        ];
      case UserRole.SECURITY_CONTROL:
        return [
          ...common,
          { id: 'Loss Monitor', icon: ShieldAlert },
          { id: 'Asset Track', icon: Database },
          { id: 'Access Logs', icon: History },
          { id: 'Risk Scoring', icon: Target }
        ];
      default:
        return common;
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden lg:flex w-[170px] bg-[#0a0f18] border-r border-gray-800/60 flex-col p-3 shrink-0 z-[60] shadow-3xl">
      <div className="flex flex-col items-center gap-2 mb-8 pl-0 group text-center">
        <div className="w-10 h-10 bg-cyan-600 rounded-[12px] flex items-center justify-center text-white shadow-2xl shadow-cyan-600/40 group-hover:scale-110 transition-transform duration-500 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border border-white/20 animate-spin neural-orbit-line" />
          </div>
          <div className="w-3 h-3 bg-white rounded-full animate-cognimed-core" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[12px] font-black text-white leading-tight tracking-[0.2em] uppercase italic truncate">
            C <span className="text-cyan-400 animate-pulse inline-block">O</span> G N I M E D
          </h1>
          <p className="text-[6px] text-gray-500 uppercase tracking-[0.3em] font-black mt-0.5">INSTITUTIONAL AI</p>
        </div>
      </div>

      <div className="bg-[#111827]/80 border border-gray-800/60 rounded-[20px] p-2.5 mb-6 flex flex-col items-center gap-2 group hover:border-cyan-500/20 transition-all cursor-pointer shadow-xl overflow-hidden text-center">
        <div className="w-9 h-9 bg-cyan-600/10 rounded-xl flex items-center justify-center text-cyan-500 border border-cyan-500/10 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-inner shrink-0">
          <User size={20} />
        </div>
        <div className="min-w-0">
          <h4 className="text-[10px] font-black text-white tracking-tight uppercase italic truncate">{role.toUpperCase()}</h4>
          <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest mt-0.5 truncate px-1">Authorized Node</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[7px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2 px-3">Registry Nodes</p>
        <nav className="space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[12px] transition-all group relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-cyan-500/5 text-cyan-500 border border-cyan-500/10' 
                  : 'text-gray-500 hover:text-gray-200 hover:bg-[#111827]/40'
              }`}
            >
              <item.icon size={14} className={activeTab === item.id ? 'text-cyan-500' : 'text-gray-700 group-hover:text-gray-400 transition-colors'} />
              <span className={`text-[9px] font-black tracking-tight uppercase italic truncate ${activeTab === item.id ? 'text-cyan-500' : 'text-gray-600 group-hover:text-gray-400'}`}>
                {item.id}
              </span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" 
                />
              )}
            </motion.button>
          ))}
        </nav>
      </div>

      <div className="mt-2 mb-6">
        <p className="text-[7px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3 px-3">COGNIMED Agents</p>
        <div className="space-y-2 px-1">
          {AGENTS.map((agent) => (
            <div key={agent.id} className="relative group flex items-center">
              <button
                onClick={() => onAgentClick(agent.id)}
                className={`w-full flex items-center justify-center py-2.5 rounded-[12px] transition-all border ${
                  activeAgent === agent.id 
                    ? 'bg-white/5 border-gray-700 shadow-xl' 
                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-gray-800'
                }`}
              >
                <agent.icon 
                  size={18} 
                  className={`${agent.color} transition-all duration-300 group-hover:scale-110 ${agent.glow} ${activeAgent === agent.id ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`} 
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-800/60">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-[12px] transition-all group"
        >
          <Power size={16} className="group-hover:rotate-12 transition-transform duration-500" />
          <span className="text-[9px] font-black tracking-tight uppercase italic">Logoff Node</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
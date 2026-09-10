import {
  LayoutDashboard,
  CheckSquare,
  CalendarRange,
  Lightbulb,
  Sliders,
  CalendarDays,
  BarChart3,
  GitMerge,
  Layers,
  Info
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'tasks'
  | 'planner'
  | 'recommendations'
  | 'simulation'
  | 'calendar'
  | 'analytics';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingCount?: number;
  recommendationsCount?: number;
}

export function Sidebar({ activeTab, onTabChange, pendingCount = 0, recommendationsCount = 0 }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as ActiveTab, label: 'Maintenance Tasks', icon: CheckSquare, badge: pendingCount },
    { id: 'planner' as ActiveTab, label: 'Block Planner', icon: CalendarRange, highlight: true },
    { id: 'recommendations' as ActiveTab, label: 'AI Recommendations', icon: Lightbulb, badge: recommendationsCount },
    { id: 'simulation' as ActiveTab, label: 'What-If Simulation', icon: Sliders },
    { id: 'calendar' as ActiveTab, label: 'Weekly & Monthly Plan', icon: CalendarDays },
    { id: 'analytics' as ActiveTab, label: 'Analytics & Insights', icon: BarChart3 }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none min-h-[calc(100vh-80px)]">
      {/* Navigation List */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Core Operations
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Railway Multi-Department Flow Box */}
      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Integrated Departments</span>
        </div>
        <div className="space-y-1.5 text-slate-400">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Engineering (P-Way)
            </span>
            <span className="text-slate-500 font-mono">TMS</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              S&T (Signaling)
            </span>
            <span className="text-slate-500 font-mono">SMMS</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              TRD (Traction 25kV)
            </span>
            <span className="text-slate-500 font-mono">TDMS</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
            <span className="flex items-center gap-1.5 text-amber-300">
              <GitMerge className="w-3 h-3" />
              Train Operations
            </span>
            <span className="text-slate-500 font-mono">COA</span>
          </div>
        </div>

        <div className="mt-3 p-2 bg-blue-950/50 rounded border border-blue-800/40 text-[11px] text-blue-200 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <span>Multi-department bundling optimizes corridor availability up to 96%.</span>
        </div>
      </div>
    </aside>
  );
}

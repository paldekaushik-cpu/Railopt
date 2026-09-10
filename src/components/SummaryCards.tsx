import { AlertOctagon, Clock, CalendarCheck, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface SummaryCardsProps {
  criticalTasksCount: number;
  pendingTasksCount: number;
  plannedBlocksCount: number;
  assetAvailabilityPercentage: number;
  trainConflictsCount: number;
  tasksBundledCount: number;
}

export function SummaryCards({
  criticalTasksCount,
  pendingTasksCount,
  plannedBlocksCount,
  assetAvailabilityPercentage,
  trainConflictsCount,
  tasksBundledCount
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'Critical Maintenance Tasks',
      value: criticalTasksCount,
      subtext: 'Requires immediate corridor block',
      icon: AlertOctagon,
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Pending Tasks',
      value: pendingTasksCount,
      subtext: 'Across Engineering, S&T, TRD',
      icon: Clock,
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      title: 'Planned Blocks',
      value: plannedBlocksCount,
      subtext: 'Scheduled for current window',
      icon: CalendarCheck,
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Asset Availability',
      value: `${assetAvailabilityPercentage.toFixed(1)}%`,
      subtext: 'Target >= 95.0% operational',
      icon: CheckCircle2,
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Train Conflicts',
      value: trainConflictsCount,
      subtext: 'Timetable overlaps detected',
      icon: AlertTriangle,
      textColor: trainConflictsCount > 0 ? 'text-orange-700' : 'text-slate-700',
      bgColor: trainConflictsCount > 0 ? 'bg-orange-50' : 'bg-slate-50',
      borderColor: trainConflictsCount > 0 ? 'border-orange-200' : 'border-slate-200'
    },
    {
      title: 'Tasks Bundled',
      value: tasksBundledCount,
      subtext: 'Multi-department joint blocks',
      icon: Layers,
      textColor: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-lg bg-white border ${card.borderColor} shadow-2xs transition-all hover:shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 truncate">{card.title}</span>
              <div className={`p-1.5 rounded-md ${card.bgColor} ${card.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-black tracking-tight ${card.textColor}`}>
              {card.value}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}

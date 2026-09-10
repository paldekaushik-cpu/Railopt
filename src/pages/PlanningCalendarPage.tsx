import { useState } from 'react';
import { BlockPlan, MaintenanceTask } from '../types';
import { CalendarDays, Calendar as CalendarIcon, Clock, CheckCircle2, AlertOctagon, Layers } from 'lucide-react';

interface PlanningCalendarPageProps {
  plans: BlockPlan[];
  tasks: MaintenanceTask[];
}

export function PlanningCalendarPage({ plans, tasks }: PlanningCalendarPageProps) {
  const [activeView, setActiveView] = useState<'weekly' | 'monthly'>('weekly');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Distribution for simulated weekly schedule
  const weeklySchedule = daysOfWeek.map((day, idx) => {
    // Distribute plans across days
    const dayPlans = plans.filter((_, i) => i % 7 === idx);
    return {
      day,
      date: `Mar ${10 + idx}, 2026`,
      plans: dayPlans
    };
  });

  // Monthly stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const overdueTasks = tasks.filter(t => t.daysOverdue > 0 && t.status !== 'Completed').length;
  const scheduledBlocks = plans.length;

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Long-Range Planning
            </span>
            <span className="text-xs text-slate-500 font-mono">Divisional Master Rolling Stock & Track Schedule</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Weekly & Monthly Corridor Block Horizon</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Coordinate divisional engineering track possessions and overhead wire shutdowns weeks in advance.
          </p>
        </div>

        {/* Toggle Button */}
        <div className="inline-flex rounded-lg border border-slate-300 p-1 bg-slate-50 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveView('weekly')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'weekly'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => setActiveView('monthly')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'monthly'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Calendar
          </button>
        </div>
      </div>

      {/* WEEKLY VIEW */}
      {activeView === 'weekly' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {weeklySchedule.map((col, idx) => (
            <div
              key={col.day}
              className={`rounded-lg border bg-white shadow-2xs flex flex-col ${
                idx === 0 ? 'border-blue-300 ring-1 ring-blue-400' : 'border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div className={`p-3 border-b text-center ${idx === 0 ? 'bg-blue-50/80 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs font-bold text-slate-900">{col.day}</div>
                <div className="text-[11px] text-slate-500 font-medium">{col.date}</div>
              </div>

              {/* Day Plans */}
              <div className="p-2 space-y-2 flex-1 min-h-[360px] bg-slate-50/30">
                {col.plans.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-[11px] italic mt-6">
                    No block possession scheduled
                  </div>
                ) : (
                  col.plans.map(p => (
                    <div
                      key={p.planId}
                      className="p-2.5 rounded-md bg-white border border-slate-200 shadow-2xs space-y-1.5 text-xs hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-900 text-[11px]">{p.planId}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                          Sec {p.section}
                        </span>
                      </div>

                      <div className="font-mono text-[11px] text-slate-700 flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{p.startTime}–{p.endTime}</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {p.departments.map(d => (
                          <span
                            key={d}
                            className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-700"
                          >
                            {d}
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-600 truncate" title={p.bundlingDetails?.explanation}>
                        {p.taskIds.length} tasks bundled
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span className="text-emerald-700 font-semibold">{p.utilization}% util</span>
                        <span className="text-slate-500 font-medium">{p.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MONTHLY VIEW */
        <div className="space-y-5">
          {/* Monthly KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-500">Planned Monthly Blocks</span>
              <div className="text-xl font-black text-blue-700 mt-1">{scheduledBlocks * 4} blocks</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-500">Scheduled Activities</span>
              <div className="text-xl font-black text-slate-800 mt-1">{totalTasks} tasks</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-500">Completed Maintenance</span>
              <div className="text-xl font-black text-emerald-700 mt-1">{completedTasks} completed</div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-500">Critical / Overdue Items</span>
              <div className="text-xl font-black text-red-700 mt-1">{overdueTasks} overdue</div>
            </div>
          </div>

          {/* Calendar Grid Representation */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span>March 2026 — Master Divisional Block Calendar</span>
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-blue-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Coordinated Block
                </span>
                <span className="flex items-center gap-1 text-red-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical Renewal
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 border-b border-slate-200 pb-2 mb-2">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => {
                const dayNum = i + 1;
                const hasBlock = dayNum % 3 === 0 || dayNum === 10 || dayNum === 11;
                const isCritical = dayNum === 14 || dayNum === 22;

                return (
                  <div
                    key={dayNum}
                    className={`min-h-[75px] p-2 rounded border text-left flex flex-col justify-between ${
                      dayNum === 10
                        ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${dayNum === 10 ? 'text-blue-900 font-black' : 'text-slate-700'}`}>
                        {dayNum}
                      </span>
                      {dayNum === 10 && (
                        <span className="text-[9px] bg-blue-600 text-white font-bold px-1 rounded">Today</span>
                      )}
                    </div>

                    <div className="space-y-1 mt-1">
                      {hasBlock && (
                        <div className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 truncate">
                          Sec {['A-B', 'B-C', 'C-D'][dayNum % 3]} (2h)
                        </div>
                      )}
                      {isCritical && (
                        <div className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 truncate">
                          Critical P-Way
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

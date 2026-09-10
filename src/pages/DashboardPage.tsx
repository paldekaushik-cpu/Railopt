import { MaintenanceTask, BlockPlan, CorridorSection } from '../types';
import { SummaryCards } from '../components/SummaryCards';
import { CorridorMap } from '../components/CorridorMap';
import { Sparkles, CalendarRange, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { ActiveTab } from '../components/Sidebar';

interface DashboardPageProps {
  tasks: MaintenanceTask[];
  plans: BlockPlan[];
  sections: CorridorSection[];
  onNavigate: (tab: ActiveTab) => void;
  onSelectSection: (sectionCode: string) => void;
}

export function DashboardPage({ tasks, plans, sections, onNavigate, onSelectSection }: DashboardPageProps) {
  // Compute dynamic summary metrics
  const criticalTasksCount = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed').length;
  const pendingTasksCount = tasks.filter(t => t.status === 'Pending' || t.status === 'Bundled').length;
  const plannedBlocksCount = plans.length;
  const tasksBundledCount = tasks.filter(t => t.status === 'Bundled').length;
  const trainConflictsCount = plans.reduce((acc, p) => acc + (p.trainConflicts || 0), 0);

  // Asset availability calculation
  const totalAssets = 20;
  const severeOverdueCount = tasks.filter(t => t.daysOverdue >= 5 && t.status !== 'Completed').length;
  const assetAvailability = Math.max(91.5, Math.min(98.8, Number((99.0 - (severeOverdueCount * 1.1) - (trainConflictsCount * 0.4)).toFixed(1))));

  return (
    <div className="space-y-6">
      {/* Top Welcome / Mission Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-lg p-5 shadow-sm border border-blue-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-700/80 text-blue-100 border border-blue-500/40">
              Indian Railways Co-ordination Engine
            </span>
            <span className="text-xs text-blue-200">TMS • SMMS • TDMS • COA</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Corridor Availability & Automatic Block Planning
          </h2>
          <p className="text-xs text-blue-200/90 max-w-2xl leading-relaxed">
            Instead of departments planning maintenance blocks independently, RailOpt AI creates a coordinated plan by considering maintenance urgency, asset criticality, train movements, corridor availability, and compatible multi-department activities.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('planner')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs rounded-md shadow flex items-center gap-1.5 transition-colors"
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Open Block Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('recommendations')}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-md border border-white/20 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Bundles</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <SummaryCards
        criticalTasksCount={criticalTasksCount}
        pendingTasksCount={pendingTasksCount}
        plannedBlocksCount={plannedBlocksCount}
        assetAvailabilityPercentage={assetAvailability}
        trainConflictsCount={trainConflictsCount}
        tasksBundledCount={tasksBundledCount}
      />

      {/* Railway Corridor Visual Map */}
      <CorridorMap
        sections={sections}
        tasks={tasks}
        plans={plans}
        onSelectSection={onSelectSection}
      />

      {/* Today's Block Plan Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-blue-600" />
              <span>Today&apos;s Co-ordinated Corridor Block Schedule</span>
            </h3>
            <p className="text-xs text-slate-500">
              Approved multi-department corridor possessions synchronized with train timetables.
            </p>
          </div>
          <button
            onClick={() => onNavigate('planner')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>Launch Optimizer</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Block ID</th>
                <th className="px-4 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Time Window</th>
                <th className="px-4 py-3 font-semibold">Departments</th>
                <th className="px-4 py-3 font-semibold">Tasks / Activities</th>
                <th className="px-4 py-3 font-semibold text-center">Train Conflicts</th>
                <th className="px-4 py-3 font-semibold text-center">Block Utilization</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 italic">
                    No block plans currently in database. Click &ldquo;Open Block Planner&rdquo; to generate optimal blocks.
                  </td>
                </tr>
              ) : (
                plans.map(plan => {
                  const statusColors = {
                    Recommended: 'bg-blue-50 text-blue-800 border-blue-200',
                    Scheduled: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    'In Progress': 'bg-amber-50 text-amber-800 border-amber-200',
                    Completed: 'bg-slate-100 text-slate-700 border-slate-200',
                    Rejected: 'bg-red-50 text-red-700 border-red-200'
                  }[plan.status] || 'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <tr key={plan.planId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-900">
                        {plan.planId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {plan.section}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {plan.startTime}–{plan.endTime}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {plan.departments.map(dept => (
                            <span
                              key={dept}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                dept === 'Engineering'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : dept === 'S&T'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="truncate max-w-[280px]" title={plan.bundlingDetails?.explanation}>
                          {plan.bundlingDetails?.explanation || `${plan.taskIds.length} maintenance tasks bundled`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                            plan.trainConflicts === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {plan.trainConflicts} {plan.trainConflicts === 1 ? 'conflict' : 'conflicts'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">
                        {plan.utilization}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColors}`}>
                          {plan.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIH Workflow & Department Pipeline Diagram */}
      <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Automatic Block Planning Architecture Flow (SIH26027)
            </h4>
            <p className="text-xs text-slate-500">
              End-to-end data pipeline from railway legacy systems into unified optimization.
            </p>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
            TMS • SMMS • TDMS → Cloud Firestore → AI Engine
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <div className="font-bold text-blue-900 text-[11px]">1. Ingestion</div>
            <div className="text-[10px] text-slate-500 mt-0.5">TMS, SMMS, TDMS</div>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <div className="font-bold text-blue-900 text-[11px]">2. Unified DB</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cloud Firestore</div>
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <div className="font-bold text-blue-900 text-[11px]">3. Priority Scoring</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Safety & Urgency</div>
          </div>
          <div className="p-2.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900">
            <div className="font-bold text-[11px]">4. Multi-Dept</div>
            <div className="text-[10px] text-indigo-700 mt-0.5">Task Bundling</div>
          </div>
          <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
            <div className="font-bold text-[11px]">5. Conflict Check</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Train Timetables</div>
          </div>
          <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-900">
            <div className="font-bold text-[11px]">6. Optimization</div>
            <div className="text-[10px] text-blue-700 mt-0.5">Max Availability</div>
          </div>
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="font-bold text-[11px]">7. Block Plan</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Recommended Slot</div>
          </div>
          <div className="p-2.5 rounded bg-purple-50 border border-purple-200 text-purple-900">
            <div className="font-bold text-[11px]">8. What-If</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Dynamic Simulation</div>
          </div>
        </div>
      </div>
    </div>
  );
}

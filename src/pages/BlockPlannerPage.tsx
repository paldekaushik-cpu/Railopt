import { useState } from 'react';
import { MaintenanceTask, Train, BlockWindow, BlockPlan } from '../types';
import { generateOptimalBlockPlan, OptimizationResult } from '../algorithms/blockOptimization';
import { detectTrainConflicts } from '../algorithms/conflictDetection';
import { firestoreService } from '../firebase/firestoreService';
import {
  CalendarRange,
  Sparkles,
  Train as TrainIcon,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Info
} from 'lucide-react';

interface BlockPlannerPageProps {
  tasks: MaintenanceTask[];
  trains: Train[];
  windows: BlockWindow[];
  plans: BlockPlan[];
  initialSection?: string;
  onRefresh?: () => void;
}

export function BlockPlannerPage({
  tasks,
  trains,
  windows,
  plans,
  initialSection = 'A-B'
}: BlockPlannerPageProps) {
  const [selectedSection, setSelectedSection] = useState<string>(initialSection);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Generation state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  // Time window inspector for manual conflict check
  const [inspectorStart, setInspectorStart] = useState('10:00');
  const [inspectorEnd, setInspectorEnd] = useState('12:00');

  // Filter tasks, trains, and windows for current section
  const sectionTasks = tasks.filter(t => t.section === selectedSection);
  const pendingSectionTasks = sectionTasks.filter(t => t.status === 'Pending' || t.status === 'Bundled');
  const sectionTrains = trains.filter(t => t.section === selectedSection);
  const sectionWindows = windows.filter(w => w.section === selectedSection);
  const existingSectionPlans = plans.filter(p => p.section === selectedSection);

  // Live conflict check on inspected window
  const liveConflictCheck = detectTrainConflicts(selectedSection, inspectorStart, inspectorEnd, sectionTrains);

  // Toggle task selection
  const handleToggleTask = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter(id => id !== taskId));
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    }
  };

  const handleSelectAllTasks = () => {
    if (selectedTaskIds.length === pendingSectionTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(pendingSectionTasks.map(t => t.taskId));
    }
  };

  // Run Optimization
  const handleGenerateOptimalPlan = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);

    try {
      // Execute optimization algorithm
      const result = generateOptimalBlockPlan(tasks, trains, windows, {
        date: selectedDate,
        targetSection: selectedSection,
        selectedTaskIds: selectedTaskIds.length > 0 ? selectedTaskIds : undefined
      });

      // Save generated plan(s) to Firestore
      for (const plan of result.generatedPlans) {
        await firestoreService.saveBlockPlan(plan);
      }

      setOptimizationResult(result);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Primary Optimizer Engine
            </span>
            <span className="text-xs text-slate-500 font-mono">Module SIH26027-CORE</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <span>Automatic Corridor Block Planner</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Synthesizes train timetables, multi-department task urgency, and available line possession windows to generate de-conflicted maintenance schedules.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={handleGenerateOptimalPlan}
          disabled={isOptimizing || pendingSectionTasks.length === 0}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all shrink-0"
        >
          <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : 'text-amber-300'}`} />
          <span>{isOptimizing ? 'Optimizing Corridor Schedule...' : 'Generate Optimal Block Plan'}</span>
        </button>
      </div>

      {/* Control Panel: Section, Date, and Task Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Select Section */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            1. Railway Corridor Section
          </label>
          <select
            value={selectedSection}
            onChange={e => {
              setSelectedSection(e.target.value);
              setSelectedTaskIds([]);
              setOptimizationResult(null);
            }}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
          >
            {['A-B', 'B-C', 'C-D', 'D-E', 'E-F'].map(s => (
              <option key={s} value={s}>
                Corridor Section {s} (Double Line BG, 25kV AC)
              </option>
            ))}
          </select>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Pending Tasks: <strong className="text-slate-800">{pendingSectionTasks.length}</strong></span>
            <span>Trains Today: <strong className="text-slate-800">{sectionTrains.length}</strong></span>
          </div>
        </div>

        {/* Select Date */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            2. Planning Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-2 text-[11px] text-slate-500">
            Timetable source: <span className="font-mono text-slate-700">COA Operational Schedule</span>
          </div>
        </div>

        {/* Task Selection Filter */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                3. Maintenance Tasks
              </label>
              <button
                onClick={handleSelectAllTasks}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                {selectedTaskIds.length === pendingSectionTasks.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {selectedTaskIds.length > 0
                ? `${selectedTaskIds.length} prioritized tasks chosen for block inclusion.`
                : 'Auto-bundling all compatible pending tasks in this section.'}
            </p>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Multi-department bundling active (Engineering, S&T, TRD)
          </div>
        </div>
      </div>

      {/* OPTIMIZATION RESULTS SHOWCASE (If generated) */}
      {optimizationResult && (
        <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white rounded-xl p-6 shadow-lg border border-blue-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-800/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Optimal Schedule Generated
                </span>
                <span className="text-xs text-blue-200 font-mono">Persisted to Firestore</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white mt-1">
                Recommended Coordinated Block for Section {selectedSection}
              </h3>
            </div>
            <button
              onClick={() => setAuditLogOpen(!auditLogOpen)}
              className="text-xs font-semibold text-blue-300 hover:text-white underline flex items-center gap-1 self-start sm:self-auto"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{auditLogOpen ? 'Hide Algorithm Steps' : 'View AI Decision Steps'}</span>
            </button>
          </div>

          {/* Key Bundling Showcase */}
          {optimizationResult.generatedPlans.map(plan => (
            <div key={plan.planId} className="bg-slate-900/90 rounded-lg border border-blue-700/50 p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-600/30 border border-blue-500/50 text-blue-300 flex items-center justify-center font-mono font-bold text-sm">
                    {plan.startTime}
                  </div>
                  <div>
                    <div className="text-xs text-blue-300 font-medium">Recommended Time Window</div>
                    <div className="text-xl font-extrabold text-white tracking-tight">
                      Section {plan.section}: {plan.startTime} – {plan.endTime}
                    </div>
                  </div>
                </div>

                {/* Department Badges */}
                <div className="flex items-center gap-2">
                  <div className="text-right text-xs text-slate-300 mr-1 hidden sm:block">
                    Participating Crews:
                  </div>
                  {plan.departments.map(d => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{d}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Multi-Department Bundling Highlight Banner (As instructed in Prompt #3) */}
              <div className="p-3.5 bg-indigo-950/70 border border-indigo-500/40 rounded-lg flex items-start gap-3">
                <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-indigo-200">
                    AI Multi-Department Task Bundling Activated
                  </div>
                  <p className="text-xs text-indigo-200/90 leading-relaxed">
                    {plan.bundlingDetails?.explanation ||
                      `AI detected ${plan.taskIds.length} compatible maintenance activities and bundled them into one block.`}
                  </p>
                </div>
              </div>

              {/* Performance Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-[11px] text-slate-400">Tasks Bundled</div>
                  <div className="text-lg font-black text-white mt-0.5">{plan.taskIds.length}</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-[11px] text-slate-400">Train Conflicts</div>
                  <div className={`text-lg font-black mt-0.5 ${plan.trainConflicts === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {plan.trainConflicts}
                  </div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-[11px] text-slate-400">Block Utilization</div>
                  <div className="text-lg font-black text-blue-400 mt-0.5">{plan.utilization}%</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-[11px] text-slate-400">Asset Availability Impact</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">{plan.assetAvailabilityImpact}%</div>
                </div>
              </div>

              {/* Tasks Included in this Block */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Bundled Department Tasks Executing in this Block:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {tasks
                    .filter(t => plan.taskIds.includes(t.taskId))
                    .map(t => (
                      <div key={t.taskId} className="p-2.5 bg-slate-800/50 rounded border border-slate-700/60 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="truncate">
                          <div className="font-semibold text-white flex items-center justify-between">
                            <span className="font-mono text-[11px] text-blue-300">{t.taskId}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{t.duration} hrs</span>
                          </div>
                          <div className="text-[11px] text-slate-300 truncate" title={t.taskDescription}>
                            {t.taskDescription}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}

          {/* AI Decision Audit Log */}
          {auditLogOpen && (
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div className="font-bold text-blue-400 pb-1 mb-2 border-b border-slate-800">
                Optimization Trace & Decision Steps (Drop-in Google OR-Tools Compatible):
              </div>
              {optimizationResult.auditTrail.map((log, i) => (
                <div key={i} className="leading-relaxed flex items-start gap-2">
                  <span className="text-blue-500">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visual Timeline Comparison (Train Schedules vs Available Windows vs Tasks) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>24-Hour Corridor Timeline (Section {selectedSection})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Visual alignment of train movements, pre-identified maintenance windows, and planned blocks.
          </p>
        </div>

        {/* Timeline Visual Track */}
        <div className="space-y-4">
          {/* Hour Ruler */}
          <div className="relative border-b border-slate-200 pb-2">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>06:00</span>
              <span>08:00</span>
              <span>10:00</span>
              <span>12:00</span>
              <span>14:00</span>
              <span>16:00</span>
              <span>18:00</span>
              <span>20:00</span>
              <span>22:00</span>
            </div>
          </div>

          {/* 1. Train Movements Row */}
          <div>
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <TrainIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Train Movements ({sectionTrains.length} scheduled)</span>
            </div>
            <div className="relative h-12 bg-slate-50 rounded-md border border-slate-200 p-1 flex items-center overflow-x-auto">
              {sectionTrains.map(train => {
                const priorityColors = {
                  1: 'bg-red-600 text-white border-red-700',
                  2: 'bg-blue-600 text-white border-blue-700',
                  3: 'bg-emerald-600 text-white border-emerald-700',
                  4: 'bg-slate-700 text-white border-slate-800'
                }[train.priority] || 'bg-slate-600 text-white';

                return (
                  <div
                    key={train.trainId}
                    className={`shrink-0 mx-1 px-2 py-1 rounded text-[10px] font-bold border shadow-2xs flex items-center gap-1 ${priorityColors}`}
                    title={`${train.trainName} (${train.trainId}) | ${train.arrivalTime} - ${train.departureTime} | Priority ${train.priority}`}
                  >
                    <span>{train.trainId}</span>
                    <span className="opacity-75 text-[9px] font-normal font-mono">({train.departureTime})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Available Corridor Windows Row */}
          <div>
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pre-Analyzed Low-Traffic Windows ({sectionWindows.length} potential slots)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sectionWindows.map(win => (
                <div
                  key={win.blockId}
                  className="p-3 bg-emerald-50/70 rounded-md border border-emerald-200 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-950">
                      {win.startTime} – {win.endTime}
                    </span>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Duration: {win.durationHours} hrs
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setInspectorStart(win.startTime);
                      setInspectorEnd(win.endTime);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[11px] font-semibold transition-colors"
                  >
                    Inspect Slot
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Existing Scheduled Blocks Row */}
          {existingSectionPlans.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                <CalendarRange className="w-3.5 h-3.5 text-blue-600" />
                <span>Active / Saved Block Plans in Section {selectedSection}</span>
              </div>
              <div className="space-y-2">
                {existingSectionPlans.map(plan => (
                  <div
                    key={plan.planId}
                    className="p-3 bg-blue-50/70 rounded-md border border-blue-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-900 text-xs">{plan.planId}</span>
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-blue-100">
                        {plan.startTime} – {plan.endTime}
                      </span>
                      <div className="flex gap-1">
                        {plan.departments.map(d => (
                          <span key={d} className="text-[10px] bg-blue-200/70 text-blue-900 font-bold px-1.5 py-0.2 rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-800">
                      {plan.taskIds.length} tasks bundled • {plan.utilization}% utilization
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Conflict Inspector Widget */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Corridor Block Conflict Inspector</span>
            </h3>
            <p className="text-xs text-slate-500">
              Test any arbitrary time window to verify simulated timetable conflict severity in Section {selectedSection}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-700">Start Time:</label>
            <input
              type="time"
              value={inspectorStart}
              onChange={e => setInspectorStart(e.target.value)}
              className="p-1.5 border border-slate-300 rounded font-mono font-medium text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-700">End Time:</label>
            <input
              type="time"
              value={inspectorEnd}
              onChange={e => setInspectorEnd(e.target.value)}
              className="p-1.5 border border-slate-300 rounded font-mono font-medium text-slate-800"
            />
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Status:
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                liveConflictCheck.hasConflict
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {liveConflictCheck.hasConflict
                ? `${liveConflictCheck.totalConflicts} Train Overlap(s)`
                : 'Clear Window (0 Conflicts)'}
            </span>
          </div>
        </div>

        {liveConflictCheck.hasConflict && (
          <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-xs space-y-1.5">
            <div className="font-bold text-amber-950 flex items-center gap-1.5">
              <TrainIcon className="w-3.5 h-3.5 text-amber-700" />
              <span>Overlapping Train Details:</span>
            </div>
            {liveConflictCheck.conflictingTrains.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] text-amber-900">
                <span className="font-medium">
                  {c.train.trainName} ({c.train.trainId}) – Transit: {c.overlapTime}
                </span>
                <span className="italic text-amber-800">{c.resolutionSuggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Tasks in this Section Checklist */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Pending Tasks in Section {selectedSection} ({pendingSectionTasks.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select specific tasks or let RailOpt AI automatically bundle all compatible activities.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {pendingSectionTasks.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs italic">
              All tasks in Section {selectedSection} have already been bundled or scheduled!
            </div>
          ) : (
            pendingSectionTasks.map(task => {
              const isSelected = selectedTaskIds.includes(task.taskId);
              return (
                <div
                  key={task.taskId}
                  onClick={() => handleToggleTask(task.taskId)}
                  className={`p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-900">{task.taskId}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {task.department}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                          {task.priority} Priority
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 mt-0.5">
                        {task.taskDescription}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-mono text-slate-700 font-semibold">{task.duration} hrs</div>
                    <div className="text-[11px] text-slate-500">Due: {task.dueDate}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { MaintenanceTask, Train, BlockWindow, BlockPlan, BlockPlanStatus } from '../types';
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
  Info,
  ThumbsUp,
  Sliders,
  XCircle,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  UserCheck
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Expanded "Why this plan?" states
  const [expandedWhyPlanIds, setExpandedWhyPlanIds] = useState<Record<string, boolean>>({});

  // Modify modal state
  const [modifyingPlan, setModifyingPlan] = useState<BlockPlan | null>(null);
  const [modifyStartTime, setModifyStartTime] = useState('');
  const [modifyEndTime, setModifyEndTime] = useState('');
  const [modifyReason, setModifyReason] = useState('');

  // Reject modal state
  const [rejectingPlan, setRejectingPlan] = useState<BlockPlan | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Time window inspector for manual conflict check
  const [inspectorStart, setInspectorStart] = useState('10:00');
  const [inspectorEnd, setInspectorEnd] = useState('12:00');

  // Filter tasks, trains, and windows for current section
  const sectionTasks = tasks.filter(t => t.section === selectedSection);
  const pendingSectionTasks = sectionTasks.filter(t => t.status === 'Pending' || t.status === 'Bundled');
  const sectionTrains = trains.filter(t => t.section === selectedSection);
  const sectionWindows = windows.filter(w => w.section === selectedSection);
  const sectionPlans = plans.filter(p => p.section === selectedSection);

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

  const toggleWhyThisPlan = (planId: string) => {
    setExpandedWhyPlanIds(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  // Run Optimization
  const handleGenerateOptimalPlan = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);

    try {
      const result = generateOptimalBlockPlan(tasks, trains, windows, {
        date: selectedDate,
        targetSection: selectedSection,
        selectedTaskIds: selectedTaskIds.length > 0 ? selectedTaskIds : undefined
      });

      for (const plan of result.generatedPlans) {
        await firestoreService.saveBlockPlan(plan);
      }

      setOptimizationResult(result);
      setToastMessage(`Generated ${result.generatedPlans.length} de-conflicted block plan(s) for Section ${selectedSection}.`);
    } catch (err) {
      console.error('Optimization error:', err);
      setToastMessage('Error running optimization algorithm.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Approval Workflow: Approve
  const handleApprovePlan = async (plan: BlockPlan) => {
    try {
      await firestoreService.approveBlockPlan(plan.planId, 'K. S. Sharma (Sr. DOM)');
      setToastMessage(`Plan ${plan.planId} APPROVED by Sr. Divisional Operations Manager.`);
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  // Approval Workflow: Submit Modification
  const handleSubmitModification = async () => {
    if (!modifyingPlan) return;
    try {
      await firestoreService.modifyBlockPlan(
        modifyingPlan.planId,
        {
          startTime: modifyStartTime || modifyingPlan.startTime,
          endTime: modifyEndTime || modifyingPlan.endTime
        },
        modifyReason || 'Manual adjustment by Controller',
        'K. S. Sharma (Sr. DOM)'
      );
      setModifyingPlan(null);
      setToastMessage(`Plan ${modifyingPlan.planId} MODIFIED and saved.`);
    } catch (err) {
      console.error('Modify error:', err);
    }
  };

  // Approval Workflow: Submit Rejection
  const handleSubmitRejection = async () => {
    if (!rejectingPlan) return;
    try {
      await firestoreService.rejectBlockPlan(
        rejectingPlan.planId,
        rejectReason || 'Section traffic saturation',
        'K. S. Sharma (Sr. DOM)'
      );
      setRejectingPlan(null);
      setToastMessage(`Plan ${rejectingPlan.planId} REJECTED. Tasks returned to maintenance backlog.`);
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  // Export Plan (Official Indian Railways Format)
  const handleExportPlan = (plan: BlockPlan) => {
    const lines = [
      '=============================================================',
      'INDIAN RAILWAYS - DIVISIONAL OPERATING CORRIDOR POSSESSION ORDER',
      '=============================================================',
      `Plan Reference ID: ${plan.planId}`,
      `Corridor Section: Section ${plan.section}`,
      `Date of Block: ${plan.date}`,
      `Block Window: ${plan.startTime} Hrs to ${plan.endTime} Hrs`,
      `Status: ${plan.status}`,
      plan.approvedBy ? `Approved By: ${plan.approvedBy} (${plan.approvalTimestamp || 'Verified'})` : 'Approval: Pending Sr. DOM Sign-off',
      '-------------------------------------------------------------',
      `Participating Departments: ${plan.departments.join(', ')}`,
      `Block Utilization: ${plan.utilization}%`,
      `Asset Availability Impact: ${plan.assetAvailabilityImpact}%`,
      `Train Conflicts: ${plan.trainConflicts}`,
      '-------------------------------------------------------------',
      'BUNDLED MAINTENANCE TASKS INCLUDED:',
      ...plan.taskIds.map((tid, idx) => {
        const t = tasks.find(item => item.taskId === tid);
        return `  ${idx + 1}. [${tid}] ${t?.department || 'Dept'}: ${t?.taskDescription || 'Maintenance'} (${t?.duration || 2}h) - Asset: ${t?.assetId || 'Asset'}`;
      }),
      '-------------------------------------------------------------',
      'EXPLAINABLE AI RATIONALE ("WHY THIS PLAN?"):',
      `  • Priority: ${plan.whyThisPlan?.priorityRationale || 'High-risk assets prioritized'}`,
      `  • Window Slot: ${plan.whyThisPlan?.windowRationale || 'Minimum passenger train disruption'}`,
      `  • Multi-Dept Bundling: ${plan.whyThisPlan?.compatibleBundlingRationale || 'Safe concurrent track & catenary possession'}`,
      `  • Conflict Check: ${plan.whyThisPlan?.conflictCheckRationale || 'Timetable clearance confirmed'}`,
      '============================================================='
    ];

    const textContent = lines.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IR_BLOCK_PLAN_${plan.planId}_${plan.section}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage(`Exported Block Plan ${plan.planId} in official Indian Railways format.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              PRD Section 18 & 22: AI Block Planner & Approval
            </span>
            <span className="text-xs text-slate-500 font-mono">Module SIH26027-CORE</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <span>Automatic Corridor Block Planning & Approval Workflow</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Synthesizes train timetables, multi-department task urgency, and available line possession windows to generate de-conflicted maintenance schedules with Human-in-the-Loop approval.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={handleGenerateOptimalPlan}
          disabled={isOptimizing || pendingSectionTasks.length === 0}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : 'text-amber-300'}`} />
          <span>{isOptimizing ? 'Optimizing Corridor Schedule...' : 'Generate Optimal Block Plan'}</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

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
            {['A-B', 'B-C', 'C-D', 'D-E', 'E-F', 'F-G', 'G-H', 'H-I', 'I-J'].map(s => (
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
                3. Maintenance Tasks ({selectedTaskIds.length}/{pendingSectionTasks.length})
              </label>
              <button
                onClick={handleSelectAllTasks}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
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

      {/* ACTIVE & GENERATED BLOCK PLANS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-blue-600" />
            <span>Coordinated Block Plans for Section {selectedSection} ({sectionPlans.length})</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Status Transitions: AI Recommended → Approved / Modified / Rejected</span>
        </div>

        {sectionPlans.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs">
            <CalendarRange className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">No block plans created for Section {selectedSection} yet.</div>
            <p className="text-slate-400 max-w-sm mx-auto mt-1">
              Select maintenance tasks and click <strong>"Generate Optimal Block Plan"</strong> above to run AI bundling and conflict de-confliction.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sectionPlans.map(plan => {
              const isWhyExpanded = expandedWhyPlanIds[plan.planId] ?? true;
              const planTasks = tasks.filter(t => plan.taskIds.includes(t.taskId));

              return (
                <div
                  key={plan.planId}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                >
                  {/* Card Top Header */}
                  <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-mono font-black text-sm">
                        {plan.planId}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-300 font-bold">
                            Section {plan.section} • {plan.date}
                          </span>

                          {/* Status Badge (PRD Section 22) */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border flex items-center gap-1 ${
                              plan.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : plan.status === 'MODIFIED'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : plan.status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            {plan.status === 'APPROVED' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : plan.status === 'MODIFIED' ? (
                              <Sliders className="w-3 h-3 text-amber-400" />
                            ) : plan.status === 'REJECTED' ? (
                              <XCircle className="w-3 h-3 text-red-400" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-purple-400" />
                            )}
                            <span>{plan.status || 'AI RECOMMENDED'}</span>
                          </span>
                        </div>

                        <div className="text-lg font-black text-white tracking-tight mt-0.5">
                          Window: {plan.startTime} – {plan.endTime} Hrs
                        </div>
                      </div>
                    </div>

                    {/* Participating Departments Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {plan.departments.map(d => (
                        <span
                          key={d}
                          className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold"
                        >
                          {d}
                        </span>
                      ))}

                      {/* Export Plan Button */}
                      <button
                        onClick={() => handleExportPlan(plan)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                        title="Export Official IR Possession Order"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Order</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Approval Notice if already approved */}
                    {plan.status === 'APPROVED' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span>
                            <strong>Officially Stamped:</strong> Approved by {plan.approvedBy || 'Sr. DOM'} on {plan.approvalTimestamp || plan.generatedAt}. Line possession order issued to Operating Control.
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          REF: IR-POSS-{plan.planId}
                        </span>
                      </div>
                    )}

                    {/* Rejection notice if rejected */}
                    {plan.status === 'REJECTED' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>
                          <strong>Plan Rejected by Controller:</strong> {plan.rejectionReason || 'High priority train movement conflict.'}
                        </span>
                      </div>
                    )}

                    {/* Multi-Department Bundling Highlight Banner */}
                    <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-3">
                      <Layers className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-xs text-indigo-950">
                        <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                          <span>Multi-Department Coordinated Bundling:</span>
                          <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded font-mono">
                            {plan.taskIds.length} tasks bundled
                          </span>
                        </div>
                        <p className="text-indigo-800 leading-relaxed">
                          {plan.bundlingDetails?.explanation ||
                            `Combined maintenance work for Engineering, S&T, and TRD into a single unified corridor possession.`}
                        </p>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Bundled Tasks</div>
                        <div className="text-base font-extrabold text-slate-900 mt-0.5">{plan.taskIds.length}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Train Overlaps</div>
                        <div className={`text-base font-extrabold mt-0.5 ${plan.trainConflicts === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {plan.trainConflicts === 0 ? '0 (Clear)' : `${plan.trainConflicts} train(s)`}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Block Utilization</div>
                        <div className="text-base font-extrabold text-blue-600 mt-0.5">{plan.utilization}%</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Asset Availability</div>
                        <div className="text-base font-extrabold text-emerald-600 mt-0.5">{plan.assetAvailabilityImpact}%</div>
                      </div>
                    </div>

                    {/* Bundled Tasks List in this Plan */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700">
                        Maintenance Activities Under this Block:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {planTasks.map(t => (
                          <div
                            key={t.taskId}
                            className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-start gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="truncate w-full">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-blue-900 text-[11px]">{t.taskId}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                                  {t.department}
                                </span>
                              </div>
                              <div className="text-slate-800 font-medium text-[11px] truncate mt-0.5" title={t.taskDescription}>
                                {t.taskDescription}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                                <span>Asset: {t.assetId}</span>
                                <span>Duration: {t.duration}h</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4-Pillar "Why this plan?" Explainable AI Card (PRD Section 21 & Prompt #3) */}
                    <div className="border border-blue-100 rounded-lg bg-blue-50/50 overflow-hidden">
                      <button
                        onClick={() => toggleWhyThisPlan(plan.planId)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-blue-950 hover:bg-blue-100/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Explainable AI Rationale: "Why this plan?"</span>
                        </div>
                        {isWhyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isWhyExpanded && (
                        <div className="p-4 pt-2 border-t border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* 1. Priority Rationale */}
                          <div className="p-3 bg-white rounded border border-blue-200 space-y-1">
                            <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                              <span>1. Priority Score Rationale</span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {plan.whyThisPlan?.priorityRationale ||
                                'Bundles highest-scoring maintenance assets in this section based on safety risk, urgency, and overdue threshold.'}
                            </p>
                          </div>

                          {/* 2. Window Rationale */}
                          <div className="p-3 bg-white rounded border border-blue-200 space-y-1">
                            <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                              <span>2. Line Possession Slot Selection</span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {plan.whyThisPlan?.windowRationale ||
                                `Window ${plan.startTime}–${plan.endTime} corresponds to minimal passenger train traffic density along Section ${plan.section}.`}
                            </p>
                          </div>

                          {/* 3. Compatible Bundling Rationale */}
                          <div className="p-3 bg-white rounded border border-blue-200 space-y-1">
                            <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block"></span>
                              <span>3. Cross-Department Co-Possession</span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {plan.whyThisPlan?.compatibleBundlingRationale ||
                                'Synchronizes Engineering track teams and TRD catenary power isolation so both crews work under one block possession.'}
                            </p>
                          </div>

                          {/* 4. Conflict Check Rationale */}
                          <div className="p-3 bg-white rounded border border-blue-200 space-y-1">
                            <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block"></span>
                              <span>4. Timetable Conflict Verification</span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {plan.whyThisPlan?.conflictCheckRationale ||
                                'Zero passenger conflicts: High-speed trains cleared prior to block inception or regulated via alternate line.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Approval Workflow Action Bar (PRD Section 22) */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500 font-medium">
                        Human-in-the-Loop Authority: Sr. Divisional Operations Manager (DOM)
                      </div>

                      <div className="flex items-center gap-2">
                        {/* If AI Recommended or Modified, allow Approve, Modify, Reject */}
                        {plan.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprovePlan(plan)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Approve Plan</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setModifyingPlan(plan);
                            setModifyStartTime(plan.startTime);
                            setModifyEndTime(plan.endTime);
                            setModifyReason('');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Modify Window</span>
                        </button>

                        {plan.status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setRejectingPlan(plan);
                              setRejectReason('');
                            }}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-bold flex items-center gap-1.5 border border-red-200 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Inspect Slot
                  </button>
                </div>
              ))}
            </div>
          </div>
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
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Overlapping Train Movements Detected:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-900 text-[11px]">
              {liveConflictCheck.conflictingTrains.map((c, i) => (
                <li key={i}>
                  <strong>{c.train.trainName}</strong> ({c.train.trainId}, Priority {c.train.priority}): Transit {c.train.arrivalTime}–{c.train.departureTime}. Overlap: {c.overlapTime} ({c.severity} severity). Suggestion: {c.resolutionSuggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modify Modal */}
      {modifyingPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Modify Block Window: {modifyingPlan.planId}</span>
              </h3>
              <button onClick={() => setModifyingPlan(null)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={modifyStartTime}
                    onChange={e => setModifyStartTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={modifyEndTime}
                    onChange={e => setModifyEndTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Reason for Modification</label>
                <textarea
                  value={modifyReason}
                  onChange={e => setModifyReason(e.target.value)}
                  placeholder="e.g. Shifted 30 mins to accommodate late-running Goods BOXN-12"
                  rows={3}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModifyingPlan(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitModification}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
              >
                Save as MODIFIED
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-bold text-red-900 text-sm flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Reject Block Plan: {rejectingPlan.planId}</span>
              </h3>
              <button onClick={() => setRejectingPlan(null)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600">
                Rejecting this block plan will transition its status to <strong>REJECTED</strong> and return all bundled maintenance tasks back to the Pending backlog for future optimization.
              </p>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Reason for Rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. VIP train movement conflict or crew shortage"
                  rows={3}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectingPlan(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRejection}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

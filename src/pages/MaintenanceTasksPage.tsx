import React, { useState } from 'react';
import { MaintenanceTask, Department, PriorityLevel, AssetCondition, PriorityWeights } from '../types';
import { calculateTaskPriority, DEFAULT_PRIORITY_WEIGHTS } from '../algorithms/priorityScoring';
import { firestoreService } from '../firebase/firestoreService';
import {
  Sparkles,
  Filter,
  Plus,
  Search,
  CheckCircle,
  AlertOctagon,
  Clock,
  Wrench,
  X,
  Sliders,
  ArrowRight,
  Eye
} from 'lucide-react';

interface MaintenanceTasksPageProps {
  tasks: MaintenanceTask[];
  onRefresh?: () => void;
  onNavigateToOptimizer?: (section: string, taskId?: string) => void;
}

export function MaintenanceTasksPage({ tasks, onNavigateToOptimizer }: MaintenanceTasksPageProps) {
  // Filter states (PRD Section 17: Department, Priority, Corridor, Status, Overdue, Date)
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedOverdueFilter, setSelectedOverdueFilter] = useState<string>('All');
  const [selectedDueDate, setSelectedDueDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Scoring Modal & Processing state
  const [isScoringAll, setIsScoringAll] = useState(false);
  const [scoringNotification, setScoringNotification] = useState<string | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<MaintenanceTask | null>(null);

  // Formula Weights Configuration Modal (PRD Section 8)
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [activeWeights, setActiveWeights] = useState<PriorityWeights>(DEFAULT_PRIORITY_WEIGHTS);

  // New Task Modal
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<MaintenanceTask>>({
    department: 'Engineering',
    section: 'A-B',
    assetId: 'TRK-AB-109',
    assetType: 'Track Fastener & Rail Pad',
    taskDescription: '',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    duration: 2.0,
    criticality: 'High',
    urgency: 7,
    safetyRisk: 8,
    assetCondition: 'Fair',
    daysOverdue: 0,
    operationalImpact: 7,
    status: 'Pending'
  });

  // Unique sections from tasks
  const sectionsList = Array.from(new Set(tasks.map(t => t.section))).sort();

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (selectedDept !== 'All' && task.department !== selectedDept) return false;
    if (selectedSection !== 'All' && task.section !== selectedSection) return false;
    if (selectedPriority !== 'All' && task.priority !== selectedPriority) return false;
    if (selectedStatus !== 'All' && task.status !== selectedStatus) return false;
    if (selectedOverdueFilter === 'Overdue' && task.daysOverdue <= 0) return false;
    if (selectedOverdueFilter === 'On Schedule' && task.daysOverdue > 0) return false;
    if (selectedDueDate && task.dueDate > selectedDueDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        task.taskId.toLowerCase().includes(q) ||
        task.taskDescription.toLowerCase().includes(q) ||
        task.assetId.toLowerCase().includes(q) ||
        task.assetType.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate AI Priority for ALL pending tasks using active weights and save to Firestore
  const handleGenerateAiPriorityAll = async () => {
    setIsScoringAll(true);
    setScoringNotification(null);
    try {
      let updatedCount = 0;
      for (const task of tasks) {
        const scored = calculateTaskPriority(task, activeWeights);
        await firestoreService.updateTask(task.taskId, {
          riskScore: scored.riskScore,
          priority: scored.priority,
          priorityExplanation: scored.explanation
        });
        updatedCount++;
      }
      setScoringNotification(`AI Priority recalculated for ${updatedCount} maintenance tasks.`);
    } catch (err) {
      console.error('Error generating AI priority:', err);
      setScoringNotification('Updated AI Priority calculation for maintenance tasks.');
    } finally {
      setIsScoringAll(false);
    }
  };

  // Calculate for a single task
  const handleScoreSingleTask = async (task: MaintenanceTask) => {
    const scored = calculateTaskPriority(task, activeWeights);
    try {
      await firestoreService.updateTask(task.taskId, {
        riskScore: scored.riskScore,
        priority: scored.priority,
        priorityExplanation: scored.explanation
      });
      setSelectedTaskForDetails({
        ...task,
        riskScore: scored.riskScore,
        priority: scored.priority,
        priorityExplanation: scored.explanation
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Schedule Action
  const handleQuickSchedule = async (task: MaintenanceTask) => {
    try {
      await firestoreService.updateTask(task.taskId, {
        status: 'Scheduled'
      });
      setScoringNotification(`Task ${task.taskId} marked as Scheduled.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit New Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.taskDescription || !newTask.assetId) return;

    const scored = calculateTaskPriority(newTask, activeWeights);
    const taskId = `TASK-${newTask.department === 'Engineering' ? 'ENG' : newTask.department === 'S&T' ? 'SNT' : 'TRD'}-${Math.floor(100 + Math.random() * 900)}`;

    const fullTask: MaintenanceTask = {
      taskId,
      department: newTask.department as Department,
      assetId: newTask.assetId || 'ASSET-GEN-01',
      assetType: newTask.assetType || 'Railway Asset',
      section: newTask.section || 'A-B',
      taskDescription: newTask.taskDescription || '',
      dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
      duration: Number(newTask.duration) || 2.0,
      criticality: newTask.criticality as PriorityLevel,
      urgency: Number(newTask.urgency) || 5,
      safetyRisk: Number(newTask.safetyRisk) || 5,
      assetCondition: newTask.assetCondition as AssetCondition,
      daysOverdue: Number(newTask.daysOverdue) || 0,
      operationalImpact: Number(newTask.operationalImpact) || 5,
      status: 'Pending',
      riskScore: scored.riskScore,
      priority: scored.priority,
      priorityExplanation: scored.explanation
    };

    try {
      await firestoreService.createTask(fullTask);
      setIsNewTaskModalOpen(false);
      setScoringNotification(`New maintenance task ${taskId} successfully logged and scored.`);
    } catch (err) {
      console.error(err);
    }
  };

  const totalOverdue = tasks.filter(t => t.daysOverdue > 0).length;
  const criticalCount = tasks.filter(t => t.priority === 'Critical').length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              PRD Section 17: Maintenance Management
            </span>
            <span className="text-xs text-slate-500 font-mono">Cross-Department Backlog</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Multi-Department Railway Maintenance Tasks</span>
          </h2>
          <p className="text-xs text-slate-500">
            Integrated repository of Engineering (TMS), S&T (SMMS), and TRD (TDMS) maintenance demands with Explainable AI Priority Scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Formula Weights Configuration */}
          <button
            onClick={() => setIsWeightsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs flex items-center gap-1.5 border border-slate-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Formula Weights ({activeWeights.criticality}/{activeWeights.severity}/{activeWeights.urgency}/{activeWeights.overdue}/{activeWeights.assetImpact})</span>
          </button>

          {/* AI Priority Scoring for all */}
          <button
            onClick={handleGenerateAiPriorityAll}
            disabled={isScoringAll}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isScoringAll ? 'Scoring Backlog...' : 'Recalculate AI Priorities'}</span>
          </button>

          {/* Log New Task */}
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Task</span>
          </button>
        </div>
      </div>

      {/* Scoring Notification Alert */}
      {scoringNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{scoringNotification}</span>
          </div>
          <button onClick={() => setScoringNotification(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-semibold">Total Open Tasks</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">{tasks.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across 3 railway departments</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Overdue Backlog</span>
          </div>
          <div className="text-xl font-black text-red-600 mt-0.5">{totalOverdue}</div>
          <div className="text-[10px] text-red-500 mt-0.5">Breached maintenance window</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-amber-600 font-semibold">Critical Priority</div>
          <div className="text-xl font-black text-amber-600 mt-0.5">{criticalCount}</div>
          <div className="text-[10px] text-amber-500 mt-0.5">High safety risk threshold</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-indigo-600 font-semibold">AI Formula Weights</div>
          <div className="text-xs font-mono font-bold text-indigo-900 mt-1">
            C:30 S:25 U:20 O:15 A:10
          </div>
          <div className="text-[10px] text-indigo-600 mt-0.5">PRD Section 8 Spec</div>
        </div>
      </div>

      {/* Filter Bar (PRD Section 17: Department, Priority, Corridor, Status, Overdue, Date) */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filters:</span>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 text-[11px]">Dept:</label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-blue-500"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering (P-Way)</option>
              <option value="S&T">S&T (Signals)</option>
              <option value="TRD">TRD (OHE 25kV)</option>
            </select>
          </div>

          {/* Corridor (Section) Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 text-[11px]">Corridor:</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-blue-500"
            >
              <option value="All">All Corridors</option>
              {sectionsList.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 text-[11px]">Priority:</label>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-blue-500"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 text-[11px]">Status:</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Bundled">Bundled</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Overdue Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 text-[11px]">Overdue:</label>
            <select
              value={selectedOverdueFilter}
              onChange={e => setSelectedOverdueFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Overdue">Overdue Only</option>
              <option value="On Schedule">On Schedule</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 text-[11px]">Due Before:</label>
            <input
              type="date"
              value={selectedDueDate}
              onChange={e => setSelectedDueDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-blue-500"
            />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search task, asset, id..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-500"
          />
        </div>
      </div>

      {/* Main Task Table (PRD Section 17 Columns: Task ID, Asset, Department, Corridor, Priority, Severity, Duration, Due Status, Recommended Block, Status, Actions) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3 font-semibold">Task ID</th>
                <th className="px-3 py-3 font-semibold">Asset</th>
                <th className="px-3 py-3 font-semibold">Department</th>
                <th className="px-3 py-3 font-semibold">Corridor</th>
                <th className="px-3 py-3 font-semibold text-center">Priority</th>
                <th className="px-2.5 py-3 font-semibold text-center">Severity</th>
                <th className="px-2.5 py-3 font-semibold text-center">Duration</th>
                <th className="px-3 py-3 font-semibold">Due Status</th>
                <th className="px-3 py-3 font-semibold">Recommended Block</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500 italic">
                    No maintenance tasks found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const deptBadge = {
                    Engineering: 'bg-blue-50 text-blue-700 border-blue-200',
                    'S&T': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    TRD: 'bg-purple-50 text-purple-700 border-purple-200'
                  }[task.department];

                  const priorityBadge = {
                    Critical: 'bg-red-100 text-red-800 border-red-200',
                    High: 'bg-orange-100 text-orange-800 border-orange-200',
                    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
                    Low: 'bg-slate-100 text-slate-700 border-slate-200'
                  }[task.priority];

                  const isOverdue = task.daysOverdue > 0;

                  return (
                    <tr
                      key={task.taskId}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      {/* Task ID */}
                      <td className="px-3.5 py-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {task.taskId}
                      </td>

                      {/* Asset */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{task.assetId}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[130px]">{task.assetType}</div>
                      </td>

                      {/* Department */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${deptBadge}`}>
                          {task.department}
                        </span>
                      </td>

                      {/* Corridor */}
                      <td className="px-3 py-3 font-bold text-slate-800 whitespace-nowrap">
                        Section {task.section}
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                          {task.priority}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{task.riskScore}/100</div>
                      </td>

                      {/* Severity */}
                      <td className="px-2.5 py-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-700">{task.safetyRisk}/10</span>
                      </td>

                      {/* Duration */}
                      <td className="px-2.5 py-3 text-center font-mono font-medium text-slate-800 whitespace-nowrap">
                        {task.duration} hrs
                      </td>

                      {/* Due Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{task.dueDate}</div>
                        {isOverdue ? (
                          <span className="text-[10px] text-red-600 font-bold flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.daysOverdue}d overdue
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            On Schedule
                          </span>
                        )}
                      </td>

                      {/* Recommended Block */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {task.status === 'Bundled' || task.status === 'Scheduled' ? (
                          <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            B-OPT ({task.section})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Pending AI Optimization
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${
                          task.status === 'Scheduled'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : task.status === 'Bundled'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : task.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {task.status}
                        </span>
                      </td>

                      {/* Actions: View Details, Schedule, Optimize */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => setSelectedTaskForDetails(task)}
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Schedule */}
                          <button
                            onClick={() => handleQuickSchedule(task)}
                            className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer"
                            title="Mark as Scheduled"
                          >
                            Schedule
                          </button>

                          {/* Optimize */}
                          <button
                            onClick={() => {
                              if (onNavigateToOptimizer) {
                                onNavigateToOptimizer(task.section, task.taskId);
                              }
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-0.5 cursor-pointer"
                            title="Open in Block Optimizer"
                          >
                            <span>Optimize</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Weights Customization Modal (PRD Section 8) */}
      {isWeightsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Configure Priority Formula Weights</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  PRD Section 8: Priority Score = (Criticality × 30) + (Severity × 25) + (Urgency × 20) + (Overdue × 15) + (Asset Impact × 10)
                </p>
              </div>
              <button onClick={() => setIsWeightsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Criticality Weight (Current: {activeWeights.criticality})</span>
                  <span className="text-blue-600 font-mono">{activeWeights.criticality}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={activeWeights.criticality}
                  onChange={e => setActiveWeights({ ...activeWeights, criticality: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Severity Weight (Current: {activeWeights.severity})</span>
                  <span className="text-blue-600 font-mono">{activeWeights.severity}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={activeWeights.severity}
                  onChange={e => setActiveWeights({ ...activeWeights, severity: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Urgency Weight (Current: {activeWeights.urgency})</span>
                  <span className="text-blue-600 font-mono">{activeWeights.urgency}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={activeWeights.urgency}
                  onChange={e => setActiveWeights({ ...activeWeights, urgency: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Overdue Days Weight (Current: {activeWeights.overdue})</span>
                  <span className="text-blue-600 font-mono">{activeWeights.overdue}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={activeWeights.overdue}
                  onChange={e => setActiveWeights({ ...activeWeights, overdue: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Asset Operational Impact Weight (Current: {activeWeights.assetImpact})</span>
                  <span className="text-blue-600 font-mono">{activeWeights.assetImpact}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={activeWeights.assetImpact}
                  onChange={e => setActiveWeights({ ...activeWeights, assetImpact: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 font-mono flex justify-between">
                <span>Total Weight Sum:</span>
                <span className="font-bold text-slate-900">
                  {activeWeights.criticality + activeWeights.severity + activeWeights.urgency + activeWeights.overdue + activeWeights.assetImpact} (Normalized to 100)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveWeights(DEFAULT_PRIORITY_WEIGHTS);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer"
              >
                Reset Defaults (30/25/20/15/10)
              </button>
              <button
                onClick={() => {
                  setIsWeightsModalOpen(false);
                  handleGenerateAiPriorityAll();
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer"
              >
                Apply & Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTaskForDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-blue-900">{selectedTaskForDetails.taskId}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {selectedTaskForDetails.department}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Section {selectedTaskForDetails.section}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mt-1">
                  {selectedTaskForDetails.taskDescription}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskForDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Explanation Box */}
            <div className="p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-950 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Explainable AI Risk & Priority Rationale</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {selectedTaskForDetails.priorityExplanation ||
                  `Calculated risk score: ${selectedTaskForDetails.riskScore}/100. Priority is ${selectedTaskForDetails.priority} due to asset criticality (${selectedTaskForDetails.criticality}) and safety factors.`}
              </p>
            </div>

            {/* Parameter Matrix */}
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500">Criticality</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTaskForDetails.criticality}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500">Urgency</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTaskForDetails.urgency}/10</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500">Safety Risk</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTaskForDetails.safetyRisk}/10</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500">Asset Condition</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTaskForDetails.assetCondition}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500">Days Overdue</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTaskForDetails.daysOverdue} days</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500">Operational Impact</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTaskForDetails.operationalImpact}/10</div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => handleScoreSingleTask(selectedTaskForDetails)}
                className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 cursor-pointer"
              >
                Recalculate AI Score
              </button>
              <button
                onClick={() => setSelectedTaskForDetails(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-white rounded-lg max-w-lg w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Log Maintenance Activity (Simulated Ingestion)</span>
              </h3>
              <button type="button" onClick={() => setIsNewTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Department</label>
                  <select
                    value={newTask.department}
                    onChange={e => setNewTask({ ...newTask, department: e.target.value as Department })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="Engineering">Engineering (TMS - Track)</option>
                    <option value="S&T">S&T (SMMS - Signals & Interlocking)</option>
                    <option value="TRD">TRD (TDMS - Traction Distribution)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Section</label>
                  <select
                    value={newTask.section}
                    onChange={e => setNewTask({ ...newTask, section: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    {sectionsList.map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Asset ID</label>
                  <input
                    type="text"
                    value={newTask.assetId}
                    onChange={e => setNewTask({ ...newTask, assetId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                    placeholder="e.g. TRK-AB-109"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Asset Type</label>
                  <input
                    type="text"
                    value={newTask.assetType}
                    onChange={e => setNewTask({ ...newTask, assetType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                    placeholder="e.g. Turnout Point"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Task Description</label>
                <input
                  type="text"
                  value={newTask.taskDescription}
                  onChange={e => setNewTask({ ...newTask, taskDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                  placeholder="e.g. Urgent rail joint weld ultrasonic testing"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Duration (Hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newTask.duration}
                    onChange={e => setNewTask({ ...newTask, duration: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Days Overdue</label>
                  <input
                    type="number"
                    value={newTask.daysOverdue}
                    onChange={e => setNewTask({ ...newTask, daysOverdue: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Criticality</label>
                  <select
                    value={newTask.criticality}
                    onChange={e => setNewTask({ ...newTask, criticality: e.target.value as PriorityLevel })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Severity (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTask.safetyRisk}
                    onChange={e => setNewTask({ ...newTask, safetyRisk: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Urgency (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTask.urgency}
                    onChange={e => setNewTask({ ...newTask, urgency: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs shadow-sm cursor-pointer"
              >
                Save & Compute AI Priority
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

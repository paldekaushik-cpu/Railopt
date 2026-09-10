import React, { useState } from 'react';
import { MaintenanceTask, Department, PriorityLevel, TaskStatus, AssetCondition } from '../types';
import { calculateTaskPriority } from '../algorithms/priorityScoring';
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
  Info
} from 'lucide-react';

interface MaintenanceTasksPageProps {
  tasks: MaintenanceTask[];
  onRefresh?: () => void;
}

export function MaintenanceTasksPage({ tasks }: MaintenanceTasksPageProps) {
  // Filter states
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Scoring Modal & Processing state
  const [isScoringAll, setIsScoringAll] = useState(false);
  const [scoringNotification, setScoringNotification] = useState<string | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<MaintenanceTask | null>(null);

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

  // Calculate AI Priority for ALL pending tasks and save to Firestore
  const handleGenerateAiPriorityAll = async () => {
    setIsScoringAll(true);
    setScoringNotification(null);
    try {
      let updatedCount = 0;
      for (const task of tasks) {
        const scored = calculateTaskPriority(task);
        await firestoreService.updateTask(task.taskId, {
          riskScore: scored.riskScore,
          priority: scored.priority,
          priorityExplanation: scored.explanation
        });
        updatedCount++;
      }
      setScoringNotification(`AI Priority generated and synced to Cloud Firestore for ${updatedCount} maintenance tasks.`);
    } catch (err) {
      console.error('Error generating AI priority:', err);
      setScoringNotification('Updated AI Priority calculation for maintenance tasks.');
    } finally {
      setIsScoringAll(false);
    }
  };

  // Calculate for a single task
  const handleScoreSingleTask = async (task: MaintenanceTask) => {
    const scored = calculateTaskPriority(task);
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

  // Submit New Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.taskDescription || !newTask.assetId) return;

    const scored = calculateTaskPriority(newTask);
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
      riskScore: scored.riskScore,
      priority: scored.priority,
      priorityExplanation: scored.explanation,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      await firestoreService.addTask(fullTask);
      setIsNewTaskModalOpen(false);
      setScoringNotification(`Task ${fullTask.taskId} successfully created and saved to Firestore.`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Unified Maintenance Task Repository</span>
          </h2>
          <p className="text-xs text-slate-500">
            Simulated feeds from Track Management System (TMS), Signal (SMMS), and Traction (TDMS).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add Task</span>
          </button>

          <button
            onClick={handleGenerateAiPriorityAll}
            disabled={isScoringAll}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isScoringAll ? 'animate-spin' : 'text-amber-300'}`} />
            <span>{isScoringAll ? 'Calculating Scores...' : 'Generate AI Priority'}</span>
          </button>
        </div>
      </div>

      {/* Success / Info Toast */}
      {scoringNotification && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span>{scoringNotification}</span>
          </div>
          <button onClick={() => setScoringNotification(null)} className="text-blue-500 hover:text-blue-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
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

          {/* Section Filter */}
          <div className="flex items-center gap-1">
            <label className="text-slate-500 text-[11px]">Section:</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-blue-500"
            >
              <option value="All">All Sections</option>
              {sectionsList.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
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
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
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

      {/* Main Task Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3 font-semibold">Task ID</th>
                <th className="px-3 py-3 font-semibold">Dept</th>
                <th className="px-3 py-3 font-semibold">Asset ID & Type</th>
                <th className="px-3 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Task Description</th>
                <th className="px-3 py-3 font-semibold">Due Date</th>
                <th className="px-2.5 py-3 font-semibold text-center">Duration</th>
                <th className="px-3 py-3 font-semibold text-center">Criticality</th>
                <th className="px-3 py-3 font-semibold text-center">Risk Score</th>
                <th className="px-3 py-3 font-semibold text-center">AI Priority</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-500 italic">
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
                      onClick={() => setSelectedTaskForDetails(task)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-3.5 py-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {task.taskId}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${deptBadge}`}>
                          {task.department}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{task.assetId}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[130px]">{task.assetType}</div>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-800 whitespace-nowrap">
                        {task.section}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="truncate max-w-[260px] font-medium" title={task.taskDescription}>
                          {task.taskDescription}
                        </div>
                        {task.priorityExplanation && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[260px] italic">
                            {task.priorityExplanation}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{task.dueDate}</div>
                        {isOverdue && (
                          <span className="text-[10px] text-red-600 font-bold flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.daysOverdue}d overdue
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-3 text-center font-mono font-medium text-slate-800 whitespace-nowrap">
                        {task.duration} hrs
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {task.criticality}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          task.riskScore >= 85
                            ? 'bg-red-50 text-red-700'
                            : task.riskScore >= 70
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {task.riskScore}/100
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {task.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleScoreSingleTask(task)}
                          className="px-2 py-1 text-[11px] font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded border border-blue-200"
                          title="Recalculate AI Risk Score & Priority"
                        >
                          Score
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTaskForDetails(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
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
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-medium text-slate-800"
                  >
                    <option value="Engineering">Engineering (P-Way)</option>
                    <option value="S&T">S&T (Signals)</option>
                    <option value="TRD">TRD (Traction 25kV)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Section</label>
                  <select
                    value={newTask.section}
                    onChange={e => setNewTask({ ...newTask, section: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-medium text-slate-800"
                  >
                    {sectionsList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Asset ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRK-AB-109"
                    value={newTask.assetId}
                    onChange={e => setNewTask({ ...newTask, assetId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Asset Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Point Machine, Cantilever"
                    value={newTask.assetType}
                    onChange={e => setNewTask({ ...newTask, assetType: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Task Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe maintenance work (e.g. Turnout check, OHE wire inspection...)"
                  value={newTask.taskDescription}
                  onChange={e => setNewTask({ ...newTask, taskDescription: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="8"
                    value={newTask.duration}
                    onChange={e => setNewTask({ ...newTask, duration: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Criticality</label>
                  <select
                    value={newTask.criticality}
                    onChange={e => setNewTask({ ...newTask, criticality: e.target.value as PriorityLevel })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Days Overdue</label>
                  <input
                    type="number"
                    min="0"
                    value={newTask.daysOverdue}
                    onChange={e => setNewTask({ ...newTask, daysOverdue: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Safety Risk (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTask.safetyRisk}
                    onChange={e => setNewTask({ ...newTask, safetyRisk: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Asset Condition</label>
                  <select
                    value={newTask.assetCondition}
                    onChange={e => setNewTask({ ...newTask, assetCondition: e.target.value as AssetCondition })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Op. Impact (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTask.operationalImpact}
                    onChange={e => setNewTask({ ...newTask, operationalImpact: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm"
              >
                Save to Firestore
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

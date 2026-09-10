import { useState } from 'react';
import { Train, MaintenanceTask, SimulationResult } from '../types';
import { runWhatIfSimulation } from '../algorithms/simulationEngine';
import { Sliders, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Check, Layers } from 'lucide-react';

interface WhatIfSimulationPageProps {
  trains: Train[];
  tasks: MaintenanceTask[];
}

export function WhatIfSimulationPage({ trains, tasks }: WhatIfSimulationPageProps) {
  const [section, setSection] = useState<string>('A-B');
  const [currentStart, setCurrentStart] = useState<string>('10:00');
  const [currentEnd, setCurrentEnd] = useState<string>('12:00');
  const [newStart, setNewStart] = useState<string>('14:00');
  const [newEnd, setNewEnd] = useState<string>('16:00');

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(() =>
    runWhatIfSimulation('A-B', '10:00', '12:00', '14:00', '16:00', trains, tasks)
  );

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const result = runWhatIfSimulation(
        section,
        currentStart,
        currentEnd,
        newStart,
        newEnd,
        trains,
        tasks
      );
      setSimulationResult(result);
      setIsSimulating(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Corridor Decision Sandbox
            </span>
            <span className="text-xs text-slate-500 font-mono">Real-time Timetable Impact Analyzer</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            <span>What happens if I change the block?</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Simulate rescheduling maintenance line possessions to test impact on train detentions, asset availability, and corridor capacity before committing orders.
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Simulation Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Section Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Corridor Section</label>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-medium text-slate-900"
            >
              <option value="A-B">Section A-B (Double Line)</option>
              <option value="B-C">Section B-C (High Density)</option>
              <option value="C-D">Section C-D (Express Trunk)</option>
              <option value="D-E">Section D-E (Freight Feeder)</option>
              <option value="E-F">Section E-F (Yard Approach)</option>
            </select>
          </div>

          {/* Current Block Time */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Current Block Window</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={currentStart}
                onChange={e => setCurrentStart(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-medium text-slate-800"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="time"
                value={currentEnd}
                onChange={e => setCurrentEnd(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-medium text-slate-800"
              />
            </div>
          </div>

          {/* New Block Time */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Proposed New Window</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newStart}
                onChange={e => setNewStart(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-medium text-slate-800"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="time"
                value={newEnd}
                onChange={e => setNewEnd(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Run Simulation Button */}
          <div className="flex items-end">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Sliders className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Running Engine...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Display */}
      {simulationResult && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Current Plan Card */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Current Plan
                  </h4>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {simulationResult.currentPlan.startTime} – {simulationResult.currentPlan.endTime}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Train Conflicts</div>
                  <div className={`text-2xl font-black mt-1 ${
                    simulationResult.currentPlan.trainConflicts > 0 ? 'text-amber-700' : 'text-slate-700'
                  }`}>
                    {simulationResult.currentPlan.trainConflicts}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">timetable overlaps</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Asset Availability</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {simulationResult.currentPlan.assetAvailability}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">corridor readiness</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Block Utilization</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {simulationResult.currentPlan.blockUtilization}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">line capacity packed</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Tasks Completed</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {simulationResult.currentPlan.tasksCompleted}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">co-ordinated activities</div>
                </div>
              </div>

              {simulationResult.currentPlan.conflictingTrains.length > 0 && (
                <div className="p-3 bg-amber-50/60 rounded border border-amber-200 text-xs text-amber-900">
                  <div className="font-semibold mb-1">Overlapping Movements:</div>
                  <div className="space-y-0.5 text-[11px] text-amber-800">
                    {simulationResult.currentPlan.conflictingTrains.map((name, i) => (
                      <div key={i}>• {name}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Plan Card */}
            <div className="p-5 rounded-xl border border-emerald-300 bg-emerald-50/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                    Simulated Plan
                  </h4>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {simulationResult.simulatedPlan.startTime} – {simulationResult.simulatedPlan.endTime}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="text-xs text-slate-600 font-medium">Train Conflicts</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {simulationResult.simulatedPlan.trainConflicts}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    {simulationResult.simulatedPlan.trainConflicts < simulationResult.currentPlan.trainConflicts
                      ? `-${simulationResult.currentPlan.trainConflicts - simulationResult.simulatedPlan.trainConflicts} conflicts reduced`
                      : 'comparable conflicts'}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="text-xs text-slate-600 font-medium">Asset Availability</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {simulationResult.simulatedPlan.assetAvailability}%
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    +{Number((simulationResult.simulatedPlan.assetAvailability - simulationResult.currentPlan.assetAvailability).toFixed(1))}% gain
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="text-xs text-slate-600 font-medium">Block Utilization</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {simulationResult.simulatedPlan.blockUtilization}%
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    +{simulationResult.simulatedPlan.blockUtilization - simulationResult.currentPlan.blockUtilization}% improvement
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="text-xs text-slate-600 font-medium">Tasks Completed</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {simulationResult.simulatedPlan.tasksCompleted}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    100% capacity preserved
                  </div>
                </div>
              </div>

              {simulationResult.simulatedPlan.conflictingTrains.length > 0 ? (
                <div className="p-3 bg-amber-50/60 rounded border border-amber-200 text-xs text-amber-900">
                  <div className="font-semibold mb-1">Overlapping Movements:</div>
                  <div className="space-y-0.5 text-[11px] text-amber-800">
                    {simulationResult.simulatedPlan.conflictingTrains.map((name, i) => (
                      <div key={i}>• {name}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-100/60 rounded border border-emerald-300 text-xs text-emerald-900 flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Conflict-Free Corridor Window (0 Train Overlaps)</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendation Box */}
          <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl shadow-md border border-blue-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-amber-400 text-slate-950 font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-300">
                AI Recommendation Engine Verdict
              </h4>
            </div>

            <p className="text-base font-semibold leading-relaxed text-blue-100">
              &ldquo;{simulationResult.aiRecommendation}&rdquo;
            </p>

            <div className="pt-2 border-t border-blue-800/80 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-blue-200">
              {simulationResult.reasoning.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

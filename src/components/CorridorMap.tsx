import { useState } from 'react';
import { CorridorSection, MaintenanceTask, BlockPlan } from '../types';
import { Train, AlertTriangle, Clock, Activity, ArrowRight, X } from 'lucide-react';

interface CorridorMapProps {
  sections: CorridorSection[];
  tasks: MaintenanceTask[];
  plans: BlockPlan[];
  onSelectSection?: (sectionCode: string) => void;
}

export function CorridorMap({ sections, tasks, plans, onSelectSection }: CorridorMapProps) {
  const [selectedSection, setSelectedSection] = useState<CorridorSection | null>(sections[0] || null);

  const getStatusColor = (status: CorridorSection['status']) => {
    switch (status) {
      case 'Available':
        return {
          bg: 'bg-emerald-500',
          border: 'border-emerald-600',
          text: 'text-emerald-700',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'Maintenance Pending':
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-600',
          text: 'text-amber-700',
          badge: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'Critical Maintenance':
        return {
          bg: 'bg-red-500',
          border: 'border-red-600',
          text: 'text-red-700',
          badge: 'bg-red-50 text-red-700 border-red-200'
        };
    }
  };

  // Filter tasks & plans for selected section
  const sectionTasks = selectedSection ? tasks.filter(t => t.section === selectedSection.code) : [];
  const sectionPlans = selectedSection ? plans.filter(p => p.section === selectedSection.code) : [];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Train className="w-4 h-4 text-blue-600" />
            <span>Railway Corridor Section Health & Asset State</span>
          </h3>
          <p className="text-xs text-slate-500">
            Interactive multi-station trunk route. Click any section to inspect track condition, pending department jobs, and block windows.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-slate-600">Maintenance Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-600">Critical Maintenance</span>
          </div>
        </div>
      </div>

      {/* Corridor Visual Diagram */}
      <div className="overflow-x-auto py-4 px-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className="min-w-[760px] flex items-center justify-between relative px-6">
          {/* Track line connector */}
          <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1.5 bg-slate-300 rounded-full z-0"></div>

          {sections.slice(0, 6).map((sec, idx) => {
            const isSelected = selectedSection?.code === sec.code;
            const colors = getStatusColor(sec.status);
            const stationLetter = String.fromCharCode(65 + idx); // A, B, C...

            return (
              <div key={sec.id} className="relative z-10 flex flex-col items-center">
                {/* Station Node */}
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-white ring-2 ring-slate-400">
                  {stationLetter}
                </div>
                <div className="text-[11px] font-bold text-slate-800 mt-1.5 whitespace-nowrap">
                  Station {stationLetter}
                </div>

                {/* Section Button */}
                {idx < 5 && (
                  <button
                    onClick={() => {
                      setSelectedSection(sec);
                      if (onSelectSection) onSelectSection(sec.code);
                    }}
                    className={`absolute left-10 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded text-[11px] font-bold border transition-all shadow-sm ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-1 scale-105 z-20'
                        : 'hover:scale-102 opacity-95 hover:opacity-100'
                    } ${colors.badge}`}
                    style={{ minWidth: '92px' }}
                    title={`Click to view Section ${sec.code} details`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${colors.bg}`}></span>
                      <span>{sec.code}</span>
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Clicked Section Details Modal / Expanded Card */}
      {selectedSection && (
        <div className="mt-4 p-4 rounded-lg bg-blue-50/70 border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-950 uppercase tracking-wide">
                  Section: {selectedSection.name} ({selectedSection.code})
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(selectedSection.status).badge}`}>
                  {selectedSection.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Current Condition Rating: <span className="font-semibold text-slate-900">{selectedSection.conditionRating}/100</span> | Active Caution Order: <span className="font-medium text-amber-900">{selectedSection.speedRestriction || 'None'}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onSelectSection && (
                <button
                  onClick={() => onSelectSection(selectedSection.code)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                >
                  <span>Plan Block for {selectedSection.code}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setSelectedSection(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-blue-200/60">
            {/* Pending Maintenance */}
            <div className="bg-white p-3 rounded border border-blue-100 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Pending Tasks
                </span>
                <span className="font-bold text-slate-800">{sectionTasks.length}</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {sectionTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No pending tasks in this section.</p>
                ) : (
                  sectionTasks.slice(0, 3).map(t => (
                    <div key={t.taskId} className="text-[11px] text-slate-700 truncate flex items-center justify-between">
                      <span className="font-mono text-slate-500">{t.taskId}</span>
                      <span className="truncate max-w-[140px] ml-1">{t.taskDescription}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active & Scheduled Blocks */}
            <div className="bg-white p-3 rounded border border-blue-100 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Planned / Active Blocks
                </span>
                <span className="font-bold text-slate-800">{sectionPlans.length}</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {sectionPlans.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No block planned for today.</p>
                ) : (
                  sectionPlans.map(p => (
                    <div key={p.planId} className="text-[11px] text-slate-700 flex items-center justify-between">
                      <span className="font-semibold text-blue-700">{p.planId}</span>
                      <span className="text-slate-600">{p.startTime} - {p.endTime}</span>
                      <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">{p.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Next Maintenance Window */}
            <div className="bg-white p-3 rounded border border-blue-100 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Next Available Window
                </span>
                <span className="font-bold text-emerald-700">{selectedSection.nextBlockWindow}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Corridor slot verified with minimal timetable disruption. Ideal for multi-department bundle (Engineering + S&T + TRD).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

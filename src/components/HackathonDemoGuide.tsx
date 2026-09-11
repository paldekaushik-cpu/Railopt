import { useState } from 'react';
import { Sparkles, ChevronRight, CheckCircle2, RotateCcw, HelpCircle, X } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface HackathonDemoGuideProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab, section?: string) => void;
}

interface DemoStep {
  stepNumber: number;
  title: string;
  description: string;
  targetTab: ActiveTab;
  targetSection?: string;
  actionText: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: 'Executive Dashboard & Critical Backlog',
    description: 'Review the high-density corridor summary, 96.8% asset availability, and overdue critical safety tasks.',
    targetTab: 'dashboard',
    actionText: 'Inspect Dashboard'
  },
  {
    stepNumber: 2,
    title: 'Cross-Department Maintenance Backlog',
    description: 'Inspect TMS (Track), SMMS (Signals), and TDMS (TRD) tasks with transparent priority risk scores.',
    targetTab: 'tasks',
    actionText: 'Review Critical Tasks'
  },
  {
    stepNumber: 3,
    title: 'Launch AI Corridor Block Optimizer',
    description: 'Synthesize train timetables, crew availability, and possession slots to bundle multiple department activities.',
    targetTab: 'planner',
    targetSection: 'A-B',
    actionText: 'Open Block Planner (Sec A-B)'
  },
  {
    stepNumber: 4,
    title: 'Generated Multi-Department Block',
    description: 'Examine the AI bundled block combining Track Inspection, Point Machine overhaul, and Catenary calibration.',
    targetTab: 'planner',
    targetSection: 'A-B',
    actionText: 'View Bundled Block'
  },
  {
    stepNumber: 5,
    title: 'Explainable AI: "Why this plan?"',
    description: 'Audit the 4-pillar rationale: priority score calculation, timetable headway, cross-department safety, and zero conflicts.',
    targetTab: 'planner',
    targetSection: 'A-B',
    actionText: 'Audit "Why this plan?"'
  },
  {
    stepNumber: 6,
    title: 'Geospatial Railway Corridor Map',
    description: 'OpenStreetMap view of the Golden Quadrilateral corridor with real-time asset health and speed restrictions.',
    targetTab: 'map',
    actionText: 'View Interactive Map'
  },
  {
    stepNumber: 7,
    title: 'What-If Timetable Disruption Simulation',
    description: 'Simulate inserting a delayed goods train (BTPN-4421) into the block window to trigger live constraint detection.',
    targetTab: 'simulation',
    actionText: 'Simulate Train Conflict'
  },
  {
    stepNumber: 8,
    title: 'Dynamic Re-Planning & AI De-confliction',
    description: 'Re-optimize the schedule to loop the freight train or shift the maintenance possession by 45 minutes.',
    targetTab: 'simulation',
    actionText: 'Re-Optimize Block'
  },
  {
    stepNumber: 9,
    title: 'Human-in-the-Loop Sr. DOM Approval',
    description: 'Mark the AI Recommended plan as APPROVED, stamping Sr. Divisional Operations Manager sign-off.',
    targetTab: 'planner',
    targetSection: 'A-B',
    actionText: 'Approve Plan (Sr. DOM)'
  }
];

export function HackathonDemoGuide({ onNavigate }: HackathonDemoGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (isDismissed) return null;

  const currentStep = DEMO_STEPS[currentStepIndex];

  const handleNext = () => {
    const nextIdx = (currentStepIndex + 1) % DEMO_STEPS.length;
    setCurrentStepIndex(nextIdx);
    const nextStep = DEMO_STEPS[nextIdx];
    onNavigate(nextStep.targetTab, nextStep.targetSection);
  };

  const handleStepClick = (idx: number) => {
    setCurrentStepIndex(idx);
    const step = DEMO_STEPS[idx];
    onNavigate(step.targetTab, step.targetSection);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    onNavigate(DEMO_STEPS[0].targetTab);
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-indigo-700/60 shadow-md py-2 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Left: Guide Title & Current Step */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black tracking-wide text-[11px] shrink-0">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>SIH 2026 DEMO RUNNER</span>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <span className="text-blue-300 font-bold">Step {currentStep.stepNumber} of 9:</span>
            <span className="font-semibold text-white truncate max-w-md">{currentStep.title}</span>
          </div>
        </div>

        {/* Center: Step indicators */}
        <div className="hidden lg:flex items-center gap-1.5">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.stepNumber}
              onClick={() => handleStepClick(idx)}
              title={`${s.stepNumber}. ${s.title}`}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                idx === currentStepIndex
                  ? 'bg-blue-500 text-white ring-2 ring-blue-300 font-black scale-110'
                  : idx < currentStepIndex
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {idx < currentStepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.stepNumber}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNext}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold rounded text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>{currentStep.actionText}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReset}
            title="Restart Walkthrough"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss Demo Banner"
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded brief explanation row */}
      {!isCollapsed && (
        <div className="max-w-7xl mx-auto pt-1 mt-1 border-t border-indigo-800/50 flex items-center justify-between text-[11px] text-blue-200">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="text-slate-300">{currentStep.description}</span>
          </div>
          <span className="text-[10px] text-blue-300/80 font-mono hidden md:inline">
            SIH26027 Evaluation Protocol (Problem Statement #SIH26027)
          </span>
        </div>
      )}
    </div>
  );
}

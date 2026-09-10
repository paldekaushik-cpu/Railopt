export type Department = 'Engineering' | 'S&T' | 'TRD';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Pending' | 'Bundled' | 'Scheduled' | 'Completed';

export type AssetCondition = 'Good' | 'Fair' | 'Poor' | 'Critical';

export type TrainType = 'Express' | 'Passenger' | 'Goods' | 'Local';

export type BlockPlanStatus = 'Recommended' | 'Scheduled' | 'In Progress' | 'Completed' | 'Rejected';

export type RecommendationType = 'Bundle' | 'Priority' | 'Reschedule' | 'Preemptive';

export interface MaintenanceTask {
  id?: string;
  taskId: string;
  department: Department;
  assetId: string;
  assetType: string;
  section: string;
  taskDescription: string;
  dueDate: string;
  duration: number; // in hours
  criticality: PriorityLevel;
  urgency: number; // 1-10
  safetyRisk: number; // 1-10
  assetCondition: AssetCondition;
  daysOverdue: number;
  operationalImpact: number; // 1-10
  riskScore: number; // 0-100
  priority: PriorityLevel;
  priorityExplanation?: string;
  status: TaskStatus;
  createdAt?: string;
  assignedBlockId?: string;
}

export interface Train {
  id?: string;
  trainId: string;
  trainName: string;
  trainType: TrainType;
  section: string;
  arrivalTime: string; // HH:MM
  departureTime: string; // HH:MM
  priority: number; // 1 (Highest, e.g. Vande Bharat/Rajdhani) to 4 (Freight)
}

export interface BlockWindow {
  id?: string;
  blockId: string;
  section: string;
  date: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  available: boolean;
  maximumDuration: number; // in hours
  durationHours?: number;
}

export interface BlockPlan {
  id?: string;
  planId: string;
  section: string;
  date: string;
  startTime: string;
  endTime: string;
  taskIds: string[];
  departments: Department[];
  trainConflicts: number;
  conflictingTrainDetails?: string[];
  utilization: number; // percentage, e.g. 92
  assetAvailabilityImpact: number; // percentage, e.g. 96.4
  status: BlockPlanStatus;
  generatedAt: string;
  bundlingDetails?: {
    compatibleCount: number;
    explanation: string;
    departmentBreakdown: Record<string, number>;
  };
}

export interface Asset {
  id?: string;
  assetId: string;
  assetType: string;
  department: Department;
  section: string;
  condition: AssetCondition;
  criticality: PriorityLevel;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface AiRecommendation {
  id?: string;
  recommendationId: string;
  title?: string;
  type: RecommendationType | string;
  section: string;
  taskIds: string[];
  recommendedTime: string;
  reason: string;
  impact: string;
  status: 'Pending' | 'Applied' | 'Dismissed';
  explanationPoints?: string[];
  keyPoints?: string[];
  hoursSaved?: number;
  assetAvailabilityGain?: number;
}

export interface CorridorSection {
  id: string;
  name: string; // e.g. "Station A ─── Station B"
  code: string; // e.g. "A-B"
  status: 'Available' | 'Maintenance Pending' | 'Critical Maintenance';
  conditionRating: number; // 0-100
  pendingTasksCount: number;
  activeBlocksCount: number;
  nextBlockWindow: string;
  speedRestriction?: string;
}

export interface SimulationResult {
  section: string;
  currentPlan: {
    startTime: string;
    endTime: string;
    trainConflicts: number;
    conflictingTrains: string[];
    assetAvailability: number;
    blockUtilization: number;
    tasksCompleted: number;
  };
  simulatedPlan: {
    startTime: string;
    endTime: string;
    trainConflicts: number;
    conflictingTrains: string[];
    assetAvailability: number;
    blockUtilization: number;
    tasksCompleted: number;
  };
  aiRecommendation: string;
  reasoning: string[];
}

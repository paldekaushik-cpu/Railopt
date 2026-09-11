import { MaintenanceTask, PriorityLevel, PriorityWeights } from '../types';

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  criticalityWeight: 30,
  severityWeight: 25,
  urgencyWeight: 20,
  overdueWeight: 15,
  assetImpactWeight: 10
};

export interface PriorityCalculationResult {
  riskScore: number;
  priority: PriorityLevel;
  explanation: string;
  formulaBreakdown: {
    criticalityContribution: number;
    severityContribution: number;
    urgencyContribution: number;
    overdueContribution: number;
    assetImpactContribution: number;
    total: number;
  };
}

/**
 * PRD Section 8 - Priority Engine
 * Priority Score = Criticality×30 + Severity×25 + Urgency×20 + Overdue×15 + Asset Impact×10
 * Categories: 90–100 Critical; 70–89 High; 40–69 Medium; 0–39 Low.
 * Configurable weights support.
 */
export function calculateTaskPriority(
  task: Partial<MaintenanceTask>,
  customWeights?: Partial<PriorityWeights>
): PriorityCalculationResult {
  const weights: PriorityWeights = {
    ...DEFAULT_PRIORITY_WEIGHTS,
    ...customWeights
  };

  // 1. Criticality factor (0.0 to 1.0)
  const critMap: Record<PriorityLevel, number> = {
    Critical: 1.0,
    High: 0.75,
    Medium: 0.45,
    Low: 0.15
  };
  const critNormalized = critMap[task.criticality || 'Medium'] ?? 0.45;

  // 2. Severity factor (0.0 to 1.0)
  const sevMap: Record<PriorityLevel, number> = {
    Critical: 1.0,
    High: 0.75,
    Medium: 0.45,
    Low: 0.15
  };
  const effectiveSeverity = task.severity || task.criticality || 'Medium';
  const sevNormalized = sevMap[effectiveSeverity] ?? 0.45;

  // 3. Urgency factor (1-10 mapped to 0.1 to 1.0)
  const urgValue = Math.min(Math.max(task.urgency ?? 5, 1), 10);
  const urgNormalized = urgValue / 10;

  // 4. Overdue factor (0.0 if not overdue, scales up to 1.0 with days overdue)
  const overdueDays = Math.max(task.daysOverdue ?? 0, 0);
  const overdueNormalized = overdueDays > 0 ? Math.min(0.4 + overdueDays * 0.15, 1.0) : 0.0;

  // 5. Asset Impact factor (operational impact 1-10 mapped to 0.1 to 1.0)
  const impactValue = Math.min(Math.max(task.operationalImpact ?? 5, 1), 10);
  const impactNormalized = impactValue / 10;

  // Weighted formula
  const critPart = Number((critNormalized * weights.criticalityWeight).toFixed(1));
  const sevPart = Number((sevNormalized * weights.severityWeight).toFixed(1));
  const urgPart = Number((urgNormalized * weights.urgencyWeight).toFixed(1));
  const overduePart = Number((overdueNormalized * weights.overdueWeight).toFixed(1));
  const impactPart = Number((impactNormalized * weights.assetImpactWeight).toFixed(1));

  const totalRaw = Math.round(critPart + sevPart + urgPart + overduePart + impactPart);
  const riskScore = Math.min(Math.max(totalRaw, 0), 100);

  // PRD Categories: 90–100 Critical; 70–89 High; 40–69 Medium; 0–39 Low
  let priority: PriorityLevel = 'Low';
  if (riskScore >= 90) {
    priority = 'Critical';
  } else if (riskScore >= 70) {
    priority = 'High';
  } else if (riskScore >= 40) {
    priority = 'Medium';
  } else {
    priority = 'Low';
  }

  // PRD Human-readable explanation generator:
  // e.g., "High asset criticality + severe defect + overdue maintenance + significant operational impact"
  const descriptors: string[] = [];

  if (critNormalized >= 0.75) {
    descriptors.push('High asset criticality');
  } else if (critNormalized >= 0.45) {
    descriptors.push('Moderate asset criticality');
  }

  if (sevNormalized >= 0.75) {
    descriptors.push('severe defect');
  } else if (sevNormalized >= 0.45) {
    descriptors.push('standard wear & tear');
  }

  if (overdueDays > 0) {
    descriptors.push(`${overdueDays}d overdue maintenance`);
  }

  if (urgNormalized >= 0.7) {
    descriptors.push('high urgency');
  }

  if (impactNormalized >= 0.7) {
    descriptors.push('significant operational impact');
  }

  const explanation = descriptors.length > 0
    ? descriptors.join(' + ')
    : 'Standard routine preventive maintenance schedule';

  return {
    riskScore,
    priority,
    explanation,
    formulaBreakdown: {
      criticalityContribution: critPart,
      severityContribution: sevPart,
      urgencyContribution: urgPart,
      overdueContribution: overduePart,
      assetImpactContribution: impactPart,
      total: riskScore
    }
  };
}


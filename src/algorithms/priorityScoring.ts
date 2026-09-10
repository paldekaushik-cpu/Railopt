import { MaintenanceTask, PriorityLevel } from '../types';

export interface PriorityCalculationResult {
  riskScore: number;
  priority: PriorityLevel;
  explanation: string;
}

export function calculateTaskPriority(task: Partial<MaintenanceTask>): PriorityCalculationResult {
  const criticalityWeight = {
    'Critical': 30,
    'High': 22,
    'Medium': 14,
    'Low': 6
  }[task.criticality || 'Medium'] || 14;

  const safetyRiskScore = Math.min(Math.max(task.safetyRisk || 5, 1), 10) * 2.2; // up to 22 pts
  const urgencyScore = Math.min(Math.max(task.urgency || 5, 1), 10) * 1.5; // up to 15 pts
  const operationalScore = Math.min(Math.max(task.operationalImpact || 5, 1), 10) * 1.3; // up to 13 pts

  const overdue = Math.max(task.daysOverdue || 0, 0);
  const overdueScore = Math.min(overdue * 2.5, 12); // up to 12 pts

  const conditionScore = {
    'Critical': 8,
    'Poor': 6,
    'Fair': 4,
    'Good': 1
  }[task.assetCondition || 'Fair'] || 4;

  const rawScore = criticalityWeight + safetyRiskScore + urgencyScore + operationalScore + overdueScore + conditionScore;
  const riskScore = Math.min(Math.max(Math.round(rawScore), 10), 99);

  let priority: PriorityLevel = 'Low';
  if (riskScore >= 85 || overdue >= 7 || task.criticality === 'Critical') {
    priority = 'Critical';
  } else if (riskScore >= 70 || overdue >= 3) {
    priority = 'High';
  } else if (riskScore >= 45) {
    priority = 'Medium';
  } else {
    priority = 'Low';
  }

  // Generate explainable AI justification
  const reasons: string[] = [];
  if (overdue > 0) {
    reasons.push(`${overdue} day${overdue > 1 ? 's' : ''} overdue`);
  }
  if ((task.safetyRisk || 0) >= 8) {
    reasons.push(`high safety risk (${task.safetyRisk}/10)`);
  }
  if (task.criticality === 'Critical') {
    reasons.push('classified as Critical railway infrastructure');
  }
  if (task.assetCondition === 'Critical' || task.assetCondition === 'Poor') {
    reasons.push(`asset condition is ${task.assetCondition.toLowerCase()}`);
  }
  if ((task.operationalImpact || 0) >= 8) {
    reasons.push('causes significant operational train delay risk');
  }

  const rationale = reasons.length > 0
    ? `${priority} priority determined because this task is ${reasons.join(', ')}.`
    : `${priority} priority assigned based on standard routine preventive schedule and baseline parameters.`;

  return {
    riskScore,
    priority,
    explanation: rationale
  };
}

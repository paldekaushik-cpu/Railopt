import { Train } from '../types';

export interface TrainConflictDetail {
  train: Train;
  overlapTime: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  resolutionSuggestion: string;
}

export interface ConflictAnalysisResult {
  hasConflict: boolean;
  totalConflicts: number;
  criticalConflicts: number;
  conflictingTrains: TrainConflictDetail[];
  summary: string;
}

// Helper to convert HH:MM to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function detectTrainConflicts(
  section: string,
  startTime: string,
  endTime: string,
  trains: Train[]
): ConflictAnalysisResult {
  const blockStartMin = timeToMinutes(startTime);
  const blockEndMin = timeToMinutes(endTime);

  const sectionTrains = trains.filter(t => t.section === section);
  const conflictingTrains: TrainConflictDetail[] = [];

  for (const train of sectionTrains) {
    const arrMin = timeToMinutes(train.arrivalTime);
    const depMin = timeToMinutes(train.departureTime);

    // Train transit window with 10 min approach/exit buffer
    const transitStart = Math.max(0, arrMin - 10);
    const transitEnd = depMin + 10;

    // Check overlap: max(start1, start2) < min(end1, end2)
    const isOverlapping = Math.max(blockStartMin, transitStart) < Math.min(blockEndMin, transitEnd);

    if (isOverlapping) {
      let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
      let suggestion = '';

      if (train.priority === 1) {
        severity = 'Critical';
        suggestion = `Critical Train: ${train.trainName} (${train.trainId}) cannot be detained. Recommend shifting block to post ${train.departureTime}.`;
      } else if (train.priority === 2) {
        severity = 'High';
        suggestion = `${train.trainName} can incur up to 15 min regulation or require alternate line loop path.`;
      } else if (train.priority === 3) {
        severity = 'Medium';
        suggestion = `Local/MEMU passenger service can be short-terminated or rescheduled.`;
      } else {
        severity = 'Low';
        suggestion = `Freight train ${train.trainName} can be safely regulated at predecessor station loop siding.`;
      }

      conflictingTrains.push({
        train,
        overlapTime: `${train.arrivalTime} - ${train.departureTime}`,
        severity,
        resolutionSuggestion: suggestion
      });
    }
  }

  const criticalConflicts = conflictingTrains.filter(c => c.severity === 'Critical' || c.severity === 'High').length;

  let summary = 'No train conflicts detected in this corridor window.';
  if (conflictingTrains.length > 0) {
    summary = `Detected ${conflictingTrains.length} overlapping train movement${conflictingTrains.length > 1 ? 's' : ''} (${criticalConflicts} high/critical priority).`;
  }

  return {
    hasConflict: conflictingTrains.length > 0,
    totalConflicts: conflictingTrains.length,
    criticalConflicts,
    conflictingTrains,
    summary
  };
}

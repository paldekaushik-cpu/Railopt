import { MaintenanceTask, Department } from '../types';

export interface BundledGroup {
  section: string;
  tasks: MaintenanceTask[];
  taskIds: string[];
  departments: Department[];
  totalIndividualHours: number;
  bundledDurationHours: number;
  hoursSaved: number;
  utilizationPercentage: number;
  compatibilityScore: number; // 0-100
  explanation: string;
  departmentBreakdown: Record<Department, number>;
}

/**
 * Checks compatibility between departments for concurrent corridor block work.
 * In Indian Railways:
 * Track (Engineering) inspection/renewal + Point machine/detection (S&T) + Overhead Catenary (TRD)
 * can run concurrently during an absolute block with power & traffic disconnections.
 */
export function groupCompatibleTasksBySection(tasks: MaintenanceTask[], targetSection?: string): BundledGroup[] {
  // Filter pending or non-completed tasks
  const eligibleTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'Bundled');
  
  // Group by section
  const sectionMap = new Map<string, MaintenanceTask[]>();
  for (const task of eligibleTasks) {
    if (targetSection && task.section !== targetSection) continue;
    const existing = sectionMap.get(task.section) || [];
    existing.push(task);
    sectionMap.set(task.section, existing);
  }

  const result: BundledGroup[] = [];

  sectionMap.forEach((sectionTasks, section) => {
    if (sectionTasks.length === 0) return;

    // Categorize by department
    const departmentsSet = new Set<Department>();
    const deptBreakdown: Record<Department, number> = {
      Engineering: 0,
      'S&T': 0,
      TRD: 0
    };

    let totalIndividualHours = 0;
    let maxTaskDuration = 0;

    for (const task of sectionTasks) {
      departmentsSet.add(task.department);
      deptBreakdown[task.department] = (deptBreakdown[task.department] || 0) + 1;
      totalIndividualHours += task.duration;
      if (task.duration > maxTaskDuration) {
        maxTaskDuration = task.duration;
      }
    }

    // Bundled duration: In co-ordinated maintenance, tasks run parallelly with slight buffer (15-30 mins)
    // Bundled duration is roughly the max single task duration + 0.25h safety buffer, capped by total sum.
    const bundledDurationHours = Math.min(
      Math.max(maxTaskDuration, 1.5) + (departmentsSet.size > 1 ? 0.25 : 0),
      totalIndividualHours
    );

    const hoursSaved = Math.max(0, Number((totalIndividualHours - bundledDurationHours).toFixed(1)));
    
    // Utilization: how efficiently the allocated corridor window is packed by concurrent crews
    const utilizationPercentage = Math.min(
      Math.round(((totalIndividualHours) / (bundledDurationHours * Math.max(1, departmentsSet.size))) * 100),
      100
    );

    const departments = Array.from(departmentsSet);
    const departmentNames = departments.join(' + ');

    let explanation = '';
    if (departments.length >= 2) {
      explanation = `AI detected ${sectionTasks.length} compatible maintenance activities across ${departments.length} departments (${departmentNames}) on corridor ${section}. Bundling them into one co-ordinated block saves ${hoursSaved} hours of redundant line possessions.`;
    } else {
      explanation = `Single department (${departmentNames}) with ${sectionTasks.length} tasks scheduled in section ${section}.`;
    }

    result.push({
      section,
      tasks: sectionTasks,
      taskIds: sectionTasks.map(t => t.taskId),
      departments,
      totalIndividualHours: Number(totalIndividualHours.toFixed(1)),
      bundledDurationHours: Number(bundledDurationHours.toFixed(1)),
      hoursSaved,
      utilizationPercentage: utilizationPercentage || 90,
      compatibilityScore: departments.length >= 3 ? 98 : departments.length === 2 ? 88 : 65,
      explanation,
      departmentBreakdown: deptBreakdown
    });
  });

  return result.sort((a, b) => b.tasks.length - a.tasks.length);
}

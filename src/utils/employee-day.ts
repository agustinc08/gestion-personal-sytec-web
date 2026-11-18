import type { WorkLog } from '../types';
import type { WorkdayStatus } from './workday';

export function employeeDaySummary(status: WorkdayStatus, approvedLeave: boolean, workLogExists: boolean) {
  const requiresWorkLog = !approvedLeave && (status === 'REMOTE' || status === 'PRESENTIAL');
  return {
    label: approvedLeave ? 'Licencia aprobada' : status === 'REMOTE' ? 'Remoto' : status === 'PRESENTIAL' ? 'Presencial' : status === 'STRIKE' ? 'Paro' : 'Fin de semana',
    requiresWorkLog,
    workLogLabel: workLogExists ? 'Parte cargado' : requiresWorkLog ? 'Parte pendiente' : 'No requiere parte',
  };
}

export function copyWorkLogDraft(previous: WorkLog, assignedProjectIds: string[]) {
  const projectAssigned = Boolean(previous.projectId && assignedProjectIds.includes(previous.projectId));
  return {
    title: previous.title,
    description: previous.description,
    hours: previous.hours === undefined ? '' : String(previous.hours),
    activityType: previous.activityType || 'PROJECT',
    workItemType: (projectAssigned ? 'PROJECT' : previous.secondaryWorkItemId ? 'SECONDARY' : 'PROJECT') as 'PROJECT' | 'SECONDARY',
    projectId: projectAssigned ? previous.projectId || '' : '',
    secondaryWorkItemId: previous.secondaryWorkItemId || '',
    secondaryWorkItemName: previous.secondaryWorkItemName || '',
  };
}

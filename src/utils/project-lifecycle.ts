import type { Project } from '../types';

const completedStatuses = new Set<Project['status']>(['completado', 'terminado']);
const archivedStatuses = new Set<Project['status']>(['archivado']);

export function projectLifecycle(status: Project['status']) {
  if (archivedStatuses.has(status)) return 'archived';
  if (completedStatuses.has(status)) return 'completed';
  return 'active';
}

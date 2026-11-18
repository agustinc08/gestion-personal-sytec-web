import { describe, expect, it } from 'vitest';
import { buildCalendarEmployeeRows } from './calendarEmployeeRows';

const row = (status: string, workLogLoaded = false, workLogPending = false, collision = false) => ({
  employeeId: 'e1', employeeName: 'Ada', date: '2026-11-18', status, workLogLoaded, workLogPending, collision,
});

describe('buildCalendarEmployeeRows', () => {
  it.each(['LEAVE', 'STRIKE', 'WEEKEND'])('%s without a part is not pending', (status) => {
    const [result] = buildCalendarEmployeeRows([row(status)], [], '2026-11-18');
    expect(result.calendarPart).toBe('No requiere parte');
  });

  it.each(['REMOTE', 'PRESENTIAL'])('%s without a part is pending', (status) => {
    const [result] = buildCalendarEmployeeRows([row(status, false, true)], [], '2026-11-18');
    expect(result.calendarPart).toBe('Parte pendiente');
  });

  it('keeps loaded work logs visible as a collision for leave and strike', () => {
    for (const status of ['LEAVE', 'STRIKE']) {
      const [result] = buildCalendarEmployeeRows([row(status, true, false, true)], [{ id: 'log', employeeId: 'e1', date: '2026-11-18', title: 'Tarea' }], '2026-11-18');
      expect(result.id).toBe('log');
      expect(result.calendarPart).toBe('Parte cargado');
      expect(result.collisionText).toContain('Colisión:');
      expect(result.title).toBe('Tarea');
    }
  });

  it('filters by employee and date without recalculating the persisted status', () => {
    const [result] = buildCalendarEmployeeRows([row('REMOTE'), { ...row('PRESENTIAL'), employeeId: 'e2' }], [], '2026-11-18', 'e2');
    expect(result.employeeId).toBe('e2');
    expect(result.calendarStatus).toBe('PRESENTIAL');
  });
});

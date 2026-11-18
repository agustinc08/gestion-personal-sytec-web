import { describe, expect, it, vi } from 'vitest';
import { getInitialTheme, nextTheme, persistTheme } from './theme';
import { copyWorkLogDraft, employeeDaySummary } from './employee-day';
import { createLicenseRequestWithOptionalCertificate } from './license-submit';
import { projectLifecycle } from './project-lifecycle';
import type { WorkLog } from '../types';

describe('user-facing workflow helpers', () => {
  it('defaults to light and persists dark theme', () => {
    localStorage.clear();
    expect(getInitialTheme()).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    persistTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(getInitialTheme()).toBe('dark');
  });

  it('does not mark a weekend as a pending work log', () => {
    expect(employeeDaySummary('WEEKEND', false, false)).toEqual({ label: 'Fin de semana', requiresWorkLog: false, workLogLabel: 'No requiere parte' });
  });

  it('creates a draft from the previous log without saving or copying its date/id', () => {
    const previous = { id: 'old', employeeId: 'e1', projectId: 'p1', title: 'Soporte', description: 'Detalle', date: '2026-10-02', mode: 'remoto', hours: 2, activityType: 'SUPPORT' } as WorkLog;
    const save = vi.fn();
    const draft = copyWorkLogDraft(previous, ['p1']);
    expect(draft).toMatchObject({ title: 'Soporte', projectId: 'p1', hours: '2' });
    expect(draft).not.toHaveProperty('id');
    expect(draft).not.toHaveProperty('date');
    expect(save).not.toHaveBeenCalled();
  });

  it('waits for request creation before certificate upload and retains caller state on failure', async () => {
    let rejectCreate!: (error: Error) => void;
    let formValue = 'request data';
    const create = vi.fn(() => new Promise<{ id: string }>((_, reject) => { rejectCreate = reject; }));
    const upload = vi.fn(async () => {});
    const submit = createLicenseRequestWithOptionalCertificate(create, upload, true).then(() => { formValue = ''; });
    expect(upload).not.toHaveBeenCalled();
    rejectCreate(new Error('API unavailable'));
    await expect(submit).rejects.toThrow('API unavailable');
    expect(formValue).toBe('request data');
    expect(upload).not.toHaveBeenCalled();
  });

  it('uploads only after the API returns the created license id', async () => {
    const events: string[] = [];
    await createLicenseRequestWithOptionalCertificate(
      async () => { events.push('create'); return { id: 'license-1' }; },
      async (license) => { events.push(`upload:${license.id}`); },
      true,
    );
    expect(events).toEqual(['create', 'upload:license-1']);
  });

  it('classifies project lifecycle using existing persisted statuses', () => {
    expect(projectLifecycle('vigente')).toBe('active');
    expect(projectLifecycle('pausado')).toBe('active');
    expect(projectLifecycle('completado')).toBe('completed');
    expect(projectLifecycle('archivado')).toBe('archived');
  });
});

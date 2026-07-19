import { describe, it, expect, beforeEach } from 'vitest';
import { createBackup, validateBackup, applyBackup, BACKUP_KEYS } from '../lib/backup';

const usersSlice = (withAdmin: boolean) => JSON.stringify({
  state: { users: [{ username: 'admin', active: withAdmin, modules: withAdmin ? ['admin'] : ['dashboard'] }] },
  version: 0,
});
const dataSlice = () => JSON.stringify({
  state: { treaties: [{ id: 't1' }], claims: [], retroProgrammes: [], auditLog: [] },
  version: 0,
});

describe('backup & restore', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips every stored slice', () => {
    localStorage.setItem('afrirevision-data', dataSlice());
    localStorage.setItem('afrirevision-users', usersSlice(true));
    localStorage.setItem('theme', 'dark');

    const b = createBackup('tester');
    expect(b.format).toBe('afrirevision-backup');
    expect(Object.keys(b.slices).sort()).toEqual(['afrirevision-data', 'afrirevision-users', 'theme'].sort());

    localStorage.clear();
    applyBackup(b);
    expect(localStorage.getItem('afrirevision-data')).toBe(dataSlice());
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('restore removes keys absent from the backup (true snapshot semantics)', () => {
    localStorage.setItem('afrirevision-data', dataSlice());
    const b = createBackup('tester');
    localStorage.setItem('afrirevision-fx-rates', '{"x":1}');
    applyBackup(b);
    expect(localStorage.getItem('afrirevision-fx-rates')).toBeNull();
  });

  it('validation rejects wrong format, corrupted slices, and admin lockout', () => {
    expect(validateBackup({ hello: 'world' }).ok).toBe(false);
    expect(validateBackup({ format: 'afrirevision-backup', version: 2, slices: {} }).ok).toBe(false);

    const corrupted = { format: 'afrirevision-backup', version: 1, exportedAt: '', exportedBy: '', slices: { 'afrirevision-data': '{not json' } };
    const cv = validateBackup(corrupted);
    expect(cv.ok).toBe(false);
    expect(cv.errors.some(e => e.includes('corrupted'))).toBe(true);

    const lockout = { format: 'afrirevision-backup', version: 1, exportedAt: '', exportedBy: '', slices: { 'afrirevision-users': usersSlice(false) } };
    const lv = validateBackup(lockout);
    expect(lv.ok).toBe(false);
    expect(lv.errors.some(e => e.includes('administrator'))).toBe(true);
  });

  it('valid backup passes and summarises contents', () => {
    localStorage.setItem('afrirevision-data', dataSlice());
    localStorage.setItem('afrirevision-users', usersSlice(true));
    const v = validateBackup(createBackup('tester'));
    expect(v.ok).toBe(true);
    expect(v.summary.join(' ')).toContain('1 treaties');
    expect(v.summary.join(' ')).toContain('1 user accounts');
  });

  it('key list covers the data and users slices', () => {
    expect(BACKUP_KEYS).toContain('afrirevision-data');
    expect(BACKUP_KEYS).toContain('afrirevision-users');
  });
});

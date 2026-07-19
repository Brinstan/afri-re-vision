// Full-application backup & restore (G-05).
//
// Until the backend lands, localStorage is the system of record — one cleared
// cache loses the book. This module exports every persisted slice to a single
// JSON file and restores it with validation. User accounts are included so a
// restore brings back both the data AND who may access it.

export const BACKUP_KEYS = [
  'afrirevision-data',                    // all business entities (DataStore)
  'afrirevision-users',                   // user registry & module grants
  'afrirevision-actuarial-assumptions',
  'afrirevision-ifrs17-assumptions',
  'afrirevision-pricing-assumptions',
  'afrirevision-fx-rates',
  'afrirevision-coa-custom',
  'afrirevision-bank-reconciled',
  'afrirevision-pricing-history',
  'theme',
] as const;

export interface BackupFile {
  format: 'afrirevision-backup';
  version: 1;
  exportedAt: string;
  exportedBy: string;
  slices: Record<string, string>;         // raw persisted JSON strings per key
}

export const createBackup = (exportedBy: string): BackupFile => {
  const slices: Record<string, string> = {};
  BACKUP_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) slices[key] = value;
  });
  return {
    format: 'afrirevision-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy,
    slices,
  };
};

export interface RestoreValidation {
  ok: boolean;
  errors: string[];
  summary: string[];
}

/** Validate a parsed backup before touching any stored data. */
export const validateBackup = (raw: unknown): RestoreValidation => {
  const errors: string[] = [];
  const summary: string[] = [];
  const b = raw as Partial<BackupFile>;

  if (!b || typeof b !== 'object') errors.push('Not a JSON object');
  else {
    if (b.format !== 'afrirevision-backup') errors.push('Not an AfriReVision backup file');
    if (b.version !== 1) errors.push(`Unsupported backup version: ${String(b.version)}`);
    if (!b.slices || typeof b.slices !== 'object') errors.push('Backup contains no data slices');
  }
  if (errors.length) return { ok: false, errors, summary };

  const slices = (b as BackupFile).slices;
  // Every slice must itself parse as JSON (theme is a bare string — allow it).
  Object.entries(slices).forEach(([key, value]) => {
    if (key === 'theme') return;
    try { JSON.parse(value); } catch { errors.push(`Slice "${key}" is corrupted (invalid JSON)`); }
  });

  try {
    const data = slices['afrirevision-data'] ? JSON.parse(slices['afrirevision-data']) : null;
    const s = data?.state;
    if (s) {
      summary.push(`${(s.treaties ?? []).length} treaties`);
      summary.push(`${(s.claims ?? []).length} claims`);
      summary.push(`${(s.retroProgrammes ?? []).length} retro programmes`);
      summary.push(`${(s.auditLog ?? []).length} audit entries`);
    } else if (slices['afrirevision-data']) {
      errors.push('Business data slice has no persisted state');
    }
    const users = slices['afrirevision-users'] ? JSON.parse(slices['afrirevision-users']) : null;
    if (users?.state?.users) {
      const list = users.state.users as Array<{ active: boolean; modules: string[] }>;
      summary.push(`${list.length} user accounts`);
      if (!list.some(u => u.active && (u.modules ?? []).includes('admin'))) {
        errors.push('Backup contains no active administrator — restoring would lock everyone out');
      }
    }
  } catch (e) {
    errors.push(`Could not inspect backup contents: ${String(e)}`);
  }

  const exportedAt = (b as BackupFile).exportedAt;
  if (exportedAt) summary.unshift(`Taken ${new Date(exportedAt).toLocaleString()} by ${(b as BackupFile).exportedBy || 'unknown'}`);

  return { ok: errors.length === 0, errors, summary };
};

/** Apply a validated backup. Caller must reload the app afterwards. */
export const applyBackup = (backup: BackupFile): void => {
  BACKUP_KEYS.forEach(key => {
    if (key in backup.slices) localStorage.setItem(key, backup.slices[key]);
    else localStorage.removeItem(key);
  });
};

export const backupFilename = () =>
  `afrirevision-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;

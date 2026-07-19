import { describe, it, expect } from 'vitest';
import { MODULES, MODULE_IDS, ROLE_TEMPLATES, canAccess, isAdmin, hashPassword, newSalt } from '../access/permissions';

describe('module catalogue and role templates', () => {
  it('module ids are unique and every template grants only known modules', () => {
    expect(new Set(MODULE_IDS).size).toBe(MODULES.length);
    Object.entries(ROLE_TEMPLATES).forEach(([role, mods]) => {
      mods.forEach(m => expect(MODULE_IDS, `${role} grants unknown module ${m}`).toContain(m));
    });
  });
  it('the underwriter template matches the specified access set', () => {
    expect([...ROLE_TEMPLATES['Underwriter']].sort()).toEqual(
      ['dashboard', 'pricing', 'retrocession', 'treaties', 'underwriting'].sort());
  });
  it('only the administrator template includes the admin module', () => {
    Object.entries(ROLE_TEMPLATES).forEach(([role, mods]) => {
      if (role === 'System Administrator') expect(mods).toContain('admin');
      else expect(mods).not.toContain('admin');
    });
  });
});

describe('access checks', () => {
  it('canAccess is strict: null user or missing grant denies', () => {
    expect(canAccess(null, 'claims')).toBe(false);
    expect(canAccess({ modules: ['claims'] }, 'claims')).toBe(true);
    expect(canAccess({ modules: ['claims'] }, 'accounting')).toBe(false);
    expect(isAdmin({ modules: ['admin'] })).toBe(true);
    expect(isAdmin({ modules: MODULE_IDS.filter(m => m !== 'admin') })).toBe(false);
  });
});

describe('password hashing', () => {
  it('is deterministic per salt and differs across salts/passwords', async () => {
    const salt = newSalt();
    const h1 = await hashPassword('secret123', salt);
    const h2 = await hashPassword('secret123', salt);
    const h3 = await hashPassword('secret124', salt);
    const h4 = await hashPassword('secret123', newSalt());
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).not.toBe(h4);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });
});

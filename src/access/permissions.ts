// Feature-based access control: the platform is a set of modules, and each
// user is granted access to specific modules by a System Administrator.
// Pure definitions + helpers; the persisted registry lives in UserStore.tsx.

export interface ModuleDef {
  id: string;
  label: string;
  description: string;
}

/** Every grantable feature (module) in the platform. */
export const MODULES: ModuleDef[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Executive overview, KPIs and quick actions' },
  { id: 'underwriting', label: 'Underwriting', description: 'Inward contract capture and conversion to treaties' },
  { id: 'actuarial', label: 'Actuarial Engine', description: 'Loss triangles, reserving methods, diagnostics' },
  { id: 'pricing', label: 'Pricing', description: 'Treaty pricing workstation and AI advisor' },
  { id: 'accounting', label: 'Accounting', description: 'General ledger, receivables/payables, statements' },
  { id: 'claims', label: 'Claims', description: 'Claims processing and treaty linkage' },
  { id: 'treaties', label: 'Treaties', description: 'Treaty administration and premium bookings' },
  { id: 'retrocession', label: 'Retrocession', description: 'Outward programmes, recoveries, counterparties' },
  { id: 'ifrs', label: 'IFRS 17', description: 'IFRS 17 measurement and reporting' },
  { id: 'admin', label: 'Administration', description: 'User accounts and module access management' },
];

export const MODULE_IDS = MODULES.map(m => m.id);

/** Role templates: a starting set of modules the admin can then tailor per user. */
export const ROLE_TEMPLATES: Record<string, string[]> = {
  'System Administrator': MODULE_IDS,
  'Underwriter': ['dashboard', 'underwriting', 'pricing', 'treaties', 'retrocession'],
  'Claims Officer': ['dashboard', 'claims', 'treaties'],
  'Accountant': ['dashboard', 'accounting', 'treaties'],
  'Actuary': ['dashboard', 'actuarial', 'pricing', 'ifrs'],
  'Finance Manager': ['dashboard', 'accounting', 'ifrs', 'retrocession', 'treaties'],
  'Executive': ['dashboard', 'actuarial', 'pricing', 'accounting', 'claims', 'treaties', 'retrocession', 'ifrs', 'underwriting'],
  'Custom': ['dashboard'],
};

export const ROLES = Object.keys(ROLE_TEMPLATES);

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  role: string;
  /** Module ids this user may access (granted by an administrator). */
  modules: string[];
  /** SHA-256 hex of `${salt}:${password}`. */
  passwordHash: string;
  salt: string;
  active: boolean;
  /** True while the seeded default admin password is unchanged. */
  mustChangePassword: boolean;
  createdAt: string;
  lastLogin?: string;
}

export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const newSalt = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');

export const canAccess = (user: { modules: string[] } | null, moduleId: string): boolean =>
  !!user && user.modules.includes(moduleId);

export const isAdmin = (user: { modules: string[] } | null): boolean => canAccess(user, 'admin');

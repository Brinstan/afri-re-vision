import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserAccount, ROLE_TEMPLATES, hashPassword, newSalt } from '../access/permissions';

// Persisted user registry, separate from business data so "Reset Data" never
// wipes accounts. The seeded administrator signs in with admin / admin123 and
// is prompted to change the password (empty hash = seed credential sentinel).

const seedAdmin: UserAccount = {
  id: 'USR-ADMIN',
  username: 'admin',
  displayName: 'System Administrator',
  role: 'System Administrator',
  modules: ROLE_TEMPLATES['System Administrator'],
  passwordHash: '',
  salt: 'seed',
  active: true,
  mustChangePassword: true,
  createdAt: new Date().toISOString(),
};

const DEFAULT_ADMIN_PASSWORD = 'admin123';

interface UserStore {
  users: UserAccount[];
  authenticate: (username: string, password: string) => Promise<UserAccount | null>;
  addUser: (input: {
    username: string; displayName: string; role: string; modules: string[]; password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  updateUser: (id: string, changes: Partial<Pick<UserAccount, 'displayName' | 'role' | 'modules' | 'active'>>) => void;
  setPassword: (id: string, password: string) => Promise<void>;
  removeUser: (id: string) => void;
  hasSeedAdminPassword: () => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [seedAdmin],

      authenticate: async (username, password) => {
        const user = get().users.find(
          u => u.username.toLowerCase() === username.trim().toLowerCase()
        );
        if (!user || !user.active) return null;
        let valid: boolean;
        if (user.passwordHash === '') {
          valid = password === DEFAULT_ADMIN_PASSWORD;
        } else {
          valid = (await hashPassword(password, user.salt)) === user.passwordHash;
        }
        if (!valid) return null;
        set(state => ({
          users: state.users.map(u =>
            u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
          ),
        }));
        return user;
      },

      addUser: async ({ username, displayName, role, modules, password }) => {
        const name = username.trim().toLowerCase();
        if (!name) return { ok: false, error: 'Username is required' };
        if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };
        if (get().users.some(u => u.username.toLowerCase() === name)) {
          return { ok: false, error: 'Username already exists' };
        }
        const salt = newSalt();
        const passwordHash = await hashPassword(password, salt);
        const user: UserAccount = {
          id: `USR-${Date.now()}`,
          username: name,
          displayName: displayName.trim() || username,
          role,
          modules: modules.length ? modules : ['dashboard'],
          passwordHash,
          salt,
          active: true,
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ users: [...state.users, user] }));
        return { ok: true };
      },

      updateUser: (id, changes) =>
        set(state => ({
          users: state.users.map(u => (u.id === id ? { ...u, ...changes } : u)),
        })),

      setPassword: async (id, password) => {
        const salt = newSalt();
        const passwordHash = await hashPassword(password, salt);
        set(state => ({
          users: state.users.map(u =>
            u.id === id ? { ...u, salt, passwordHash, mustChangePassword: false } : u
          ),
        }));
      },

      removeUser: id =>
        set(state => ({ users: state.users.filter(u => u.id !== id) })),

      hasSeedAdminPassword: () =>
        get().users.some(u => u.username === 'admin' && u.passwordHash === ''),
    }),
    { name: 'afrirevision-users' }
  )
);

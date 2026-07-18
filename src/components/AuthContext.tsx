import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useUserStore } from './UserStore';
import { canAccess } from '../access/permissions';

interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  modules: string[];
  mustChangePassword: boolean;
}

interface AuthContextType {
  user: SessionUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasModule: (moduleId: string) => boolean;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (undefined === context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const toSession = (u: {
  id: string; username: string; displayName: string; role: string;
  modules: string[]; mustChangePassword: boolean;
}): SessionUser => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
  role: u.role,
  modules: u.modules,
  mustChangePassword: u.mustChangePassword,
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    const account = await useUserStore.getState().authenticate(username, password);
    if (!account) return false;
    const session = toSession(account);
    setUser(session);
    localStorage.setItem('user', JSON.stringify(session));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  /** Re-read the signed-in user's account (after an admin edit or password change). */
  const refreshSession = () => {
    setUser(current => {
      if (!current) return current;
      const account = useUserStore.getState().users.find(u => u.id === current.id);
      if (!account || !account.active) {
        localStorage.removeItem('user');
        return null;
      }
      const session = toSession(account);
      localStorage.setItem('user', JSON.stringify(session));
      return session;
    });
  };

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Only restore sessions that map to a live, active registry account.
      const account = useUserStore.getState().users.find(u => u.id === parsed.id);
      if (account && account.active) {
        setUser(toSession(account));
      } else {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasModule: (moduleId: string) => canAccess(user, moduleId),
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

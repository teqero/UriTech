import { createContext, useContext, type ReactNode } from 'react';
import { type ProfileTheme } from '@uritech/shared';
import { useAuth } from './AuthContext';

const ProfileThemeContext = createContext<ProfileTheme | null>(null);

export function ProfileThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useAuth();
  return <ProfileThemeContext.Provider value={theme}>{children}</ProfileThemeContext.Provider>;
}

export function useProfileTheme(): ProfileTheme {
  const ctx = useContext(ProfileThemeContext);
  const { theme } = useAuth();
  return ctx ?? theme ?? { primary: '#00AA13', accent: '#F06400', headerBg: '#00AA13', tabBarActive: '#00AA13', label: 'Cliente' };
}

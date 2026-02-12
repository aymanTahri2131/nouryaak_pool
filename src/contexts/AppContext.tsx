import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Language } from '@/types';
import { authApi, getAccessToken } from '@/apis';
import { SocketProvider } from '@/components/SocketProvider';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string, fr: string, ar: string) => string;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => Promise<void>;
  isAuthReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const t = useCallback(
    (en: string, fr: string, ar: string) => {
      if (language === 'ar') return ar;
      if (language === 'fr') return fr;
      return en;
    },
    [language]
  );

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (getAccessToken()) {
        try {
          const user = await authApi.me();
          setCurrentUser(user);
        } catch {
          setCurrentUser(null);
        }
      }
      setIsAuthReady(true);
    };
    initAuth();
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        currentUser,
        setCurrentUser,
        logout,
        isAuthReady,
      }}
    >
      <SocketProvider currentUser={currentUser}>{children}</SocketProvider>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

import { ReactNode, useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Language } from '@/types';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Coffee,
  ChefHat,
  Trophy,
  Package,
  BarChart3,
  Menu,
  X,
  Globe,
  User,
  Users,
  LogOut,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom 8-ball icon for Pool Tables
const PoolBallIcon = ({ className }: { className?: string }) => (
  <div className={cn('relative flex items-center justify-center', className)}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full">
      <circle cx="12" cy="12" r="10" />
      <text x="12" y="12" textAnchor="middle" dominantBaseline="central" fill="currentColor" stroke="none" fontSize="12" fontWeight="bold">8</text>
    </svg>
  </div>
);

interface AppLayoutProps {
  children?: ReactNode;
}

const navigation = [
  {
    path: '/reports',
    icon: BarChart3,
    labelEn: 'Reports & Statistics',
    labelFr: 'Rapports et Statistiques',
    labelAr: 'التقارير والإحصائيات',
    roles: ['admin', 'waiter', 'pool_manager']
  },
  {
    path: '/users',
    icon: Users,
    labelEn: 'Users Management',
    labelFr: 'Gestion des Utilisateurs',
    labelAr: 'إدارة المستخدمين',
    roles: ['admin']
  },
  {
    path: '/products',
    icon: Package,
    labelEn: 'Products Management',
    labelFr: 'Gestion des Produits',
    labelAr: 'إدارة المنتجات',
    roles: ['admin']
  },
  {
    path: '/pool-management',
    icon: Settings,
    labelEn: 'Pool Management',
    labelAr: 'إدارة البلياردو',
    labelFr: 'Gestion Billard',
    roles: ['admin', 'pool_manager']
  },
  {
    path: '/tables',
    icon: Coffee,
    labelEn: 'Café Tables',
    labelFr: 'Tables Café',
    labelAr: 'طاولات المقهى',
    roles: ['admin', 'waiter']
  },
  {
    path: '/bartender',
    icon: ChefHat,
    labelEn: 'Preparation Queue',
    labelFr: 'File de Préparation',
    labelAr: 'قائمة التحضير',
    roles: ['admin', 'waiter', 'bartender']
  },
  {
    path: '/pool',
    icon: PoolBallIcon,
    labelEn: 'Pool Tables',
    labelFr: 'Tables de Billard',
    labelAr: 'طاولات البلياردو',
    roles: ['pool_manager']
  },
];

const getNavItems = (role: string) => {
  if (role === 'admin') {
    return navigation.filter(item => item.roles.includes('admin'));
  }
  if (role === 'waiter') {
    // Reports, Café Tables, Prep Queue
    return [
      navigation.find(n => n.path === '/reports'),
      navigation.find(n => n.path === '/tables'),
      navigation.find(n => n.path === '/bartender'),
    ].filter(Boolean) as typeof navigation;
  }
  if (role === 'bartender') {
    // Only Prep Queue
    return navigation.filter(item => item.path === '/bartender');
  }
  if (role === 'pool_manager') {
    // Reports, Pool Tables, Pool Management
    return [
      navigation.find(n => n.path === '/reports'),
      navigation.find(n => n.path === '/pool'),
      navigation.find(n => n.path === '/pool-management'),
    ].filter(Boolean) as typeof navigation;
  }
  return [];
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { language, setLanguage, t, currentUser, logout } = useApp();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 overflow-y-auto lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full lg:ltr:translate-x-0 lg:rtl:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-white rounded-lg">
              <img src="/NooryakBg.png" alt="Nouryaak Pool" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">Nouryaak Pool</h1>
              <p className="text-xs text-sidebar-foreground/70">POS System</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {currentUser && getNavItems(currentUser.role).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all touch-target',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t(item.labelEn ?? '', item.labelFr ?? '', item.labelAr ?? '')}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => {
              const next: Record<Language, Language> = { en: 'fr', fr: 'ar', ar: 'en' };
              setLanguage(next[language]);
            }}
          >
            <Globe className="h-5 w-5" />
            {language === 'en' ? 'Français' : language === 'fr' ? 'العربية' : 'English'}
          </Button>

          {/* Current User & Logout */}
          {currentUser && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{currentUser.name}</p>
                  <p className="text-xs text-sidebar-foreground/70 capitalize">{currentUser.role.replace('_', ' ')}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => logout()}
              >
                <LogOut className="h-5 w-5" />
                {t('Logout', 'Déconnexion', 'تسجيل الخروج')}
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Quick language toggle for desktop */}
          <Button
            variant="outline"
            size="sm"
            className="hidden lg:flex gap-2"
            onClick={() => {
              const next: Record<Language, Language> = { en: 'fr', fr: 'ar', ar: 'en' };
              setLanguage(next[language]);
            }}
          >
            <Globe className="h-4 w-4" />
            {language.toUpperCase()}
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 min-w-0">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};

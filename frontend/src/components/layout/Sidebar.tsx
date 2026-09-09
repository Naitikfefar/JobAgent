import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Briefcase, FileText, Mail, BarChart3, User, LogOut, TrendingUp, Sun, Moon, Trophy, Star 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';
import { getMySubscription } from '@/services/api';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const theme = useTheme();
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    const loadSubscription = async () => {
      if (user) {
        try {
          const res = await getMySubscription();
          setCurrentPlan(res.data.plan);
        } catch (err) {
          console.error('Failed to load subscription:', err);
        }
      }
    };

    loadSubscription();
  }, [user]);

  function ThemeToggle() {
    const { isDark, toggleTheme } = theme || { isDark: false, toggleTheme: () => {} };
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full"
      >
        {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        <span className="text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
    );
  }

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Jobs', path: '/jobs' },
    { icon: FileText, label: 'Resume', path: '/resume' },
    { icon: Trophy, label: 'Career Growth', path: '/career' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: TrendingUp, label: 'Skill Gap', path: '/skill-gap' },
    { icon: Mail, label: 'Cover Letters', path: '/cover-letters' },
    { icon: BarChart3, label: 'Applications', path: '/applications' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0A0A0F] border-r border-slate-200 dark:border-[#2A2A3E] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 dark:border-[#2A2A3E]">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            JobCopilot
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-primary/10 text-primary font-semibold dark:text-white' : 'text-slate-600 dark:text-[#A0A0B8] hover:bg-slate-50 dark:hover:bg-[#12121A] hover:text-slate-900 dark:hover:text-white'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#2A2A3E] space-y-4">
          {/* Upgrade Banner for Free Users */}
          {currentPlan === 'free' && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">Free Plan</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Upgrade for unlimited jobs + interview prep</p>
              <Link
                to="/pricing"
                className="mt-2 block text-center text-xs bg-purple-600 text-white rounded-lg py-1.5 font-medium hover:bg-purple-700 transition-colors"
              >
                Upgrade to Pro →
              </Link>
            </div>
          )}

          {/* Theme toggle */}
          <ThemeToggle />

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 dark:text-[#A0A0B8] hover:bg-slate-50 dark:hover:bg-[#12121A] hover:text-slate-900 dark:hover:text-white rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
        </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 dark:bg-[#0A0A0F]">
        {children}
      </main>
    </div>
  );
}

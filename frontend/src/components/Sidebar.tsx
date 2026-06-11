import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Calendar, Settings, LogOut, Sparkles, StickyNote, Code2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import WhatsNewDialog from './shared/WhatsNewDialog';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuthStore();
  const [showWhatsNew, setShowWhatsNew] = React.useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = (isActive: boolean) => cn(
    "flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors",
    isActive 
      ? "bg-primary/10 text-primary border-l-4 border-primary" 
      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
  );

  return (
    <aside className={cn(
      "w-[260px] bg-background/95 backdrop-blur-xl border-r border-border flex flex-col h-screen p-6 shrink-0 z-50 transition-transform duration-300 ease-in-out fixed md:relative",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40 flex items-center justify-center">
          <Code2 size={18} className="text-white" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">DevTracker</h2>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        <NavLink to="/" onClick={onClose} className={({ isActive }) => navItemClass(isActive)} end>
          <LayoutDashboard size={20} />
          <span>{t('sidebar.dashboard')}</span>
        </NavLink>
        <NavLink to="/projects" onClick={onClose} className={({ isActive }) => cn(navItemClass(isActive), "sidebar-projects")}>
          <FolderKanban size={20} />
          <span>{t('sidebar.projects')}</span>
        </NavLink>
        <NavLink to="/tasks" onClick={onClose} className={({ isActive }) => navItemClass(isActive)}>
          <CheckSquare size={20} />
          <span>{t('sidebar.tasks')}</span>
        </NavLink>
        <NavLink to="/planner" onClick={onClose} className={({ isActive }) => navItemClass(isActive)}>
          <Calendar size={20} />
          <span>{t('sidebar.planner')}</span>
        </NavLink>
        <NavLink to="/notes" onClick={onClose} className={({ isActive }) => navItemClass(isActive)}>
          <StickyNote size={20} />
          <span>Notes</span>
        </NavLink>
        <NavLink to="/settings" onClick={onClose} className={({ isActive }) => navItemClass(isActive)}>
          <Settings size={20} />
          <span>{t('sidebar.settings')}</span>
        </NavLink>
        <button 
          onClick={() => setShowWhatsNew(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors text-muted-foreground hover:bg-white/5 hover:text-foreground text-left mt-2 border border-primary/20 bg-primary/5 text-primary"
        >
          <Sparkles size={20} />
          <span>Nouveautés</span>
        </button>
      </nav>

      <WhatsNewDialog isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />

      <div className="mt-auto border-t border-border pt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleLanguage} title={t('sidebar.language')} className="shrink-0 rounded-full">
            {i18n.language.toUpperCase()}
          </Button>
        </div>
        <Button variant="outline" className="w-full flex items-center gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;

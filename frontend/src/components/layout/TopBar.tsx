import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import PomodoroTimer from '../shared/PomodoroTimer';
import GlobalTimer from '../shared/GlobalTimer';
import { Moon, Sun, Bell, WifiOff, BrainCircuit, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import AiSuggestionsWidget from '../dashboard/AiSuggestionsWidget';
import { Button } from '../ui/button';
import { useOfflineStore } from '../../store/offlineStore';
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isOffline = useOfflineStore(state => state.isOffline);
  const { t, i18n } = useTranslation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('topbar.morning', 'Good morning');
    if (hour < 18) return t('topbar.afternoon', 'Good afternoon');
    return t('topbar.evening', 'Good evening');
  };

  const dateStr = new Date().toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 z-10 sticky top-0">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu size={20} />
          </Button>
        )}
        <div className="flex flex-col hidden sm:flex">
          <h1 className="text-lg font-semibold tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Développeur'}
          </h1>
          <span className="text-xs text-muted-foreground capitalize">{dateStr}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {isOffline && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded-full">
            <WifiOff size={14} /> {t('topbar.offline', 'Offline')}
          </div>
        )}
        <div className="hidden lg:block">
          <GlobalTimer />
        </div>
        <PomodoroTimer />
        
        <div className="flex items-center gap-0 md:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex text-primary hover:bg-primary/10">
                <BrainCircuit size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0 border-none bg-transparent shadow-none">
              <AiSuggestionsWidget />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                <Bell size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-6 text-center text-sm text-muted-foreground">
                {t('topbar.noNotifications', 'Aucune nouvelle notification')}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold ml-2">
            {user?.name?.[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

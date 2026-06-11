import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import TopBar from './TopBar';
import AIChat from '../shared/AIChat';
import QuickCapture from '../shared/QuickCapture';
import CommandPalette from '../shared/CommandPalette';
import DailyStandup from '../shared/DailyStandup';
import OnboardingOverlay from '../shared/OnboardingOverlay';

const AppShell: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Overlay for mobile when sidebar is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
      <AIChat />
      <QuickCapture />
      <CommandPalette />
      <DailyStandup />
      <OnboardingOverlay />
    </div>
  );
};

export default AppShell;

import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, CheckSquare, Folder, LayoutDashboard, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => {
          if (!prev) setSearch('');
          return !prev;
        });
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const routes = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
    { name: 'Projects', path: '/projects', icon: <Folder size={16} /> },
    { name: 'Tasks', path: '/tasks', icon: <CheckSquare size={16} /> },
    { name: 'Planner', path: '/planner', icon: <CheckSquare size={16} /> },
    { name: 'Notes', path: '/notes', icon: <FileText size={16} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={16} /> },
  ];

  const filteredRoutes = routes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
      <div 
        className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-border">
          <Search size={18} className="text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground text-lg"
            placeholder="Search commands, projects, tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="max-h-96 overflow-y-auto py-2">
          {filteredRoutes.length > 0 && (
            <div className="px-2 mb-2">
              <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">Navigation</div>
              {filteredRoutes.map(route => (
                <button
                  key={route.path}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors text-left"
                  onClick={() => {
                    navigate(route.path);
                    setIsOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">{route.icon}</span>
                  {route.name}
                </button>
              ))}
            </div>
          )}
          {filteredRoutes.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
    </div>
  );
};

export default CommandPalette;

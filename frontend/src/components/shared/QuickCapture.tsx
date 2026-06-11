import React, { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../api/axios';
import { useQueryClient } from '@tanstack/react-query';

const QuickCapture: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState<'task' | 'note'>('task');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    try {
      if (type === 'task') {
        await api.post('/tasks', { title: content.trim(), projectId: null });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else {
        await api.post('/notes', { title: 'Note rapide', content: content.trim() });
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
      setContent('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to capture', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-lg transition-transform duration-200 ${isOpen ? 'rotate-45 bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:scale-105'}`}
        >
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-card border border-border rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-bottom-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Quick Capture</h3>
            <textarea
              autoFocus
              className="w-full h-24 p-3 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2 bg-muted p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType('task')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === 'task' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Task
                </button>
                <button
                  type="button"
                  onClick={() => setType('note')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === 'note' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Note
                </button>
              </div>
              <Button type="submit" size="sm" disabled={!content.trim() || loading} className="gap-2">
                Save <Check size={14} />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default QuickCapture;

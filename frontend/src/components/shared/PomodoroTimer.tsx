import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { usePomodoroStore } from '../../store/pomodoroStore';
import { Button } from '../ui/button';
import api from '../../api/axios';

const PomodoroTimer: React.FC = () => {
  const { isRunning, timeLeft, currentTaskId, start, pause, reset, tick } = usePomodoroStore();
  const [tasks, setTasks] = useState<{id: string, title: string}[]>([]);

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = window.setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  useEffect(() => {
    // Fetch user tasks for the selector
    api.get('/tasks/all').then(res => setTasks(res.data)).catch(() => {});
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="topbar-timer flex items-center gap-1 md:gap-3 bg-secondary/30 px-2 md:px-4 py-1 md:py-2 rounded-lg border border-border">
      <select 
        className="bg-transparent border-none text-xs md:text-sm outline-none text-foreground w-16 md:w-32 truncate hidden sm:block"
        value={currentTaskId || ''}
        onChange={(e) => {
          if (e.target.value) {
            usePomodoroStore.setState({ currentTaskId: e.target.value });
          }
        }}
        disabled={isRunning}
      >
        <option value="">Select task...</option>
        {tasks.map(t => (
          <option key={t.id} value={t.id}>{t.title}</option>
        ))}
      </select>
      <div className="text-sm md:text-lg font-mono font-bold w-12 md:w-16 text-center">
        {formatTime(timeLeft)}
      </div>
      <div className="flex items-center">
        {isRunning ? (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={pause}>
            <Pause size={14} />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => start()}>
            <Play size={14} />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={reset}>
          <RotateCcw size={14} />
        </Button>
      </div>
    </div>
  );
};

export default PomodoroTimer;

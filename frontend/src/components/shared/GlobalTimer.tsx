import React, { useEffect } from 'react';
import { Square, Loader2 } from 'lucide-react';
import { useTimeTrackingStore } from '../../store/timeTrackingStore';
import { Button } from '../ui/button';

const formatTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const GlobalTimer: React.FC = () => {
  const { 
    activeTaskId, 
    activeTaskTitle, 
    elapsedSeconds, 
    isLoading, 
    stopTimer, 
    tick, 
    fetchCurrentTimer 
  } = useTimeTrackingStore();

  useEffect(() => {
    fetchCurrentTimer();
  }, [fetchCurrentTimer]);

  useEffect(() => {
    if (!activeTaskId) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTaskId, tick]);

  if (!activeTaskId) return null;

  return (
    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col">
        <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Tracking Time</span>
        <span className="text-xs font-medium max-w-[120px] truncate">{activeTaskTitle}</span>
      </div>
      
      <div className="font-mono text-sm font-semibold tabular-nums text-primary w-[50px] text-center">
        {formatTime(elapsedSeconds)}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-6 h-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
        onClick={() => stopTimer()}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Square size={10} fill="currentColor" />}
      </Button>
    </div>
  );
};

export default GlobalTimer;

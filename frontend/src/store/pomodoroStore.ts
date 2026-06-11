import { create } from 'zustand';

interface PomodoroStore {
  isRunning: boolean;
  timeLeft: number; // in seconds
  currentTaskId: string | null;
  sessionCount: number;
  start: (taskId?: string) => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

const DEFAULT_TIME = 25 * 60; // 25 minutes

export const usePomodoroStore = create<PomodoroStore>((set) => ({
  isRunning: false,
  timeLeft: DEFAULT_TIME,
  currentTaskId: null,
  sessionCount: 0,
  start: (taskId?: string) => set((state) => ({ 
    isRunning: true, 
    currentTaskId: taskId || state.currentTaskId 
  })),
  pause: () => set({ isRunning: false }),
  reset: () => set({ isRunning: false, timeLeft: DEFAULT_TIME, currentTaskId: null }),
  tick: () => set((state) => {
    if (state.timeLeft <= 1) {
      return { isRunning: false, timeLeft: 0, sessionCount: state.sessionCount + 1 };
    }
    return { timeLeft: state.timeLeft - 1 };
  }),
}));

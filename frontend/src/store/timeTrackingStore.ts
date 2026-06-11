import { create } from 'zustand';
import api from '../api/axios';

interface TimeTrackingState {
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  startTime: Date | null;
  elapsedSeconds: number;
  isLoading: boolean;
  
  // Actions
  fetchCurrentTimer: () => Promise<void>;
  startTimer: (taskId: string, title: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  tick: () => void;
}

export const useTimeTrackingStore = create<TimeTrackingState>((set, get) => ({
  activeTaskId: null,
  activeTaskTitle: null,
  startTime: null,
  elapsedSeconds: 0,
  isLoading: false,

  fetchCurrentTimer: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/time-entries/current');
      const data = response.data;
      if (data && !data.endTime) {
        const startTime = new Date(data.startTime);
        const elapsedSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        set({
          activeTaskId: data.taskId,
          activeTaskTitle: data.task?.title || 'Unknown Task',
          startTime,
          elapsedSeconds,
        });
      } else {
        set({ activeTaskId: null, activeTaskTitle: null, startTime: null, elapsedSeconds: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch current timer', error);
    } finally {
      set({ isLoading: false });
    }
  },

  startTimer: async (taskId: string, title: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post(`/time-entries/start/${taskId}`);
      const startTime = new Date(response.data.startTime);
      set({
        activeTaskId: taskId,
        activeTaskTitle: title,
        startTime,
        elapsedSeconds: 0,
      });
    } catch (error) {
      console.error('Failed to start timer', error);
    } finally {
      set({ isLoading: false });
    }
  },

  stopTimer: async () => {
    const { activeTaskId } = get();
    if (!activeTaskId) return;

    set({ isLoading: true });
    try {
      await api.post(`/time-entries/stop/${activeTaskId}`);
      set({
        activeTaskId: null,
        activeTaskTitle: null,
        startTime: null,
        elapsedSeconds: 0,
      });
      // A full refresh or global state sync might be needed to update the UI
      window.dispatchEvent(new Event('task-updated'));
    } catch (error) {
      console.error('Failed to stop timer', error);
    } finally {
      set({ isLoading: false });
    }
  },

  tick: () => {
    const { startTime, activeTaskId } = get();
    if (activeTaskId && startTime) {
      const elapsedSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      set({ elapsedSeconds });
    }
  },
}));

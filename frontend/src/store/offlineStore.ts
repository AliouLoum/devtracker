import { create } from 'zustand';
import api from '../api/axios';

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: any;
  headers?: any;
}

interface OfflineStore {
  isOffline: boolean;
  queuedRequests: QueuedRequest[];
  setOffline: (status: boolean) => void;
  enqueueRequest: (req: Omit<QueuedRequest, 'id'>) => void;
  syncRequests: () => Promise<void>;
}

const STORAGE_KEY = 'devtracker_offline_queue';

const getInitialQueue = (): QueuedRequest[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  isOffline: !navigator.onLine,
  queuedRequests: getInitialQueue(),
  setOffline: (status: boolean) => set({ isOffline: status }),
  enqueueRequest: (req) => {
    const newReq = { ...req, id: Date.now().toString() };
    set((state) => {
      const newQueue = [...state.queuedRequests, newReq];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newQueue));
      return { queuedRequests: newQueue };
    });
  },
  syncRequests: async () => {
    const { queuedRequests } = get();
    if (queuedRequests.length === 0) return;

    console.log(`Syncing ${queuedRequests.length} offline requests...`);
    
    // Clear queue before syncing to avoid duplicate syncs
    set({ queuedRequests: [] });
    localStorage.removeItem(STORAGE_KEY);

    for (const req of queuedRequests) {
      try {
        await api({
          method: req.method,
          url: req.url,
          data: req.data,
          headers: req.headers,
        });
      } catch (err) {
        console.error('Failed to sync request:', req, err);
        // Put it back if it failed for reasons other than 4xx?
        // Keep simple: if it fails on sync, we discard it to avoid blocking queue
      }
    }
  }
}));

// Listen to online/offline events
window.addEventListener('online', () => {
  useOfflineStore.getState().setOffline(false);
  useOfflineStore.getState().syncRequests();
});

window.addEventListener('offline', () => {
  useOfflineStore.getState().setOffline(true);
});

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  connect: (token: string) => void;
  disconnect: () => void;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connect: (token: string) => {
    const currentSocket = get().socket;
    if (currentSocket) return;

    const socket = io('/', {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    set({ socket });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
  joinProject: (projectId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('joinProject', projectId);
    }
  },
  leaveProject: (projectId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leaveProject', projectId);
    }
  },
}));

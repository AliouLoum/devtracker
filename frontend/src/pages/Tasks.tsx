import React, { useState } from 'react';
import { Plus, LayoutList, Kanban, Calendar as CalendarIcon } from 'lucide-react';
import api from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { ConfirmDialog } from '../components/ConfirmDialog';

import TaskTableView from '../components/TaskTableView';
import TaskBoardView from '../components/TaskBoardView';
import TaskCalendarView from '../components/TaskCalendarView';
import TaskSidePeek from '../components/TaskSidePeek';
import { useSocketStore } from '../store/socketStore';
import { useTranslation } from 'react-i18next';

import type { Task } from '../types/task';

const Tasks: React.FC = () => {
  const queryClient = useQueryClient();
  const socket = useSocketStore(state => state.socket);
  const joinProject = useSocketStore(state => state.joinProject);
  const leaveProject = useSocketStore(state => state.leaveProject);
  const [activeView, setActiveView] = useState<'list' | 'board' | 'calendar'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const { t } = useTranslation();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks/all');
      return res.data;
    }
  });

  React.useEffect(() => {
    if (!socket || tasks.length === 0) return;
    
    // Get unique project IDs
    const projectIds = new Set(tasks.map(t => t.projectId).filter(Boolean));
    
    projectIds.forEach(id => joinProject(id as string));

    const handleTaskUpdated = (updatedTask: Task) => {
      queryClient.setQueryData<Task[]>(['tasks'], old => {
        if (!old) return old;
        const exists = old.some(t => t.id === updatedTask.id);
        if (exists) {
          return old.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t);
        }
        return [...old, updatedTask];
      });
    };

    socket.on('task:updated', handleTaskUpdated);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      projectIds.forEach(id => leaveProject(id as string));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, tasks.length, joinProject, leaveProject, queryClient]);

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskToDelete(null);
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Task> }) => api.patch(`/tasks/${id}`, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      
      // Special case for status updates which use the /status endpoint in our backend usually
      // Actually, our API /tasks/:id endpoint in backend supports status, title, notes, dueDate, priority updates.
      // We will ensure the backend TasksController update() handles all.
      
      queryClient.setQueryData<Task[]>(['tasks'], old => 
        old?.map(t => t.id === id ? { ...t, ...updates } : t)
      );
      return { previousTasks };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // We should also invalidate dashboard and evolution if status changed, but a simple page refresh handles it, 
      // or we can just invalidate globally if needed.
    }
  });

  const handleCreateTask = async () => {
    try {
      const res = await api.post('/tasks', { title: t('tasks.defaultNewTask') });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Open the side-peek for the new task immediately
      setSelectedTask(res.data);
    } catch (error) {
      console.error("Failed to create task", error);
    }
  };

  const handleUpdateTask = (task: Task, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ id: task.id, updates });
  };

  const handleSidePeekUpdate = (updatedTask: Task) => {
    // Optimistically update the UI while queryClient refetches
    queryClient.setQueryData<Task[]>(['tasks'], old => 
      old?.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
    );
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-muted-foreground">{t('tasks.loading')}</div>;

  return (
    <div className="flex flex-col h-full gap-6 w-full max-w-[1400px] mx-auto overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('tasks.title')}</h1>
          <p className="text-muted-foreground">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-muted p-1 rounded-lg flex">
            <button 
              onClick={() => setActiveView('list')} 
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeView === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutList size={16} /> {t('tasks.list')}
            </button>
            <button 
              onClick={() => setActiveView('board')} 
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeView === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Kanban size={16} /> {t('tasks.board')}
            </button>
            <button 
              onClick={() => setActiveView('calendar')} 
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeView === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <CalendarIcon size={16} /> {t('tasks.calendar')}
            </button>
          </div>
          <Button className="gap-2" onClick={handleCreateTask}>
            <Plus size={16} /> {t('tasks.newTask')}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {activeView === 'list' && (
          <TaskTableView 
            tasks={tasks} 
            onTaskClick={setSelectedTask} 
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask}
          />
        )}
        {activeView === 'board' && (
          <TaskBoardView 
            tasks={tasks} 
            onTaskClick={setSelectedTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        {activeView === 'calendar' && (
          <TaskCalendarView tasks={tasks} onTaskClick={setSelectedTask} onUpdateTask={handleUpdateTask} />
        )}
      </div>

      <TaskSidePeek 
        task={selectedTask} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        onUpdate={handleSidePeekUpdate}
      />
      
      <ConfirmDialog 
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        title={t('taskSidePeek.confirmDeleteTitle', 'Supprimer la tâche')}
        description={t('taskSidePeek.confirmDeleteDesc', 'Voulez-vous vraiment supprimer cette tâche ? Cette action est irréversible.')}
        confirmText={t('common.delete', 'Supprimer')}
      />
    </div>
  );
};

export default Tasks;

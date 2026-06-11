import React, { useEffect, useState } from 'react';
import { Clock, CalendarDays, CheckCircle2, Circle, AlertCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ConfirmDialog } from '../ConfirmDialog';
import api from '../../api/axios';

interface Task {
  id: string;
  title: string;
  notes: string;
  status: string;
  dueDate: string;
  estimatedMinutes: number;
  timeSpentSeconds: number;
}

interface ProjectPlanningProps {
  projectId: string;
}

export const ProjectPlanning: React.FC<ProjectPlanningProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks', { params: { projectId } });
        // Sort by dueDate
        const sortedTasks = response.data.sort((a: Task, b: Task) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        setTasks(sortedTasks);
      } catch (error) {
        console.error("Failed to load project tasks", error);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchTasks();
  }, [projectId]);

  if (loading) {
    return <div className="animate-pulse h-40 bg-muted/20 rounded-xl" />;
  }

  const formatTime = (minutes: number, seconds: number) => {
    const estimatedHours = Math.round(minutes / 60 * 10) / 10;
    const spentHours = Math.round(seconds / 3600 * 10) / 10;
    return { estimatedHours, spentHours };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'doing': return <Clock className="text-blue-500" size={20} />;
      default: return <Circle className="text-muted-foreground" size={20} />;
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete}`);
      setTasks(prev => prev.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarDays size={20} /> Planning & Tâches</CardTitle>
        <CardDescription>Suivi des tâches, durées estimées et temps restant.</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-6">Aucune tâche assignée à ce projet.</p>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => {
              const { estimatedHours, spentHours } = formatTime(task.estimatedMinutes, task.timeSpentSeconds);
              let progress = estimatedHours > 0 ? (spentHours / estimatedHours) * 100 : 0;
              if (progress > 100) progress = 100;
              
              const isOvertime = spentHours > estimatedHours;

              return (
                <div key={task.id} className="flex flex-col p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                      <div>
                        <h4 className="font-semibold text-base leading-tight">{task.title}</h4>
                        {task.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.dueDate && (
                        <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md whitespace-nowrap">
                          Échéance : {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      <button onClick={() => setTaskToDelete(task.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors bg-secondary/30 rounded-md">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progression du temps</span>
                      <div className="flex items-center gap-2 font-medium">
                        <span className={isOvertime ? 'text-destructive' : ''}>{spentHours}h</span>
                        <span className="text-muted-foreground">/ {estimatedHours}h</span>
                        {isOvertime && <AlertCircle size={14} className="text-destructive ml-1" />}
                      </div>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${isOvertime ? 'bg-destructive' : 'bg-primary'}`} 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {isOvertime 
                          ? `Dépassé de ${Math.round((spentHours - estimatedHours) * 10) / 10}h` 
                          : `Reste ${Math.round((estimatedHours - spentHours) * 10) / 10}h`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <ConfirmDialog 
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        title="Supprimer la tâche"
        description="Voulez-vous vraiment supprimer cette tâche ? Cette action est irréversible."
        confirmText="Supprimer"
      />
    </Card>
  );
};

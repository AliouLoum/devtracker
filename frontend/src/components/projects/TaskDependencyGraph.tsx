import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Network, CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  dependsOnIds: string[];
}

export const TaskDependencyGraph: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.get(`/projects/${projectId}/tasks`).then(res => setTasks(res.data)).catch(console.error);
  }, [projectId]);

  if (tasks.length === 0) return null;

  const tasksWithDeps = tasks.filter(t => t.dependsOnIds && t.dependsOnIds.length > 0);
  
  if (tasksWithDeps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Network size={20} /> Dépendances des Tâches</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">Aucune dépendance configurée pour ce projet.</p>
        </CardContent>
      </Card>
    );
  }

  const getTaskById = (id: string) => tasks.find(t => t.id === id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Network size={20} /> Dépendances des Tâches</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasksWithDeps.map(task => (
            <div key={task.id} className="flex flex-col gap-2 p-3 border border-border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 font-medium">
                {task.status === 'done' ? <CheckCircle size={16} className="text-emerald-500" /> : <Circle size={16} className="text-muted-foreground" />}
                <span>{task.title}</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded ml-auto">Bloqué par {task.dependsOnIds.length} tâche(s)</span>
              </div>
              
              <div className="pl-6 flex flex-col gap-2 border-l-2 border-border ml-2 mt-1">
                {task.dependsOnIds.map(depId => {
                  const dep = getTaskById(depId);
                  if (!dep) return null;
                  return (
                    <div key={dep.id} className="flex items-center gap-2 text-sm">
                      <ArrowRight size={14} className="text-muted-foreground" />
                      {dep.status === 'done' ? <CheckCircle size={14} className="text-emerald-500" /> : <Circle size={14} className="text-destructive" />}
                      <span className={dep.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}>
                        {dep.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

import React, { useState } from 'react';
import { Circle, CheckCircle2, ListTree } from 'lucide-react';
import { useVimShortcuts } from '../hooks/useVimShortcuts';
import KeyboardCheatSheet from './shared/KeyboardCheatSheet';

import type { Task } from '../types/task';

interface TaskTableViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
}

const TaskTableView: React.FC<TaskTableViewProps> = ({ tasks, onTaskClick, onUpdateTask, onDeleteTask }) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const { showCheatSheet, setShowCheatSheet } = useVimShortcuts({
    onDown: () => setFocusedIndex(prev => Math.min(prev + 1, tasks.length - 1)),
    onUp: () => setFocusedIndex(prev => Math.max(prev - 1, 0)),
    onEdit: () => {
      if (focusedIndex >= 0 && focusedIndex < tasks.length) {
        onTaskClick(tasks[focusedIndex]);
      }
    },
    onDone: () => {
      if (focusedIndex >= 0 && focusedIndex < tasks.length) {
        const task = tasks[focusedIndex];
        onUpdateTask(task, { status: task.status === 'done' ? 'todo' : 'done' });
      }
    },
    onDelete: () => {
      if (focusedIndex >= 0 && focusedIndex < tasks.length && onDeleteTask) {
        onDeleteTask(tasks[focusedIndex].id);
      }
    }
  });

  return (
    <div className="w-full overflow-x-auto border border-border rounded-lg bg-card">
      <KeyboardCheatSheet isOpen={showCheatSheet} onClose={() => setShowCheatSheet(false)} />
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
          <tr>
            <th className="font-medium px-4 py-3 w-10 text-center">Status</th>
            <th className="font-medium px-4 py-3">Title</th>
            <th className="font-medium px-4 py-3 w-32">Priority</th>
            <th className="font-medium px-4 py-3 w-40">Due Date</th>
            <th className="font-medium px-4 py-3 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                No tasks found.
              </td>
            </tr>
          ) : (
            tasks.map((task, idx) => (
              <tr 
                key={task.id} 
                className={`hover:bg-accent/50 transition-colors group cursor-pointer ${focusedIndex === idx ? 'bg-accent ring-1 ring-primary/50' : ''}`}
                onClick={() => {
                  setFocusedIndex(idx);
                  onTaskClick(task);
                }}
              >
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    onClick={() => onUpdateTask(task, { status: task.status === 'done' ? 'todo' : 'done' })}
                  >
                    {task.status === 'done' ? <CheckCircle2 size={18} className="text-primary" /> : <Circle size={18} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {task.title}
                    </h3>
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <ListTree size={12} />
                        <span>
                          {task.subtasks.filter((s: any) => s.status === 'done').length}/{task.subtasks.length}
                        </span>
                        <div className="w-16 h-1 bg-secondary rounded-full ml-1 overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(task.subtasks.filter((s: any) => s.status === 'done').length / task.subtasks.length) * 100}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select 
                    className="bg-transparent border-none outline-none cursor-pointer appearance-none text-xs px-2 py-1 rounded-full hover:bg-muted font-medium"
                    value={task.priority}
                    onChange={(e) => onUpdateTask(task, { priority: e.target.value as any })}
                    style={{
                      color: task.priority === 'high' ? 'hsl(var(--destructive))' : task.priority === 'medium' ? '#f97316' : 'hsl(var(--primary))'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="date"
                    className="bg-transparent text-sm hover:bg-muted px-2 py-1 rounded-md border-none outline-none cursor-pointer text-muted-foreground"
                    value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
                    onChange={(e) => onUpdateTask(task, { dueDate: e.target.value || null as any })}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    {onDeleteTask && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                        title="Supprimer la tâche"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTableView;

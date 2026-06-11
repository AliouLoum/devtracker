import React from 'react';
import { DndContext, useDraggable, useDroppable, pointerWithin } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { CalendarIcon, MessageSquare, ListTree } from 'lucide-react';
import { format } from 'date-fns';

import type { Task } from '../types/task';

interface TaskBoardViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
}

const DroppableColumn = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col flex-1 min-w-[280px] bg-muted/30 rounded-xl border ${isOver ? 'border-primary ring-1 ring-primary/20' : 'border-border'} overflow-hidden transition-colors`}
    >
      <div className="p-4 border-b border-border bg-card/50">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto min-h-[500px]">
        {children}
      </div>
    </div>
  );
};

const DraggableCard = ({ task, onClick, onDelete }: { task: Task, onClick: () => void, onDelete?: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...listeners} 
      {...attributes}
      className={`bg-card p-4 rounded-lg border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${task.status === 'done' ? 'opacity-70' : ''}`}
      onClick={() => {
        // Only trigger click if we didn't drag far (handled roughly by default HTML events, but robustly we might want a threshold)
        onClick();
      }}
    >
      <div className="flex justify-between items-start mb-2 group">
        <h4 className={`font-medium mb-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
              title="Supprimer la tâche"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          )}
        </div>
      </div>
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <ListTree size={12} />
          <span>
            {task.subtasks.filter((s: any) => s.status === 'done').length}/{task.subtasks.length}
          </span>
          <div className="w-full max-w-[60px] h-1 bg-secondary rounded-full ml-1 overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${(task.subtasks.filter((s: any) => s.status === 'done').length / task.subtasks.length) * 100}%` }} 
            />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 mt-3">
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            <CalendarIcon size={12} />
            {format(new Date(task.dueDate), 'MMM d')}
          </div>
        )}
        <div className="flex-1" />
        {task.priority === 'high' && <div className="w-2 h-2 rounded-full bg-destructive" title="High Priority" />}
        {task.priority === 'medium' && <div className="w-2 h-2 rounded-full bg-orange-500" title="Medium Priority" />}
        {task.priority === 'low' && <div className="w-2 h-2 rounded-full bg-primary" title="Low Priority" />}
        {task.notes && <div title="Has notes"><MessageSquare size={12} className="text-muted-foreground" /></div>}
      </div>
    </div>
  );
};

const TaskBoardView: React.FC<TaskBoardViewProps> = ({ tasks, onTaskClick, onUpdateTask, onDeleteTask }) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id as string;
    const newStatus = over.id as 'todo' | 'in_progress' | 'done';
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      onUpdateTask(task, { status: newStatus });
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
      <div className="flex gap-6 overflow-x-auto pb-4">
        <DroppableColumn id="todo" title={`To Do (${todoTasks.length})`}>
          {todoTasks.map(t => <DraggableCard key={t.id} task={t} onClick={() => onTaskClick(t)} onDelete={onDeleteTask ? () => onDeleteTask(t.id) : undefined} />)}
        </DroppableColumn>
        <DroppableColumn id="in_progress" title={`In Progress (${inProgressTasks.length})`}>
          {inProgressTasks.map(t => <DraggableCard key={t.id} task={t} onClick={() => onTaskClick(t)} onDelete={onDeleteTask ? () => onDeleteTask(t.id) : undefined} />)}
        </DroppableColumn>
        <DroppableColumn id="done" title={`Done (${doneTasks.length})`}>
          {doneTasks.map(t => <DraggableCard key={t.id} task={t} onClick={() => onTaskClick(t)} onDelete={onDeleteTask ? () => onDeleteTask(t.id) : undefined} />)}
        </DroppableColumn>
      </div>
    </DndContext>
  );
};

export default TaskBoardView;

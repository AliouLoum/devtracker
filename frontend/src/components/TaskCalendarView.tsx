import React, { useState } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Inbox, ListTree } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, pointerWithin } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

import type { Task } from '../types/task';

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task, updates: Partial<Task>) => void;
}

const DraggableTask = ({ task, onClick }: { task: Task, onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  let bg = 'bg-accent/50 text-foreground';
  if (task.priority === 'high') bg = 'bg-destructive/10 text-destructive';
  if (task.status === 'done') bg = 'bg-muted text-muted-foreground line-through';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`text-xs px-2 py-1 mb-1 rounded-md truncate cursor-grab active:cursor-grabbing hover:brightness-95 transition-all ${bg}`}
      title={task.title}
    >
      <div className="flex-1 min-w-0">
        <div className="truncate">{task.title}</div>
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] opacity-80 mt-0.5">
            <ListTree size={10} />
            <span>
              {task.subtasks.filter((s: any) => s.status === 'done').length}/{task.subtasks.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const DroppableDay = ({ day, isCurrentMonth, children }: { day: Date, isCurrentMonth: boolean, children: React.ReactNode }) => {
  const dateStr = format(day, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-1 border-b border-r border-border transition-colors ${
        isCurrentMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground'
      } ${isOver ? 'bg-primary/5 ring-1 ring-inset ring-primary' : ''} ${isToday(day) ? 'bg-accent/30' : ''}`}
    >
      <div className={`text-right text-xs p-1 ${isToday(day) ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
        {format(day, 'd')}
      </div>
      <div className="flex flex-col gap-0.5 mt-1 overflow-hidden max-h-[80px]">
        {children}
      </div>
    </div>
  );
};

const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ tasks, onTaskClick, onUpdateTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id as string;
    const newDateStr = over.id as string; // 'yyyy-MM-dd' or 'unscheduled'
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (newDateStr === 'unscheduled') {
      if (task.dueDate !== null) onUpdateTask(task, { dueDate: null as any });
    } else {
      // Create a date string that ensures we keep the same day (ignoring timezone offsets if possible)
      // but the easiest is to just set it to YYYY-MM-DDT12:00:00Z to avoid shifting
      const newDate = new Date(`${newDateStr}T12:00:00Z`).toISOString();
      if (task.dueDate !== newDate) onUpdateTask(task, { dueDate: newDate });
    }
  };

  const unscheduledTasks = tasks.filter(t => !t.dueDate);
  
  const { setNodeRef: setUnscheduledRef, isOver: isUnscheduledOver } = useDroppable({ id: 'unscheduled' });

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="flex-1 flex flex-col bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h2 className="text-xl font-bold">{format(currentDate, dateFormat)}</h2>
            <div className="flex items-center gap-2">
              <button onClick={today} className="text-sm px-3 py-1 bg-background border border-border rounded-md hover:bg-accent transition-colors">Today</button>
              <button onClick={prevMonth} className="p-1 hover:bg-accent rounded-md"><ChevronLeft size={20} /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-accent rounded-md"><ChevronRight size={20} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs font-semibold py-2 text-muted-foreground">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 flex-1">
            {days.map(day => {
              const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
              return (
                <DroppableDay key={day.toString()} day={day} isCurrentMonth={isSameMonth(day, monthStart)}>
                  {dayTasks.map(t => (
                    <DraggableTask key={t.id} task={t} onClick={() => onTaskClick(t)} />
                  ))}
                </DroppableDay>
              );
            })}
          </div>
        </div>

        <div 
          ref={setUnscheduledRef}
          className={`w-full lg:w-72 bg-muted/20 border rounded-lg p-4 flex flex-col transition-colors ${
            isUnscheduledOver ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border'
          }`}
        >
          <div className="flex items-center gap-2 mb-4 text-muted-foreground font-medium">
            <Inbox size={18} />
            <h3>Unscheduled ({unscheduledTasks.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {unscheduledTasks.map(t => (
              <DraggableTask key={t.id} task={t} onClick={() => onTaskClick(t)} />
            ))}
            {unscheduledTasks.length === 0 && (
              <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg mt-4">
                Drag tasks here to unschedule them.
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default TaskCalendarView;

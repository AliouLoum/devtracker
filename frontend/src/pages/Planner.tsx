import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import TaskSidePeek from '../components/TaskSidePeek';
import type { Task } from '../types/task';

const Planner: React.FC = () => {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'calendar'],
    queryFn: async () => {
      const res = await api.get(`/tasks/all`);
      return res.data;
    }
  });

  const handleCreateTask = async (date: Date) => {
    try {
      // Adjust date to timezone string
      const dateString = date.toISOString();
      // Ensure 'tasks.defaultNewTask' exists, fallback to 'New Task' if not defined in i18n
      const titleStr = t('tasks.defaultNewTask');
      const finalTitle = titleStr === 'tasks.defaultNewTask' ? 'New Task' : titleStr;
      
      const res = await api.post('/tasks', { 
        title: finalTitle,
        dueDate: dateString
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTask(res.data);
    } catch (error) {
      console.error("Failed to create task", error);
    }
  };

  const handleSidePeekUpdate = (updatedTask: Task) => {
    queryClient.setQueryData<Task[]>(['tasks', 'calendar'], old => 
      old?.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
    );
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const isSameDay = (d1: Date, d2: string | Date) => {
    if (!d2) return false;
    const date2 = new Date(d2);
    return d1.getFullYear() === date2.getFullYear() &&
           d1.getMonth() === date2.getMonth() &&
           d1.getDate() === date2.getDate();
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskToDelete(null);
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  const renderTaskCard = (task: Task) => (
    <div 
      key={task.id} 
      onClick={() => setSelectedTask(task)}
      className="p-2 mb-2 bg-card border border-border rounded-lg shadow-sm cursor-pointer hover:border-primary transition-colors text-left group flex justify-between items-start"
    >
      <div className="flex items-start gap-2 flex-1">
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          {task.status === 'done' ? <CheckCircle2 size={14} className="text-primary" /> : <Circle size={14} />}
        </div>
        <div className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setTaskToDelete(task.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-opacity"
        title="Supprimer la tâche"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      </button>
    </div>
  );

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderDailyView = () => {
    const dayTasks = tasks.filter((t: Task) => t.dueDate && isSameDay(currentDate, t.dueDate));

    return (
      <div className="flex justify-center h-full">
        <div className="w-full max-w-2xl bg-muted/20 border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-card flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold capitalize">{currentDate.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
              <p className="text-sm text-muted-foreground">{dayTasks.length} {t('planner.tasksCount') || 'tasks'}</p>
            </div>
            <Button size="sm" onClick={() => handleCreateTask(currentDate)} className="gap-2">
              <Plus size={16} /> {t('planner.addTask')}
            </Button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto bg-card/50">
            {dayTasks.length > 0 ? (
              dayTasks.map(renderTaskCard)
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {t('planner.noTasks')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const dayNames = [t('planner.days.mon'), t('planner.days.tue'), t('planner.days.wed'), t('planner.days.thu'), t('planner.days.fri'), t('planner.days.sat'), t('planner.days.sun')];

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 h-full overflow-y-auto pr-2 pb-4">
        {weekDays.map((date, idx) => {
          const isToday = isSameDay(new Date(), date);
          const dayTasks = tasks.filter((t: Task) => t.dueDate && isSameDay(date, t.dueDate));

          return (
            <div key={idx} className={`flex flex-col bg-muted/20 border ${isToday ? 'border-primary ring-1 ring-primary/20' : 'border-border'} rounded-xl overflow-hidden`}>
              <div className={`p-3 border-b border-border flex flex-col items-center justify-center gap-1 ${isToday ? 'bg-primary/10' : 'bg-card'}`}>
                <span className="text-xs font-semibold text-muted-foreground uppercase">{dayNames[idx]}</span>
                <span className={`text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                  {date.getDate()}
                </span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto bg-card/50 space-y-2">
                {dayTasks.map(renderTaskCard)}
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground hover:text-foreground justify-start h-8 px-2"
                  onClick={() => handleCreateTask(date)}
                >
                  <Plus size={14} className="mr-1" /> {t('planner.addTask')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthlyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    // Adjust for Monday as first day of week
    const startingBlankDays = firstDay === 0 ? 6 : firstDay - 1; 

    const days = [];
    for (let i = 0; i < startingBlankDays; i++) {
      days.push(<div key={`blank-${i}`} className="h-32 border-b border-r border-border bg-muted/20" />);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const cellDate = new Date(year, month, i);
      const isToday = isSameDay(new Date(), cellDate);
      const dayTasks = tasks.filter((t: Task) => t.dueDate && isSameDay(cellDate, t.dueDate));

      days.push(
        <div key={`day-${i}`} className={`h-32 border-b border-r border-border p-2 flex flex-col gap-1 transition-colors hover:bg-muted/30 group ${isToday ? 'bg-primary/5' : 'bg-card'}`}>
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
              {i}
            </span>
            <button 
              onClick={() => handleCreateTask(cellDate)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
            >
              <Plus size={14} />
            </button>
          </div>
          {/* Simple task indicators */}
          <div className="flex-1 overflow-y-auto space-y-1 mt-1">
            {dayTasks.map((t: Task) => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTask(t)}
                className="text-[10px] px-1.5 py-1 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 truncate cursor-pointer hover:bg-blue-500/20"
              >
                {t.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    // Fill the rest of the row
    const totalCells = days.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`end-blank-${i}`} className="h-32 border-b border-r border-border bg-muted/20" />);
    }

    return (
      <div className="w-full overflow-x-auto pb-4">
        <div className="grid grid-cols-7 border-l border-t border-border rounded-lg overflow-hidden bg-card h-full min-w-[700px]">
          {[t('planner.days.mon'), t('planner.days.tue'), t('planner.days.wed'), t('planner.days.thu'), t('planner.days.fri'), t('planner.days.sat'), t('planner.days.sun')].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground border-b border-r border-border bg-muted/50">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const getNavigationLabel = () => {
    if (view === 'daily') {
      return currentDate.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    if (view === 'weekly') {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'daily') newDate.setDate(newDate.getDate() - 1);
    else if (view === 'weekly') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'daily') newDate.setDate(newDate.getDate() + 1);
    else if (view === 'weekly') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col h-full gap-6 w-full max-w-[1400px] mx-auto overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('planner.title')}</h1>
          <p className="text-muted-foreground">{t('planner.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={navigateToday} className="hidden md:flex">
            {t('planner.today')}
          </Button>
          
          <div className="flex items-center bg-card border border-border rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={navigatePrevious}>
              <ChevronLeft size={18} />
            </Button>
            <div className="w-48 text-center font-semibold text-sm truncate capitalize">
              {getNavigationLabel()}
            </div>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight size={18} />
            </Button>
          </div>

          <div className="bg-muted p-1 rounded-lg flex">
            <button 
              onClick={() => setView('daily')} 
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${view === 'daily' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              <Clock size={14} className="hidden sm:block" /> {t('planner.daily')}
            </button>
            <button 
              onClick={() => setView('weekly')} 
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${view === 'weekly' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              <CalendarIcon size={14} className="hidden sm:block" /> {t('planner.weekly')}
            </button>
            <button 
              onClick={() => setView('monthly')} 
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${view === 'monthly' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              <CalendarIcon size={14} className="hidden sm:block" /> {t('planner.monthly')}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto md:overflow-hidden pb-4 md:pb-0">
        {view === 'daily' && renderDailyView()}
        {view === 'weekly' && renderWeeklyView()}
        {view === 'monthly' && renderMonthlyView()}
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
        onConfirm={handleDeleteTask}
        title={t('taskSidePeek.confirmDeleteTitle', 'Supprimer la tâche')}
        description={t('taskSidePeek.confirmDeleteDesc', 'Voulez-vous vraiment supprimer cette tâche ? Cette action est irréversible.')}
        confirmText={t('common.delete', 'Supprimer')}
      />
    </div>
  );
};

export default Planner;

import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Flag, Circle, CheckCircle2, AlignLeft, Repeat, ListTree, Plus, Trash2, User, Bell } from 'lucide-react';
import { Button } from './ui/button';
import api from '../api/axios';
import { useTimeTrackingStore } from '../store/timeTrackingStore';
import { useSocketStore } from '../store/socketStore';
import { Play, Square, Clock } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import type { Task } from '../types/task';

interface TaskSidePeekProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

const TaskSidePeek: React.FC<TaskSidePeekProps> = ({ task, isOpen, onClose, onUpdate }) => {
  const [localTask, setLocalTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isRecurrenceOpen, setIsRecurrenceOpen] = useState(false);
  const { startTimer, stopTimer, activeTaskId } = useTimeTrackingStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const socket = useSocketStore(state => state.socket);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const fetchSubtasks = async (taskId: string) => {
    try {
      const { data } = await api.get(`/tasks/${taskId}/subtasks`);
      setSubtasks(data);
    } catch (error) {
      console.error("Failed to fetch subtasks", error);
    }
  };

  const fetchComments = async (taskId: string) => {
    try {
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  };

  const fetchProjectMembers = async (projectId: string) => {
    try {
      const { data } = await api.get(`/projects/${projectId}/members`);
      setProjectMembers(data);
    } catch (error) {
      console.error("Failed to fetch project members", error);
    }
  };

  useEffect(() => {
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalTask({ ...task });
      fetchSubtasks(task.id);
      fetchComments(task.id);
      if (task.projectId) {
        fetchProjectMembers(task.projectId);
      }
    }
  }, [task]);

  useEffect(() => {
    if (!socket || !localTask?.projectId) return;

    const handleCommentCreated = (comment: any) => {
      if (comment.taskId === localTask.id) {
        setComments(prev => {
          if (prev.some(c => c.id === comment.id)) return prev;
          return [...prev, comment];
        });
      }
    };

    const handleCommentDeleted = ({ commentId, taskId }: any) => {
      if (taskId === localTask.id) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:deleted', handleCommentDeleted);

    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:deleted', handleCommentDeleted);
    };
  }, [socket, localTask?.id, localTask?.projectId]);

  if (!isOpen || !localTask) return null;

  const handleChange = (field: keyof Task, value: any) => {
    setLocalTask(prev => prev ? { ...prev, [field]: value } : null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRecurrenceChange = async (field: string, value: any) => {
    if (!localTask) return;
    const newRec = { ...(localTask.recurrence || { type: 'daily', interval: 1 }), [field]: value };
    handleChange('recurrence', newRec);
    try {
      await api.patch(`/tasks/${localTask.id}/recurrence`, { recurrence: newRec });
      onUpdate({ ...localTask, recurrence: newRec });
    } catch (error) {
      console.error("Failed to update recurrence", error);
    }
  };

  const removeRecurrence = async () => {
    if (!localTask) return;
    handleChange('recurrence', null);
    try {
      await api.delete(`/tasks/${localTask.id}/recurrence`);
      onUpdate({ ...localTask, recurrence: undefined });
      setIsRecurrenceOpen(false);
    } catch (error) {
      console.error("Failed to remove recurrence", error);
    }
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim() || !localTask) return;
    try {
      const { data } = await api.post(`/tasks/${localTask.id}/subtasks`, {
        title: newSubtaskTitle,
        status: 'todo',
        priority: 'medium',
      });
      setSubtasks(prev => [...prev, data]);
      setNewSubtaskTitle('');
      onUpdate({ ...localTask, subtasks: [...subtasks, data] });
    } catch (error) {
      console.error("Failed to create subtask", error);
    }
  };

  const toggleSubtaskStatus = async (st: Task) => {
    const nextStatus = st.status === 'done' ? 'todo' : 'done';
    try {
      const { data } = await api.patch(`/tasks/${st.id}/status`, { status: nextStatus });
      const updatedList = subtasks.map(s => s.id === st.id ? data : s);
      setSubtasks(updatedList);
      onUpdate({ ...localTask, subtasks: updatedList });
    } catch (error) {
      console.error("Failed to update subtask", error);
    }
  };

  const deleteSubtask = async (stId: string) => {
    try {
      await api.delete(`/tasks/${stId}`);
      const updatedList = subtasks.filter(s => s.id !== stId);
      setSubtasks(updatedList);
      onUpdate({ ...localTask, subtasks: updatedList });
    } catch (error) {
      console.error("Failed to delete subtask", error);
    }
  };

  const doneSubtasks = subtasks.filter(st => st.status === 'done').length;
  const progress = subtasks.length > 0 ? Math.round((doneSubtasks / subtasks.length) * 100) : 0;

  const handleSave = async () => {
    if (!localTask) return;
    try {
      await api.patch(`/tasks/${localTask.id}`, {
        title: localTask.title,
        notes: localTask.notes,
        status: localTask.status,
        priority: localTask.priority,
        dueDate: localTask.dueDate,
        assigneeId: localTask.assigneeId,
        reminderAt: localTask.reminderAt,
      });
      onUpdate(localTask);
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  const toggleStatus = () => {
    const nextStatus = localTask.status === 'done' ? 'todo' : 'done';
    handleChange('status', nextStatus);
  };

  const postComment = async () => {
    if (!newComment.trim() || !localTask) return;
    try {
      const { data } = await api.post(`/tasks/${localTask.id}/comments`, { content: newComment });
      setComments(prev => [...prev, data]);
      setNewComment('');
    } catch (error) {
      console.error("Failed to post comment", error);
    }
  };

  const handleDeleteTask = async () => {
    if (!localTask) return;
    try {
      await api.delete(`/tasks/${localTask.id}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
        onClick={() => { handleSave(); onClose(); }}
      />
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[500px] bg-background border-l border-border shadow-2xl transition-transform duration-300 transform translate-x-0 flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <button onClick={toggleStatus} className="text-muted-foreground hover:text-primary transition-colors">
               {localTask.status === 'done' ? <CheckCircle2 size={24} className="text-primary" /> : <Circle size={24} />}
            </button>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {localTask.status === 'done' ? t('taskSidePeek.statusCompleted') : localTask.status === 'in_progress' ? t('taskSidePeek.statusInProgress') : t('taskSidePeek.statusTodo')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { handleSave(); onClose(); }}>
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <input
            type="text"
            className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder-muted-foreground text-foreground"
            value={localTask.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={handleSave}
            placeholder={t('taskSidePeek.taskTitle')}
          />

          <div className="space-y-4">
            <div className="grid grid-cols-3 items-center">
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <CalendarIcon size={16} /> {t('taskSidePeek.dueDate')}
              </div>
              <div className="col-span-2">
                <input
                  type="date"
                  className="bg-transparent text-sm hover:bg-muted p-1 rounded-md border-none outline-none cursor-pointer"
                  value={localTask.dueDate ? localTask.dueDate.substring(0, 10) : ''}
                  onChange={(e) => {
                    handleChange('dueDate', e.target.value || null);
                    handleSave();
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 items-center">
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <Flag size={16} /> {t('taskSidePeek.priority')}
              </div>
              <div className="col-span-2">
                <select
                  className="bg-transparent text-sm hover:bg-muted p-1 rounded-md border-none outline-none cursor-pointer appearance-none"
                  value={localTask.priority}
                  onChange={(e) => {
                    handleChange('priority', e.target.value);
                    handleSave();
                  }}
                >
                  <option value="low">{t('taskSidePeek.priorityLow')}</option>
                  <option value="medium">{t('taskSidePeek.priorityMedium')}</option>
                  <option value="high">{t('taskSidePeek.priorityHigh')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center">
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <Bell size={16} /> {t('taskSidePeek.reminder', 'Rappel (Email)')}
              </div>
              <div className="col-span-2">
                <input
                  type="datetime-local"
                  className="bg-transparent text-sm hover:bg-muted p-1 rounded-md border-none outline-none cursor-pointer"
                  value={localTask.reminderAt ? new Date(new Date(localTask.reminderAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().substring(0, 16) : ''}
                  onChange={(e) => {
                    handleChange('reminderAt', e.target.value ? new Date(e.target.value).toISOString() : null);
                    handleSave();
                  }}
                />
              </div>
            </div>

            {localTask.projectId && (
              <div className="grid grid-cols-3 items-center">
                <div className="text-muted-foreground text-sm flex items-center gap-2">
                  <User size={16} /> {t('taskSidePeek.assignee')}
                </div>
                <div className="col-span-2">
                  <select
                    className="bg-transparent text-sm hover:bg-muted p-1 rounded-md border-none outline-none cursor-pointer"
                    value={localTask.assigneeId || ''}
                    onChange={(e) => {
                      handleChange('assigneeId', e.target.value || null);
                      handleSave();
                    }}
                  >
                    <option value="">{t('taskSidePeek.unassigned')}</option>
                    {projectMembers.map(pm => (
                      <option key={pm.user.id} value={pm.user.id}>{pm.user.name || pm.user.email}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Time Tracking */}
            <div className="grid grid-cols-3 items-center">
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <Clock size={16} /> {t('taskSidePeek.timeSpent')}
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <span className="text-sm font-medium">
                  {localTask.timeSpentSeconds ? `${(localTask.timeSpentSeconds / 3600).toFixed(1)}h` : '0h'}
                </span>
                {activeTaskId === localTask.id ? (
                  <Button size="sm" variant="destructive" onClick={() => stopTimer()} className="h-7 px-3 text-xs">
                    <Square size={12} className="mr-1.5" /> {t('taskSidePeek.stopTimer')}
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => startTimer(localTask.id, localTask.title)} className="h-7 px-3 text-xs">
                    <Play size={12} className="mr-1.5" /> {t('taskSidePeek.startTimer')}
                  </Button>
                )}
              </div>
            </div>

            {/* Recurrence */}
            <div className="grid grid-cols-3 items-start pt-2">
              <div className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                <Repeat size={16} /> {t('taskSidePeek.repeat')}
              </div>
              <div className="col-span-2">
                {!localTask.recurrence && !isRecurrenceOpen ? (
                  <button onClick={() => setIsRecurrenceOpen(true)} className="text-sm text-muted-foreground hover:text-primary p-1">
                    Add recurrence...
                  </button>
                ) : (
                  <div className="bg-muted p-3 rounded-md space-y-3 relative text-sm">
                    <button onClick={removeRecurrence} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-2">
                      <span>{t('taskSidePeek.every')}</span>
                      <input 
                        type="number" 
                        min="1" 
                        className="w-16 p-1 rounded bg-background border-none outline-none" 
                        value={localTask.recurrence?.interval || 1} 
                        onChange={e => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)}
                      />
                      <select 
                        className="p-1 rounded bg-background border-none outline-none cursor-pointer"
                        value={localTask.recurrence?.type || 'daily'}
                        onChange={e => handleRecurrenceChange('type', e.target.value)}
                      >
                        <option value="daily">{t('taskSidePeek.days')}</option>
                        <option value="weekly">{t('taskSidePeek.weeks')}</option>
                        <option value="monthly">{t('taskSidePeek.months')}</option>
                      </select>
                    </div>
                    {localTask.recurrence?.type === 'weekly' && (
                      <div className="flex items-center gap-1 mt-2">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => {
                          const daysOfWeek = localTask.recurrence?.daysOfWeek || [];
                          const isSelected = daysOfWeek.includes(idx);
                          return (
                            <button
                              key={idx}
                              className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-primary/20 text-muted-foreground'}`}
                              onClick={() => {
                                const newDays = isSelected 
                                  ? daysOfWeek.filter((d: number) => d !== idx)
                                  : [...daysOfWeek, idx];
                                handleRecurrenceChange('daysOfWeek', newDays);
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <ListTree size={18} />
                  <h3 className="font-medium">{t('taskSidePeek.subtasks')}</h3>
                </div>
                {subtasks.length > 0 && (
                  <span className="text-xs">{doneSubtasks}/{subtasks.length} ({progress}%)</span>
                )}
              </div>
              
              {subtasks.length > 0 && (
                <div className="w-full bg-secondary h-1.5 rounded-full mb-4 overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              )}

              <div className="space-y-2 mb-3">
                {subtasks.map(st => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <button onClick={() => toggleSubtaskStatus(st)} className="text-muted-foreground hover:text-primary transition-colors">
                      {st.status === 'done' ? <CheckCircle2 size={16} className="text-primary" /> : <Circle size={16} />}
                    </button>
                    <span className={`flex-1 text-sm ${st.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                      {st.title}
                    </span>
                    <button onClick={() => deleteSubtask(st.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Plus size={16} className="text-muted-foreground" />
                <input 
                  type="text" 
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder-muted-foreground"
                  placeholder={t('taskSidePeek.addSubtask')}
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSubtask()}
                />
                {newSubtaskTitle && (
                  <Button size="sm" variant="ghost" onClick={addSubtask} className="h-6 text-xs px-2">{t('taskSidePeek.add')}</Button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <AlignLeft size={18} />
              <h3 className="font-medium">{t('taskSidePeek.description')}</h3>
            </div>
            <textarea
              className="w-full h-[200px] bg-transparent border border-border rounded-md p-3 outline-none focus:ring-1 focus:ring-primary resize-none placeholder-muted-foreground"
              placeholder={t('taskSidePeek.descPlaceholder')}
              value={localTask.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              onBlur={handleSave}
            />
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-border">
            <h3 className="font-medium mb-4">{t('taskSidePeek.comments')}</h3>
            <div className="space-y-4 mb-4">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium flex-shrink-0">
                    {c.user.name?.[0] || c.user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 bg-muted p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{c.user.name || c.user.email}</span>
                      <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-muted-foreground">{t('taskSidePeek.noComments')}</p>}
            </div>
            
            <div className="flex gap-2">
              <textarea 
                className="flex-1 bg-transparent border border-border rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder={t('taskSidePeek.writeComment')}
                rows={2}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <Button onClick={postComment} className="self-end" size="sm">{t('taskSidePeek.post')}</Button>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmDialog 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTask}
        title={t('taskSidePeek.confirmDeleteTitle', 'Supprimer la tâche')}
        description={t('taskSidePeek.confirmDeleteDesc', 'Voulez-vous vraiment supprimer cette tâche ? Cette action est irréversible.')}
        confirmText={t('common.delete', 'Supprimer')}
      />
    </>
  );
};

export default TaskSidePeek;

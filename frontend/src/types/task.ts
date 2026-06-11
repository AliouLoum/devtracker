export interface Recurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  projectId?: string;
  
  // Subtasks
  parentTaskId?: string;
  subtasks?: Task[];
  
  // Recurrence
  recurrence?: Recurrence;
  recurrenceParentId?: string;
  recurrenceDate?: string;

  assigneeId?: string;
  assignee?: any;
  timeSpentSeconds?: number;
  reminderAt?: string | null;
}

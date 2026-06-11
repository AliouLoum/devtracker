import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Clock, Folder } from 'lucide-react';
import * as Highcharts from 'highcharts';
import { HighchartsReact } from 'highcharts-react-official';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import ProductivityHeatmap from '../components/ProductivityHeatmap';
import { useTranslation } from 'react-i18next';

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  projectName: string;
  projectColor: string;
}

interface DashboardData {
  totalProjects: number;
  todayTasksCount: number;
  overdueTasksCount: number;
  globalProgress: number;
  upcomingTasks: Task[];
  todayTasks: Task[];
  overdueTasks: Task[];
  tasksByPriority: { name: string; count: number; color: string }[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center text-muted-foreground">{t('dashboard.loading')}</div>;
  }

  if (!data) {
    return <div className="flex h-full w-full items-center justify-center text-destructive">{t('dashboard.error')}</div>;
  }

  const chartOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 300,
    },
    title: {
      text: `${data.globalProgress}%`,
      align: 'center',
      verticalAlign: 'middle',
      y: 10,
      style: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: 'hsl(var(--foreground))'
      }
    },
    plotOptions: {
      pie: {
        innerSize: '80%',
        borderWidth: 0,
        dataLabels: {
          enabled: false
        }
      }
    },
    series: [{
      type: 'pie',
      name: 'Progress',
      data: [
        { name: 'Completed', y: data.globalProgress, color: 'hsl(var(--primary))' },
        { name: 'Remaining', y: 100 - data.globalProgress, color: 'hsl(var(--muted))' }
      ]
    }],
    credits: {
      enabled: false
    },
    tooltip: {
      backgroundColor: 'hsl(var(--popover))',
      style: { color: 'hsl(var(--popover-foreground))' },
      borderColor: 'hsl(var(--border))',
      borderRadius: 8,
      shadow: false,
    }
  };

  const tasksByPriorityOptions: Highcharts.Options = {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
      height: 300,
    },
    title: {
      text: ''
    },
    xAxis: {
      categories: data.tasksByPriority?.map(p => p.name) || [],
      labels: {
        style: { color: 'hsl(var(--foreground))', fontWeight: 'bold' }
      }
    },
    yAxis: {
      title: { text: 'Tasks' },
      labels: {
        style: { color: 'hsl(var(--foreground))' }
      },
      gridLineColor: 'hsl(var(--border))',
      tickInterval: 1
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        colorByPoint: true,
        colors: data.tasksByPriority?.map(p => p.color) || []
      }
    },
    series: [{
      type: 'bar',
      name: 'Tasks',
      data: data.tasksByPriority?.map(p => p.count) || [],
      showInLegend: false,
      dataLabels: {
        enabled: true,
        style: { color: 'hsl(var(--foreground))', textOutline: 'none' }
      }
    }],
    credits: { enabled: false },
    tooltip: {
      backgroundColor: 'hsl(var(--popover))',
      style: { color: 'hsl(var(--popover-foreground))' },
      borderColor: 'hsl(var(--border))',
      borderRadius: 8,
    }
  };

  const markTaskDone = async (id: string) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status: 'done' });
      // Refresh dashboard
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (error) {
      console.error("Error updating task status", error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.overview')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
      </header>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalProjects')}</CardTitle>
            <Folder className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProjects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.tasksToday')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todayTasksCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.overdueTasks')}</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.overdueTasksCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.globalProgress')}</CardTitle>
            <Calendar className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.globalProgress}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('dashboard.progressOverview')}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <HighchartsReact
              highcharts={Highcharts}
              options={chartOptions}
            />
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.activeTasks')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!Array.isArray(data.upcomingTasks) || data.upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('dashboard.allCaughtUp')}</p>
            ) : (
              <div className="space-y-4">
                {data.upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.projectColor }}></div>
                        <span className="text-xs font-medium text-muted-foreground">{task.projectName}</span>
                      </div>
                      <h4 className="font-semibold">{task.title}</h4>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : t('dashboard.unscheduled')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.activeTasksByPriority')}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <HighchartsReact
              highcharts={Highcharts}
              options={tasksByPriorityOptions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.reminders')}</CardTitle>
          </CardHeader>
          <CardContent>
            {(!data.todayTasks || data.todayTasks.length === 0) && (!data.overdueTasks || data.overdueTasks.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('dashboard.noTasksDueToday')}</p>
            ) : (
              <div className="space-y-2">
                {data.overdueTasks?.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-full border-muted-foreground cursor-pointer"
                      onChange={() => markTaskDone(task.id)}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-destructive">{task.title}</span>
                      <span className="text-xs text-destructive/80">{t('dashboard.overdue')} - {task.projectName}</span>
                    </div>
                  </div>
                ))}
                {data.todayTasks?.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-full border-muted-foreground cursor-pointer"
                      onChange={() => markTaskDone(task.id)}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{task.title}</span>
                      <span className="text-xs text-muted-foreground">{t('dashboard.today')} - {task.projectName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.productivityHeatmap')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductivityHeatmap />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

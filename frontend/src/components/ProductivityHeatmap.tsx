import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { format, subDays, getDay } from 'date-fns';

interface HeatmapData {
  date: string;
  count: number;
}

const ProductivityHeatmap: React.FC = () => {
  const [data, setData] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const year = new Date().getFullYear();
        const response = await api.get(`/dashboard/heatmap?year=${year}`);
        const map = new Map<string, number>();
        response.data.forEach((d: HeatmapData) => {
          map.set(d.date, d.count);
        });
        setData(map);
      } catch (error) {
        console.error("Failed to fetch heatmap", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  if (loading) return <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Loading heatmap...</div>;

  // Generate last 365 days
  const today = new Date();
  const days = [];
  for (let i = 364; i >= 0; i--) {
    days.push(subDays(today, i));
  }

  // Group by week to render columns
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Fill the first week with nulls to align correctly if needed, or just push days
  days.forEach(day => {
    if (currentWeek.length === 0 && getDay(day) !== 0) {
      // pad start of first week if we want strict Sunday start
      for (let i = 0; i < getDay(day); i++) {
        currentWeek.push(subDays(day, getDay(day) - i));
      }
    }
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColor = (count: number) => {
    if (count === 0) return 'bg-secondary';
    if (count <= 2) return 'bg-primary/40';
    if (count <= 4) return 'bg-primary/60';
    if (count <= 6) return 'bg-primary/80';
    return 'bg-primary';
  };

  return (
    <div className="heatmap-widget w-full overflow-x-auto pb-4">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1">
            {week.map((day, dIdx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const count = data.get(dateStr) || 0;
              // Check if day is actually in our 365 range or just padding
              const isPadding = day > today || day < subDays(today, 365);
              
              if (isPadding) {
                return <div key={dIdx} className="w-3 h-3 rounded-sm opacity-0" />;
              }

              return (
                <div 
                  key={dIdx} 
                  className={`w-3 h-3 rounded-sm ${getColor(count)} cursor-pointer hover:ring-1 hover:ring-foreground transition-all`}
                  title={`${count} tasks completed on ${dateStr}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-secondary"></div>
        <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
        <div className="w-3 h-3 rounded-sm bg-primary/60"></div>
        <div className="w-3 h-3 rounded-sm bg-primary/80"></div>
        <div className="w-3 h-3 rounded-sm bg-primary"></div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ProductivityHeatmap;

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import api from '../../api/axios';
import { useQueryClient } from '@tanstack/react-query';

const DailyStandup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkStandup = () => {
      const todayDate = new Date().toLocaleDateString();
      const lastStandup = localStorage.getItem('lastStandup');
      const lastStandupPrompt = localStorage.getItem('lastStandupPrompt');
      const currentHour = new Date().getHours();
      
      // Auto open if it's past 9 AM, no standup submitted today, AND we haven't prompted them yet today
      if (currentHour >= 9 && lastStandup !== todayDate && lastStandupPrompt !== todayDate) {
        setIsOpen(true);
        // Record that we have prompted them today so it doesn't pop up again on refresh
        localStorage.setItem('lastStandupPrompt', todayDate);
      }
    };
    checkStandup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const content = `**Hier**\n${yesterday}\n\n**Aujourd'hui**\n${today}\n\n**Blocages**\n${blockers || 'Aucun'}`;
      await api.post('/notes', { 
        title: `Standup - ${new Date().toLocaleDateString()}`, 
        content,
        tags: ['standup']
      });
      localStorage.setItem('lastStandup', new Date().toLocaleDateString());
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsOpen(false);
    } catch (error) {
      console.error('Standup save failed', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-1">Daily Standup</h2>
        <p className="text-sm text-muted-foreground mb-6">Préparez votre journée. Une note sera automatiquement créée.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Qu'avez-vous fait hier ?</label>
            <textarea
              required
              className="w-full p-3 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={3}
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Que prévoyez-vous aujourd'hui ?</label>
            <textarea
              required
              className="w-full p-3 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={3}
              value={today}
              onChange={(e) => setToday(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Des blocages ? (Optionnel)</label>
            <textarea
              className="w-full p-3 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Plus tard
            </Button>
            <Button type="submit" disabled={loading || !yesterday || !today}>
              Valider le Standup
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyStandup;

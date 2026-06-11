import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Joyride, STATUS } from 'react-joyride';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const OnboardingOverlay: React.FC = () => {
  const [run, setRun] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const hasCompleted = localStorage.getItem('onboarding_completed');
    if (!hasCompleted && user?.createdAt) {
      const isNewUser = new Date().getTime() - new Date(user.createdAt).getTime() < 15 * 60 * 1000;
      if (isNewUser) {
        // Small delay to let UI render
        setTimeout(() => setRun(true), 1000);
      } else {
        // If not a new user, just mark it as completed so we don't check again
        localStorage.setItem('onboarding_completed', 'true');
      }
    }
  }, [user]);

  const steps: any[] = [
    {
      target: 'body',
      placement: 'center',
      content: "Bienvenue sur DevTracker 2.0 ! Faisons un tour rapide de vos nouveaux super-pouvoirs.",
      disableBeacon: true,
    },
    {
      target: '.sidebar-projects',
      content: "Voici vos projets. Nous allons vous générer un projet de démonstration pour tester !",
    },
    {
      target: '.topbar-timer',
      content: "Démarrez le chronomètre global depuis n'importe où. Il vous suivra même si vous changez de page.",
    },
    {
      target: '.heatmap-widget',
      content: "Suivez votre régularité avec cette Heatmap style GitHub. Plus vous complétez de tâches, plus c'est vert !",
    }
  ];

  const handleJoyrideCallback = async (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('onboarding_completed', 'true');
      
      // Generate demo project and redirect to it
      try {
        const res = await api.post('/projects/demo');
        if (res.data && res.data.id) {
          navigate(`/projects/${res.data.id}`);
        }
      } catch (err) {
        console.error('Failed to create demo project', err);
      }
    }
  };

  if (!run) return null;

  const JoyrideComponent = Joyride as any;

  return (
    <JoyrideComponent
      steps={steps}
      run={run}
      continuous
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
          arrowColor: 'hsl(var(--card))',
        }
      }}
    />
  );
};

export default OnboardingOverlay;

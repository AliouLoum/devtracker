import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { BrainCircuit, Sparkles } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

const AiSuggestionsWidget: React.FC = () => {
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    socketRef.current = io('/ai', {
      auth: { token: accessToken },
      path: '/socket.io',
    });

    socketRef.current.on('connect', () => {
      // Demande directement la recommandation via le socket
      socketRef.current?.emit('chat', { 
        message: "Analyse mes tâches et projets. Recommande-moi LA prochaine tâche à faire maintenant, l'heure optimale, et signale toute échéance critique. Réponds en un seul paragraphe très direct, motivant et sans bla-bla.", 
        history: [] 
      });
    });

    socketRef.current.on('chat-token', (data: { token: string }) => {
      setIsLoading(false);
      setSuggestion(prev => prev + data.token);
    });

    socketRef.current.on('chat-done', () => {
      setIsLoading(false);
      socketRef.current?.disconnect();
    });

    socketRef.current.on('chat-error', () => {
      setIsLoading(false);
      setSuggestion("Erreur lors de la génération de la suggestion via l'IA.");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [accessToken]);

  return (
    <Card className="border-border bg-popover shadow-xl min-w-[320px] max-w-[400px] z-50 overflow-hidden">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-primary text-sm font-semibold">
          <Sparkles size={16} />
          AI Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 flex flex-col gap-4">
        {isLoading && !suggestion ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse py-4">
            <BrainCircuit size={24} />
            <span className="text-xs">Analyse de vos priorités...</span>
          </div>
        ) : (
          <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-foreground/90">
            {suggestion}
            {isLoading && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary animate-pulse align-middle" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiSuggestionsWidget;

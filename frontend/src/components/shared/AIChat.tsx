import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, Sparkles } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Bonjour ! Je suis votre assistant DevTracker propulsé par NVIDIA. Posez-moi des questions sur vos projets, vos tâches ou demandez-moi de l\'aide.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken } = useAuthStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (accessToken && isOpen && !socketRef.current) {
      socketRef.current = io('/ai', {
        auth: { token: accessToken },
        path: '/socket.io',
      });

      socketRef.current.on('chat-token', (data: { token: string }) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          
          if (newMessages[lastIndex].role === 'assistant') {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: newMessages[lastIndex].content + data.token
            };
          }
          return newMessages;
        });
      });

      socketRef.current.on('chat-done', () => {
        setIsLoading(false);
        setStreamingMessageId(null);
      });

      socketRef.current.on('chat-error', (data) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `**Erreur:** ${data.error}` }]);
        setIsLoading(false);
        setStreamingMessageId(null);
      });
    }

    return () => {
      if (!isOpen && socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [accessToken, isOpen, streamingMessageId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !socketRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    const newStreamingId = (Date.now() + 1).toString();
    setStreamingMessageId(newStreamingId);
    setMessages(prev => [...prev, { id: newStreamingId, role: 'assistant', content: '' }]);

    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
    socketRef.current.emit('chat', { message: userMsg.content, history });
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-24 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center group"
          title="Ouvrir l'Assistant IA (Ctrl+J)"
        >
          <Sparkles size={24} className="group-hover:animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col pointer-events-auto" onClick={e => e.stopPropagation()}>
          <div className="w-full sm:w-[400px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden h-[600px] max-h-[85vh] animate-in slide-in-from-bottom-8">
            <header className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Bot size={24} className="text-primary" />
                <h2 className="font-semibold">DevTracker AI</h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">NVIDIA NIM</span>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              {messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-sm' 
                      : 'bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border/50 shadow-sm'
                  }`}>
                    {msg.content}
                    {msg.role === 'assistant' && msg.id === streamingMessageId && isLoading && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="p-3 border-t border-border bg-card flex items-center gap-2" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-muted/50 border border-input rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                placeholder="Posez une question à l'IA..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-sm"
                disabled={!input.trim() || isLoading}
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;

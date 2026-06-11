import React, { useState, useEffect } from 'react';
import { Search, Plus, Pin, Trash2, Tag, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import api from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  updatedAt: string;
}

const NotesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ['notes', search],
    queryFn: async () => {
      const res = await api.get(search ? `/notes/search?q=${search}` : '/notes');
      return res.data;
    }
  });

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  useEffect(() => {
    if (activeNote) {
      setLocalTitle(activeNote.title);
      setLocalContent(activeNote.content);
    } else {
      setLocalTitle('');
      setLocalContent('');
    }
  }, [activeNoteId]); // Do NOT include activeNote to avoid overriding user input during autosave

  const createNote = useMutation({
    mutationFn: () => api.post('/notes', { title: 'Nouvelle note', content: '' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setActiveNoteId(res.data.id);
    }
  });

  const updateNote = useMutation({
    mutationFn: (data: Partial<Note>) => api.patch(`/notes/${activeNoteId}`, data),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: () => setSaveStatus('error')
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (activeNoteId === activeNoteId) setActiveNoteId(null);
    }
  });

  const togglePin = useMutation({
    mutationFn: (note: Note) => api.patch(`/notes/${note.id}`, { pinned: !note.pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] })
  });

  // Debounced save for content and title
  useEffect(() => {
    if (!activeNoteId) return;
    const handler = setTimeout(() => {
      if (activeNote && (localTitle !== activeNote.title || localContent !== activeNote.content)) {
        updateNote.mutate({ title: localTitle, content: localContent });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [localTitle, localContent, activeNoteId]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-background rounded-xl border border-border overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-[280px] flex-shrink-0 md:border-r border-border bg-card flex-col ${activeNoteId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border flex flex-col gap-4">
          <Button onClick={() => createNote.mutate()} className="w-full gap-2">
            <Plus size={16} /> Nouvelle Note
          </Button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Chargement...</div>
          ) : notes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Aucune note trouvée.</div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`p-4 cursor-pointer border-b border-border transition-colors hover:bg-muted/50 ${activeNoteId === note.id ? 'bg-muted' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm truncate pr-2 flex-1 text-foreground">
                    {note.title || 'Note sans titre'}
                  </h4>
                  {note.pinned && <Pin size={12} className="text-primary flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {note.content || 'Pas de contenu...'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  {note.tags?.length > 0 && (
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary text-[9px]">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className={`flex-1 flex-col bg-background ${!activeNoteId ? 'hidden md:flex' : 'flex'}`}>
        {activeNote ? (
          <>
            <header className="h-14 border-b border-border px-4 md:px-6 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4 flex-1">
                <Button variant="ghost" size="icon" className="md:hidden flex-shrink-0" onClick={() => setActiveNoteId(null)}>
                  <ChevronLeft size={18} />
                </Button>
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  className="bg-transparent border-none text-lg font-semibold outline-none placeholder-muted-foreground text-foreground w-full min-w-0"
                  placeholder="Titre de la note"
                />
                <div className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                  {saveStatus === 'saving' && 'Enregistrement...'}
                  {saveStatus === 'saved' && 'Enregistré'}
                  {saveStatus === 'error' && <span className="text-destructive">Erreur</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => togglePin.mutate(activeNote)} className={activeNote.pinned ? 'text-primary' : 'text-muted-foreground'}>
                  <Pin size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Tag size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteNote.mutate(activeNote.id)}>
                  <Trash2 size={18} />
                </Button>
              </div>
            </header>
            <div className="flex-1 p-6 relative">
              <textarea
                className="w-full h-full bg-transparent border-none outline-none resize-none text-foreground placeholder-muted-foreground leading-relaxed"
                placeholder="Commencez à écrire..."
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-4">
            <FileText size={48} className="opacity-20" />
            <p>Sélectionnez une note ou créez-en une nouvelle.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple icon for empty state
const FileText = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

export default NotesPage;

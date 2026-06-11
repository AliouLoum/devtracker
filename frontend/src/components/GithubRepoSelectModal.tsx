import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, GitBranch as Github, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

interface Repo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string;
}

interface GithubRepoSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const GithubRepoSelectModal: React.FC<GithubRepoSelectModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchRepos();
    }
  }, [isOpen]);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/github/repos');
      setRepos(res.data);
      setSelectedRepos([]);
    } catch (err) {
      console.error('Failed to fetch github repos:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRepo = (fullName: string) => {
    setSelectedRepos(prev => 
      prev.includes(fullName) ? prev.filter(n => n !== fullName) : [...prev, fullName]
    );
  };

  const handleImport = async () => {
    if (selectedRepos.length === 0) return;
    
    setImporting(true);
    try {
      await api.post(`/github/sync-projects`, {
        selectedRepos
      });
      onImportSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to import repos:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Github className="w-6 h-6" />
            Importer des Projets GitHub
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les dépôts GitHub que vous souhaitez transformer en projets.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-3 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Chargement de vos dépôts GitHub...</p>
            </div>
          ) : repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <CheckCircle2 className="w-12 h-12 text-green-500/50" />
              <p>Aucun dépôt trouvé sur votre compte GitHub.</p>
            </div>
          ) : (
            repos.map(repo => {
              const isSelected = selectedRepos.includes(repo.fullName);
              return (
                <div 
                  key={repo.id}
                  onClick={() => toggleRepo(repo.fullName)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border/50 bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-foreground line-clamp-1">
                          {repo.name}
                        </h4>
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">
                          {repo.owner}
                        </span>
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={importing}>
            Annuler
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={importing || selectedRepos.length === 0 || loading}
            className="min-w-[120px]"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Importer {selectedRepos.length > 0 ? `(${selectedRepos.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

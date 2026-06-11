import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, GitBranch as Github, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

interface Issue {
  number: number;
  title: string;
  body: string;
  url: string;
  labels: any[];
}

interface GithubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onImportSuccess: () => void;
}

export const GithubImportModal: React.FC<GithubImportModalProps> = ({ isOpen, onClose, projectId, onImportSuccess }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchIssues();
    }
  }, [isOpen, projectId]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/github/issues/${projectId}`);
      setIssues(res.data);
      // Select all by default or none by default? Let's do none by default for safety
      setSelectedIssues([]);
    } catch (err) {
      console.error('Failed to fetch github issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleIssue = (number: number) => {
    setSelectedIssues(prev => 
      prev.includes(number) ? prev.filter(n => n !== number) : [...prev, number]
    );
  };

  const handleImport = async () => {
    if (selectedIssues.length === 0) return;
    
    setImporting(true);
    try {
      await api.post(`/github/import-selected/${projectId}`, {
        issueNumbers: selectedIssues
      });
      onImportSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to import issues:', err);
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
            Importer des Issues GitHub
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les issues que vous souhaitez transformer en tâches.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-3 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Chargement des issues...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <CheckCircle2 className="w-12 h-12 text-green-500/50" />
              <p>Aucune issue ouverte trouvée sur ce dépôt.</p>
            </div>
          ) : (
            issues.map(issue => {
              const isSelected = selectedIssues.includes(issue.number);
              return (
                <div 
                  key={issue.number}
                  onClick={() => toggleIssue(issue.number)}
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
                          {issue.title}
                        </h4>
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">
                          #{issue.number}
                        </span>
                      </div>
                      {issue.labels && issue.labels.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {issue.labels.map((lbl: any, idx: number) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-background">
                              {typeof lbl === 'string' ? lbl : lbl.name}
                            </span>
                          ))}
                        </div>
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
            disabled={importing || selectedIssues.length === 0 || loading}
            className="min-w-[120px]"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Importer {selectedIssues.length > 0 ? `(${selectedIssues.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

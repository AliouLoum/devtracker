import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

interface KeyboardCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardCheatSheet: React.FC<KeyboardCheatSheetProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raccourcis Clavier</DialogTitle>
          <DialogDescription>
            Boostez votre productivité avec la navigation style Vim (seulement actif hors des champs texte).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="text-muted-foreground">Naviguer vers le bas</span>
            <kbd className="bg-muted px-2 py-1 rounded-md text-sm font-mono border border-border">j</kbd>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="text-muted-foreground">Naviguer vers le haut</span>
            <kbd className="bg-muted px-2 py-1 rounded-md text-sm font-mono border border-border">k</kbd>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="text-muted-foreground">Éditer la tâche sélectionnée</span>
            <kbd className="bg-muted px-2 py-1 rounded-md text-sm font-mono border border-border">e</kbd>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="text-muted-foreground">Marquer comme Done</span>
            <kbd className="bg-muted px-2 py-1 rounded-md text-sm font-mono border border-border">d</kbd>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="text-muted-foreground">Supprimer la tâche</span>
            <kbd className="bg-muted px-2 py-1 rounded-md text-sm font-mono border border-border">Backspace</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Afficher cette aide</span>
            <kbd className="bg-muted px-2 py-1 rounded-md text-sm font-mono border border-border">Shift + ?</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardCheatSheet;

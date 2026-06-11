import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { CheckCircle2, Zap, Palette, CalendarClock, Link } from 'lucide-react';

interface WhatsNewDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatsNewDialog: React.FC<WhatsNewDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="text-primary" />
            Nouveautés de la Phase 5
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="flex gap-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit text-primary">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Mode Hors-Ligne & PWA</h4>
              <p className="text-sm text-muted-foreground mt-1">
                L'application fonctionne maintenant sans internet ! Vos modifications sont sauvegardées localement et synchronisées automatiquement dès le retour de la connexion.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit text-primary">
              <Palette size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Thèmes Custom (8 couleurs)</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Allez dans les Settings pour choisir la couleur d'accent qui vous correspond (Bleu, Violet, Vert, Orange, etc.).
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit text-primary">
              <CalendarClock size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Suggestions IA & Priorités</h4>
              <p className="text-sm text-muted-foreground mt-1">
                L'algorithme IA sur le Dashboard vous indique quelle tâche prioriser. Chaque nuit, les priorités sont recalculées automatiquement selon vos deadlines !
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit text-primary">
              <Link size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Graphe de Dépendances</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Liez les tâches entre elles et visualisez l'ordre de travail dans le nouvel onglet "Graphe" de votre projet.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsNewDialog;

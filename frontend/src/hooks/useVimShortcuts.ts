import { useEffect, useState } from 'react';

export const useVimShortcuts = (handlers: {
  onUp?: () => void;
  onDown?: () => void;
  onEdit?: () => void;
  onDone?: () => void;
  onDelete?: () => void;
}) => {
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'j':
          handlers.onDown?.();
          break;
        case 'k':
          handlers.onUp?.();
          break;
        case 'e':
          handlers.onEdit?.();
          break;
        case 'd':
          handlers.onDone?.();
          break;
        case 'Backspace':
          handlers.onDelete?.();
          break;
        case '?':
          if (e.shiftKey) {
            setShowCheatSheet(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);

  return { showCheatSheet, setShowCheatSheet };
};

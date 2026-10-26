import { useEffect } from 'react';

/**
 * Closes an open menu on a secondary press (or Control-click) outside every menu popover, where the
 * browser then shows its own menu. React Aria's outside-press dismissal handles primary presses only.
 */
export function useCloseOnSecondaryPress(isOpen: boolean, close: () => void): void {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 2 && !(event.button === 0 && event.ctrlKey)) return;
      if ((event.target as Element | null)?.closest?.('.ui-menu-popover')) return;
      close();
    };
    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, [isOpen, close]);
}

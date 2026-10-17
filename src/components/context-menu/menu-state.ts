import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Key, RootMenuTriggerState } from 'react-aria-components';

/**
 * The root menu state React Aria reads for submenus and to close a whole menu tree, for a menu
 * whose open state lives elsewhere. `close` empties the submenu stack, then calls `onClose`.
 */
export function useRootMenuState(isOpen: boolean, onClose: () => void): RootMenuTriggerState {
  const [expandedKeysStack, setExpandedKeysStack] = useState<Key[]>([]);
  const close = useCallback(() => {
    setExpandedKeysStack([]);
    onClose();
  }, [onClose]);
  return useMemo<RootMenuTriggerState>(
    () => ({
      isOpen,
      focusStrategy: 'first',
      point: null,
      setPoint: () => {},
      setOpen: (open) => {
        if (!open) close();
      },
      open: () => {},
      toggle: close,
      close,
      expandedKeysStack,
      openSubmenu: (triggerKey, level) =>
        setExpandedKeysStack((stack) =>
          level > stack.length ? stack : [...stack.slice(0, level), triggerKey],
        ),
      closeSubmenu: (triggerKey, level) =>
        setExpandedKeysStack((stack) =>
          stack[level] === triggerKey ? stack.slice(0, level) : stack,
        ),
    }),
    [isOpen, close, expandedKeysStack],
  );
}

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

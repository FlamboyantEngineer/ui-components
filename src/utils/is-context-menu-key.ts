/** Whether a key requests a context menu through the menu key or Shift+F10. */
export function isContextMenuKey({ key, shiftKey }: { key: string; shiftKey: boolean }): boolean {
  return key === 'ContextMenu' || (shiftKey && key === 'F10');
}

'use client';

import { type DragEvent, useRef, useState } from 'react';

interface FileDrop {
  /** A drag carrying files is over the composer. */
  isDropTarget: boolean;
  /** Handlers for the composer's root. */
  dropProps: {
    onDragEnter: (event: DragEvent) => void;
    onDragOver: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
  };
}

function carriesFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

/** The files chosen in the system file chooser, handed to `onAttach` when there are any. */
export function attachChosenFiles(list: FileList | null, onAttach: (files: File[]) => void): void {
  const files = list ? Array.from(list) : [];
  if (files.length > 0) onAttach(files);
}

/**
 * Whether a clipboard holds text copied from an application, which may carry a picture of it: rich
 * text beside non-empty plain text. A copied file carries its name as plain text and no HTML, and
 * a copied image carries HTML and no plain text; both attach.
 */
function isCopiedText(data: DataTransfer): boolean {
  return data.types.includes('text/html') && data.getData('text/plain').trim() !== '';
}

/**
 * The files a paste carries, handed to `onAttach` instead of pasting; whether there were any. Text
 * copied from an application pastes as text, even when the clipboard holds a picture of it too.
 */
export function attachPastedFiles(
  event: { clipboardData: DataTransfer | null; preventDefault: () => void },
  onAttach: ((files: File[]) => void) | undefined,
): boolean {
  const data = event.clipboardData;
  const files = Array.from(data?.files ?? []);
  if (!onAttach || !data || files.length === 0 || isCopiedText(data)) return false;
  event.preventDefault();
  onAttach(files);
  return true;
}

/**
 * Files dragged onto the composer: while a drag that carries files is over it, it is a drop
 * target, and dropping hands the files to `onAttach`. Drags of text are left to the text box.
 * React Aria's drop hooks cannot tell a file drag from a text drag before the drop, so this
 * follows the native drag events, counting entries into the composer's children.
 */
export function useFileDrop(onAttach: ((files: File[]) => void) | undefined): FileDrop {
  const [isDropTarget, setDropTarget] = useState(false);
  const depth = useRef(0);
  const accepts = (event: DragEvent) => Boolean(onAttach) && carriesFiles(event);
  return {
    isDropTarget: isDropTarget && Boolean(onAttach),
    dropProps: {
      onDragEnter(event) {
        if (!accepts(event)) return;
        event.preventDefault();
        depth.current += 1;
        setDropTarget(true);
      },
      onDragOver(event) {
        if (!accepts(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      },
      onDragLeave(event) {
        if (!accepts(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDropTarget(false);
      },
      onDrop(event) {
        if (!accepts(event)) return;
        event.preventDefault();
        depth.current = 0;
        setDropTarget(false);
        const files = Array.from(event.dataTransfer.files);
        if (files.length > 0) onAttach?.(files);
      },
    },
  };
}

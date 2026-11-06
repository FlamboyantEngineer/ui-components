'use client';

import {
  type HTMLAttributes,
  type KeyboardEvent,
  type RefObject,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PressEvent } from '../../core/events.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getComposedActiveElement } from '../../utils/focus-target.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { armElementDrag } from '../../utils/pointer-drag.js';
import { useDragType } from '../../utils/use-drag-type.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { useItemDrag } from '../../utils/use-item-drag.js';
import { useLatest } from '../../utils/use-latest.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { type FileUploadMove, moveFileUploadItem } from './file-upload-moves.js';

/** What the listed files' drag and drop and keyboard moves share. */
export interface FileReorder {
  /** Unique to the upload, so other uploads and drop targets refuse its files. */
  dragType: string;
  dragging: RefObject<Key | null>;
  isDisabled: boolean;
  /** The move a drop of the dragged file on `targetId` makes, against the files shown now. */
  resolveDrop: (targetId: Key) => FileUploadMove | null;
  /** Reports and announces a move. */
  move: (move: FileUploadMove) => void;
  /** Moves a file one place by Alt+Arrow keys, keeping focus where it is. */
  step: (id: Key, delta: -1 | 1) => void;
}

interface FileReorderSource {
  files: readonly { id: Key; name: string }[];
  onMove: (move: FileUploadMove) => void;
  isDisabled: boolean;
}

const moveKeys: Readonly<Record<string, -1 | 1>> = { ArrowUp: -1, ArrowDown: 1 };

/** A drop on another file takes its place: after it when dragged down, before it when dragged up. */
function resolveFileDrop(
  files: FileReorderSource['files'],
  id: Key,
  targetId: Key,
): FileUploadMove | null {
  const from = files.findIndex((file) => file.id === id);
  const to = files.findIndex((file) => file.id === targetId);
  if (from < 0 || to < 0 || from === to) return null;
  return { id, targetId, position: from < to ? 'after' : 'before' };
}

/** The move of a file one place up (-1) or down (1), or null at either end. */
function resolveFileStep(
  files: FileReorderSource['files'],
  id: Key,
  delta: -1 | 1,
): FileUploadMove | null {
  const index = files.findIndex((file) => file.id === id);
  const target = index === -1 ? undefined : files[index + delta];
  if (!target) return null;
  return { id, targetId: target.id, position: delta === 1 ? 'after' : 'before' };
}

/**
 * The upload's file reordering: each check and move reads the files last rendered, so a file
 * removed or replaced during a drag is never moved, and every move is announced with the file's
 * new position.
 */
export function useFileReorder(source: FileReorderSource): {
  reorder: FileReorder;
  announcement: string;
} {
  const strings = useUiStrings();
  const latest = useLatest({ ...source, strings });
  const dragType = useDragType('file');
  const dragging = useRef<Key | null>(null);
  const requestFocus = useFocusRequest();
  const [announcement, setAnnouncement] = useState('');
  const { isDisabled } = source;
  const reorder = useMemo<FileReorder>(() => {
    const move = (fileMove: FileUploadMove) => {
      const { files, onMove, strings: text } = latest.current;
      const file = files.find((candidate) => candidate.id === fileMove.id);
      if (latest.current.isDisabled || !file) return;
      const position = moveFileUploadItem(files, fileMove).indexOf(file) + 1;
      onMove(fileMove);
      setAnnouncement(text.fileMoved(file.name, position, files.length));
    };
    return {
      dragType,
      dragging,
      isDisabled,
      resolveDrop: (targetId) => {
        const id = dragging.current;
        return id === null ? null : resolveFileDrop(latest.current.files, id, targetId);
      },
      move,
      step: (id, delta) => {
        const fileMove = resolveFileStep(latest.current.files, id, delta);
        if (!fileMove) return;
        const active = getComposedActiveElement(getOwnerDocument(null));
        move(fileMove);
        // React may detach the focused row to reorder the list; focus goes back to what had it.
        requestFocus(() => (isHTMLElement(active) && active.isConnected ? active : null));
      },
    };
  }, [dragType, isDisabled, latest, requestFocus]);
  return { reorder, announcement };
}

/** Lets only the handle start a file's pointer drag, so presses elsewhere in its row never drag it. */
function armFile(event: PressEvent): void {
  const row = event.target.closest('li');
  if (event.pointerType === 'keyboard' || event.pointerType === 'virtual' || !row) return;
  armElementDrag(row);
}

/** One listed file's drag and drop: props for its row and its handle, and its states. */
interface FileRowDrag {
  ref: RefObject<HTMLLIElement | null>;
  /** Spread on the row: it drags, takes drops and moves by Alt+ArrowUp and Alt+ArrowDown. */
  props: HTMLAttributes<HTMLLIElement>;
  /** Spread on the handle: a pointer press arms the drag, a keyboard press starts it. */
  handleProps: {
    onPressStart: (event: PressEvent) => void;
    onPress: (event: PressEvent) => void;
    'aria-describedby': string | undefined;
  };
  isDragging: boolean;
  dropPosition: FileUploadMove['position'] | null;
}

/**
 * A listed file's reordering: it drags from its handle, by pointer or by keyboard and screen reader
 * from the handle's press, takes drops of the upload's other files, and moves one place by
 * Alt+ArrowUp and Alt+ArrowDown from anywhere in its row but a text control.
 */
export function useFileRowDrag({
  id,
  name,
  reorder,
}: {
  id: Key;
  name: string;
  /** `null` while the files do not reorder. */
  reorder: FileReorder | null;
}): FileRowDrag {
  const ref = useRef<HTMLLIElement>(null);
  const isDisabled = !reorder || reorder.isDisabled;
  const { dragProps, startDrag, describedBy, isDragging, dropPosition } = useItemDrag({
    ref,
    key: id,
    textValue: name,
    dragType: reorder?.dragType ?? '',
    dragging: reorder?.dragging ?? null,
    isDisabled,
    resolveMove: () => reorder?.resolveDrop(id) ?? null,
    onMove: (move) => reorder?.move(move),
  });
  // The row turns draggable only while its handle is pressed (`armFile`).
  const { draggable: _draggable, ...rowDragProps } = dragProps;
  const onKeyDownCapture = (event: KeyboardEvent<HTMLLIElement>) => {
    const delta = moveKeys[event.key];
    const isOwn = event.currentTarget.contains(event.target as Node);
    if (!delta || !isMoveChord(event) || !isOwn || isComposingKey(event.nativeEvent)) return;
    // A text control in the row's actions keeps the chord for its caret.
    if (isEditableTarget(event.target) || isDisabled) return;
    event.preventDefault();
    event.stopPropagation();
    reorder?.step(id, delta);
  };
  return {
    ref,
    props: reorder ? { ...(rowDragProps as HTMLAttributes<HTMLLIElement>), onKeyDownCapture } : {},
    handleProps: { onPressStart: armFile, onPress: startDrag, 'aria-describedby': describedBy },
    isDragging,
    dropPosition,
  };
}

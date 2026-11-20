'use client';

import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { Dialog } from './dialog.js';
import type {
  DialogContentOptions,
  DialogController,
  DialogEntry,
  DialogHandle,
  DialogOpenOptions,
} from './dialog-controller.js';

export interface DialogHostProps {
  /** The controller whose open modals the host renders. */
  controller: DialogController;
}

interface DialogHostEntryProps {
  entry: DialogEntry;
  /** False while a closed modal runs its exit, before it leaves the host. */
  isOpen: boolean;
  /** Called once a closed modal's exit has ended. */
  onExitComplete: (() => void) | undefined;
}

function DialogHostEntry({ entry, isOpen, onExitComplete }: DialogHostEntryProps) {
  const handle = entry.handle as DialogHandle<unknown>;
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handle.close();
    },
    [handle],
  );
  const options = entry.options as DialogOpenOptions<unknown>;
  if ('render' in options) {
    return options.render({ isOpen: true, onOpenChange, close: handle.close, handle });
  }
  const { content, ...modalProps } = options;
  return (
    <Dialog
      {...modalProps}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onExitComplete={isOpen ? undefined : onExitComplete}
    >
      {typeof content === 'function' ? content(handle) : content}
    </Dialog>
  );
}

/** A key per controller, so a host given another controller starts its modals afresh. */
const controllerKeys = new WeakMap<DialogController, number>();
let lastControllerKey = 0;

function keyOf(controller: DialogController): number {
  let key = controllerKeys.get(controller);
  if (key === undefined) {
    lastControllerKey += 1;
    key = lastControllerKey;
    controllerKeys.set(controller, key);
  }
  return key;
}

/** Where a modal stands in its controller's opening order; IDs count up as modals open. */
function openingOrder(entry: DialogEntry): number {
  return Number(entry.id.slice(entry.id.lastIndexOf('-') + 1));
}

/**
 * The modals that closed while shown and still run their exit, kept until it ends. A modal drawn by
 * `render` leaves at once, since the host cannot tell when its own exit ends.
 */
function useLeavingDialogs(shown: readonly DialogEntry[]) {
  const [last, setLast] = useState(shown);
  const [leaving, setLeaving] = useState<readonly DialogEntry[]>([]);
  const isSame =
    last.length === shown.length && last.every((entry, index) => entry === shown[index]);
  if (!isSame) {
    // Adjusting state while rendering keeps a closed modal on the page in the same commit.
    const ids = new Set(shown.map((entry) => entry.id));
    const gone = last.filter((entry) => !ids.has(entry.id) && !('render' in entry.options));
    setLast(shown);
    if (gone.length > 0) setLeaving((current) => [...current, ...gone]);
  }
  const finish = useCallback((entry: DialogEntry) => {
    setLeaving((current) => current.filter((item) => item !== entry));
    (entry.options as DialogContentOptions).onExitComplete?.();
  }, []);
  return { leaving, finish };
}

/** One controller's open modals, the most recently opened on top. */
function ControllerDialogs({ controller }: DialogHostProps) {
  const entries = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  // A modal hides everything outside itself when it mounts, so modals mounted in the same commit
  // would hide each other. Newly listed modals mount one commit at a time, oldest first.
  const [mounted, setMounted] = useState(0);
  const count = Math.min(mounted, entries.length);
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Each modal must be committed, and hide the rest, before the next one mounts.
    if (count < entries.length) setMounted(count + 1);
    else if (mounted !== count) setMounted(count);
  }, [count, mounted, entries.length]);
  const shown = entries.slice(0, count);
  const { leaving, finish } = useLeavingDialogs(shown);
  const listed = [
    ...shown.map((entry) => ({ entry, isOpen: true })),
    ...leaving.map((entry) => ({ entry, isOpen: false })),
  ].sort((a, b) => openingOrder(a.entry) - openingOrder(b.entry));
  return (
    <>
      {listed.map(({ entry, isOpen }) => (
        <DialogHostEntry
          key={entry.id}
          entry={entry}
          isOpen={isOpen}
          onExitComplete={() => finish(entry)}
        />
      ))}
    </>
  );
}

/**
 * Renders a controller's open modals, the most recently opened on top. Render it once. Given another
 * controller, it drops the modals it showed and shows the new controller's from scratch: modal IDs
 * are unique within one controller only, so no draft, pending state or focus carries across.
 */
export function DialogHost({ controller }: DialogHostProps) {
  return <ControllerDialogs key={keyOf(controller)} controller={controller} />;
}

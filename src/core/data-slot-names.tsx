'use client';

// Names that a presentation gives the shared parts it renders (specs/HOOK-CONTRACT.md UIC-HOOKS-1.6).

import { createContext, type ReactNode, useContext, useMemo } from 'react';
import type { ComponentHooks, DataSlotOverrides } from './hooks.js';

interface DataSlotNamesProps {
  /** `data-slot` names by hook class; a module constant, so the scope keeps one value. */
  names: DataSlotOverrides;
  children: ReactNode;
}

/** How a presentation renames a family's declared names. */
export interface DataSlotPrefix {
  /** The declared prefix, e.g. `dialog`. */
  from: string;
  /** The presentation's prefix, e.g. `sheet`. */
  to: string;
  /** Part words that change too, by declared word (`{ content: 'list' }`); `null` drops the name. */
  parts?: Readonly<Record<string, string | null>> | undefined;
}

const noNames: DataSlotOverrides = {};

const DataSlotNamesContext = createContext<DataSlotOverrides>(noNames);

function renameWithPrefix(name: string, { from, to, parts = {} }: DataSlotPrefix): string | null {
  if (name === from) return to;
  if (!name.startsWith(`${from}-`)) return name;
  const word = name.slice(from.length + 1);
  const renamed = Object.hasOwn(parts, word) ? parts[word] : word;
  return renamed === null || renamed === undefined ? null : `${to}-${renamed}`;
}

function hasNamesFor(hooks: ComponentHooks<string>, names: DataSlotOverrides): boolean {
  if (names === noNames) return false;
  const root = hooks.className;
  return Object.keys(names).some(
    (hookClass) => hookClass === root || hookClass.startsWith(`${root}__`),
  );
}

/**
 * The names a presentation gives a family's parts: every declared name of `families` that starts
 * with `prefix.from`, keyed by its hook class, with the prefix swapped (`dialog-title` becomes
 * `sheet-title`). With `from` equal to `to`, the declared names, which undo an outer presentation's.
 */
export function prefixDataSlots(
  families: ReadonlyArray<ComponentHooks<string>>,
  prefix: DataSlotPrefix,
): DataSlotOverrides {
  const names: Record<string, string | null> = {};
  for (const hooks of families) {
    for (const part of ['root', ...hooks.slots]) {
      const declared = hooks.dataSlot(part);
      if (declared === undefined) continue;
      const hookClass = part === 'root' ? hooks.className : hooks.slotClass(part);
      names[hookClass] = renameWithPrefix(declared, prefix);
    }
  }
  return names;
}

/** Names the shared parts rendered inside it; its names win over those of outer scopes. */
export function DataSlotNames({ names, children }: DataSlotNamesProps) {
  const outer = useContext(DataSlotNamesContext);
  const merged = useMemo(
    () => (outer === noNames ? names : { ...outer, ...names }),
    [outer, names],
  );
  return <DataSlotNamesContext value={merged}>{children}</DataSlotNamesContext>;
}

/** `hooks` with the names the enclosing presentations give its classes. */
export function useDataSlotHooks<Slot extends string>(
  hooks: ComponentHooks<Slot>,
): ComponentHooks<Slot> {
  const names = useContext(DataSlotNamesContext);
  return useMemo(
    () => (hasNamesFor(hooks, names) ? hooks.withDataSlots(names) : hooks),
    [hooks, names],
  );
}

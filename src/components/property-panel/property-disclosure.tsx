'use client';

// What the collapsible parts of a property panel (sections and cards) share.

import { useContext, useId } from 'react';
import { DisclosureGroupStateContext } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { usePersistentState, useUiStrings } from '../../core/provider.js';
import { booleanCodec } from '../../utils/json-codec.js';

/** Whether a section or card is open, which the caller may control. */
export interface PropertyExpansionProps {
  /** Whether it is open, controlled. */
  isExpanded?: boolean | undefined;
  /** Whether it starts open, uncontrolled. */
  defaultExpanded?: boolean | undefined;
  /** Called when it opens or closes. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}

interface ScopedExpansionOptions {
  /** Whether a query is active. */
  isFiltering: boolean;
  /** Whether the part is expanded while a query is active. */
  isExpandedWhileFiltering: boolean;
  isExpanded?: boolean | undefined;
  defaultExpanded: boolean;
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /** Remembers an uncontrolled state through the provider storage under this key. */
  persistKey?: string | undefined;
}

interface ScopedExpansion {
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
}

/** A part's disclosure state, and the way to open it to reveal a field inside, query or not. */
interface RevealableExpansion {
  expansion: ScopedExpansion;
  /** Opens the part unless it is open: its own state, or through `onExpandedChange` when controlled. */
  reveal: () => void;
}

/**
 * Disclosure state for a part that follows its caller, its stored value or the user, and that a
 * query opens: while one is active the part shows `isExpandedWhileFiltering` and ignores presses,
 * and the state the user chose returns when the query clears.
 */
export function useScopedExpansion({
  isFiltering,
  isExpandedWhileFiltering,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  persistKey,
}: ScopedExpansionOptions): RevealableExpansion {
  const [ownExpanded, setOwnExpanded] = usePersistentState(
    isExpanded === undefined ? persistKey : undefined,
    defaultExpanded,
    { codec: booleanCodec },
  );
  const change = (next: boolean) => {
    setOwnExpanded(next);
    onExpandedChange?.(next);
  };
  return {
    expansion: {
      isExpanded: isFiltering ? isExpandedWhileFiltering : (isExpanded ?? ownExpanded),
      onExpandedChange(next) {
        if (!isFiltering) change(next);
      },
    },
    // The open state the part returns to once a query lifts.
    reveal: () => {
      if (!(isExpanded ?? ownExpanded)) change(true);
    },
  };
}

/**
 * A section's disclosure state: while the panel opens and closes its sections (React Aria's
 * disclosure group), the panel's state for the key `id` (a generated key without one), which a
 * query still overrides; otherwise the section's own, as `useScopedExpansion` keeps it.
 */
export function useSectionExpansion({
  id,
  isExpanded,
  onExpandedChange,
  persistKey,
  ...options
}: ScopedExpansionOptions & { id: Key | undefined }): RevealableExpansion {
  const group = useContext(DisclosureGroupStateContext);
  const generatedId = useId();
  const key = id ?? generatedId;
  return useScopedExpansion({
    ...options,
    isExpanded: group ? group.expandedKeys.has(key) : isExpanded,
    onExpandedChange(next) {
      group?.toggleKey(key);
      onExpandedChange?.(next);
    },
    persistKey: group ? undefined : persistKey,
  });
}

/** The mark of a section or card that holds a property overriding an inherited value. */
export function OverrideMark({ className }: { className: string }) {
  const strings = useUiStrings();
  return <span className={className} role="img" aria-label={strings.containsOverrides} />;
}

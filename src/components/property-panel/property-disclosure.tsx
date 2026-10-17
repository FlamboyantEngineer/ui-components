// What the collapsible parts of a property panel (sections and cards) share.

import { usePersistentState, useUiStrings } from '../../core/provider.js';

export interface ScopedExpansionOptions {
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

export interface ScopedExpansion {
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
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
}: ScopedExpansionOptions): ScopedExpansion {
  const [ownExpanded, setOwnExpanded] = usePersistentState(
    isExpanded === undefined ? persistKey : undefined,
    defaultExpanded,
  );
  return {
    isExpanded: isFiltering ? isExpandedWhileFiltering : (isExpanded ?? ownExpanded),
    onExpandedChange(next) {
      if (isFiltering) return;
      setOwnExpanded(next);
      onExpandedChange?.(next);
    },
  };
}

/** The mark of a section or card that holds a property overriding an inherited value. */
export function OverrideMark({ className }: { className: string }) {
  const strings = useUiStrings();
  return <span className={className} role="img" aria-label={strings.containsOverrides} />;
}

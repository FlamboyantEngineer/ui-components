// Which reasoning, tool calls and groups of steps of a message are open, as the reader chose
// (specs/CHAT-PARTS.md, UIC-CHAT-PARTS-5.3 and UIC-CHAT-PARTS-6.1).

import { useEffect, useRef, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';

/** The reader's open (`true`) and closed (`false`) choices, by part id or group key. */
export type ExpandedParts = Readonly<Record<string, boolean>>;

export interface PartsExpansionOptions {
  expandedParts: ExpandedParts | undefined;
  onExpandedPartsChange: ((expandedParts: Record<string, boolean>) => void) | undefined;
}

export interface PartsExpansion {
  expanded: ExpandedParts;
  /** Records the reader's choice for one part or group. */
  setExpanded: (key: string, isExpanded: boolean) => void;
  /** Opens these parts or groups, as if the reader had opened each. */
  expand: (keys: readonly string[]) => void;
}

/** A group of steps and the tool calls in it that wait for the reader's approval. */
export interface AwaitingGroup {
  key: string;
  callIds: readonly string[];
}

/** The reader's choices: the caller's when `expandedParts` is given, else kept here. */
export function usePartsExpansion({
  expandedParts,
  onExpandedPartsChange,
}: PartsExpansionOptions): PartsExpansion {
  const [own, setOwn] = useState<ExpandedParts>({});
  const expanded = expandedParts ?? own;
  const update = (next: Record<string, boolean>) => {
    if (expandedParts === undefined) setOwn(next);
    onExpandedPartsChange?.(next);
  };
  return {
    expanded,
    setExpanded: (key, isExpanded) => update({ ...expanded, [key]: isExpanded }),
    expand: (keys) =>
      update({ ...expanded, ...Object.fromEntries(keys.map((key) => [key, true])) }),
  };
}

/**
 * Opens a group the reader closed when a tool call in it starts waiting for approval, so the
 * request never hides in a collapsed group. The group then stays open, as if the reader had opened
 * it, so it does not collapse under the reader's focus once they decide; closing it again holds.
 */
export function useApprovalReveal(groups: readonly AwaitingGroup[], expansion: PartsExpansion) {
  const seen = useRef<ReadonlySet<string>>(new Set());
  const latest = useLatest({ groups, expansion });
  const signature = groups.map((group) => `${group.key}=${group.callIds.join(',')}`).join(';');
  useEffect(() => {
    const { groups: current, expansion: state } = latest.current;
    const closed = current.filter(
      (group) =>
        state.expanded[group.key] === false && group.callIds.some((id) => !seen.current.has(id)),
    );
    seen.current = new Set(current.flatMap((group) => group.callIds));
    if (closed.length > 0) state.expand(closed.map((group) => group.key));
  }, [signature, latest]);
}

'use client';

import { useState } from 'react';
import type { Key } from '../../core/props.js';
import {
  applySelectMembershipValue,
  markSelectMembershipOptions,
  type SelectMembershipBaseline,
  type SelectMembershipChanges,
  type SelectMembershipEdits,
  toSelectMembershipChanges,
  toSelectMembershipValue,
} from './select-membership.js';
import type { SelectFieldItem } from './select-options.js';

export interface SelectMembershipOptions {
  /** The select's options, flat or grouped. */
  options: readonly SelectFieldItem[];
  /** Each option's committed membership across the records being edited. */
  baseline: SelectMembershipBaseline;
  /** The edits, controlled; the caller updates them from `onEditsChange`. */
  edits?: SelectMembershipEdits | undefined;
  /** The first edits while uncontrolled. Defaults to none. */
  defaultEdits?: SelectMembershipEdits | undefined;
  /** Hears each edit with the add, remove and retain intent it leaves. */
  onEditsChange?:
    ((edits: SelectMembershipEdits, changes: SelectMembershipChanges) => void) | undefined;
  /** Names the records being edited; a new key drops uncontrolled edits made for the old ones. */
  resetKey?: Key | undefined;
}

const noEdits: SelectMembershipEdits = { added: [], removed: [] };

/**
 * Bulk membership editing for a multiple `SelectField`: spread `fieldProps` on the field. Mixed
 * options show as indeterminate until edited; picks and unpicks become add and remove intent, while
 * untouched mixed options are retained, so applying `changes` never overwrites a record's other
 * memberships. Applying the intent to records stays with the caller.
 */
export function useSelectMembership(options: SelectMembershipOptions) {
  const { baseline, onEditsChange, resetKey } = options;
  const initial = options.defaultEdits ?? noEdits;
  const [own, setOwn] = useState({ resetKey, edits: initial });
  if (!Object.is(own.resetKey, resetKey)) setOwn({ resetKey, edits: initial });
  const edits = options.edits ?? (Object.is(own.resetKey, resetKey) ? own.edits : initial);
  const setEdits = (next: SelectMembershipEdits) => {
    if (next === edits) return;
    if (options.edits === undefined) setOwn({ resetKey, edits: next });
    onEditsChange?.(next, toSelectMembershipChanges(baseline, next));
  };
  return {
    fieldProps: {
      options: markSelectMembershipOptions(options.options, baseline, edits),
      value: toSelectMembershipValue(baseline, edits),
      onChange: (next: Key[]) =>
        setEdits(applySelectMembershipValue({ items: options.options, baseline, edits, next })),
    },
    changes: toSelectMembershipChanges(baseline, edits),
    isDirty: edits.added.length > 0 || edits.removed.length > 0,
    /** Drops every edit, so each option shows its baseline membership again. */
    reset: () => setEdits(edits.added.length + edits.removed.length > 0 ? noEdits : edits),
  };
}

// The membership model of a multiple select that edits several records at once: what each option's
// membership was (the baseline), the edits made since, and the add, remove and retain intent.

import type { Key } from '../../core/props.js';
import { flattenPickerItems } from '../field/field-picker-items.js';
import type { SelectFieldItem, SelectFieldOption } from './select-options.js';

/** Each option's committed membership across the records: chosen for all, or for some. */
export interface SelectMembershipBaseline {
  /** Options every record has. */
  selectedKeys: readonly Key[];
  /** Options some records have; the rest of the options belong to none. */
  partialKeys: readonly Key[];
}

/** The edits made against the baseline: options to give every record, and to take from every one. */
export interface SelectMembershipEdits {
  added: readonly Key[];
  removed: readonly Key[];
}

/** The intent to apply: the edits, and the mixed options whose per-record memberships stay as they are. */
export interface SelectMembershipChanges extends SelectMembershipEdits {
  retained: readonly Key[];
}

type Membership = 'all' | 'some' | 'none';

function readBaseline(baseline: SelectMembershipBaseline, key: Key): Membership {
  if (baseline.selectedKeys.includes(key)) return 'all';
  return baseline.partialKeys.includes(key) ? 'some' : 'none';
}

function readEdit(edits: SelectMembershipEdits, key: Key): 'add' | 'remove' | null {
  if (edits.added.includes(key)) return 'add';
  return edits.removed.includes(key) ? 'remove' : null;
}

/**
 * The edit a pick (`isChosen`) or an unpick leaves on an option. Picking a mixed option adds it for
 * every record, unpicking it then removes it from every record, and picking it once more drops the
 * edit, so it is mixed again; an option back at its baseline carries no edit.
 */
function toggleEdit(base: Membership, edit: 'add' | 'remove' | null, isChosen: boolean) {
  if (isChosen) {
    if (base === 'all' || (base === 'some' && edit === 'remove')) return null;
    return 'add';
  }
  return base === 'none' ? null : 'remove';
}

/** Whether `key` names an option the reader may change: listed, and not disabled. */
function isEditable(options: readonly SelectFieldOption[], key: Key) {
  const option = options.find((candidate) => candidate.id === key);
  return option !== undefined && !option.isDisabled;
}

/** The chosen keys a select shows for the edits: chosen for all, and not removed, or added. */
export function toSelectMembershipValue(
  baseline: SelectMembershipBaseline,
  edits: SelectMembershipEdits,
): Key[] {
  const kept = baseline.selectedKeys.filter((key) => !edits.removed.includes(key));
  return [...kept, ...edits.added.filter((key) => !kept.includes(key))];
}

/** The options with `isIndeterminate` set on the mixed ones that carry no edit. */
export function markSelectMembershipOptions(
  items: readonly SelectFieldItem[],
  baseline: SelectMembershipBaseline,
  edits: SelectMembershipEdits,
): SelectFieldItem[] {
  const mark = (option: SelectFieldOption): SelectFieldOption => ({
    ...option,
    isIndeterminate:
      readBaseline(baseline, option.id) === 'some' && readEdit(edits, option.id) === null,
  });
  return items.map((item) =>
    'options' in item ? { ...item, options: item.options.map(mark) } : mark(item),
  );
}

/**
 * The edits after the select reports `next` while it showed `shown`. Each key that joined or left
 * the value steps through `toggleEdit`; keys of disabled or unlisted options keep their edit, so
 * they never carry intent the reader could not make.
 */
export function applySelectMembershipValue(options: {
  items: readonly SelectFieldItem[];
  baseline: SelectMembershipBaseline;
  edits: SelectMembershipEdits;
  next: readonly Key[];
}): SelectMembershipEdits {
  const { baseline, edits, next } = options;
  const listed = flattenPickerItems(options.items);
  const shown = toSelectMembershipValue(baseline, edits);
  const toggled = [
    ...next.filter((key) => !shown.includes(key)),
    ...shown.filter((key) => !next.includes(key)),
  ].filter((key) => isEditable(listed, key));
  if (toggled.length === 0) return edits;
  let added = [...edits.added];
  let removed = [...edits.removed];
  for (const key of toggled) {
    const edit = toggleEdit(readBaseline(baseline, key), readEdit(edits, key), next.includes(key));
    added = added.filter((candidate) => candidate !== key);
    removed = removed.filter((candidate) => candidate !== key);
    if (edit === 'add') added.push(key);
    if (edit === 'remove') removed.push(key);
  }
  return { added, removed };
}

/** The intent for the edits: what to add and remove, and the mixed options left untouched. */
export function toSelectMembershipChanges(
  baseline: SelectMembershipBaseline,
  edits: SelectMembershipEdits,
): SelectMembershipChanges {
  return {
    added: edits.added,
    removed: edits.removed,
    retained: baseline.partialKeys.filter((key) => readEdit(edits, key) === null),
  };
}

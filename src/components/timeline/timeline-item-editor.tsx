'use client';

// The item editor: a modal form over one timeline item's name, days and progress
// (specs/TIMELINE.md, UIC-TIMELINE-2.6).

import { useCallback, useRef, useState, type FormEvent, type RefObject } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { Form } from '../form/form.js';
import { Link } from '../link/link.js';
import { Modal } from '../modal/modal.js';
import { NumberField } from '../number-field/number-field.js';
import { PeoplePicker } from '../people-picker/people-picker.js';
import { TextField } from '../text-field/text-field.js';
import { readTimelineItem, type TimelineItem, type TimelinePerson } from './timeline-geometry.js';

/**
 * What the editor saves: the item's name, days, progress and assignees. A milestone's `end` is its
 * `start`.
 */
export interface TimelineItemEdit {
  id: Key;
  label: string;
  start: string;
  end: string;
  progress: number | undefined;
  assignees: readonly TimelinePerson[] | undefined;
}

export interface TimelineItemEditorProps extends RefProps<HTMLDivElement>, BaseProps {
  /** The item to edit; the editor is open while it is set. */
  item: TimelineItem | null;
  /** Called once with the edited item when Save finds every field valid; the editor then closes. */
  onSave: (edit: TimelineItemEdit) => void;
  /** Called when the editor closes, by Save, Cancel, Escape or the close button. */
  onClose: () => void;
  /**
   * The people an item can be assigned to. With them the editor shows an assignees picker that
   * searches them by name; without them the item keeps its assignees.
   */
  assignablePeople?: readonly TimelinePerson[] | undefined;
}

const hooks = createHooks('timeline-item-editor', ['form', 'link']);

const percent: Intl.NumberFormatOptions = { style: 'percent' };

interface ItemFormProps {
  item: TimelineItem;
  people: readonly TimelinePerson[] | undefined;
  formRef: RefObject<HTMLFormElement | null>;
  onSave: (edit: TimelineItemEdit) => void;
}

interface AssigneesFieldProps {
  people: readonly TimelinePerson[];
  value: Key[];
  onChange: (value: Key[]) => void;
  isReadOnly: boolean;
}

/** A picker of an item's assignees among the assignable people, searched by name. */
function AssigneesField({ people, value, onChange, isReadOnly }: AssigneesFieldProps) {
  const strings = useUiStrings();
  const loadItems = useCallback(
    (query: string) => {
      const text = query.trim().toLocaleLowerCase();
      return Promise.resolve(
        people.filter((person) => person.name.toLocaleLowerCase().includes(text)),
      );
    },
    [people],
  );
  return (
    <PeoplePicker
      selectionMode="multiple"
      label={strings.timelineAssigneesColumn}
      value={value}
      onChange={onChange}
      loadItems={loadItems}
      knownPeople={people}
      isReadOnly={isReadOnly}
    />
  );
}

/** The people with the given ids, in that order, from the item's assignees and the assignable people. */
function findPeople(ids: readonly Key[], sources: readonly (readonly TimelinePerson[])[]) {
  const byId = new Map(sources.flat().map((person) => [person.id, person]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/** The fields of one item, drafted from it; a submit with every field valid saves them once. */
function ItemForm({ item, people, formRef, onSave }: ItemFormProps) {
  const strings = useUiStrings();
  const read = readTimelineItem(item);
  const isMilestone = read?.kind === 'milestone';
  const isReadOnly = Boolean(item.isReadOnly);
  const [label, setLabel] = useState(item.label);
  const [dates, setDates] = useState(read ? { start: read.start, end: read.end } : null);
  const [day, setDay] = useState(read?.start ?? null);
  const [progress, setProgress] = useState(item.progress ?? null);
  const [assigneeIds, setAssigneeIds] = useState(() => (item.assignees ?? []).map((p) => p.id));
  const isSaved = useRef(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const span = isMilestone ? (day ? { start: day, end: day } : null) : dates;
    const name = label.trim();
    if (isSaved.current || isReadOnly || !span || !name) return;
    isSaved.current = true;
    const kept = isMilestone ? item.progress : (progress ?? undefined);
    const assignees = people
      ? findPeople(assigneeIds, [item.assignees ?? [], people])
      : item.assignees;
    onSave({ id: item.id, label: name, ...span, progress: kept, assignees });
  };
  return (
    <Form ref={formRef} className={hooks.slotClass('form')} onSubmit={submit}>
      {item.href ? (
        <Link href={item.href} className={hooks.slotClass('link')}>
          {strings.timelineOpenItem(item.label)}
        </Link>
      ) : null}
      <TextField
        label={strings.timelineNameField}
        value={label}
        onChange={setLabel}
        isRequired
        isReadOnly={isReadOnly}
        autoFocus
      />
      {isMilestone ? (
        <DateTimeField
          label={strings.timelineDayField}
          value={day}
          onChange={setDay}
          isRequired
          isReadOnly={isReadOnly}
        />
      ) : (
        <>
          <DateTimeField
            mode="date-range"
            label={strings.timelineDatesField}
            value={dates}
            onChange={setDates}
            isRequired
            isReadOnly={isReadOnly}
          />
          <NumberField
            label={strings.timelineProgressColumn}
            value={progress}
            onChange={setProgress}
            minValue={0}
            maxValue={1}
            step={0.05}
            formatOptions={percent}
            isReadOnly={isReadOnly}
          />
        </>
      )}
      {people ? (
        <AssigneesField
          people={people}
          value={assigneeIds}
          onChange={setAssigneeIds}
          isReadOnly={isReadOnly}
        />
      ) : null}
    </Form>
  );
}

/**
 * A modal editor for one timeline item: its name, its days (a range for a bar, one day for a
 * milestone), a bar's progress and, given the assignable people, its assignees; a link to the
 * item's own page when it has one. Save checks the fields and hands the edit to the host once;
 * Cancel and Escape leave the item as it was. A read-only item opens with read-only fields and no
 * Save. Each opening owns its draft: reopening, even the same item while the editor is still
 * closing, starts a new draft from the item as it is then, which saves once.
 */
export function TimelineItemEditor({
  ref,
  item,
  onSave,
  onClose,
  assignablePeople,
  className,
}: TimelineItemEditorProps) {
  const strings = useUiStrings();
  // The last item stays drawn while the editor closes.
  const [shown, setShown] = useState(item);
  if (item !== null && item !== shown) setShown(item);
  // Each opening counts, so the form a closing editor keeps drawn is never taken for the next one.
  const [opening, setOpening] = useState({ isOpen: item !== null, count: 0 });
  if (opening.isOpen !== (item !== null)) {
    setOpening({ isOpen: item !== null, count: opening.count + (item === null ? 0 : 1) });
  }
  const formRef = useRef<HTMLFormElement>(null);
  const isReadOnly = Boolean(shown?.isReadOnly);
  const label = shown?.label ?? '';
  return (
    <Modal
      ref={ref}
      {...hooks.root({ className })}
      isOpen={item !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={isReadOnly ? label : strings.timelineEditItem(label)}
      primaryAction={
        isReadOnly
          ? undefined
          : { label: strings.save, onPress: () => formRef.current?.requestSubmit() }
      }
      cancelAction={isReadOnly ? { label: strings.close } : {}}
    >
      {shown ? (
        <ItemForm
          key={`${opening.count}:${toKeyIdentity(shown.id)}`}
          item={shown}
          people={assignablePeople}
          formRef={formRef}
          onSave={(edit) => {
            onSave(edit);
            onClose();
          }}
        />
      ) : null}
    </Modal>
  );
}

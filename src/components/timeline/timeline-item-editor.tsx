'use client';

// The item editor: a modal form over one timeline item's name, days and progress
// (specs/TIMELINE.md, UIC-TIMELINE-2.6).

import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { Form } from '../form/form.js';
import { Modal } from '../modal/modal.js';
import { NumberField } from '../number-field/number-field.js';
import { TextField } from '../text-field/text-field.js';
import { readTimelineItem, type TimelineItem } from './timeline-geometry.js';

/** What the editor saves: the item's name, days and progress. A milestone's `end` is its `start`. */
export interface TimelineItemEdit {
  id: Key;
  label: string;
  start: string;
  end: string;
  progress: number | undefined;
}

export interface TimelineItemEditorProps extends BaseProps {
  /** The item to edit; the editor is open while it is set. */
  item: TimelineItem | null;
  /** Called once with the edited item when Save finds every field valid; the editor then closes. */
  onSave: (edit: TimelineItemEdit) => void;
  /** Called when the editor closes, by Save, Cancel, Escape or the close button. */
  onClose: () => void;
}

const hooks = createHooks('timeline-item-editor', ['form']);

const percent: Intl.NumberFormatOptions = { style: 'percent' };

interface ItemFormProps {
  item: TimelineItem;
  formRef: RefObject<HTMLFormElement | null>;
  onSave: (edit: TimelineItemEdit) => void;
}

/** The fields of one item, drafted from it; a submit with every field valid saves them once. */
function ItemForm({ item, formRef, onSave }: ItemFormProps) {
  const strings = useUiStrings();
  const read = readTimelineItem(item);
  const isMilestone = read?.kind === 'milestone';
  const isReadOnly = Boolean(item.isReadOnly);
  const [label, setLabel] = useState(item.label);
  const [dates, setDates] = useState(read ? { start: read.start, end: read.end } : null);
  const [day, setDay] = useState(read?.start ?? null);
  const [progress, setProgress] = useState(item.progress ?? null);
  const isSaved = useRef(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const span = isMilestone ? (day ? { start: day, end: day } : null) : dates;
    const name = label.trim();
    if (isSaved.current || isReadOnly || !span || !name) return;
    isSaved.current = true;
    const kept = isMilestone ? item.progress : (progress ?? undefined);
    onSave({ id: item.id, label: name, ...span, progress: kept });
  };
  return (
    <Form ref={formRef} className={hooks.slotClass('form')} onSubmit={submit}>
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
    </Form>
  );
}

/**
 * A modal editor for one timeline item: its name, its days (a range for a bar, one day for a
 * milestone) and a bar's progress. Save checks the fields and hands the edit to the host once;
 * Cancel and Escape leave the item as it was. A read-only item opens with read-only fields and no
 * Save. The draft belongs to the item it opened on, by id.
 */
export function TimelineItemEditor({ item, onSave, onClose, className }: TimelineItemEditorProps) {
  const strings = useUiStrings();
  // The last item stays drawn while the editor closes.
  const [shown, setShown] = useState(item);
  if (item !== null && item !== shown) setShown(item);
  const formRef = useRef<HTMLFormElement>(null);
  const isReadOnly = Boolean(shown?.isReadOnly);
  const label = shown?.label ?? '';
  return (
    <Modal
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
          key={toKeyIdentity(shown.id)}
          item={shown}
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

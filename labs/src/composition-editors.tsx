import { useEffect, useRef, useState } from 'react';
import { AssetPicker, type AssetPickerItem } from '../../src/components/asset-picker/index.js';
import { Button } from '../../src/components/button/button.js';
import { CalendarView, type CalendarViewEvent } from '../../src/components/calendar-view/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { DateTimeField } from '../../src/components/date-time-field/date-time-field.js';
import { Fieldset } from '../../src/components/field/index.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { Modal } from '../../src/components/modal/modal.js';
import { NumberField } from '../../src/components/number-field/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { SelectField } from '../../src/components/select-field/index.js';
import { Switch } from '../../src/components/switch/index.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { Timeline, type TimelineItem } from '../../src/components/timeline/index.js';
import { DeleteGlyph, PlusGlyph } from '../../src/core/glyphs.js';

/** The host owns draft validation and saves; the calendar owns date geometry and navigation. */
export function CalendarEditorComposition() {
  const [events, setEvents] = useState<CalendarViewEvent[]>([
    { id: 'review', title: 'Review', start: '2026-11-12', end: '2026-11-13' },
  ]);
  const [draft, setDraft] = useState<CalendarViewEvent | null>(null);
  return (
    <Stack space="md">
      <CalendarView
        events={events}
        defaultDate="2026-11-12"
        onEventAction={(id) => setDraft(events.find((event) => event.id === id) ?? null)}
        onEventChange={(next) =>
          setEvents((current) => current.map((event) => (event.id === next.id ? next : event)))
        }
      />
      <Modal
        isOpen={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
        title="Edit event"
        bodyLayout="column"
        primaryAction={{
          label: 'Save',
          isDisabled: !draft?.title.trim() || !draft.start || !draft.end || draft.end < draft.start,
          onPress: (close) => {
            if (draft)
              setEvents((current) =>
                current.map((event) => (event.id === draft.id ? draft : event)),
              );
            close();
          },
        }}
      >
        <TextField
          label="Title"
          value={draft?.title ?? ''}
          onChange={(title) => setDraft((current) => current && { ...current, title })}
        />
        <DateTimeField
          mode="date-range"
          label="Dates"
          value={draft?.start ? { start: draft.start, end: draft.end ?? draft.start } : null}
          onChange={(range) => {
            setDraft(
              (current) =>
                current && { ...current, start: range?.start ?? '', end: range?.end ?? '' },
            );
          }}
        />
      </Modal>
    </Stack>
  );
}

/** A menu requests a form; dragging and the table alternative remain timeline interactions. */
export function TimelineEditorComposition() {
  const [items, setItems] = useState<TimelineItem[]>([
    { id: 'prepare', rowId: 'work', label: 'Prepare', start: '2026-11-10', end: '2026-11-14' },
  ]);
  const [draft, setDraft] = useState<TimelineItem | null>(null);
  return (
    <Stack space="md">
      <Timeline
        rows={[{ id: 'work', label: 'Work' }]}
        items={items}
        range={{ start: '2026-11-01', end: '2026-11-30' }}
        itemMenu={[{ id: 'edit', label: 'Edit' }]}
        onItemMenuAction={(_, item) => setDraft(item)}
        onItemChange={(change) =>
          setItems((current) =>
            current.map((item) => (item.id === change.id ? { ...item, ...change } : item)),
          )
        }
      />
      <Modal
        isOpen={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
        title="Edit item"
        bodyLayout="column"
        primaryAction={{
          label: 'Save',
          isDisabled: !draft?.label.trim() || !draft.start || !draft.end || draft.end < draft.start,
          onPress: (close) => {
            if (draft)
              setItems((current) => current.map((item) => (item.id === draft.id ? draft : item)));
            close();
          },
        }}
      >
        <TextField
          label="Label"
          value={draft?.label ?? ''}
          onChange={(label) => setDraft((current) => current && { ...current, label })}
        />
        <DateTimeField
          mode="date-range"
          label="Dates"
          value={draft?.start ? { start: draft.start, end: draft.end ?? draft.start } : null}
          onChange={(range) => {
            setDraft(
              (current) =>
                current && { ...current, start: range?.start ?? '', end: range?.end ?? '' },
            );
          }}
        />
        <NumberField
          label="Progress"
          minValue={0}
          maxValue={100}
          value={(draft?.progress ?? 0) * 100}
          onChange={(value) =>
            setDraft((current) => current && { ...current, progress: (value ?? 0) / 100 })
          }
        />
      </Modal>
    </Stack>
  );
}

const assets: AssetPickerItem[] = [
  {
    id: 'sample',
    name: 'Sample image',
    thumbnailSrc:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="60"%3E%3Crect width="80" height="60" fill="%23777"/%3E%3C/svg%3E',
    width: 800,
    height: 600,
  },
];
const searchAssets = () => Promise.resolve(assets);

/** Selection and placement are separate host decisions, composed with shared layout controls. */
export function AssetPlacementComposition() {
  const [asset, setAsset] = useState<AssetPickerItem | null>(null);
  const [alt, setAlt] = useState('');
  const [width, setWidth] = useState<number | null>(800);
  const [height, setHeight] = useState<number | null>(600);
  const [constrain, setConstrain] = useState(true);
  const [align, setAlign] = useState('start');
  const [saved, setSaved] = useState('');
  return (
    <Stack space="md">
      <AssetPicker
        aria-label="Choose image"
        search={searchAssets}
        onSelect={(item) => {
          setAsset(item);
          setAlt(item.alt ?? '');
          setWidth(item.width ?? null);
          setHeight(item.height ?? null);
          setConstrain(true);
        }}
      />
      {asset ? (
        <Stack space="md">
          <TextField label="Alternative text" value={alt} onChange={setAlt} />
          <Cluster space="sm" wrap="wrap">
            <NumberField
              label="Width"
              minValue={1}
              value={width}
              onChange={(value) => {
                setWidth(value);
                if (constrain && value !== null && asset.width && asset.height)
                  setHeight(Math.max(1, Math.round((value * asset.height) / asset.width)));
              }}
            />
            <NumberField
              label="Height"
              minValue={1}
              value={height}
              onChange={(value) => {
                setHeight(value);
                if (constrain && value !== null && asset.width && asset.height)
                  setWidth(Math.max(1, Math.round((value * asset.width) / asset.height)));
              }}
            />
            <SegmentedChoice
              aria-label="Alignment"
              value={align}
              onChange={(value) => setAlign(value ?? 'start')}
              options={['start', 'center', 'end'].map((value) => ({ value, label: value }))}
            />
          </Cluster>
          <Checkbox isSelected={constrain} onChange={setConstrain}>
            Keep proportions
          </Checkbox>
          <Button
            onPress={() =>
              setSaved(`${asset.name}: ${alt}, ${width ?? 'natural'} pixels, ${align}`)
            }
          >
            Place image
          </Button>
        </Stack>
      ) : null}
      <output aria-live="polite">{saved}</output>
    </Stack>
  );
}

type SequenceKind = 'hold' | 'ramp' | 'repeat';

interface SequenceStep {
  id: string;
  kind: SequenceKind;
  amount: number | null;
}

/** Each kind's numeric field: the host's label, limits, step and starting value. */
const sequenceKinds: Record<
  SequenceKind,
  { label: string; min: number; max: number; step: number; initial: number }
> = {
  hold: { label: 'Duration (s)', min: 0.1, max: 600, step: 0.1, initial: 5 },
  ramp: { label: 'Target (%)', min: 0, max: 100, step: 1, initial: 50 },
  repeat: { label: 'Count', min: 1, max: 20, step: 1, initial: 3 },
};

const sequenceKindOptions = [
  { id: 'hold', label: 'Hold' },
  { id: 'ramp', label: 'Ramp' },
  { id: 'repeat', label: 'Repeat' },
];

const minSteps = 1;
const maxSteps = 5;

/**
 * Ordered typed rows: each row's select chooses which numeric field it shows and that field's
 * limits. The host owns the rows, their ids, the row count bounds and focus after an add or a
 * removal; the fieldset disables every field at once while the values stay visible.
 */
export function FieldRowsComposition() {
  const [steps, setSteps] = useState<SequenceStep[]>([
    { id: 'warm-up', kind: 'hold', amount: 30 },
    { id: 'rise', kind: 'ramp', amount: 80 },
  ]);
  const [nextId, setNextId] = useState(1);
  const [isLocked, setLocked] = useState(false);
  // The row whose kind select takes focus once the rows render, or the add button ('').
  const pendingFocus = useRef<string | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const id = pendingFocus.current;
    pendingFocus.current = null;
    if (id !== null) (id === '' ? addButton.current : triggers.current.get(id))?.focus();
  }, [steps]);
  const update = (changed: SequenceStep) =>
    setSteps((current) => current.map((step) => (step.id === changed.id ? changed : step)));
  const remove = (index: number) => {
    const next = steps[index + 1] ?? steps[index - 1];
    setSteps(steps.filter((_, at) => at !== index));
    pendingFocus.current = next?.id ?? '';
  };
  return (
    <Stack space="md">
      <Switch isSelected={isLocked} onChange={setLocked}>
        Lock sequence
      </Switch>
      <Fieldset legend="Test sequence" isDisabled={isLocked}>
        <Stack space="sm" align="start">
          {steps.map((step, index) => {
            const field = sequenceKinds[step.kind];
            return (
              <Cluster key={step.id} space="sm" align="end" wrap="wrap">
                <SelectField
                  label={`Step ${index + 1} kind`}
                  options={sequenceKindOptions}
                  value={step.kind}
                  triggerRef={(element) => {
                    if (element) triggers.current.set(step.id, element);
                    else triggers.current.delete(step.id);
                  }}
                  onChange={(key) => {
                    const kind = key as SequenceKind | null;
                    if (kind && kind !== step.kind)
                      update({ ...step, kind, amount: sequenceKinds[kind].initial });
                  }}
                />
                <NumberField
                  // Another kind is another field: its limits and validation start over.
                  key={step.kind}
                  label={field.label}
                  minValue={field.min}
                  maxValue={field.max}
                  step={field.step}
                  commitBehavior="validate"
                  value={step.amount}
                  onChange={(amount) => update({ ...step, amount })}
                />
                <Button
                  icon={DeleteGlyph}
                  variant="ghost"
                  label={`Remove step ${index + 1}`}
                  isDisabled={isLocked || steps.length <= minSteps}
                  onPress={() => remove(index)}
                />
              </Cluster>
            );
          })}
          <Button
            ref={addButton}
            variant="ghost"
            startIcon={PlusGlyph}
            isDisabled={isLocked || steps.length >= maxSteps}
            onPress={() => {
              const id = `step-${nextId}`;
              setSteps([...steps, { id, kind: 'hold', amount: sequenceKinds.hold.initial }]);
              setNextId(nextId + 1);
              pendingFocus.current = id;
            }}
          >
            Add step
          </Button>
        </Stack>
      </Fieldset>
    </Stack>
  );
}

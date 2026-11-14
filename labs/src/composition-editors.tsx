import { useState } from 'react';
import { AssetPicker, type AssetPickerItem } from '../../src/components/asset-picker/index.js';
import { Button } from '../../src/components/button/button.js';
import { CalendarView, type CalendarViewEvent } from '../../src/components/calendar-view/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { DateTimeField } from '../../src/components/date-time-field/date-time-field.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { Modal } from '../../src/components/modal/modal.js';
import { NumberField } from '../../src/components/number-field/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { Timeline, type TimelineItem } from '../../src/components/timeline/index.js';

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

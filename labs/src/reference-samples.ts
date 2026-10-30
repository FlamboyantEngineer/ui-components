import { CalendarGlyph, FileGlyph, LinkGlyph } from '../../src/core/glyphs.js';

// Sample records for the reference chips of the composer, Chat Parts and Chat labs: trip plans and
// notes the host looks up by their opaque ids, one of them missing and one restricted.

import type { MessageComposerMenuItem } from '../../src/components/message-composer/index.js';
import type {
  RecordLabelPresentation,
  RecordLabelReference,
  RecordLabelResolver,
} from '../../src/components/record-label/index.js';

interface LabRecord extends RecordLabelPresentation {
  id: string;
  label: string;
  recordType: string;
}

export const labRecords: readonly LabRecord[] = [
  {
    id: '7c2e4f10-9b1a-4d3e-8f6a-2b5c1d0e9a47',
    label: 'TRIP-4',
    recordType: 'itinerary',
    name: 'Lisbon weekend',
    icon: CalendarGlyph,
    type: 'Itinerary',
    href: '#trip-4',
    preview: 'Two days in Lisbon: the castle, the tram ride and dinner by the river.',
  },
  {
    id: '19af6c3d-2e8b-4a7f-b1d0-5c9e3f2a6b81',
    label: 'NOTE-12',
    recordType: 'note',
    name: 'Packing list',
    icon: FileGlyph,
    type: 'Note',
    href: '#note-12',
  },
  {
    id: '0d41b7e2-6c5f-4e9a-a3b8-7f1d2c4e5a90',
    label: 'NOTE-9',
    recordType: 'note',
    unavailable: 'missing',
  },
  {
    id: '55b0e9c1-3a7d-4f2b-9e6c-8d4a1b7f3c25',
    label: 'TRIP-2',
    recordType: 'itinerary',
    unavailable: 'restricted',
  },
];

/** The host's lookup: a record's current presentation by its id, never from the token's label. */
export const getLabReference: RecordLabelResolver = (reference: RecordLabelReference) => {
  const record = labRecords.find((entry) => entry.id === reference.id);
  if (!record) return { unavailable: 'missing' };
  const { id: _id, label: _label, recordType: _type, ...presentation } = record;
  return presentation;
};

/** Menu items that insert each sample record as a reference chip. */
export const referenceMenuItems: MessageComposerMenuItem[] = labRecords.map((record) => ({
  id: `reference-${record.label}`,
  label: `Reference ${record.label}`,
  description: record.name ?? record.unavailable,
  icon: LinkGlyph,
  onAction: (composer) =>
    composer.insertPill({
      kind: 'reference',
      id: record.id,
      label: record.label,
      recordType: record.recordType,
    }),
}));

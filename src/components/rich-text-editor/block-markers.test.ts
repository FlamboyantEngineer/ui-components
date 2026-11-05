import { describe, expect, it } from 'vitest';
import { placeMarkers } from './block-markers.js';
import { getEngineSchema } from './engine-schema.js';
import { getDefaultRichTextSchema } from './rich-text-schema.js';

const schema = getEngineSchema(getDefaultRichTextSchema());
const paragraph = (text: string) => schema.node('paragraph', null, [schema.text(text)]);
// Blocks of 5 positions each: One at 0, Two at 5, Three at 12.
const doc = schema.node('doc', null, [paragraph('One'), paragraph('Two'), paragraph('Three')]);

describe('block markers', () => {
  it('UIC-RICH-TEXT-EDITOR-12.2 places markers on their blocks, clamped to the document', () => {
    expect(
      placeMarkers(doc, [
        { block: 1, message: 'Second' },
        { block: 0, endBlock: 9, severity: 'warning', message: 'All' },
        { block: 3, message: 'Past the end' },
        { block: -1, message: 'Before the start' },
        { block: 2, endBlock: 0, message: 'Backwards' },
      ]),
    ).toEqual([
      { from: 5, last: 5, to: 10, severity: 'error', message: 'Second' },
      { from: 0, last: 10, to: 17, severity: 'warning', message: 'All' },
      { from: 10, last: 10, to: 17, severity: 'error', message: 'Backwards' },
    ]);
  });
});

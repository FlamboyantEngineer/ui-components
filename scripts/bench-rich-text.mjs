#!/usr/bin/env node
// Measures what a rich text field pays per edit for its value (UIC-RICH-TEXT-EDITOR-1.3), at
// representative document sizes: paragraphs of 200 characters, edited 20 times at spread places.
//   before: each edit serializes the whole document, builds its structural key to compare it with
//           the committed value, and the field keeps the snapshot in its own history;
//   after:  each edit builds the document's JSON from the unchanged parts of the last one and
//           compares it with the committed value by shared parts; the field keeps no history.
// Reports the median and slowest edit and the heap the 20 values retain after collection. Each
// measurement runs in a process of its own, so no run sees another's garbage or cached JSON.
// Run with `npm run bench:rich-text`, which builds first: it reads the built modules.

import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { EditorState } from 'prosemirror-state';

const dist = new URL('../dist/components/', import.meta.url);
const load = (path) => import(new URL(path, dist).href);
const { getEngineSchema } = await load('rich-text-editor/engine-schema.js');
const { getDefaultRichTextSchema } = await load('rich-text-editor/rich-text-schema.js');
const { toRichTextJson } = await load('rich-text-editor/editor-state.js');
const { isRichTextEqual } = await load('rich-text-editor/rich-text-document.js');
const { toFieldValueKey } = await load('field/field-value.js');

if (typeof globalThis.gc !== 'function') {
  console.error('Run with node --expose-gc (npm run bench:rich-text).');
  process.exit(1);
}

const SIZES = [100, 1000, 5000];
const EDITS = 20;
const schema = getEngineSchema(getDefaultRichTextSchema());
const line = 'Orchard rows of plums, figs and quinces ripen in turn. '.repeat(4).slice(0, 200);

function createDocument(paragraphs) {
  const blocks = Array.from({ length: paragraphs }, () =>
    schema.nodes.paragraph.create(null, schema.text(line)),
  );
  return EditorState.create({ schema, doc: schema.nodes.doc.create(null, blocks) });
}

/** The documents after each edit: one character typed into a paragraph spread through the document. */
function editedDocuments(state, paragraphs) {
  const documents = [];
  let current = state;
  for (let edit = 0; edit < EDITS; edit += 1) {
    const paragraph = Math.floor(((edit + 0.5) * paragraphs) / EDITS);
    // Each earlier edit typed one character into an earlier paragraph.
    const position = paragraph * (line.length + 2) + 1 + edit + (edit % line.length);
    current = current.apply(current.tr.insertText('x', position));
    documents.push(current.doc);
  }
  return documents;
}

function heapUsed() {
  // Run with --expose-gc, which defines gc.
  globalThis.gc?.();
  globalThis.gc?.();
  return process.memoryUsage().heapUsed;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const pipelines = {
  before(documents, committedDocument) {
    const committed = committedDocument.toJSON();
    const kept = [];
    const times = documents.map((document) => {
      const started = performance.now();
      const value = document.toJSON();
      const isDirty = toFieldValueKey(value) !== toFieldValueKey(committed);
      kept.push(value);
      if (!isDirty) throw new Error('an edit must differ');
      return performance.now() - started;
    });
    return { times, kept };
  },
  after(documents, committedDocument) {
    const committed = toRichTextJson(committedDocument);
    const kept = [];
    const times = documents.map((document) => {
      const started = performance.now();
      const value = toRichTextJson(document);
      const isDirty = !isRichTextEqual(value, committed);
      kept.push(value);
      if (!isDirty) throw new Error('an edit must differ');
      return performance.now() - started;
    });
    return { times, kept };
  },
};

/** Measures one pipeline at one size and prints the result as JSON. */
function measure(name, paragraphs) {
  const state = createDocument(paragraphs);
  const documents = editedDocuments(state, paragraphs);
  const base = heapUsed();
  const { times, kept } = pipelines[name](documents, state.doc);
  const retained = heapUsed() - base;
  if (kept.length !== EDITS) throw new Error('every edit keeps its value');
  console.log(JSON.stringify({ times, retained }));
}

const [, , pipeline, size] = process.argv;
if (pipeline) {
  measure(pipeline, Number(size));
} else {
  const rows = [];
  for (const paragraphs of SIZES) {
    for (const name of Object.keys(pipelines)) {
      const output = execFileSync(
        process.execPath,
        ['--expose-gc', fileURLToPath(import.meta.url), name, String(paragraphs)],
        { encoding: 'utf8' },
      );
      const { times, retained } = JSON.parse(output);
      rows.push({
        characters: (paragraphs * line.length).toLocaleString('en-US'),
        pipeline: name,
        'median ms': median(times).toFixed(2),
        'slowest ms': Math.max(...times).toFixed(2),
        'retained MiB': (retained / 2 ** 20).toFixed(1),
      });
    }
  }
  console.table(rows);
}

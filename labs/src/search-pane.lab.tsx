import { useState } from 'react';
import {
  buildSearchSnippet,
  SearchPane,
  type SearchPaneProps,
  type SearchPaneResult,
  SearchSnippet,
} from '../../src/components/search-pane/index.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { findLabResults, labSections, SearchDocument } from './search-pane-document.js';

const states = [
  'empty',
  'idle',
  'pending',
  'results',
  'no-results',
  'error',
  'unavailable',
] as const;
const modes = ['none', 'hidable', 'shown'] as const;

const sampleResults = findLabResults(labSections, 'pear', new Set());

const stateProps: Record<(typeof states)[number], Partial<SearchPaneProps>> = {
  empty: {},
  idle: { defaultQuery: 'pear', status: 'idle' },
  pending: { defaultQuery: 'pear', status: 'pending', results: sampleResults.slice(0, 2) },
  results: { defaultQuery: 'pear', results: sampleResults, defaultCurrentKey: 'storage:0' },
  'no-results': { defaultQuery: 'quince jam', results: [] },
  error: { defaultQuery: 'pear', status: 'error' },
  unavailable: { status: 'unavailable', message: 'Open a document to search it.' },
};

const ignore = () => undefined;

const modeProps: Record<(typeof modes)[number], Partial<SearchPaneProps>> = {
  none: {},
  hidable: { replaceMode: 'hidable', onReplace: ignore, onReplaceAll: ignore },
  shown: { replaceMode: 'shown', onReplace: ignore, onReplaceAll: ignore },
};

/** `count` matches, one per line of a long generated log. */
function makeManyResults(count: number): SearchPaneResult[] {
  return Array.from({ length: count }, (_, index) => {
    const source = `Entry ${index + 1}: the pear crate was weighed and logged.`;
    const start = source.indexOf('pear');
    return { id: index, source, start, end: start + 4, label: `Entry ${index + 1}` };
  });
}

const manyResults = makeManyResults(820);

/** A pane over 820 matches: the list mounts a page of rows, while counting and stepping cover all. */
function ManyResults() {
  const [currentKey, setCurrentKey] = useState<Key | null>(null);
  return (
    <div data-lab-demo="many-results">
      <div style={{ display: 'flex', flexDirection: 'column', width: 380, height: 360 }}>
        <SearchPane
          label="Find in the log"
          defaultQuery="pear"
          results={manyResults}
          currentKey={currentKey}
          onCurrentKeyChange={setCurrentKey}
        />
      </div>
      <LabOutput name="current">{currentKey === null ? 'none' : String(currentKey)}</LabOutput>
    </div>
  );
}

const snippetCases: { name: string; source: string; match: string }[] = [
  {
    name: 'multiline',
    source: 'First line of the paragraph\n\n   second line, where the   match sits\tafter tabs',
    match: 'match',
  },
  {
    name: 'long-context',
    source:
      'The leading context runs on for quite a while before it reaches the words next to the ' +
      'needle in this sentence, and the trailing context goes on and on well past the end of the row.',
    match: 'needle',
  },
  { name: 'inside-word', source: 'Spearmint keeps pests away.', match: 'pear' },
  {
    name: 'long-word',
    source: `${'Pneumonoultramicroscopic'.repeat(4)}silicovolcanoconiosis is long`,
    match: 'silico',
  },
  { name: 'unicode', source: 'Les poires mûres, 梨 et pêras — 👩‍👩‍👧 cuisinées.', match: '梨' },
  { name: 'boundary', source: 'needle at the start', match: 'needle' },
];

/** Snippets of awkward text, each drawn wide and narrow. */
function SnippetGallery() {
  return (
    <div data-lab-demo="snippets" style={{ display: 'grid', gap: 8 }}>
      {snippetCases.map(({ name, source, match }) => {
        const start = source.indexOf(match);
        const snippet = buildSearchSnippet({ source, start, end: start + match.length });
        return (
          <div key={name} data-lab-case={name} style={{ display: 'grid', gap: 4 }}>
            <div style={{ width: 520, maxWidth: '100%' }} data-lab-width="wide">
              <SearchSnippet snippet={snippet} />
            </div>
            <div style={{ width: 160 }} data-lab-width="narrow">
              <SearchSnippet snippet={snippet} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States and modes"
      description="Each state in each replace mode (none, hidable behind the chevron, always shown): empty, not searched yet, searching (the last results stay browsable), results, no results, failed and unavailable."
    >
      <StateMatrix
        axes={{ state: states, mode: modes }}
        render={({ state, mode }) => (
          <div style={{ display: 'flex', flexDirection: 'column', width: 320, maxHeight: 280 }}>
            <SearchPane
              label={`Find, ${state}, ${mode}`}
              {...stateProps[state]}
              {...modeProps[mode]}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Search and replace in a document"
      description="Type to search; Enter and Shift+Enter step through every match and wrap, a row chosen by pointer, Enter or Space becomes current, and the document marks it. Pick the replace mode: read-only (no replace controls), hidable (the chevron shows the replacement with Replace and Replace all on its line) or always shown; matches in the locked section cannot be replaced. Hide arrows without results leaves out Previous and Next while nothing matches, and Narrow panel shows the find row wrap with the count and its arrows together; with no count the arrows sit snug against the query. Escape closes the pane and focus returns to the document, where Ctrl+F or Cmd+F (and Ctrl+H or Cmd+H while editable) opens it again."
    >
      <SearchDocument name="document" />
    </LabSection>
    <LabSection
      title="A read-only document in a narrow panel"
      description="The same document read-only: no replace toggle, box or shortcut."
    >
      <SearchDocument name="read-only" replaceMode="none" isNarrow />
    </LabSection>
    <LabSection
      title="Many results"
      description="820 matches: the list mounts 200 rows at a time, with buttons for the earlier and later pages, while the count and stepping cover every match. Shift+Enter from no match goes to the last one."
    >
      <ManyResults />
    </LabSection>
    <LabSection
      title="Snippets"
      description="Snippets built with buildSearchSnippet and drawn with SearchSnippet, wide and narrow: multiline text on one line, long leading and trailing context, a match inside a word, a word too long to keep whole, Unicode text and a match at the start. A narrow row gives up the leading context first and keeps the match in view."
    >
      <SnippetGallery />
    </LabSection>
  </>,
);

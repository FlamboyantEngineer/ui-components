import { type CSSProperties, type KeyboardEvent, type ReactNode, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import {
  SearchPane,
  type SearchPaneHandle,
  type SearchPaneReplaceMode,
  type SearchPaneResult,
} from '../../src/components/search-pane/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import type { Key } from '../../src/core/props.js';
import { LabOutput } from './lab-output.js';

/** A section of the sample document; a locked one may be searched but not changed. */
export interface GuideSection {
  id: string;
  title: string;
  text: string;
  isLocked?: boolean;
}

export const labSections: readonly GuideSection[] = [
  {
    id: 'intro',
    title: 'Introduction',
    text:
      'This orchard guide covers pears, plums and quinces.\n' +
      'Each pear variety ripens on its own schedule, so check the pears every few days.',
  },
  {
    id: 'harvest',
    title: 'Harvest',
    text:
      'Pick a pear when it lifts from the spur with a gentle twist.\n\n' +
      'An extraordinarilylongcompoundwordaboutpearpickingtechnique sits here to test long words, ' +
      'then the text continues with more about the harvest of each pear tree in the orchard.',
  },
  {
    id: 'storage',
    title: 'Storage (locked)',
    text: 'Store pears in a cool room. Spearmint keeps pests away from the stored pear crates.',
    isLocked: true,
  },
  {
    id: 'notes',
    title: 'Notes',
    text: 'Poire, pêra and 梨 all name the pear. The last note mentions a pear.',
  },
];

export const labOptions = [
  { id: 'case', label: 'Match case' },
  { id: 'words', label: 'Whole words' },
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Every match of `query` in the sections, as the pane's results, in document order. */
export function findLabResults(
  sections: readonly GuideSection[],
  query: string,
  options: ReadonlySet<Key>,
): SearchPaneResult[] {
  if (!query.trim()) return [];
  const body = escapeRegExp(query);
  const pattern = new RegExp(
    options.has('words') ? `\\b${body}\\b` : body,
    options.has('case') ? 'gu' : 'giu',
  );
  return sections.flatMap((section) =>
    [...section.text.matchAll(pattern)].map((found, index) => ({
      id: `${section.id}:${index}`,
      source: section.text,
      start: found.index,
      end: found.index + found[0].length,
      label: section.title,
      description: `Match ${index + 1}`,
      isReplaceable: !section.isLocked,
    })),
  );
}

const currentStyle: CSSProperties = {
  borderRadius: 'var(--ref-radius-sm)',
  background: 'color-mix(in srgb, var(--ref-accent) var(--ref-tint-strong), transparent)',
  color: 'inherit',
};

/** A section's text with the current match marked, as a host draws it. */
function markCurrent(section: GuideSection, current: SearchPaneResult | undefined): ReactNode {
  if (!current || current.source !== section.text || !current.id.toString().startsWith(section.id))
    return section.text;
  return (
    <>
      {section.text.slice(0, current.start)}
      <mark aria-current="true" data-lab-current="" style={currentStyle}>
        {section.text.slice(current.start, current.end)}
      </mark>
      {section.text.slice(current.end)}
    </>
  );
}

interface SearchDocumentProps {
  /** The demo's name, for its `data-lab-demo`. */
  name: string;
  /** The replace mode it starts with; `none` makes the document read-only. */
  replaceMode?: SearchPaneReplaceMode;
  /** Starts with a narrow panel. */
  isNarrow?: boolean;
}

/**
 * A document beside a search pane. Ctrl+F (or Cmd+F) in the document opens the pane on its query and
 * Ctrl+H (or Cmd+H) on its replacement; Escape closes the pane and focus returns to the document.
 */
export function SearchDocument({
  name,
  replaceMode = 'hidable',
  isNarrow = false,
}: SearchDocumentProps) {
  const [sections, setSections] = useState(labSections);
  const [isOpen, setOpen] = useState(true);
  const [query, setQuery] = useState('pear');
  const [selected, setSelected] = useState<Set<Key>>(new Set());
  const [currentKey, setCurrentKey] = useState<Key | null>(null);
  const [mode, setMode] = useState(replaceMode);
  const [hidesArrows, setHidesArrows] = useState(false);
  const readOnly = mode === 'none';
  const [narrow, setNarrow] = useState(isNarrow);
  const [log, setLog] = useState('nothing yet');
  const handleRef = useRef<SearchPaneHandle>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const results = findLabResults(sections, query, selected);
  const current = results.find((result) => result.id === currentKey);
  const open = (focus: 'query' | 'replacement') => {
    setOpen(true);
    requestAnimationFrame(() =>
      focus === 'query' ? handleRef.current?.focusQuery() : handleRef.current?.focusReplacement(),
    );
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key !== 'f' && !(key === 'h' && !readOnly)) return;
    event.preventDefault();
    open(key === 'f' ? 'query' : 'replacement');
  };
  const replaceIn = (targets: readonly SearchPaneResult[], replacement: string) =>
    setSections((list) =>
      list.map((section) => {
        const own = targets.filter(
          (result) => result.isReplaceable && result.id.toString().startsWith(`${section.id}:`),
        );
        const text = own.reduceRight(
          (value, result) => value.slice(0, result.start) + replacement + value.slice(result.end),
          section.text,
        );
        return { ...section, text };
      }),
    );
  return (
    <div data-lab-demo={name} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <SegmentedChoice
          aria-label="Replace mode"
          size="sm"
          sizing="content"
          options={[
            { value: 'none', label: 'Read-only' },
            { value: 'hidable', label: 'Hidable replace' },
            { value: 'shown', label: 'Replace shown' },
          ]}
          value={mode}
          onChange={(value) => setMode((value as SearchPaneReplaceMode | null) ?? mode)}
        />
        <Checkbox isSelected={hidesArrows} onChange={setHidesArrows}>
          Hide arrows without results
        </Checkbox>
        <Checkbox isSelected={narrow} onChange={setNarrow}>
          Narrow panel
        </Checkbox>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div
          data-lab-panel=""
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: narrow ? 240 : 460,
            height: 380,
            padding: 8,
            border: '1px solid var(--ref-border)',
            borderRadius: 'var(--ref-radius)',
          }}
        >
          {isOpen ? (
            <SearchPane
              handleRef={handleRef}
              label="Find in the guide"
              placeholder="Find in the guide"
              query={query}
              onQueryChange={(next) => {
                setQuery(next);
                setCurrentKey(null);
              }}
              options={labOptions}
              selectedOptions={selected}
              onSelectedOptionsChange={(keys) => {
                setSelected(keys);
                setCurrentKey(null);
              }}
              results={results}
              currentKey={currentKey}
              onCurrentKeyChange={setCurrentKey}
              defaultReplacement="quince"
              replaceMode={mode}
              emptyNavigation={hidesArrows ? 'hidden' : 'disabled'}
              onReplace={
                readOnly
                  ? undefined
                  : (replacement, key) => {
                      setLog(`replaced ${String(key)} with ${replacement}`);
                      replaceIn(
                        results.filter((result) => result.id === key),
                        replacement,
                      );
                    }
              }
              onReplaceAll={
                readOnly
                  ? undefined
                  : (replacement) => {
                      setLog(`replaced every match with ${replacement}`);
                      replaceIn(results, replacement);
                    }
              }
              onClose={() => {
                setOpen(false);
                documentRef.current?.focus();
              }}
            />
          ) : (
            <Button size="sm" variant="secondary" onPress={() => open('query')}>
              Search
            </Button>
          )}
        </div>
        <div
          ref={documentRef}
          // The document takes focus so Ctrl+F and Ctrl+H there open the pane, as a host's would.
          tabIndex={0}
          role="document"
          aria-label="Orchard guide"
          data-lab-text=""
          onKeyDown={onKeyDown}
          style={{ flex: '1 1 260px', minWidth: 0, whiteSpace: 'pre-wrap' }}
        >
          {sections.map((section) => (
            <section key={section.id}>
              <h3>{section.title}</h3>
              <p>{markCurrent(section, current)}</p>
            </section>
          ))}
        </div>
      </div>
      <LabOutput name="current">{currentKey === null ? 'none' : String(currentKey)}</LabOutput>
      <LabOutput name="replaced">{log}</LabOutput>
      <LabOutput name="open">{isOpen ? 'yes' : 'no'}</LabOutput>
    </div>
  );
}

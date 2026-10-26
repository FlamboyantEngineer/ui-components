import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { FindBar, type FindBarProps } from '../../src/components/find-bar/find-bar.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const states = ['empty', 'matches', 'no-results', 'searching'] as const;
const layouts = ['find', 'replace', 'options'] as const;

const stateProps: Record<(typeof states)[number], Partial<FindBarProps>> = {
  empty: {},
  matches: { defaultQuery: 'pear', matchCount: 12, currentIndex: 2 },
  'no-results': { defaultQuery: 'quince', matchCount: 0 },
  searching: { defaultQuery: 'plum', isPending: true },
};

const ignore = () => undefined;

const layoutProps: Record<(typeof layouts)[number], Partial<FindBarProps>> = {
  find: {},
  replace: { onReplace: ignore, onReplaceAll: ignore, onClose: ignore },
  options: {
    options: [
      { id: 'case', label: 'Match case' },
      { id: 'words', label: 'Whole words' },
    ],
    defaultSelectedOptions: ['words'],
    onClose: ignore,
  },
};

const options = [
  { id: 'case', label: 'Match case' },
  { id: 'words', label: 'Whole words' },
];

const recipe =
  'Peel the pears and cut each pear in half. Poach the pears in syrup until a knife slides in, ' +
  'then lay the Pear halves on the tart and glaze them. Pearl sugar on top is optional.';

interface Match {
  start: number;
  end: number;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The matches of `query` in `text`, with case and whole words as the options say. */
function findMatches(text: string, query: string, selected: ReadonlySet<Key>): Match[] {
  if (!query) return [];
  const body = escapeRegExp(query);
  const pattern = selected.has('words') ? `\\b${body}\\b` : body;
  const flags = selected.has('case') ? 'g' : 'gi';
  return [...text.matchAll(new RegExp(pattern, flags))].map((found) => ({
    start: found.index,
    end: found.index + found[0].length,
  }));
}

/** The text with every match replaced. */
function replaceAll(text: string, matches: readonly Match[], replacement: string): string {
  return matches.reduceRight(
    (result, match) => result.slice(0, match.start) + replacement + result.slice(match.end),
    text,
  );
}

/** The text with each match in a `<mark>`, the current one flagged. */
function markMatches(text: string, matches: readonly Match[], current: number): ReactNode[] {
  const parts: ReactNode[] = [];
  let offset = 0;
  matches.forEach((match, index) => {
    parts.push(text.slice(offset, match.start));
    parts.push(
      <mark key={match.start} data-lab-current={index === current || undefined}>
        {text.slice(match.start, match.end)}
      </mark>,
    );
    offset = match.end;
  });
  parts.push(text.slice(offset));
  return parts;
}

/** A passage the caller searches: Ctrl+F opens the bar, which finds, replaces and closes. */
function Passage() {
  const [text, setText] = useState(recipe);
  const [isOpen, setOpen] = useState(true);
  const [query, setQuery] = useState('pear');
  const [selected, setSelected] = useState<Set<Key>>(new Set());
  const [current, setCurrent] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const matches = findMatches(text, query, selected);
  const count = matches.length;
  const index = count > 0 ? Math.min(current, count - 1) : -1;
  const open = () => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'f') return;
    event.preventDefault();
    open();
  };
  const replaceAt = (match: Match, replacement: string) =>
    setText(text.slice(0, match.start) + replacement + text.slice(match.end));
  return (
    // The passage takes focus so Ctrl+F there opens the bar, as a host surface would.
    <div data-lab-case="passage" onKeyDown={onKeyDown}>
      {isOpen ? (
        <FindBar
          label="Find in the recipe"
          placeholder="Find in the recipe"
          query={query}
          onQueryChange={(next) => {
            setQuery(next);
            setCurrent(0);
          }}
          matchCount={query ? count : undefined}
          currentIndex={index}
          onNext={() => setCurrent((index + 1) % count)}
          onPrevious={() => setCurrent((index - 1 + count) % count)}
          options={options}
          selectedOptions={selected}
          onSelectedOptionsChange={(keys) => {
            setSelected(keys);
            setCurrent(0);
          }}
          defaultReplacement="plum"
          onReplace={(replacement) => matches[index] && replaceAt(matches[index], replacement)}
          onReplaceAll={(replacement) => setText(replaceAll(text, matches, replacement))}
          onClose={() => setOpen(false)}
          inputRef={inputRef}
        />
      ) : (
        <Button size="sm" variant="secondary" onPress={open}>
          Find
        </Button>
      )}
      <p tabIndex={0} data-lab-text="">
        {isOpen ? markMatches(text, matches, index) : text}
      </p>
      <p>
        Open: <output data-lab-output="open">{isOpen ? 'yes' : 'no'}</output>; options:{' '}
        <output data-lab-output="options">{[...selected].join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States and parts"
      description="Each state against a find-only bar, a bar that replaces and closes, and a bar with matching options."
    >
      <StateMatrix
        axes={{ state: states, layout: layouts }}
        render={({ state, layout }) => (
          <FindBar
            label={`Find, ${state}, ${layout}`}
            {...stateProps[state]}
            {...layoutProps[layout]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Find and replace in a passage"
      description="Type to find; Enter and Shift+Enter step, the options match case or whole words, Replace and Replace all rewrite the recipe, and Escape or Close closes the bar. Ctrl+F in the passage opens it again."
    >
      <Passage />
    </LabSection>
  </>,
);

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import {
  CompletionList,
  getCompletionOptionId,
  type CompletionListItem,
  type CompletionListProps,
} from '../../src/components/completion-list/completion-list.js';
import { KeyHints } from '../../src/components/shortcut/shortcut.js';
import { TriggeredNote } from './completion-list-note.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const contents = ['labels', 'descriptions', 'documentation', 'drawn'] as const;
const extras = ['none', 'footer', 'empty state'] as const;

const cities: CompletionListItem[] = [
  { id: 'lisbon', label: 'Lisbon', description: 'Portugal', kind: 'city' },
  { id: 'london', label: 'London', description: 'United Kingdom', kind: 'city' },
  { id: 'lyon', label: 'Lyon', description: 'France', kind: 'city' },
  { id: 'oslo', label: 'Oslo', description: 'Norway', kind: 'city' },
];

const typedItems: CompletionListItem[] = [
  { id: 1, label: 'Numeric option' },
  { id: '1', label: 'Textual option' },
];

const documented: CompletionListItem[] = cities.map((city) => ({
  ...city,
  documentation: `${city.label} is a city in ${city.description ?? 'Europe'}.`,
}));

const manyCities: CompletionListItem[] = [
  'Amsterdam',
  'Athens',
  'Barcelona',
  'Berlin',
  'Bern',
  'Bratislava',
  'Brussels',
  'Bucharest',
  'Budapest',
  'Copenhagen',
  'Dublin',
  'Edinburgh',
  'Helsinki',
  'Krakow',
  'Lisbon',
  'Ljubljana',
  'London',
  'Luxembourg',
  'Lyon',
  'Madrid',
  'Milan',
  'Munich',
  'Oslo',
  'Paris',
  'Porto',
  'Prague',
  'Riga',
  'Rome',
  'Seville',
  'Sofia',
  'Stockholm',
  'Tallinn',
  'Valencia',
  'Vienna',
  'Vilnius',
  'Warsaw',
  'Zagreb',
  'Zurich',
].map((label) => ({ id: label.toLowerCase(), label }));

type ListOptions = Pick<CompletionListProps, 'renderItem' | 'renderEmptyState' | 'footer'>;

function contentOptions(content: (typeof contents)[number]) {
  if (content === 'labels') return cities.map(({ id, label }) => ({ id, label }));
  if (content === 'documentation') return documented;
  return cities;
}

const drawCity: CompletionListProps['renderItem'] = (item, { isActive }) => (
  <>
    <Avatar name={item.label} size="xs" decorative /> <strong>{item.label}</strong>{' '}
    {isActive ? `· ${item.description ?? ''}` : null}
  </>
);

function extraOptions(extra: (typeof extras)[number], count: number): ListOptions {
  if (extra === 'footer') return { footer: `${count} matches` };
  if (extra === 'empty state') return { renderEmptyState: () => 'No cities match' };
  return {};
}

/**
 * An input that owns its list: it filters the items, moves the active option with the arrow keys,
 * names it in `aria-activedescendant` and inserts it on Enter, as any editor does.
 */
function DemoEditor({
  label,
  items,
  options,
  cell,
}: {
  label: string;
  items: readonly CompletionListItem[];
  options: ListOptions | ((count: number) => ListOptions);
  cell: string;
}) {
  const anchorRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [value, setValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const shown = items.filter((item) => item.label.toLowerCase().includes(value.toLowerCase()));
  const active = shown[Math.min(activeIndex, shown.length - 1)];
  const insert = (key: CompletionListItem['id']) => {
    const item = shown.find((candidate) => candidate.id === key);
    if (item) setValue(item.label);
    setIsOpen(false);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (!isOpen || (!move && event.key !== 'Enter' && event.key !== 'Escape')) return;
    event.preventDefault();
    if (move && shown.length > 0) {
      setActiveIndex((index) => (index + move + shown.length) % shown.length);
    } else if (event.key === 'Enter' && active) insert(active.id);
    else if (event.key === 'Escape') setIsOpen(false);
  };
  const extra = typeof options === 'function' ? options(shown.length) : options;
  return (
    <>
      <input
        ref={anchorRef}
        aria-label={label}
        value={value}
        // An input that drives a list is a combobox; the list stays in the editor's hands.
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={
          isOpen && active ? getCompletionOptionId(listId, active.id) : undefined
        }
        data-lab-editor={cell}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onChange={(event) => {
          setValue(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      <CompletionList
        {...extra}
        id={listId}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        anchorRef={anchorRef}
        items={shown}
        activeKey={active?.id ?? null}
        onActiveKeyChange={(key) => setActiveIndex(shown.findIndex((item) => item.id === key))}
        onAction={insert}
        data-lab-list={cell}
      />
    </>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

mountLab(
  <>
    <LabSection
      title="Primitive keys"
      description="Numeric and text ids that read alike remain separate options."
    >
      <DemoEditor label="Primitive keys" items={typedItems} options={{}} cell="typed" />
    </LabSection>
    <LabSection
      title="Content and extras"
      description="Focus an input to open its list: labels alone, with descriptions, with the active option's documentation, or drawn by the caller; with a footer or an empty state for a filter that matches nothing."
    >
      <StateMatrix
        axes={{ content: contents, extra: extras }}
        render={({ content, extra }) => {
          const cell = `${content}-${extra}`;
          const items = extra === 'empty state' ? [] : contentOptions(content);
          return (
            <DemoEditor
              label={`City (${content}, ${extra})`}
              items={items}
              options={(count) => ({
                ...extraOptions(extra, count),
                ...(content === 'drawn' ? { renderItem: drawCity } : {}),
              })}
              cell={cell}
            />
          );
        }}
      />
    </LabSection>
    <LabSection
      title="A long list"
      description="Tab into the editor from the last matrix cell: the list stays open after the page scrolls. Arrow keys scroll the active option within the list; the footer counts matches and lists the keys."
    >
      <Note>The input keeps focus throughout: the list only draws what the input asks for.</Note>
      <DemoEditor
        label="European city"
        items={manyCities}
        options={(count) => ({
          footer: (
            <>
              {count} matches.{' '}
              <KeyHints
                hints={[
                  { keys: ['↑', '↓'], action: 'Move' },
                  { keys: ['Enter'], action: 'Insert' },
                ]}
              />
            </>
          ),
        })}
        cell="long"
      />
    </LabSection>
    <LabSection
      title="Trigger characters"
      description="Type @ and a name (spaces allowed) to mention a person, or # and a number for a reference; the chosen token replaces the trigger and its query. An address such as alice@example.com opens nothing. Making the note read-only closes completions; enabling editing needs a new lookup."
    >
      <TriggeredNote />
    </LabSection>
  </>,
);

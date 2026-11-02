import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import {
  CompletionList,
  getCompletionOptionId,
  type CompletionListItem,
  type CompletionListProps,
} from '../../src/components/completion-list/completion-list.js';
import { Spinner } from '../../src/components/progress-bar/progress-bar.js';
import { KeyHints } from '../../src/components/shortcut/shortcut.js';
import { TriggeredNote } from './completion-list-note.js';
import { ReloadedTextSection, SwitchedSourceSection } from './completion-list-reload.js';
import { PortalHost } from '../../src/components/portal/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { ShadowRootApp } from './shadow-root-host.js';

const contents = ['labels', 'descriptions', 'documentation', 'drawn'] as const;
const extras = ['none', 'footer', 'loading', 'empty state'] as const;

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
  if (extra === 'loading') {
    return {
      renderEmptyState: () => (
        <span aria-busy="true">
          <Spinner size="sm" /> Looking up cities
        </span>
      ),
    };
  }
  return {};
}

/**
 * An input that owns its list: it filters the items, moves the active option with the arrow keys,
 * names it in `aria-activedescendant` and inserts it on Enter or Tab, as any editor does. It asks
 * for the list with `isOpen`, but names and inserts an option only once `onShownChange` reports
 * the list on screen, a frame later; a key pressed before then inserts nothing. With
 * `showsHandshake`, it prints what it asked for, what is shown and what the last key did.
 */
function DemoEditor({
  label,
  items,
  options,
  cell,
  showsHandshake = false,
}: {
  label: string;
  items: readonly CompletionListItem[];
  options: ListOptions | ((count: number) => ListOptions);
  cell: string;
  showsHandshake?: boolean;
}) {
  const anchorRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [value, setValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isShown, setIsShown] = useState(false);
  const [lastKey, setLastKey] = useState('none yet');
  const [activeIndex, setActiveIndex] = useState(0);
  const shown = items.filter((item) => item.label.toLowerCase().includes(value.toLowerCase()));
  const active = shown[Math.min(activeIndex, shown.length - 1)];
  const insert = (key: CompletionListItem['id']) => {
    const item = shown.find((candidate) => candidate.id === key);
    if (item) setValue(item.label);
    setIsOpen(false);
  };
  const isInserting = (key: string) => key === 'Enter' || key === 'Tab';
  const onKeyDown = (event: KeyboardEvent) => {
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (isInserting(event.key)) {
      // Before the list is on screen, even in the frame after it was asked for, a key inserts
      // nothing; with nothing to insert, Tab moves on.
      if (!isShown || !active) {
        setLastKey(`${event.key} with no list shown, nothing inserted`);
        return;
      }
      event.preventDefault();
      setLastKey(`${event.key} inserted ${active.label}`);
      insert(active.id);
    } else if (isOpen && move) {
      event.preventDefault();
      if (shown.length > 0) setActiveIndex((index) => (index + move + shown.length) % shown.length);
    } else if (isOpen && event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
    }
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
        aria-expanded={isShown}
        aria-autocomplete="list"
        aria-controls={isShown ? listId : undefined}
        aria-activedescendant={
          isShown && active ? getCompletionOptionId(listId, active.id) : undefined
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
        onShownChange={setIsShown}
        anchorRef={anchorRef}
        items={shown}
        activeKey={active?.id ?? null}
        onActiveKeyChange={(key) => setActiveIndex(shown.findIndex((item) => item.id === key))}
        onAction={insert}
        data-lab-list={cell}
      />
      {showsHandshake ? (
        <>
          <LabOutput name="Requested open">{String(isOpen)}</LabOutput>
          <LabOutput name="Shown">{String(isShown)}</LabOutput>
          <LabOutput name="Last key">{lastKey}</LabOutput>
        </>
      ) : null}
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
      description="Focus an input to open its list: labels alone, with descriptions, with the active option's documentation, or drawn by the caller; with a footer, a busy line while a source looks options up, or an empty state for a filter that matches nothing."
    >
      <StateMatrix
        axes={{ content: contents, extra: extras }}
        render={({ content, extra }) => {
          const cell = `${content}-${extra}`;
          const items =
            extra === 'empty state' || extra === 'loading' ? [] : contentOptions(content);
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
      description="Tab into the editor from the last matrix cell: the list stays open after the page scrolls. Arrow keys scroll the active option within the list; moving the mouse or pen over an option makes it active, and pressing it inserts it while the caret stays in the editor. A list that opens beneath a stationary pointer keeps its active option. The footer counts matches and lists the keys."
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
      title="Asked for, then shown"
      description="The editor asks for the list on focus, but the list comes on screen a frame later, once focus-driven scrolling settles; onShownChange reports it. Until then the editor names no active option, and an Enter or Tab pressed before then inserts nothing (Tab moves on). The outputs show what the editor asked for, what is on screen and what the last key did."
    >
      <DemoEditor
        label="Handshake city"
        items={cities}
        options={{}}
        cell="handshake"
        showsHandshake
      />
    </LabSection>
    <LabSection
      title="Trigger characters"
      description="Type @ and a name (spaces allowed) to mention a person, or # and a number for a reference; the chosen token replaces the trigger and its query. An address such as alice@example.com opens nothing. Making the note read-only closes completions; enabling editing needs a new lookup."
    >
      <TriggeredNote />
    </LabSection>
    <ReloadedTextSection />
    <SwitchedSourceSection />
    <LabSection
      title="Inside a shadow root"
      description="The long list inside an open shadow root with its portal host there too, as a web component keeps its styles inside. Arrow keys still scroll the active option into view within the list."
    >
      <ShadowRootApp demo="shadow-completions">
        <style>{'.ui-completion-list__listbox { max-height: 8rem; overflow-y: auto; }'}</style>
        <PortalHost>
          <DemoEditor label="Shadow city" items={manyCities} options={{}} cell="shadow" />
        </PortalHost>
      </ShadowRootApp>
    </LabSection>
  </>,
);

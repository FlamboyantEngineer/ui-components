import {
  DeleteGlyph,
  ExpandGlyph,
  FolderGlyph,
  LinkGlyph,
  PlusGlyph,
  RefreshGlyph,
  SaveGlyph,
  SidebarGlyph,
} from '../../src/core/glyphs.js';
import { useEffect, useState, type ReactNode } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import {
  CommandPalette,
  type CommandPaletteProps,
} from '../../src/components/command-palette/command-palette.js';
import { MenuItem, MenuSection, type MenuEntry } from '../../src/components/menu/menu.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import {
  TextMatch,
  splitMatchTerms,
  textMatchesTerms,
} from '../../src/components/text-match/text-match.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const states = ['default', 'typed', 'no match', 'custom empty', 'loading'] as const;
const cities = ['Paris', 'Lima', 'Oslo', 'Cairo', 'Quito', 'Hanoi', 'Dakar', 'Perth', 'Turin'];

const commands: MenuEntry[] = [
  {
    type: 'section',
    id: 'files',
    title: 'Files',
    items: [
      { id: 'new-file', label: 'New file', icon: PlusGlyph, shortcut: 'Ctrl+N' },
      {
        id: 'open-recent',
        label: 'Open recent',
        icon: FolderGlyph,
        description: 'Report.pdf, Recipes.csv',
      },
      { id: 'save-all', label: 'Save all', icon: SaveGlyph, shortcut: 'Ctrl+Alt+S' },
      { id: 'delete-file', label: 'Delete file', icon: DeleteGlyph, tone: 'danger' },
      { id: 'share-file', label: 'Share file', icon: LinkGlyph, isDisabled: true },
    ],
  },
  { type: 'separator', id: 'rule' },
  {
    type: 'section',
    id: 'go-to',
    title: 'Go to',
    items: cities.slice(0, 5).map((city) => ({ id: `go-${city.toLowerCase()}`, label: city })),
  },
  {
    type: 'section',
    id: 'view',
    title: 'View',
    items: [
      { id: 'toggle-sidebar', label: 'Toggle sidebar', icon: SidebarGlyph, shortcut: 'Ctrl+B' },
      { id: 'zoom-in', label: 'Zoom in', shortcut: 'Ctrl++' },
      { id: 'refresh', label: 'Refresh', icon: RefreshGlyph, shortcut: 'F5' },
    ],
  },
];

/** What a matrix cell shows: typed text, loading or a custom empty state. */
function stateProps(state: (typeof states)[number]): Partial<CommandPaletteProps> {
  if (state === 'typed') return { defaultInputValue: 'fi' };
  if (state === 'no match') return { defaultInputValue: 'xyz' };
  if (state === 'custom empty') {
    return { defaultInputValue: 'xyz', renderEmptyState: () => 'No command matches. Try “new”.' };
  }
  if (state === 'loading') return { items: [], isLoading: true, filter: null };
  return {};
}

/** A button that opens a controlled palette. */
function Opener({ label, ...props }: CommandPaletteProps & { label: string }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onPress={() => setOpen(true)}>
        {label}
      </Button>
      <CommandPalette {...props} isOpen={isOpen} onOpenChange={setOpen} />
    </>
  );
}

function Feedback({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

/** The page's palette: Control+K (Command+K on macOS) opens it from anywhere. */
function GlobalPalette() {
  const [isOpen, setOpen] = useState(false);
  const [last, setLast] = useState('none');
  return (
    <>
      <Button shortcut="Ctrl+K" onPress={() => setOpen(true)}>
        Commands
      </Button>
      <CommandPalette
        items={commands}
        isOpen={isOpen}
        onOpenChange={setOpen}
        onAction={(key: Key) => setLast(String(key))}
        data-lab-palette="global"
      />
      <Feedback name="Command">{last}</Feedback>
      <Feedback name="Open">{isOpen ? 'yes' : 'no'}</Feedback>
    </>
  );
}

/**
 * A second palette with the same chord that a pane mounts on demand: while it is mounted it answers
 * Control+K instead of the document's palette, and an unrelated modal keeps the chord to itself.
 */
function ChordOwners() {
  const [hasPane, setHasPane] = useState(false);
  const [last, setLast] = useState('none');
  return (
    <>
      <Button onPress={() => setHasPane(!hasPane)}>
        {hasPane ? 'Remove the pane palette' : 'Add a pane palette'}
      </Button>{' '}
      <ModalTrigger>
        <Button>Settings</Button>
        <Modal title="Settings">
          <TextField label="Display name" />
        </Modal>
      </ModalTrigger>
      {hasPane ? (
        <CommandPalette
          aria-label="Pane commands"
          items={commands}
          onAction={(key: Key) => setLast(`pane ${String(key)}`)}
          data-lab-palette="pane"
        />
      ) : null}
      <Feedback name="Pane command">{last}</Feedback>
    </>
  );
}

/** Every typed word must appear in the label, in any order: `fi ne` finds `New file`. */
function matchWords(text: string, input: string) {
  return textMatchesTerms(text, splitMatchTerms(input, { ignoreAccents: true }), {
    ignoreAccents: true,
  });
}

function WordPalette() {
  const [last, setLast] = useState('none');
  return (
    <>
      <p>Control+Shift+P opens this palette.</p>
      <Opener
        label="Commands by words"
        items={commands}
        shortcut="Ctrl+Shift+P"
        filter={matchWords}
        placeholder="Type words in any order"
        aria-label="Commands by words"
        onAction={(key: Key) => setLast(String(key))}
        data-lab-palette="words"
      />
      <Feedback name="Word command">{last}</Feedback>
    </>
  );
}

/** A palette Control+Shift+O toggles, even during its half-second fade out. */
function SlowExitPalette() {
  return (
    <>
      <p>Control+Shift+O opens and closes this palette, which starts from “fi” each time.</p>
      <Opener
        label="Slow-closing commands"
        items={commands}
        shortcut="Ctrl+Shift+O"
        defaultInputValue="fi"
        aria-label="Slow-closing commands"
        data-lab-palette="slow-exit"
      />
    </>
  );
}

const allCities = Array.from(
  { length: 60 },
  (_, index) => `${cities[index % cities.length]} ${index + 1}`,
);

/** Results fetched for the typed text after 400 milliseconds, shown with a loading row meanwhile. */
function AsyncPalette() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MenuEntry[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [last, setLast] = useState('none');
  useEffect(() => {
    if (!query) return undefined;
    const timer = setTimeout(() => {
      const terms = splitMatchTerms(query);
      const found = allCities.filter((city) => textMatchesTerms(city, terms));
      setResults(found.slice(0, 8).map((city) => ({ id: city, label: city })));
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);
  const onInputChange = (value: string) => {
    setQuery(value);
    setLoading(value !== '');
    if (!value) setResults([]);
  };
  return (
    <>
      <Opener
        label="Search cities"
        shortcut={null}
        aria-label="City search"
        placeholder="Search cities"
        items={results}
        filter={null}
        inputValue={query}
        onInputChange={onInputChange}
        isLoading={isLoading}
        renderEmptyState={() => (query ? 'No city found.' : 'Type to search 60 cities.')}
        onAction={(key: Key) => setLast(String(key))}
        data-lab-palette="async"
      />
      <Feedback name="City">{last}</Feedback>
    </>
  );
}

function JsxPalette() {
  const [last, setLast] = useState('none');
  const [sidebar, setSidebar] = useState(true);
  return (
    <>
      <Opener
        label="Composed commands"
        shortcut={null}
        aria-label="Composed commands"
        size="lg"
        onAction={(key: Key) => {
          setLast(String(key));
          if (key === 'sidebar') setSidebar((current) => !current);
        }}
        data-lab-palette="jsx"
      >
        <MenuSection title="Layout">
          <MenuItem
            id="sidebar"
            textValue="Toggle sidebar"
            icon={SidebarGlyph}
            shouldCloseOnSelect={false}
          >
            <TextMatch>Toggle sidebar</TextMatch>
          </MenuItem>
          <MenuItem id="split" textValue="Split view" icon={ExpandGlyph}>
            <TextMatch>Split view</TextMatch>
          </MenuItem>
        </MenuSection>
        <MenuSection title="Recipes">
          <MenuItem id="soup" textValue="Tomato soup" description="25 minutes">
            <TextMatch>Tomato soup</TextMatch>
          </MenuItem>
          <MenuItem id="salad" textValue="Green salad" description="10 minutes">
            <TextMatch>Green salad</TextMatch>
          </MenuItem>
        </MenuSection>
      </Opener>
      <Feedback name="Composed command">{last}</Feedback>
      <Feedback name="Sidebar">{sidebar ? 'shown' : 'hidden'}</Feedback>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="States by size"
      description="Each button opens a palette: the commands, typed text with marked matches, no match, a custom empty state and loading results, at every row density."
    >
      <StateMatrix
        axes={{ state: states, size: sizes }}
        render={({ state, size }) => (
          <Opener
            label="Open"
            items={commands}
            shortcut={null}
            size={size}
            aria-label={`Command palette, ${state}, ${size}`}
            data-lab-palette={`${state}-${size}`}
            {...stateProps(state)}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Document shortcut"
      description="Control+K (Command+K on macOS) opens the palette with focus in the search field; typing narrows the commands, Arrow Down and Up move the highlight, Enter runs it and closes, Escape clears the text and then closes, and focus returns to where it was."
    >
      <GlobalPalette />
    </LabSection>
    <LabSection
      title="Several palettes and modals"
      description="Add a pane palette with the same Control+K chord: while it is mounted it alone answers the chord, and removing it hands the chord back to the document's palette. Open Settings and press Control+K inside it: the modal keeps the chord and no palette opens on top of it."
    >
      <ChordOwners />
    </LabSection>
    <LabSection
      title="Custom shortcut and filter"
      description="Its own chord, and a filter that matches typed words in any order."
    >
      <WordPalette />
    </LabSection>
    <LabSection
      title="Reopened while closing"
      description="Every palette fades out over half a second, while focus is already back on the page. Type, close this one with its chord and reopen it before the fade ends: the search starts again from its default text instead of keeping what was typed."
    >
      <SlowExitPalette />
    </LabSection>
    <LabSection
      title="Loading results"
      description="The caller owns the typed text, fetches cities for it after 400 milliseconds and shows a loading row meanwhile; the palette does not filter them again."
    >
      <AsyncPalette />
    </LabSection>
    <LabSection
      title="Composed with JSX"
      description="Menu items as children, with TextMatch labels and an item that keeps the palette open."
    >
      <JsxPalette />
    </LabSection>
  </>,
);

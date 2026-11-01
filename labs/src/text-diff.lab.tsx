import { useState } from 'react';
import { CommentThread } from '../../src/components/comment-thread/comment-thread.js';
import { CommentThreadReply } from '../../src/components/comment-thread/index.js';
import { Button } from '../../src/components/button/button.js';
import { ScrollRegion } from '../../src/components/scroll-region/scroll-region.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  TextDiff,
  type TextDiffLayout,
  type TextDiffLine,
} from '../../src/components/text-diff/text-diff.js';
import type { ScrollAnchor } from '../../src/utils/scroll-offset-map.js';
import { useSyncedScroll } from '../../src/utils/use-synced-scroll.js';
import { ShadowRootApp } from './shadow-root-host.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { diffSequences, mapScrollOffset } from '../../src/utils/index.js';
import { LabHelperCalls } from './lab-helper-calls.js';

const recipe = [
  'Lemon tart',
  'Serves 8',
  '',
  'Rub the butter into the flour until it looks like breadcrumbs.',
  'Stir in the sugar and one egg yolk.',
  'Chill the pastry for 30 minutes.',
  'Bake the shell blind for 15 minutes.',
  'Whisk four eggs with the lemon juice.',
  'Pour the filling into the shell.',
  'Bake for 25 minutes until just set.',
].join('\n');

const revised = [
  'Lemon and lime tart',
  'Serves 10',
  '',
  'Rub the butter into the flour until it looks like breadcrumbs.',
  'Stir in the sugar and one egg yolk.',
  'Chill the pastry for 30 minutes.',
  'Bake the shell blind for 20 minutes.',
  'Whisk five eggs with the lemon and lime juice.',
  'Add the zest of two limes.',
  'Pour the filling into the shell.',
  'Bake for 25 minutes until just set.',
].join('\n');

const serving = [
  'Leave the tart to cool in the tin.',
  'Lift it out onto a wire rack.',
  'Dust with icing sugar.',
  'Slice with a hot knife.',
  'Serve at room temperature.',
  'Keep leftovers in the fridge.',
];
const reviewOld = [recipe, ...serving].join('\n');
const reviewNew = [revised, ...serving].join('\n');

const contents = {
  edited: [recipe, revised],
  added: ['', 'Serves 4\nBake for 20 minutes.'],
  cleared: ['Serves 4\nBake for 20 minutes.', ''],
  unchanged: ['Serves 4\nBake for 20 minutes.', 'Serves 4\nBake for 20 minutes.'],
} as const;
const contentNames = Object.keys(contents) as Array<keyof typeof contents>;

const settings = (city: string, port: number, extra: string[] = []) =>
  [
    '[server]',
    `host = "${city}.example.com"`,
    `port = ${port}`,
    'timeout = 30',
    'retries = 3',
    'log_level = "info"',
    'compression = true',
    'cache_size = 512',
    'workers = 4',
    'queue = "default"',
    '',
    '[storage]',
    'path = "/var/data"',
    'backup = "daily"',
    'keep = 14',
    ...extra,
    'encrypt = true',
    'region = "north"',
    'replicas = 2',
    'quota = 100',
    'archive = false',
  ].join('\n');

const oldSettings = settings('lisbon', 8080);
const newSettings = settings('porto', 8080, ['checksum = "sha256"']);

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', colorKey: 'jon' };

interface LineNote {
  side: 'old' | 'new';
  line: number;
  author: typeof maria;
  text: string;
}

const notes: LineNote[] = [
  { side: 'new', line: 7, author: maria, text: 'Twenty minutes browns the edges too much.' },
  { side: 'new', line: 9, author: jon, text: 'Should the zest go in before the juice?' },
  { side: 'old', line: 8, author: maria, text: 'Four eggs set too softly last time.' },
];

/** The note threads anchored to a line: added and unchanged lines by new number, removed by old. */
function notesFor(line: TextDiffLine) {
  return notes.filter((note) =>
    note.side === 'new'
      ? note.line === line.newNumber
      : line.change === 'removed' && note.line === line.oldNumber,
  );
}

/** A review: comment threads under the lines they are about, in either layout. */
function Review() {
  const [layout, setLayout] = useState<TextDiffLayout>('split');
  return (
    <div data-lab-demo="review">
      <SegmentedChoice
        aria-label="Layout"
        options={[
          { value: 'unified', label: 'Unified' },
          { value: 'split', label: 'Split' },
        ]}
        value={layout}
        onChange={(value) => setLayout(value === 'unified' ? 'unified' : 'split')}
      />
      <TextDiff
        aria-label="Review of the tart recipe"
        oldText={reviewOld}
        newText={reviewNew}
        layout={layout}
        context={20}
        renderLineWidget={(line) => {
          const threads = notesFor(line);
          if (threads.length === 0) return null;
          return threads.map((note) => (
            <CommentThread
              key={`${note.side}-${note.line}`}
              aria-label={`Note on line ${note.line}`}
              isReadOnly
            >
              <CommentThreadReply
                author={note.author}
                time="2026-04-20T09:30:00"
                text={note.text}
              />
            </CommentThread>
          ));
        }}
      />
    </div>
  );
}

const drafts = {
  tart: ['Lemon tart\nServes 8\nBake for 25 minutes.', 'Lime tart\nServes 8\nBake for 20 minutes.'],
  bread: ['Rye bread\nServes 8\nProve for 2 hours.', 'Spelt bread\nServes 8\nProve for 3 hours.'],
} as const;
type DraftVersion = keyof typeof drafts;

/**
 * Note drafts under changed lines. Each recipe is its own pair of texts, so switching recipes
 * draws new note fields; the host keeps every draft by recipe and line id, so a draft comes back
 * after a layout change or a return to its recipe, and never lands on another recipe's line.
 */
function LineDrafts() {
  const [layout, setLayout] = useState<TextDiffLayout>('unified');
  const [version, setVersion] = useState<DraftVersion>('tart');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [oldText, newText] = drafts[version];
  return (
    <div data-lab-demo="drafts">
      <SegmentedChoice
        aria-label="Recipe"
        options={[
          { value: 'tart', label: 'Tart' },
          { value: 'bread', label: 'Bread' },
        ]}
        value={version}
        onChange={(value) => setVersion(value === 'bread' ? 'bread' : 'tart')}
      />
      <SegmentedChoice
        aria-label="Drafts layout"
        options={[
          { value: 'unified', label: 'Unified' },
          { value: 'split', label: 'Split' },
        ]}
        value={layout}
        onChange={(value) => setLayout(value === 'split' ? 'split' : 'unified')}
      />
      <TextDiff
        aria-label={`Drafts on the ${version} recipe`}
        oldText={oldText}
        newText={newText}
        layout={layout}
        renderLineWidget={(line) => {
          if (line.change !== 'added') return null;
          const key = `${version}:${line.id}`;
          return (
            <TextField
              label={`Note on “${line.text}”`}
              value={notes[key] ?? ''}
              onChange={(value) => setNotes((current) => ({ ...current, [key]: value }))}
            />
          );
        }}
      />
      <output>Drafts kept: {Object.values(notes).filter(Boolean).length}</output>
    </div>
  );
}

const cities = ['Lisbon', 'Porto', 'Coimbra', 'Braga', 'Faro', 'Évora', 'Aveiro', 'Viseu'];
const shortList = Array.from({ length: 24 }, (_, index) => `${cities[index % 8]} ${index + 1}`);
const longList = Array.from({ length: 60 }, (_, index) => `Stop ${index + 1}`);

/** Two lists of different lengths that scroll together by the same fraction of their range. */
function SyncedLists() {
  const [first, setFirst] = useState<HTMLDivElement | null>(null);
  const [second, setSecond] = useState<HTMLDivElement | null>(null);
  useSyncedScroll([first, second]);
  return (
    <div data-lab-demo="synced" style={{ display: 'flex', gap: 16 }}>
      {[
        { name: 'Cities', items: shortList, ref: setFirst },
        { name: 'Stops', items: longList, ref: setSecond },
      ].map(({ name, items, ref }) => (
        <div
          key={name}
          style={{ display: 'flex', flexDirection: 'column', width: 180, height: 160 }}
        >
          <ScrollRegion ref={ref} role="group" aria-label={name} tabIndex={0}>
            <ul>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </ScrollRegion>
        </div>
      ))}
    </div>
  );
}

/** Each list item's distance from the top of its list, keyed by its town. */
function readTownAnchors(container: HTMLElement): ScrollAnchor[] {
  const origin = container.getBoundingClientRect().top - container.scrollTop;
  return Array.from(container.querySelectorAll('li[data-town]'), (item) => ({
    key: item.getAttribute('data-town') ?? '',
    offset: item.getBoundingClientRect().top - origin,
  }));
}

/**
 * Two lists of the same towns that scroll together through their matched items; notes added under
 * some towns of one list change its anchors, which the hook reads again.
 */
function AnchoredLists() {
  const [first, setFirst] = useState<HTMLDivElement | null>(null);
  const [second, setSecond] = useState<HTMLDivElement | null>(null);
  const [hasNotes, setHasNotes] = useState(false);
  useSyncedScroll([first, second], { getAnchors: readTownAnchors });
  return (
    <div data-lab-demo="anchored">
      <Button size="sm" onPress={() => setHasNotes((current) => !current)}>
        {hasNotes ? 'Remove notes' : 'Add notes'}
      </Button>
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          { name: 'Towns', ref: setFirst, notes: false },
          { name: 'Towns with notes', ref: setSecond, notes: hasNotes },
        ].map(({ name, ref, notes }) => (
          <div
            key={name}
            style={{ display: 'flex', flexDirection: 'column', width: 180, height: 160 }}
          >
            <ScrollRegion ref={ref} role="group" aria-label={name} tabIndex={0}>
              <ul>
                {shortList.map((town, index) => (
                  <li key={town} data-town={town}>
                    {town}
                    {notes && index % 3 === 0 ? (
                      <p>A note about {town}, long enough to wrap over lines.</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ScrollRegion>
          </div>
        ))}
      </div>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Layouts"
      description="Edited, newly written, cleared and unchanged texts, unified in one column and split side by side. Paired lines mark the words they changed; the header counts added and removed lines and moves between changes (also with n and p)."
    >
      <StateMatrix
        axes={{ content: contentNames, layout: ['unified', 'split'] }}
        render={({ content, layout }) => (
          <TextDiff
            aria-label={`${content} text, ${layout}`}
            oldText={contents[content][0]}
            newText={contents[content][1]}
            layout={layout}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Folded context"
      description="Unchanged runs keep two lines beside each change and fold the rest behind a button that shows them; the start and end of the text keep none."
    >
      <StateMatrix
        axes={{ layout: ['unified', 'split'] }}
        render={({ layout }) => (
          <TextDiff
            aria-label={`Settings, ${layout}`}
            oldText={oldSettings}
            newText={newSettings}
            layout={layout}
            context={2}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Line widgets"
      description="Read-only comment threads drawn under the lines they are about. In the split layout a thread sits on the side of its line, and the panes scroll together, meeting again at the next shared line."
    >
      <Review />
    </LabSection>
    <LabSection
      title="Drafts on lines"
      description="Note fields under added lines. Widgets belong to one pair of texts: another recipe draws new fields. The host keeps each draft by recipe and line id, so it returns after a layout change or back on its recipe."
    >
      <LineDrafts />
    </LabSection>
    <LabSection
      title="Synced scroll"
      description="useSyncedScroll on its own: two lists of different lengths keep the same fraction of their scroll range. Scroll listeners and pending echo suppression survive re-renders."
    >
      <SyncedLists />
    </LabSection>
    <LabSection
      title="Synced scroll through anchors"
      description="useSyncedScroll with getAnchors: two lists of the same towns stay level at the town they share. Anchors are read once and again only after a list changes, so adding notes realigns the lists."
    >
      <AnchoredLists />
    </LabSection>
    <LabSection
      title="Host helpers"
      description="diffSequences compares any two lists, and mapScrollOffset maps a scroll offset between panes that share anchors."
    >
      <LabHelperCalls
        calls={[
          [
            "diffSequences(['oak', 'ash', 'elm'], ['oak', 'elm', 'yew'])",
            JSON.stringify(diffSequences(['oak', 'ash', 'elm'], ['oak', 'elm', 'yew'])),
          ],
          [
            "mapScrollOffset(150, [{ key: 'a', offset: 100 }, { key: 'b', offset: 200 }], [{ key: 'a', offset: 300 }, { key: 'b', offset: 500 }])",
            mapScrollOffset(
              150,
              [
                { key: 'a', offset: 100 },
                { key: 'b', offset: 200 },
              ],
              [
                { key: 'a', offset: 300 },
                { key: 'b', offset: 500 },
              ],
            ),
          ],
        ]}
      />
    </LabSection>
    <LabSection
      title="Inside a shadow root"
      description="Folded settings inside an open shadow root, as a web component holds them: moving between changes and showing folded lines still move focus to the right row."
    >
      <ShadowRootApp demo="shadow-diff">
        <TextDiff
          aria-label="Shadow settings"
          oldText={oldSettings}
          newText={newSettings}
          context={2}
        />
      </ShadowRootApp>
    </LabSection>
  </>,
);

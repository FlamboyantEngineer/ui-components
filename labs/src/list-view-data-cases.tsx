import { useState } from 'react';
import type { Key, Selection } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import {
  List,
  ListRow,
  ListView,
  ListViewItem,
  ListViewSection,
} from '../../src/components/list-row/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection } from './chrome/index.js';

const notes = Array.from({ length: 15 }, (_, at) => ({
  id: `note-${at + 1}`,
  name: `Note ${at + 1}`,
}));
const notePage = 5;

/** A list that starts empty, then loads page by page as its end scrolls into view. */
function PagedNotes() {
  const [loaded, setLoaded] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [isStarted, setStarted] = useState(false);
  const [requests, setRequests] = useState(0);
  const hasMore = isStarted && loaded < notes.length;
  return (
    <div data-lab-demo="paged-notes" style={{ width: 300 }}>
      <Button
        size="sm"
        isDisabled={isStarted}
        onPress={() => {
          setStarted(true);
          setLoading(true);
        }}
      >
        Fetch notes
      </Button>{' '}
      <Button
        size="sm"
        variant="tertiary"
        isDisabled={!isLoading}
        onPress={() => {
          setLoaded((count) => Math.min(notes.length, count + notePage));
          setLoading(false);
        }}
      >
        Deliver page
      </Button>
      <div style={{ height: 180, outline: '1px dotted currentColor' }}>
        <ListView
          aria-label="Notes"
          items={notes.slice(0, loaded)}
          isLoading={isLoading}
          onLoadMore={
            hasMore
              ? () => {
                  setRequests((count) => count + 1);
                  setLoading(true);
                }
              : undefined
          }
          renderEmptyState={() => <p data-lab-output="empty">No notes yet. Fetch them.</p>}
        >
          {(note) => <ListViewItem title={note.name} />}
        </ListView>
      </div>
      <p>
        Shown: <output data-lab-output="shown">{loaded}</output>. Load requests:{' '}
        <output data-lab-output="requests">{requests}</output>. Loading:{' '}
        <output data-lab-output="loading">{String(isLoading)}</output>.
      </p>
    </div>
  );
}

const garden = [
  {
    id: 'herbs',
    title: 'Herbs',
    items: [
      { id: 'basil', name: 'Basil', season: 'Summer' },
      { id: 'sage', name: 'Sage', season: 'All year' },
    ],
  },
  {
    id: 'roots',
    title: 'Roots',
    items: [
      { id: 'beet', name: 'Beet', season: 'Autumn' },
      { id: 'parsnip', name: 'Parsnip', season: 'Winter' },
    ],
  },
];

/** Stable sections and rows that read page state: dependencies redraws them when it changes. */
function SeasonalSections() {
  const [showSeasons, setShowSeasons] = useState(false);
  return (
    <div data-lab-demo="dependent-list" style={{ width: 300 }}>
      <Switch isSelected={showSeasons} onChange={setShowSeasons}>
        Show seasons
      </Switch>
      <ListView aria-label="Garden" items={garden} dependencies={[showSeasons]}>
        {(section) => (
          <ListViewSection
            id={section.id}
            title={section.title}
            items={section.items}
            dependencies={[showSeasons]}
          >
            {(plant) => (
              <ListViewItem title={plant.name} meta={showSeasons ? plant.season : undefined} />
            )}
          </ListViewSection>
        )}
      </ListView>
    </div>
  );
}

const herbs = ['Basil', 'Chives', 'Dill', 'Mint', 'Thyme'].map((name) => ({
  id: name.toLowerCase(),
  name,
}));

/** A list starting with a row selected that always keeps one. */
function RequiredSelection() {
  const [selected, setSelected] = useState('chives');
  return (
    <div data-lab-demo="required-selection" style={{ width: 300 }}>
      <ListView
        aria-label="Herb of the week"
        items={herbs}
        selectionMode="single"
        defaultSelectedKeys={['chives']}
        disallowEmptySelection
        onSelectionChange={(keys: Selection) =>
          setSelected(keys === 'all' ? 'all' : [...keys].map(String).join(', ') || 'none')
        }
      >
        {(herb) => <ListViewItem title={herb.name} />}
      </ListView>
      <p>
        Selected: <output data-lab-output="selected">{selected}</output>
      </p>
    </div>
  );
}

/** Rows with rich titles, named for typeahead by textValue, whose activation is logged. */
function ActionLog() {
  const [actions, setActions] = useState<string[]>([]);
  return (
    <div data-lab-demo="action-log" style={{ width: 300 }}>
      <ListView
        aria-label="Herbs to cut"
        items={herbs}
        onAction={(key: Key) => setActions((all) => [...all, String(key)])}
      >
        {(herb) => (
          <ListViewItem
            textValue={herb.name}
            title={
              <>
                <strong>{herb.name}</strong> <em>fresh</em>
              </>
            }
          />
        )}
      </ListView>
      <p>
        Actions: <output data-lab-output="actions">{actions.join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

/** A link row that opens in a new tab and reports a middle-button click. */
function NewTabRow() {
  const [auxPresses, setAuxPresses] = useState(0);
  return (
    <div data-lab-demo="new-tab-row" style={{ width: 300 }}>
      <List aria-label="Guides">
        <ListRow
          title="Planting guide (opens in a new tab)"
          href="#planting-guide"
          target="_blank"
          rel="help"
          onAuxPress={() => setAuxPresses((count) => count + 1)}
        />
      </List>
      <p>
        Middle-button clicks: <output data-lab-output="aux">{auxPresses}</output>
      </p>
    </div>
  );
}

export function ListViewDataCases() {
  return (
    <div data-lab-family="list-view-data-cases">
      <LabSection
        title="Empty, then loading pages"
        description="The list starts empty with its renderEmptyState. Fetch notes starts loading (the loading row shows); Deliver page adds five notes. While a request loads the list asks for no more; when the new end is within a list height of view, onLoadMore asks for the next page."
      >
        <PagedNotes />
      </LabSection>
      <LabSection
        title="Redrawing stable rows"
        description="The sections and rows never change, but each row reads Show seasons from the page: dependencies on the list and on each section redraws their cached rows when it changes."
      >
        <SeasonalSections />
      </LabSection>
      <LabSection
        title="Initial and required selection"
        description="Chives starts selected through defaultSelectedKeys; disallowEmptySelection keeps one herb selected, so pressing the selected row again keeps it."
      >
        <RequiredSelection />
      </LabSection>
      <LabSection
        title="Actions on rich rows"
        description="The titles are rich content, so each row gives textValue: focus the list and type d to reach Dill. A press or Enter runs onAction with the row's key, which the log lists."
      >
        <ActionLog />
      </LabSection>
      <LabSection
        title="Link row in a new tab"
        description="A link row with target and rel: a press follows the link in a new tab, as the browser does, and its title says so. A middle-button click calls onAuxPress, counted here."
      >
        <NewTabRow />
      </LabSection>
    </div>
  );
}

import { useState, type CSSProperties } from 'react';
import type { DashboardTileMenuIcons } from '../../src/components/dashboard-grid/index.js';
import type { Key } from '../../src/core/props.js';
import { DeleteGlyph, MoveGlyph } from '../../src/core/glyphs.js';
import { Button } from '../../src/components/button/button.js';
import { Card } from '../../src/components/card/card.js';
import { BarChart } from '../../src/components/chart/index.js';
import { DonutChart } from '../../src/components/chart/index.js';
import {
  DashboardGrid,
  type DashboardGridItem,
  type DashboardTileMenuEntry,
} from '../../src/components/dashboard-grid/dashboard-grid.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { DashboardTile } from '../../src/components/dashboard-grid/index.js';
import { StatTile } from '../../src/components/stat-tile/stat-tile.js';
import { useUiStorage } from '../../src/core/provider.js';
import { requireDefined } from './require-defined.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const titles: Record<string, string> = {
  visitors: 'Visitors',
  orders: 'Orders',
  crates: 'Crates by quarter',
  results: 'Run results',
  notes: 'Notes',
};

const overview: DashboardGridItem[] = [
  { id: 'visitors', x: 0, y: 0, w: 3, h: 1 },
  { id: 'orders', x: 3, y: 0, w: 3, h: 1 },
  { id: 'results', x: 6, y: 0, w: 6, h: 3 },
  { id: 'crates', x: 0, y: 1, w: 6, h: 3 },
  { id: 'notes', x: 6, y: 3, w: 4, h: 1 },
];

const small: DashboardGridItem[] = [
  { id: 1, x: 0, y: 0, w: 2, h: 1 },
  { id: '1', x: 2, y: 0, w: 1, h: 1 },
  { id: 'c', x: 0, y: 1, w: 3, h: 1 },
];

const smallTitles = new Map<Key, string>([
  [1, 'A'],
  ['1', 'B'],
  ['c', 'C'],
]);

const frame = (width: number): CSSProperties => ({ width });
const frameWidths = { wide: 360, tight: 320, narrow: 140 } as const;

function TileContent({ id }: { id: string }) {
  switch (id) {
    case 'visitors':
      return <StatTile label="Visitors" value={1284} delta={12} goal="increase" />;
    case 'orders':
      return <StatTile label="Orders" value={312} delta={-4} goal="increase" />;
    case 'crates':
      return (
        <BarChart
          label="Crates by quarter"
          categories={['Q1', 'Q2', 'Q3', 'Q4']}
          series={[
            { id: 'apples', label: 'Apples', values: [42, 55, 61, 48] },
            { id: 'pears', label: 'Pears', values: [24, 31, 28, 35] },
          ]}
          height={160}
        />
      );
    case 'results':
      return (
        <DonutChart
          label="Run results"
          diameter={120}
          segments={[
            { id: 'passed', label: 'Passed', tone: 'success', value: 214 },
            { id: 'failed', label: 'Failed', tone: 'danger', value: 6 },
            { id: 'skipped', label: 'Skipped', tone: 'neutral', value: 2 },
          ]}
        />
      );
    default:
      return <Card title="Notes">Release review on Thursday.</Card>;
  }
}

/** The tile menu: the built-in layout actions, then the host's own Full width. */
const overviewTileMenu: readonly DashboardTileMenuEntry[] = [
  'move',
  'resize',
  'remove',
  { type: 'separator', id: 'host' },
  { id: 'full-width', label: 'Full width' },
];

/** The empty space menu: add a note tile where the menu opened. */
const overviewSpaceMenu = [{ id: 'add-note', label: 'Add a note here' }];

/** A note tile added from the empty space menu: its field keeps its own context menu. */
function NoteTile({ id }: { id: string }) {
  return (
    <Card title={`Note ${id.slice(5)}`}>
      <TextField label="Note" defaultValue="Draft" />
    </Card>
  );
}

/** Host icons for the tile menu's built-in actions (UIC-DASHBOARD-GRID-5.1). */
const tileIcons: DashboardTileMenuIcons = { move: MoveGlyph, remove: DeleteGlyph };

/** A tile's title: the sample's, or the added note's. */
const titleOf = (id: string) =>
  id.startsWith('note-') ? `Note ${id.slice(5)}` : requireDefined(titles[id]);

/**
 * An editable overview: an edit toggle, tile and empty space menus that change the layout, and
 * the layout printed as it changes.
 */
function EditableOverview() {
  const [layout, setLayout] = useState(overview);
  const [isEditing, setEditing] = useState(true);
  const [notes, setNotes] = useState(0);
  return (
    <div data-lab-demo="overview">
      <Button onPress={() => setEditing(!isEditing)}>
        {isEditing ? 'Done editing' : 'Edit layout'}
      </Button>
      <DashboardGrid
        aria-label="Overview"
        layout={layout}
        onLayoutChange={setLayout}
        isEditing={isEditing}
        rowHeight={112}
        tileMenu={overviewTileMenu}
        tileMenuIcons={tileIcons}
        onTileAction={(key, target) => {
          if (key !== 'full-width') return;
          setLayout(
            layout.map((item) => (item.id === target.id ? { ...item, x: 0, w: 12 } : item)),
          );
        }}
        spaceMenu={overviewSpaceMenu}
        onSpaceAction={(_key, cell) => {
          setNotes(notes + 1);
          setLayout([
            ...layout,
            { id: `note-${notes + 1}`, x: Math.min(cell.x, 10), y: cell.y, w: 2, h: 1 },
          ]);
        }}
      >
        {(item) => (
          <DashboardTile
            label={titleOf(String(item.id))}
            minColumnSpan={item.id === 'crates' || item.id === 'results' ? 3 : 2}
            minRowSpan={item.id === 'crates' ? 2 : 1}
          >
            {String(item.id).startsWith('note-') ? (
              <NoteTile id={String(item.id)} />
            ) : (
              <TileContent id={String(item.id)} />
            )}
          </DashboardTile>
        )}
      </DashboardGrid>
      <p data-lab-output="layout">
        {layout.map(({ id, x, y, w, h }) => `${id} ${x},${y} ${w}×${h}`).join('; ')}
      </p>
    </div>
  );
}

const shared: DashboardGridItem[] = [
  { id: 'a', x: 0, y: 0, w: 2, h: 1 },
  { id: 'b', x: 2, y: 0, w: 2, h: 1 },
];

/**
 * A layout another source changes during a drag: hold a handle, then use a button with the
 * keyboard. The drag keeps the tiles added or removed meanwhile, and stops if its own tile goes.
 */
function SharedLayout() {
  const [layout, setLayout] = useState(shared);
  const [added, setAdded] = useState(0);
  return (
    <div data-lab-demo="shared">
      <Button
        onPress={() => {
          setAdded(added + 1);
          setLayout([...layout, { id: `n${added + 1}`, x: 4, y: 0, w: 2, h: 1 }]);
        }}
      >
        Add a tile
      </Button>
      <Button onPress={() => setLayout(layout.slice(0, 1))}>Keep only the first tile</Button>
      <Button
        onPress={() => {
          // Moves the first tile away, then puts it back while the drag's pointer is still down.
          setLayout(layout.map((item, index) => (index === 0 ? { ...item, y: item.y + 3 } : item)));
          window.setTimeout(() => setLayout(layout), 300);
        }}
      >
        Move the first tile away and back
      </Button>
      <div style={frame(360)}>
        <DashboardGrid
          aria-label="Shared"
          layout={layout}
          onLayoutChange={setLayout}
          columns={6}
          rowHeight={48}
          isEditing
        >
          {(item) => <DashboardTile label={`Shared ${item.id}`}>Shared {item.id}</DashboardTile>}
        </DashboardGrid>
      </div>
      <p data-lab-output="layout">
        {layout.map(({ id, x, y, w, h }) => `${id} ${x},${y} ${w}×${h}`).join('; ')}
      </p>
    </div>
  );
}

/** The remembered grid, and a way to store a layout of the wrong shape and mount it again. */
function RememberedLayout() {
  const storage = useUiStorage();
  const [mount, setMount] = useState(0);
  return (
    <div data-lab-demo="stored">
      <Button
        onPress={() => {
          storage.setItem('lab-dashboard-grid', '[{"id":"a"}]');
          setMount(mount + 1);
        }}
      >
        Store a broken layout and remount
      </Button>
      <div style={frame(360)}>
        <DashboardGrid
          key={mount}
          aria-label="Remembered"
          defaultLayout={small}
          persistKey="lab-dashboard-grid"
          columns={3}
          rowHeight={48}
          isEditing
        >
          {(item) => (
            <DashboardTile label={`Saved ${smallTitles.get(item.id)}`}>
              Saved {smallTitles.get(item.id)}
            </DashboardTile>
          )}
        </DashboardGrid>
      </div>
    </div>
  );
}

const chain: DashboardGridItem[] = [
  { id: 'a', x: 2, y: 0, w: 2, h: 3 },
  { id: 'b', x: 0, y: 1, w: 2, h: 1 },
  { id: 'c', x: 4, y: 1, w: 2, h: 1 },
  { id: 'd', x: 0, y: 2, w: 2, h: 1 },
];

/**
 * A grid whose reflow pushes a tile below a later one: on two columns c settles under d, so the
 * tiles are read a, b, d, c. The width changes a moment after the button, so focus can wait in a
 * tile meanwhile.
 */
function ReflowOrder() {
  const [isNarrow, setNarrow] = useState(false);
  return (
    <div data-lab-demo="reflow-order">
      <Button onPress={() => window.setTimeout(() => setNarrow(!isNarrow), 1000)}>
        {isNarrow ? 'Widen in 1 second' : 'Narrow in 1 second'}
      </Button>
      <div style={frame(isNarrow ? 250 : 700)}>
        <DashboardGrid
          aria-label="Reflow order"
          layout={chain}
          columns={6}
          minColumnWidth={100}
          rowHeight={40}
        >
          {(item) => (
            <DashboardTile label={`Tile ${String(item.id)}`}>
              <Button size="sm" variant="secondary">
                Open {String(item.id)}
              </Button>
            </DashboardTile>
          )}
        </DashboardGrid>
      </div>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Edit mode"
      description="Right-click a tile, or press Shift+F10 in it, for Move, Resize and Remove (in edit mode) and Full width: the host gives Move and Remove icons, which built-in actions lack by default, and Resize and Full width stay without, every label in line; right-click the empty space below the tiles to add a note there, whose field keeps its own menu. Each tile shows a move grip at the middle of its top edge and a diagonal resize arrow at its end corner, ghost buttons laid over the tile: toggle Done editing and Edit layout to see the content keep its place. Drag them, or focus one and press the arrow keys (plain arrows only: with Shift, Alt, Control or Meta they do nothing); tiles in the way move down, and a resize stops at the last column. Each tile also stops at its minimum: Crates by quarter and Run results keep at least 3 columns and the others 2, and Crates by quarter keeps at least 2 rows (`minRowSpan`), by pointer or keyboard; the line under the grid shows each tile's committed column, row, width and height. Leaving edit mode, reflowing to a narrow layout or a pointer the browser cancels (such as a touch it takes over for scrolling) discards an unfinished pointer move or resize."
    >
      <EditableOverview />
    </LabSection>
    <LabSection
      title="States"
      description="Reading and editing a small grid on three columns with numeric and text IDs kept distinct; at 320 pixels three 100 pixel columns and their two 12 pixel gaps no longer fit, so it reflows onto two columns, and narrower onto one, read only."
    >
      <StateMatrix
        axes={{ mode: ['reading', 'editing'], width: ['wide', 'tight', 'narrow'] }}
        render={({ mode, width }) => (
          <div style={frame(frameWidths[width])}>
            <DashboardGrid
              aria-label={`${mode} ${width} grid`}
              defaultLayout={small}
              columns={3}
              minColumnWidth={100}
              rowHeight={48}
              isEditing={mode === 'editing'}
            >
              {(item) => (
                <DashboardTile label={`Tile ${smallTitles.get(item.id)}`}>
                  Tile {smallTitles.get(item.id)}
                </DashboardTile>
              )}
            </DashboardGrid>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Reading order after a reflow"
      description="Narrowing the grid to two columns pushes tile c below tile d. The tiles, and Tab, then go a, b, d, c, as they are shown, and a focused tile keeps its focus as the order changes."
    >
      <ReflowOrder />
    </LabSection>
    <LabSection
      title="Changes during a drag"
      description="Hold a handle, then press a button with the keyboard. A tile added or removed meanwhile stays in the layout the drag reports; a drag whose own tile was removed or moved stops and reports nothing, and stays stopped when the tile comes back: only a new press moves it again."
    >
      <SharedLayout />
    </LabSection>
    <LabSection
      title="Remembered layout"
      description="With persistKey, an uncontrolled grid keeps its layout through the provider storage when the page reloads. A stored layout of the wrong shape is refused, and the grid starts from its default layout."
    >
      <RememberedLayout />
    </LabSection>
  </>,
);

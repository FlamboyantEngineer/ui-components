import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { SplitView } from '../../src/components/split-view/index.js';
import { Table, applyTableMove, type TableColumn } from '../../src/components/table/index.js';

/** The ancestor scales the content widths demo offers: content widths stay the same in each. */
const scales: Record<string, CSSProperties> = {
  half: { transform: 'scale(0.5)', transformOrigin: '0 0' },
  none: {},
  double: { transform: 'scale(2)', transformOrigin: '0 0' },
  zoom: { zoom: 1.5 },
};

/**
 * Content tracks beside an omitted-width flexible track, with bounded and persisted resizing,
 * under an ancestor scale or zoom.
 */
export function ContentWidths() {
  const [scale, setScale] = useState('none');
  const [long, setLong] = useState(false);
  const [wideHeader, setWideHeader] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [resized, setResized] = useState('Not resized');
  const [virtualized, setVirtualized] = useState(false);
  const rows = [
    {
      id: 'pear',
      name: long ? 'A much longer item name with enough words to reach the column limit' : 'Pear',
      code: 'A',
      note: 'This column shares the space left over.',
    },
    { id: 'lime', name: 'Lime', code: 'B', note: 'Content tracks leave this column flexible.' },
  ];
  return (
    <div data-lab="content-widths">
      <Button onPress={() => setLong((value) => !value)}>Change content</Button>
      <Button onPress={() => setWideHeader((value) => !value)}>Change header</Button>
      <Button onPress={() => setVirtualized((value) => !value)}>
        {virtualized ? 'Use standard layout' : 'Use virtualized layout'}
      </Button>
      <Button onPress={() => setMounted((value) => !value)}>
        {mounted ? 'Unmount content table' : 'Mount content table'}
      </Button>
      <SegmentedChoice
        aria-label="Ancestor scale"
        size="sm"
        sizing="content"
        options={[
          { value: 'half', label: 'Scale 0.5' },
          { value: 'none', label: 'Scale 1' },
          { value: 'double', label: 'Scale 2' },
          { value: 'zoom', label: 'Zoom 1.5' },
        ]}
        value={scale}
        onChange={(value) => setScale(String(value))}
      />
      <div style={{ height: virtualized ? 240 : undefined, ...scales[scale] }}>
        {mounted ? (
          <Table
            aria-label="Content widths"
            rows={rows}
            virtualized={virtualized}
            persistKey="lab.table.content-widths"
            onColumnWidthsChange={(widths) => setResized(JSON.stringify(widths))}
            columns={[
              {
                id: 'name',
                header: wideHeader ? 'A descriptive item name' : 'Name',
                textValue: 'Name',
                width: 'content',
                minWidth: 80,
                maxWidth: 360,
                allowsResizing: true,
              },
              { id: 'code', header: 'Code', width: 'content', minWidth: 45, maxWidth: 110 },
              { id: 'note', header: 'Note', minWidth: 180 },
            ]}
          />
        ) : null}
      </div>
      <output role="status" aria-label="Content column resize">
        {resized}
      </output>
    </div>
  );
}

const groupedEntries = [
  { id: 'pear', name: 'Pear', kind: 'Fruit', isFixed: false },
  { id: 'lime', name: 'Lime', kind: 'Fruit', isFixed: false },
  { id: 'basil', name: 'Basil', kind: 'Herb', isFixed: true },
  { id: 'mint', name: 'Mint', kind: 'Herb', isFixed: false },
];

/** Caller-controlled moves inside one expanded group, with fixed rows kept out of dragging. */
export function GroupedReordering() {
  const [rows, setRows] = useState(groupedEntries);
  const [last, setLast] = useState('None');
  return (
    <div data-lab="grouped-reorder">
      <Table
        aria-label="Entries, reordered within groups"
        rows={rows}
        groupBy={['kind']}
        columns={[
          { id: 'name', header: 'Name', width: 'content', minWidth: 120 },
          { id: 'kind', header: 'Kind' },
        ]}
        getRowAttributes={(row) => ({ 'data-entry': row.id })}
        reorder={{
          grouped: 'within-group',
          dragTrigger: 'handle',
          canMove: (row) => !row.isFixed,
          onMove: (move) => {
            setRows((current) => applyTableMove(current, move));
            setLast(`${move.keys.join(', ')} ${move.position} ${String(move.targetKey)}`);
          },
        }}
      />
      <output role="status" aria-label="Grouped move">
        {last}
      </output>
    </div>
  );
}

const fluidRows = [
  { id: 'pear', name: 'Pear crate inspection', state: 'Open' },
  { id: 'lime', name: 'Lime delivery', state: 'Done' },
];

/**
 * A fluid table beside a resizable pane: its flexible Name column follows the pane's CSS width as
 * the separator moves, in the same frame. Its widths are kept under one of two layouts; switching
 * layout in the middle of a resize cancels it.
 */
export function FluidColumns() {
  const [layout, setLayout] = useState('first');
  return (
    <div data-lab="fluid-columns" style={{ display: 'grid', gap: 8 }}>
      <SegmentedChoice
        aria-label="Widths kept under"
        size="sm"
        sizing="content"
        options={[
          { value: 'first', label: 'Layout A' },
          { value: 'second', label: 'Layout B' },
        ]}
        value={layout}
        onChange={(value) => setLayout(String(value))}
      />
      <div style={{ height: 220 }}>
        <SplitView
          panes={[{ id: 'fluid-side' }, { id: 'fluid-table' }]}
          defaultSize={30}
          separatorLabel="Resize the side panel"
        >
          {[
            <div key="side">Side panel</div>,
            <div key="table" data-lab-fluid-space style={{ minWidth: 0 }}>
              <Table
                aria-label="Fluid columns"
                rows={fluidRows}
                columns={[
                  { id: 'name', header: 'Name', minWidth: 200, allowsResizing: true },
                  { id: 'state', header: 'State', width: 100 },
                ]}
                persistKey={`lab.table.fluid.${layout}`}
              />
            </div>,
          ]}
        </SplitView>
      </div>
    </div>
  );
}

const weightRows = [
  { id: 'one', name: 'First entry', kind: 'Sample', size: 'Small', note: 'Kept' },
  { id: 'two', name: 'Second entry', kind: 'Sample', size: 'Large', note: 'Moved' },
];

type WeightRow = (typeof weightRows)[number];

const weightColumns: TableColumn<WeightRow>[] = [
  { id: 'name', header: 'Name', width: '1fr', maxWidth: 1000 },
  { id: 'kind', header: 'Kind', width: '2fr', maxWidth: 1000 },
  { id: 'size', header: 'Size', width: '1fr', maxWidth: 90 },
  { id: 'note', header: 'Note', width: '2fr', minWidth: 100 },
];

/**
 * The same weighted, capped columns in a static and a virtualized table: Name and Kind keep their
 * one-to-two weights under a cap they never reach, Size stops at its 90 pixel cap, and the others
 * split what it leaves.
 */
export function ShareWeights() {
  return (
    <div data-lab="share-weights" style={{ display: 'grid', gap: 12, width: 640 }}>
      <Table aria-label="Weighted columns" rows={weightRows} columns={weightColumns} />
      <div style={{ height: 140, display: 'flex', flexDirection: 'column' }}>
        <Table
          aria-label="Weighted columns, virtualized"
          rows={weightRows}
          columns={weightColumns}
          virtualized
        />
      </div>
    </div>
  );
}

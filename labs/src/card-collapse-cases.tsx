import { useState } from 'react';
import type { Selection } from '../../src/core/props.js';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import {
  Card,
  CardGrid,
  CardGridItem,
  CardTitle,
  type CardPresentationSteps,
} from '../../src/components/card/index.js';
import { Checkbox } from '../../src/components/checkbox/index.js';
import { Link } from '../../src/components/link/index.js';
import { ProgressBar } from '../../src/components/progress-bar/progress-bar.js';
import { Slider } from '../../src/components/slider/slider.js';
import { TextField } from '../../src/components/text-field/index.js';
import { requireDefined } from '../../src/utils/require-defined.js';

/** A search box whose first Escape clears it and stays with it; the next one reaches the card. */
function FindField({ label }: { label: string }) {
  const [text, setText] = useState('');
  return (
    <input
      type="text"
      aria-label={label}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || text === '') return;
        event.preventDefault();
        setText('');
      }}
    />
  );
}

/** A record card: status, title, metadata, a progress preview, actions and a form in its body. */
function RowCard({
  row,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  presentationSteps,
}: {
  row: { name: string; short: string; done: number };
  isExpanded?: boolean | undefined;
  defaultExpanded?: boolean | undefined;
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  presentationSteps?: CardPresentationSteps | undefined;
}) {
  return (
    <Card
      title={row.name}
      abbreviation={row.short}
      leading={<Badge tone="success">Active</Badge>}
      description="Twelve plum trees along the south wall"
      meta="Updated Monday · Morning team"
      summary={<ProgressBar label="Harvest" value={row.done} />}
      actions={
        <>
          <Button size="sm">Water</Button>
          <Link href="#rows">Open log</Link>
          <TextField label="Crates" defaultValue="" />
          <FindField label={`Find a tree in ${row.name}`} />
        </>
      }
      footer="Last picked on Friday"
      isCollapsible
      isExpanded={isExpanded}
      defaultExpanded={defaultExpanded}
      onExpandedChange={onExpandedChange}
      presentationSteps={presentationSteps}
      fullWidth
    >
      <TextField label="Notes" defaultValue="" />
      <Checkbox>Pruned this week</Checkbox>
    </Card>
  );
}

const rows = [
  { name: 'Orchard row 4', short: 'R4', done: 40 },
  { name: 'Orchard row 5, the long stretch beside the old stone barn', short: 'R5', done: 75 },
];

const paneRows = [
  { name: 'Plum row 7', short: 'P7', done: 20 },
  { name: 'Plum row 8, the long stretch by the gate', short: 'P8', done: 90 },
];

/** Collapsible records, one controlled by the lab so "Collapse all" works from outside. */
export function CollapsibleRecords() {
  const [first, setFirst] = useState(true);
  return (
    <div data-lab-demo="collapse" style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <Button size="sm" onPress={() => setFirst(false)}>
        Collapse row 4
      </Button>
      <RowCard row={requireDefined(rows[0])} isExpanded={first} onExpandedChange={setFirst} />
      <RowCard row={requireDefined(rows[1])} />
      <p>
        Row 4 expanded: <output data-lab-output="expanded">{String(first)}</output>
      </p>
    </div>
  );
}

/** A custom header with the built-in toggle and an abbreviation. */
export function CustomHeaderCard() {
  return (
    <div data-lab-demo="custom" style={{ maxWidth: 420 }}>
      <Card
        isCollapsible
        defaultExpanded={false}
        abbreviation="Q3"
        summary="Three of five sections reviewed"
        header={
          <>
            <CardTitle>Quarterly report</CardTitle>
            <Badge>Draft</Badge>
          </>
        }
      >
        <p>Sections: overview, harvest, sales, staffing, outlook.</p>
      </Card>
    </div>
  );
}

/** The pane's breakpoints: the host sets them, the library has none. */
const paneSteps: CardPresentationSteps = { compact: { width: 320 }, minimal: { width: 120 } };

/** A pane whose width the slider (or the pane's own resize grip) sets, holding adaptive cards. */
export function ResizablePane() {
  const [width, setWidth] = useState(520);
  return (
    <div data-lab-demo="pane">
      <Slider
        label="Pane width"
        minValue={56}
        maxValue={640}
        value={width}
        onChange={(next) => setWidth(next)}
      />
      <div
        data-lab-pane=""
        style={{
          width,
          resize: 'horizontal',
          overflow: 'hidden',
          display: 'grid',
          gap: 8,
          padding: 4,
          border: '1px dashed currentColor',
        }}
      >
        {paneRows.map((row) => (
          <RowCard key={row.name} row={row} presentationSteps={paneSteps} defaultExpanded={false} />
        ))}
        <Card
          presentationSteps={paneSteps}
          abbreviation="P9"
          header={
            <>
              <CardTitle>Plum row 9</CardTitle>
              <Button size="sm">Archive row 9</Button>
            </>
          }
          fullWidth
        >
          <p>Six young trees by the gate.</p>
        </Card>
      </div>
    </div>
  );
}

/** Collapsible cards in a selectable grid: the toggle selects nothing. */
export function CollapsibleGrid() {
  const [selected, setSelected] = useState<Selection>(new Set());
  const names = selected === 'all' ? ['all'] : [...selected].map(String).sort();
  return (
    <div data-lab-demo="collapse-grid" style={{ width: 560 }}>
      <CardGrid
        aria-label="Rows"
        items={rows.map((row) => ({ ...row, id: row.short }))}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
      >
        {(row) => (
          <CardGridItem textValue={row.name}>
            {({ isSelected }) => (
              <Card
                title={row.name}
                role="group"
                isSelected={isSelected}
                isCollapsible
                defaultExpanded={false}
                summary={`Harvest ${row.done}% done`}
              >
                Twelve trees.
              </Card>
            )}
          </CardGridItem>
        )}
      </CardGrid>
      <p>
        Selected: <output data-lab-output="grid-selected">{names.join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

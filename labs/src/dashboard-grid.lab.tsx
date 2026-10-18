import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Card } from '../../src/components/card/card.js';
import { BarChart } from '../../src/components/chart/bar-chart.js';
import { DonutChart } from '../../src/components/chart/donut-chart.js';
import {
  DashboardGrid,
  type DashboardGridItem,
} from '../../src/components/dashboard-grid/dashboard-grid.js';
import { DashboardTile } from '../../src/components/dashboard-grid/dashboard-tile.js';
import { StatTile } from '../../src/components/stat-tile/stat-tile.js';
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
  { id: 'notes', x: 6, y: 3, w: 6, h: 1 },
];

const small: DashboardGridItem[] = [
  { id: 'a', x: 0, y: 0, w: 2, h: 1 },
  { id: 'b', x: 2, y: 0, w: 1, h: 1 },
  { id: 'c', x: 0, y: 1, w: 3, h: 1 },
];

const frame = (width: number): CSSProperties => ({ width });

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

/** An editable overview: an edit toggle, the layout printed as it changes. */
function EditableOverview() {
  const [layout, setLayout] = useState(overview);
  const [isEditing, setEditing] = useState(true);
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
      >
        {(item) => (
          <DashboardTile
            label={titles[item.id]!}
            minColumnSpan={item.id === 'crates' || item.id === 'results' ? 3 : 2}
          >
            <TileContent id={String(item.id)} />
          </DashboardTile>
        )}
      </DashboardGrid>
      <p data-lab-output="layout">
        {layout.map(({ id, x, y, w, h }) => `${id} ${x},${y} ${w}×${h}`).join('; ')}
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Edit mode"
      description="Each tile shows a move and a resize handle. Drag them, or focus one and press the arrow keys; tiles in the way move down."
    >
      <EditableOverview />
    </LabSection>
    <LabSection
      title="States"
      description="Reading and editing a small grid on three columns, and the same grid narrow enough to reflow onto one column, read only."
    >
      <StateMatrix
        axes={{ mode: ['reading', 'editing'], width: ['wide', 'narrow'] }}
        render={({ mode, width }) => (
          <div style={frame(width === 'wide' ? 360 : 140)}>
            <DashboardGrid
              aria-label={`${mode} ${width} grid`}
              defaultLayout={small}
              columns={3}
              minColumnWidth={100}
              rowHeight={48}
              isEditing={mode === 'editing'}
            >
              {(item) => (
                <DashboardTile label={`Tile ${String(item.id).toUpperCase()}`}>
                  Tile {String(item.id).toUpperCase()}
                </DashboardTile>
              )}
            </DashboardGrid>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Remembered layout"
      description="An uncontrolled grid that keeps its layout through the provider storage when the page reloads."
    >
      <div style={frame(360)} data-lab-demo="stored">
        <DashboardGrid
          aria-label="Remembered"
          defaultLayout={small}
          storageKey="lab-dashboard-grid"
          columns={3}
          rowHeight={48}
          isEditing
        >
          {(item) => (
            <DashboardTile label={`Saved ${String(item.id).toUpperCase()}`}>
              Saved {String(item.id).toUpperCase()}
            </DashboardTile>
          )}
        </DashboardGrid>
      </div>
    </LabSection>
  </>,
);

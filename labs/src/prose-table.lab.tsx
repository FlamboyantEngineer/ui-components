import type { ReactNode } from 'react';
import {
  ProseTable,
  type ProseTableColumn,
  type ProseTableRow,
} from '../../src/components/prose-table/prose-table.js';
import { ScrollRegion } from '../../src/components/scroll-region/scroll-region.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const header = [
  { key: 'fruit', content: 'Fruit' },
  { key: 'colour', content: 'Colour' },
  { key: 'season', content: 'Season' },
];

const contents: Record<string, readonly ProseTableRow[]> = {
  text: [row('apple', ['Apple', 'Red', 'Autumn']), row('pear', ['Pear', 'Green', 'Late summer'])],
  'inline markup': [
    row('apple', [
      <strong key="b">Apple</strong>,
      <em key="i">Red</em>,
      <code key="c">autumn</code>,
    ]),
    row('pear', [
      <a key="a" href="#pear">
        Pear
      </a>,
      'Green',
      'Late summer',
    ]),
  ],
  'short rows': [row('apple', ['Apple', 'Red']), row('plum', ['Plum'])],
};

const harvestHeader: readonly ProseTableColumn[] = [
  { key: 'fruit', content: 'Fruit', isRowHeader: true },
  { key: 'orchard', content: 'Orchard', align: 'center' },
  { key: 'crates', content: 'Crates', align: 'end' },
];

const harvest = [
  ['Apple', 'North', '1,240'],
  ['Pear', 'South', '86'],
  ['Plum', 'East', '412'],
  ['Cherry', 'West', '3,009'],
  ['Damson', 'North', '57'],
  ['Fig', 'South', '18'],
  ['Grape', 'East', '960'],
  ['Quince', 'West', '7'],
].map(([fruit = '', orchard = '', crates = '']) =>
  row(fruit, [fruit, orchard, crates], harvestHeader),
);

const harvestTotal = [row('total', ['Total', '', '5,789'], harvestHeader)];

function row(
  key: string,
  cells: ReactNode[],
  columns: readonly ProseTableColumn[] = header,
): ProseTableRow {
  return {
    key,
    cells: cells.map((content, index) => ({ key: columns[index]?.key ?? String(index), content })),
  };
}

mountLab(
  <>
    <LabSection
      title="Content"
      description="Plain, rich and short rows inside a paragraph's typography, at body size and at a small size."
    >
      <StateMatrix
        axes={{ content: Object.keys(contents), text: ['body', 'small'] }}
        render={({ content, text }) => (
          <div style={text === 'small' ? { fontSize: 12 } : undefined}>
            <p>The table below belongs to this paragraph.</p>
            <ProseTable header={header} rows={contents[content] ?? []} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Table parts"
      description="A caption, row headers in the first column, a centred and an end-aligned column, and a footer row of totals, with and without each part."
    >
      <StateMatrix
        axes={{ caption: ['with caption', 'without'], footer: ['with footer', 'without'] }}
        render={({ caption, footer }) => (
          <ProseTable
            header={harvestHeader}
            rows={harvest.slice(0, 3)}
            caption={caption === 'with caption' ? 'Crates picked this week' : undefined}
            footer={footer === 'with footer' ? harvestTotal : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Sticky header"
      description="A tall table in a 160px scroll region: with a sticky header the headings stay in view while the rows scroll."
    >
      <StateMatrix
        axes={{ header: ['sticky', 'static'] }}
        render={({ header: mode }) => (
          <div style={{ display: 'flex', flexDirection: 'column', width: 280, height: 160 }}>
            <ScrollRegion role="region" aria-label={`Harvest, ${mode} header`} tabIndex={0}>
              <ProseTable
                header={harvestHeader}
                rows={harvest}
                footer={harvestTotal}
                stickyHeader={mode === 'sticky'}
              />
            </ScrollRegion>
          </div>
        )}
      />
    </LabSection>
  </>,
);

import type { ReactNode } from 'react';
import { ProseTable, type ProseTableRow } from '../../src/components/prose-table/prose-table.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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

function row(key: string, cells: ReactNode[]): ProseTableRow {
  return {
    key,
    cells: cells.map((content, index) => ({ key: header[index]?.key ?? String(index), content })),
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
  </>,
);

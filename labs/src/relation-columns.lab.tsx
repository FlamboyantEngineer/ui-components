import { useState, type CSSProperties } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import {
  RelationColumns,
  type RelationColumnsPath,
  type RelationDirection,
} from '../../src/components/relation-columns/index.js';
import type { Key } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

interface TraceItem {
  id: string;
  title: string;
  type: 'Goal' | 'Requirement' | 'Design' | 'Test';
}

const items: TraceItem[] = [
  { id: 'goal-1', title: 'Checkout in under a minute', type: 'Goal' },
  { id: 'goal-2', title: 'Fewer abandoned baskets', type: 'Goal' },
  { id: 'req-12', title: 'Requirement 12: Save the basket', type: 'Requirement' },
  { id: 'req-13', title: 'Requirement 13: One-page payment', type: 'Requirement' },
  { id: 'des-4', title: 'Design 4: Basket storage', type: 'Design' },
  { id: 'des-5', title: 'Design 5: Payment form', type: 'Design' },
  { id: 'des-6', title: 'Design 6: Address lookup', type: 'Design' },
  { id: 'test-7', title: 'Test 7: Basket survives a reload', type: 'Test' },
  { id: 'test-8', title: 'Test 8: Pay with a saved card', type: 'Test' },
  { id: 'test-9', title: 'Test 9: Postcode finds the street', type: 'Test' },
];

const downstream: Record<string, string[]> = {
  'goal-1': ['req-13'],
  'goal-2': ['req-12', 'req-13'],
  'req-12': ['des-4'],
  'req-13': ['des-5', 'des-6'],
  'des-4': ['test-7'],
  'des-5': ['test-8'],
  'des-6': ['test-9'],
};

const byId = new Map(items.map((item) => [item.id, item]));

function getRelated(item: TraceItem, direction: RelationDirection): TraceItem[] {
  const keys =
    direction === 'downstream'
      ? (downstream[item.id] ?? [])
      : Object.keys(downstream).filter((key) => downstream[key]?.includes(item.id));
  return keys.flatMap((key) => byId.get(key) ?? []);
}

const getTextValue = (item: TraceItem) => item.title;

/** Bounds each walk so its columns scroll sideways. */
const frame: CSSProperties = { width: '36rem', maxWidth: '100%' };

function renderItem(item: TraceItem) {
  return (
    <>
      <Badge size="sm" tone={item.type === 'Test' ? 'success' : 'neutral'}>
        {item.type}
      </Badge>{' '}
      {item.title}
    </>
  );
}

const paths: Record<string, RelationColumnsPath> = {
  start: { upstream: [], downstream: [] },
  downstream: { upstream: [], downstream: ['des-5', 'test-8'] },
  'both sides': { upstream: ['goal-2'], downstream: ['des-6'] },
};

function describePath(path: RelationColumnsPath): string {
  const titles = (keys: readonly Key[]) => keys.map((key) => byId.get(String(key))?.title ?? '');
  return `Upstream: ${titles(path.upstream).join(' › ') || 'none'}; downstream: ${titles(path.downstream).join(' › ') || 'none'}`;
}

function TraceWalk() {
  const [focus, setFocus] = useState('req-13');
  const [output, setOutput] = useState('No choice yet');
  return (
    <div data-lab-demo="walk">
      <RelationColumns
        aria-label="Trace"
        item={byId.get(focus) as TraceItem}
        getRelated={getRelated}
        getTextValue={getTextValue}
        renderItem={renderItem}
        onPathChange={(path) => setOutput(describePath(path))}
        onAction={(key) => {
          setFocus(String(key));
          setOutput(`Started from ${byId.get(String(key))?.title ?? ''}`);
        }}
      />
      <p>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            setFocus('req-13');
            setOutput(`Started from ${byId.get('req-13')?.title ?? ''}`);
          }}
        >
          Back to the first item
        </Button>
      </p>
      <output data-lab-output>{output}</output>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="A walk at its start, two steps downstream, and one step on each side, left to right and right to left. A side without related items shows an empty column; the columns scroll sideways."
    >
      <StateMatrix
        axes={{ path: Object.keys(paths), locale: ['en-US', 'ar-EG'] }}
        render={({ path, locale }) => (
          <UiProvider locale={locale}>
            <div style={frame} dir={locale === 'ar-EG' ? 'rtl' : 'ltr'}>
              <RelationColumns
                aria-label={`Trace, ${path}, ${locale}`}
                item={byId.get('req-13') as TraceItem}
                getRelated={getRelated}
                getTextValue={getTextValue}
                defaultPath={paths[path]}
              />
            </div>
          </UiProvider>
        )}
      />
    </LabSection>
    <LabSection
      title="Walking relations"
      description="Choose an item to open the items related to it further along; ArrowLeft and ArrowRight move between columns. Press Enter, or double-click an item, to start the walk from it. The trail above the columns trims the walk back. Back to the first item starts its walk again empty."
    >
      <TraceWalk />
    </LabSection>
  </>,
);

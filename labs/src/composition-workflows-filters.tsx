import { useRef, useState } from 'react';
import { ActionRow } from '../../src/components/action-row/action-row.js';
import { Button } from '../../src/components/button/button.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { CheckGlyph, MoreGlyph, RefreshGlyph } from '../../src/core/glyphs.js';
import { isComposingKey } from '../../src/utils/is-composing-key.js';

export function FilterComposition() {
  const [value, setValue] = useState<string | null>('all');
  const [error, setError] = useState('');
  const [fail, setFail] = useState(true);
  return (
    <Stack space="md">
      <ActionRow
        overflow="menu"
        leadOverflow="scroll"
        size="sm"
        aria-label="Item actions"
        actions={[
          {
            id: 'refresh',
            label: 'Refresh',
            icon: RefreshGlyph,
            onPress: () => setError('Refreshed'),
          },
          { id: 'pending', label: 'Loading items', icon: CheckGlyph, isPending: true },
          {
            id: 'more',
            label: 'More item actions',
            icon: MoreGlyph,
            items: [{ id: 'settings', label: 'Filter settings' }],
          },
        ]}
        lead={
          <SegmentedChoice
            aria-label="Show items"
            size="sm"
            sizing="content"
            iconOnly="auto"
            showZero
            options={[
              { value: 'all', label: 'All items', count: 12 },
              { value: 'flagged', label: 'Flagged items', count: 0 },
              { value: 'waiting', label: 'Waiting for another detailed response', count: 128 },
            ]}
            value={value}
            onChange={async (next) => {
              await new Promise<void>((resolve) => window.setTimeout(resolve, 150));
              if (fail) {
                setError('Filter request failed. Retry when ready.');
                throw new Error('Filter request failed');
              }
              setValue(next);
              setError('');
            }}
          />
        }
      />
      <p role="status">{error || `Showing ${value ?? 'all'} items`}</p>
      <Button onPress={() => setFail(false)}>Allow filter request</Button>
    </Stack>
  );
}

export function SelectionComposition() {
  const targetRef = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(2);
  return (
    <Stack space="md">
      <Button ref={targetRef} onPress={() => setCount(2)}>
        Select two items
      </Button>
      {count ? (
        <ActionRow
          toolbar
          aria-label="Selected item actions"
          finalFocus={targetRef}
          onKeyDown={(event) => {
            if (
              event.key === 'Escape' &&
              !event.defaultPrevented &&
              !isComposingKey(event.nativeEvent)
            ) {
              event.preventDefault();
              setCount(0);
            }
          }}
          lead={
            <Cluster space="sm">
              <Button onPress={() => setCount(0)}>Clear selection</Button>
              <span role="status">{count} selected</span>
            </Cluster>
          }
          actions={[{ id: 'remove', label: 'Remove selected', onPress: () => setCount(0) }]}
        />
      ) : null}
    </Stack>
  );
}

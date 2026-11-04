import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  SplitView,
  type SplitViewHandle,
  type SplitViewPaneUnit,
} from '../../src/components/split-view/index.js';

const names: Record<string, string> = { a: 'Alpha', b: 'Blue', c: 'Gamma' };

export function SplitViewReorderingCase({ unit }: { unit: SplitViewPaneUnit }) {
  const handle = useRef<SplitViewHandle>(null);
  const [ids, setIds] = useState(['a', 'b', 'c']);
  const prefix = `reordering-${unit}`;
  return (
    <div data-lab-demo={prefix}>
      <h3>{unit === 'pixel' ? 'Pixel panes' : 'Percent panes'}</h3>
      <p>
        <Button size="sm" onPress={() => handle.current?.collapse(ids.indexOf('a'))}>
          Collapse Alpha
        </Button>{' '}
        <Button
          size="sm"
          onPress={() => setIds(ids[0] === 'a' ? ['b', 'a', 'c'] : ['a', 'b', 'c'])}
        >
          Swap Alpha and Blue
        </Button>{' '}
        <Button size="sm" onPress={() => handle.current?.expand(ids.indexOf('a'))}>
          Reopen Alpha
        </Button>
      </p>
      <div style={{ width: 720, height: 140, outline: '1px dotted currentColor' }}>
        <SplitView
          handleRef={handle}
          panes={ids.map((id) => ({
            id: `${prefix}-${id}`,
            unit,
            minSize: unit === 'pixel' ? 50 : 10,
            collapsible: true,
          }))}
          defaultSizes={unit === 'pixel' ? [100, 200, 300] : [20, 30, 50]}
          separatorLabel={(index) => `Resize ${names[ids[index] ?? '']}, ${unit}`}
        >
          {ids.map((id) => (
            <p key={id} style={{ margin: 0, padding: 8 }}>
              {names[id]}
            </p>
          ))}
        </SplitView>
      </div>
    </div>
  );
}

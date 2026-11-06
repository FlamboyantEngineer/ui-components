// A tree lab case: revealing and focusing rows by id through the tree's handle in a virtualized
// tree, with the reasons for a row under a collapsed folder and one the filter hides.

import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { Tree, type TreeHandle } from '../../src/components/tree/index.js';
import type { CollectionRevealResult, Key } from '../../src/core/index.js';
import { LabOutput } from './lab-output.js';

interface Shelf {
  id: string;
  name: string;
  children?: Shelf[];
}

const shelves: Shelf[] = Array.from({ length: 40 }, (_, folder) => ({
  id: `shelf-${folder + 1}`,
  name: `Shelf ${folder + 1}`,
  children: Array.from({ length: 10 }, (_, item) => ({
    id: `box-${folder + 1}-${item + 1}`,
    name: `Box ${folder + 1}.${item + 1}`,
  })),
}));

// Every shelf but the last is open, so its boxes are rows the tree can reveal.
const expanded = shelves.slice(0, -1).map((shelf) => shelf.id);

/**
 * A virtualized tree of 400 boxes on 40 shelves: reveal a box far below without moving focus, focus
 * one, and see why a box on the closed last shelf or one the filter hides is not shown.
 */
export function RevealTreeRows() {
  const handleRef = useRef<TreeHandle>(null);
  const [result, setResult] = useState('none');
  const [filterText, setFilterText] = useState('');
  const run = (method: 'revealKey' | 'focusKey', key: Key) => {
    const pending =
      handleRef.current?.[method](key) ??
      Promise.resolve<CollectionRevealResult>({ found: false, reason: 'unmounted' });
    void pending.then((next) => setResult(next.found ? 'found' : `not found (${next.reason})`));
  };
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button onPress={() => run('revealKey', 'box-30-4')}>Reveal box 30.4</Button>
        <Button onPress={() => run('focusKey', 'box-35-2')}>Focus box 35.2</Button>
        <Button onPress={() => run('revealKey', 'box-40-1')}>Reveal box 40.1</Button>
      </div>
      <LabOutput name="Tree reveal result">{result}</LabOutput>
      <TextField label="Filter shelves" value={filterText} onChange={setFilterText} />
      <Tree
        aria-label="Shelves"
        items={shelves}
        getTextValue={(shelf) => shelf.name}
        defaultExpandedKeys={expanded}
        filterText={filterText || undefined}
        virtualized
        handleRef={handleRef}
        data-lab-tree="reveal"
      />
    </div>
  );
}

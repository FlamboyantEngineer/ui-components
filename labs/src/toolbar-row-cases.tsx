// Cases of the layout lab for toolbar rows: overflow, pending rows and attached groups.

import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';

import {
  ToolbarRow,
  ToolbarRowGroup,
  ToolbarRowSeparator,
  type ToolbarRowGroupDensity,
  type ToolbarRowOverflow,
} from '../../src/components/layout/toolbar-row.js';
import { StateMatrix } from './chrome/index.js';

const frameStyle = (width: number): CSSProperties => ({
  width,
  outline: '1px dotted currentColor',
});

/** A row of grouped tools, one group attached, too long for a narrow host. */
function KitchenTools({ name, overflow }: { name: string; overflow: ToolbarRowOverflow }) {
  return (
    <ToolbarRow aria-label={name} overflow={overflow} justify="start" space="xs">
      <ToolbarRowGroup aria-label={`History, ${name}`} density="attached">
        <Button icon="undo" label="Undo" size="sm" />
        <Button icon="redo" label="Redo" size="sm" />
      </ToolbarRowGroup>
      <ToolbarRowSeparator />
      <ToolbarRowGroup aria-label={`Clipboard, ${name}`}>
        <Button icon="copy" label="Copy" size="sm" />
        <Button icon="edit" label="Edit" size="sm" />
        <Button icon="delete" label="Delete" size="sm" />
      </ToolbarRowGroup>
      <ToolbarRowSeparator />
      <ToolbarRowGroup aria-label={`Recipe, ${name}`}>
        <Button size="sm" variant="ghost">
          Add step
        </Button>
        <Button size="sm" variant="ghost">
          Scale servings
        </Button>
      </ToolbarRowGroup>
    </ToolbarRow>
  );
}

/** Each overflow in a 240px host. */
export function ToolbarOverflow() {
  return (
    <StateMatrix
      axes={{ overflow: ['wrap', 'scroll', 'none'] }}
      render={({ overflow }) => (
        <div style={{ ...frameStyle(240), overflow: 'hidden' }}>
          <KitchenTools name={`Recipe tools, ${overflow}`} overflow={overflow} />
        </div>
      )}
    />
  );
}

/** Attached and regular groups, in both orientations. */
export function AttachedGroups() {
  const densities: readonly ToolbarRowGroupDensity[] = ['regular', 'attached'];
  return (
    <StateMatrix
      axes={{ density: densities, orientation: ['horizontal', 'vertical'] }}
      render={({ density, orientation }) => (
        <ToolbarRow
          aria-label={`Zoom, ${density}, ${orientation}`}
          orientation={orientation}
          justify="start"
        >
          <ToolbarRowGroup aria-label={`Zoom steps, ${density}, ${orientation}`} density={density}>
            <Button icon="minus" label="Zoom out" size="sm" />
            <Button icon="refresh" label="Reset zoom" size="sm" />
            <Button icon="plus" label="Zoom in" size="sm" />
          </ToolbarRowGroup>
        </ToolbarRow>
      )}
    />
  );
}

/** The row stays pending, in place but unpainted and inert, until the editor below has started. */
export function PendingToolbar() {
  const [isStarted, setIsStarted] = useState(false);
  return (
    <div data-lab-demo="pending">
      <Button size="sm" onPress={() => setIsStarted((started) => !started)}>
        {isStarted ? 'Restart editor' : 'Start editor'}
      </Button>
      <div style={frameStyle(320)}>
        <ToolbarRow
          aria-label="Note tools"
          isPending={!isStarted}
          justify="start"
          variant="surface"
        >
          <Button icon="undo" label="Undo" size="sm" />
          <Button icon="redo" label="Redo" size="sm" />
          <Button icon="save" label="Save" size="sm" />
        </ToolbarRow>
        <p data-lab-output="editor">{isStarted ? 'Editor ready.' : 'Editor starting…'}</p>
      </div>
    </div>
  );
}

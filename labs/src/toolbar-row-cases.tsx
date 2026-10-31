import {
  CopyGlyph,
  DeleteGlyph,
  EditGlyph,
  MinusGlyph,
  PlusGlyph,
  RedoGlyph,
  RefreshGlyph,
  SaveGlyph,
  UndoGlyph,
} from '../../src/core/glyphs.js';
// Cases of the layout lab for toolbar rows: overflow, pending rows and attached groups.

import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ToolbarRow,
  ToolbarRowGroup,
  ToolbarRowSeparator,
  type ToolbarRowGroupDensity,
  type ToolbarRowOverflow,
} from '../../src/components/layout/index.js';
import { Stack } from '../../src/components/layout/layout.js';
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
        <Button icon={UndoGlyph} label="Undo" size="sm" />
        <Button icon={RedoGlyph} label="Redo" size="sm" />
      </ToolbarRowGroup>
      <ToolbarRowSeparator />
      <ToolbarRowGroup aria-label={`Clipboard, ${name}`}>
        <Button icon={CopyGlyph} label="Copy" size="sm" />
        <Button icon={EditGlyph} label="Edit" size="sm" />
        <Button icon={DeleteGlyph} label="Delete" size="sm" />
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
  const densities: readonly ToolbarRowGroupDensity[] = ['default', 'attached'];
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
            <Button icon={MinusGlyph} label="Zoom out" size="sm" />
            <Button icon={RefreshGlyph} label="Reset zoom" size="sm" />
            <Button icon={PlusGlyph} label="Zoom in" size="sm" />
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
          <Button icon={UndoGlyph} label="Undo" size="sm" />
          <Button icon={RedoGlyph} label="Redo" size="sm" />
          <Button icon={SaveGlyph} label="Save" size="sm" />
        </ToolbarRow>
        <p data-lab-output="editor">{isStarted ? 'Editor ready.' : 'Editor starting…'}</p>
      </div>
    </div>
  );
}

const overflowModes = ['wrap', 'scroll', 'none'] as const;

/** Changing the dividers, the overflow or the orientation keeps a typed draft and its focus. */
export function PresentationChanges() {
  const [divided, setDivided] = useState(false);
  const [overflow, setOverflow] = useState<ToolbarRowOverflow>('wrap');
  const [isVertical, setVertical] = useState(false);
  const nextOverflow = overflowModes[(overflowModes.indexOf(overflow) + 1) % overflowModes.length];
  return (
    <div data-lab-case="presentation">
      <ToolbarRow role="group" justify="start" aria-label="Presentation">
        <Button size="sm" onPress={() => setDivided(!divided)}>
          {divided ? 'Hide dividers' : 'Show dividers'}
        </Button>
        <Button size="sm" onPress={() => setOverflow(nextOverflow ?? 'wrap')}>
          Overflow: {overflow}
        </Button>
        <Button size="sm" onPress={() => setVertical(!isVertical)}>
          {isVertical ? 'Horizontal' : 'Vertical'}
        </Button>
      </ToolbarRow>
      <Stack divided={divided} space="sm">
        <input aria-label="Stack note" placeholder="Stack note" />
        <input aria-label="Second note" placeholder="Second note" />
      </Stack>
      <div style={frameStyle(240)}>
        <ToolbarRow
          aria-label="Search tools"
          justify="start"
          overflow={overflow}
          orientation={isVertical ? 'vertical' : 'horizontal'}
        >
          <input aria-label="Search" placeholder="Search" />
          <Button size="sm" startIcon={CopyGlyph}>
            Duplicate
          </Button>
          <Button size="sm" startIcon={RefreshGlyph}>
            Refresh
          </Button>
          <Button size="sm" startIcon={SaveGlyph}>
            Save
          </Button>
        </ToolbarRow>
      </div>
    </div>
  );
}

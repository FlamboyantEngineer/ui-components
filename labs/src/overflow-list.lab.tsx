import { useState, type ReactNode } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { ToolbarRow } from '../../src/components/layout/toolbar-row.js';
import { OverflowList } from '../../src/components/overflow-list/overflow-list.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const fruit = ['Apple', 'Banana', 'Cherry', 'Dragon fruit', 'Elderberry', 'Fig', 'Grape'];
const tools = ['Cut', 'Copy', 'Paste', 'Bold', 'Italic', 'Underline', 'Link'];
const widths = { wide: 560, medium: 300, narrow: 160 } as const;

// Lab-only frame: an overflow list needs a box whose width does not follow its content.
function Frame({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div data-lab-frame="" style={{ width }}>
      {children}
    </div>
  );
}

function MoreFruit({ hidden }: { hidden: readonly string[] }) {
  return (
    <DropdownMenu
      size="sm"
      label={`${hidden.length} more`}
      aria-label="More fruit"
      items={hidden.map((name) => ({ id: name, label: name }))}
    />
  );
}

function FruitRow({ collapseFrom }: { collapseFrom: 'start' | 'end' }) {
  return (
    <OverflowList
      role="group"
      aria-label="Fruit"
      items={fruit}
      collapseFrom={collapseFrom}
      renderItem={(name) => <Badge>{name}</Badge>}
      renderOverflow={(hidden) => <MoreFruit hidden={hidden} />}
    />
  );
}

function ResizableRow() {
  const [width, setWidth] = useState(300);
  return (
    <div data-lab-demo="resizable">
      <label>
        Width{' '}
        <input
          type="range"
          min={80}
          max={560}
          step={10}
          value={width}
          onChange={(event) => setWidth(Number(event.target.value))}
        />{' '}
        <output>{width}px</output>
      </label>
      <Frame width={width}>
        <FruitRow collapseFrom="end" />
      </Frame>
    </div>
  );
}

function ToolRow() {
  const [last, setLast] = useState('none');
  return (
    <div data-lab-demo="toolbar">
      <Frame width={330}>
        <OverflowList
          items={tools}
          render={(props) => (
            <ToolbarRow
              {...props}
              role="toolbar"
              aria-label="Text tools"
              justify="start"
              wrap="nowrap"
            />
          )}
          renderItem={(tool) => (
            <Button size="sm" variant="ghost" onPress={() => setLast(tool)}>
              {tool}
            </Button>
          )}
          renderOverflow={(hidden) => (
            <DropdownMenu
              iconOnly
              size="sm"
              label="More tools"
              items={hidden.map((tool) => ({ id: tool, label: tool }))}
              onAction={(key) => setLast(String(key))}
            />
          )}
        />
      </Frame>
      <p data-lab-output="last">Last tool: {last}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Collapsing end"
      description="Seven fruit in frames of 560, 300 and 160 pixels. The kept items stay at one end and a menu holds the rest."
    >
      <StateMatrix
        axes={{ collapseFrom: ['end', 'start'], width: ['wide', 'medium', 'narrow'] }}
        render={({ collapseFrom, width }) => (
          <Frame width={widths[width]}>
            <FruitRow collapseFrom={collapseFrom} />
          </Frame>
        )}
      />
    </LabSection>
    <LabSection
      title="Resizing"
      description="The row solves again as its frame narrows or widens, measuring hidden items from the last time they showed."
    >
      <ResizableRow />
    </LabSection>
    <LabSection
      title="Rendered as a toolbar"
      description="The render prop swaps the root for a React Aria toolbar: arrow keys move between the visible tools and the menu of the others."
    >
      <ToolRow />
    </LabSection>
  </>,
);

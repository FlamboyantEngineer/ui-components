import { type ReactNode, useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { ToolbarRow } from '../../src/components/layout/index.js';
import { OverflowList } from '../../src/components/overflow-list/overflow-list.js';
import { resolveOverflowCount } from '../../src/utils/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabHelperCalls } from './lab-helper-calls.js';
import { OverflowItemsHost } from './overflow-items-host.js';
import { NoteRow } from './overflow-list-notes.js';

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
      getKey={(name) => name}
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
          getKey={(tool) => tool}
          render={(props, { itemContainerRef }) => (
            <ToolbarRow
              {...props}
              stripRef={itemContainerRef}
              role="toolbar"
              aria-label="Text tools"
              justify="start"
              overflow="none"
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
      title="Inside a scaled frame"
      description="The 300 pixel row inside ancestors scaled by 0.75 and 1.5 keeps the same fruit as the unscaled row: items and room are measured in the row's own pixels."
    >
      <StateMatrix
        axes={{ scale: ['0.75', '1.5'] }}
        render={({ scale }) => (
          <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
            <Frame width={widths.medium}>
              <FruitRow collapseFrom="end" />
            </Frame>
          </div>
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
      description="The render prop swaps the root for a ToolbarRow, with itemContainerRef on its stripRef so the controls are measured: arrow keys move between the visible tools and the menu of the others."
    >
      <ToolRow />
    </LabSection>
    <LabSection
      title="Reordering"
      description="Type a note in a kept item, then reverse, add or remove items: each note stays with its item, and focus with the field it is in. An item that leaves for the menu loses its note."
    >
      <NoteRow />
    </LabSection>
    <LabSection
      title="A host row with useOverflowItems"
      description="A row the host renders itself, measured by useOverflowItems. The pinned item has a higher getPriority and is hidden last; minVisible keeps two items however narrow. Direct children put the +N indicator at the end, Placed indicator puts it after the first item through indicatorRef, and Nested list measures a list of its own through itemContainerRef beside a New folder button that keeps its size. The readout lists the kept and hidden items."
    >
      <OverflowItemsHost />
    </LabSection>
    <LabSection
      title="Host helpers"
      description="The count OverflowList keeps visible, from measured sizes, for a host laying out its own strip."
    >
      <LabHelperCalls
        calls={[
          [
            'resolveOverflowCount({ sizes: [60, 60, 60, 60], available: 200, gap: 8, indicatorSize: 40 })',
            resolveOverflowCount({
              sizes: [60, 60, 60, 60],
              available: 200,
              gap: 8,
              indicatorSize: 40,
            }),
          ],
        ]}
      />
    </LabSection>
  </>,
);

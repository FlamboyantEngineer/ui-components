import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { ResizeHandle } from '../../src/components/split-view/index.js';
import { SplitView, type SplitViewHandle } from '../../src/components/split-view/split-view.js';
import { LabSection, StateMatrix } from './chrome/index.js';

// Lab-only frames so the panes are visible with or without a stylesheet.
const frame = (width: number | string, height: number): CSSProperties => ({
  width,
  height,
  display: 'flex',
  flexDirection: 'column',
  outline: '1px dotted currentColor',
});

function Pane({ children }: { children: ReactNode }) {
  return <p style={{ margin: 0, padding: 8 }}>{children}</p>;
}

const paneNames = ['Folders', 'Messages', 'Reading'];
const units = ['px', '%', '%'];

/** Sizes written with each pane's unit: `160px, 40%, 60%`. */
function withUnits(sizes: readonly number[]): string {
  return sizes.map((size, index) => `${String(Math.round(size))}${units[index] ?? ''}`).join(', ');
}

/** A three-pane split whose sizes live in the lab's state: live while dragging, committed after. */
function ControlledPanes() {
  const handle = useRef<SplitViewHandle>(null);
  const [sizes, setSizes] = useState<readonly number[]>([160, 40, 60]);
  const [committed, setCommitted] = useState('none yet');
  return (
    <div style={{ display: 'grid', gap: 8 }} data-lab-split="controlled-panes">
      <p>
        <Button size="sm" onPress={() => setSizes([200, 30, 70])}>
          Wide folders
        </Button>{' '}
        <Button size="sm" onPress={() => setSizes([140, 60, 40])}>
          Wide messages
        </Button>{' '}
        <Button size="sm" onPress={() => handle.current?.collapse(0)}>
          Collapse folders
        </Button>{' '}
        <Button size="sm" onPress={() => handle.current?.expand(0)}>
          Expand folders
        </Button>
      </p>
      <p>
        Live sizes: <output data-lab-output="live">{withUnits(sizes)}</output>; committed:{' '}
        <output data-lab-output="committed">{committed}</output>
      </p>
      <div style={frame(600, 140)}>
        <SplitView
          handleRef={handle}
          panes={[
            {
              id: 'controlled-folders',
              unit: 'pixel',
              minSize: 120,
              maxSize: 240,
              collapsible: true,
              collapsedSize: 0,
            },
            { id: 'controlled-messages', minSize: 20 },
            { id: 'controlled-reading', minSize: 20 },
          ]}
          sizes={sizes}
          onSizesChange={setSizes}
          onSizesChangeEnd={(next) => {
            setSizes(next);
            setCommitted(withUnits(next));
          }}
          separatorLabel={(index) => `Resize ${paneNames[index] ?? ''}, controlled`}
        >
          {paneNames.map((name) => (
            <Pane key={name}>{name}</Pane>
          ))}
        </SplitView>
      </div>
    </div>
  );
}

const interruptions = {
  none: 'Nothing',
  reset: 'Change resetKey',
  disable: 'Disable the handle',
  unmount: 'Unmount the handle',
} as const;
type Interruption = keyof typeof interruptions;

/**
 * A handle sizing a list in rows of 20 pixels, so a pixel of travel is a twentieth of a row. One
 * second into a drag the page interrupts it as chosen, and the log shows change, end and cancel.
 */
function RowHandle() {
  const [rows, setRows] = useState(4);
  const [log, setLog] = useState<string[]>([]);
  const [interruption, setInterruption] = useState<Interruption>('none');
  const [owner, setOwner] = useState(0);
  const [isDisabled, setDisabled] = useState(false);
  const [isMounted, setMounted] = useState(true);
  const add = (entry: string) => setLog((current) => [...current, entry]);
  const restore = () => {
    setDisabled(false);
    setMounted(true);
    setLog([]);
  };
  return (
    <div style={{ display: 'grid', gap: 8 }} data-lab-handle="rows">
      <SegmentedChoice
        aria-label="One second into a drag"
        sizing="content"
        options={Object.entries(interruptions).map(([value, label]) => ({ value, label }))}
        value={interruption}
        onChange={(value) => setInterruption((value as Interruption | null) ?? 'none')}
      />
      <Button size="sm" onPress={restore}>
        Restore the handle
      </Button>
      <div
        style={{ ...frame(260, 220), justifyContent: 'flex-start' }}
        onPointerDownCapture={(event) => {
          if (!(event.target as HTMLElement).closest('[role="separator"]')) return;
          if (interruption === 'none') return;
          window.setTimeout(() => {
            if (interruption === 'reset') setOwner((value) => value + 1);
            if (interruption === 'disable') setDisabled(true);
            if (interruption === 'unmount') setMounted(false);
          }, 1000);
        }}
      >
        <div style={{ height: rows * 20, overflow: 'hidden', padding: '0 8px' }}>
          Shopping list, {rows.toFixed(1)} rows
        </div>
        {isMounted ? (
          <ResizeHandle
            orientation="horizontal"
            value={rows}
            minValue={2}
            maxValue={9}
            extent={10}
            getUnitsPerPixel={() => 1 / 20}
            resetKey={owner}
            isDisabled={isDisabled}
            aria-label="Resize the shopping list"
            onChange={(value) => {
              setRows(value);
              add(`change ${value.toFixed(2)} rows`);
            }}
            onChangeEnd={(value) => add(`end ${value.toFixed(2)} rows`)}
            onChangeCancel={() => add('cancel')}
          />
        ) : null}
      </div>
      <p>
        Owner: <output data-lab-output="owner">{owner}</output>
      </p>
      <ol
        aria-label="Handle events"
        data-lab-output="handle-events"
        style={{ maxHeight: 120, overflow: 'auto' }}
      >
        {log.slice(-8).map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

export function SplitViewControlCases() {
  return (
    <>
      <LabSection
        title="Controlled panes"
        description="A pixel folders pane and two percent panes whose sizes live in the lab's state: onSizesChange writes the live sizes during a drag and on each key, onSizesChangeEnd the committed ones. The buttons resize from outside, collapse and expand."
      >
        <ControlledPanes />
      </LabSection>
      <LabSection
        title="Standalone handle in rows"
        description="A handle whose value is in rows of 20 pixels (getUnitsPerPixel), so the list grows a row per 20 pixels of travel. Pick what the page does one second into a drag: change resetKey (a new owner), disable or unmount the handle. Each abandons the drag with onChangeCancel instead of an end; Nothing ends it normally."
      >
        <RowHandle />
      </LabSection>
      <LabSection
        title="Fixed spacing"
        description="Every gap between fixed panes, side by side, in a 320 by 120 pixel host."
      >
        <StateMatrix
          axes={{ space: ['none', 'xs', 'md', 'xl', '3xl'] as const }}
          render={({ space }) => (
            <div style={frame(320, 120)}>
              <SplitView ratio="equal" space={space} data-lab-space={space}>
                <Pane>Main</Pane>
                <Pane>Side</Pane>
              </SplitView>
            </div>
          )}
        />
      </LabSection>
      <LabSection
        title="Grow, fill and clip"
        description="A split in a positioned 320 by 120 pixel flex host beside a fixed 40 pixel footer: grow takes the free height, fill asks for the host's full height (the flex host still keeps the footer's share), clip cuts content that does not fit. Without any, the tall pane overflows the split."
      >
        <StateMatrix
          axes={{ containment: ['none', 'grow', 'fill', 'clip'] as const }}
          render={({ containment }) => (
            <div style={{ ...frame(320, 120), position: 'relative' }}>
              <SplitView
                ratio="equal"
                grow={containment === 'grow'}
                fill={containment === 'fill'}
                clip={containment === 'clip'}
                data-lab-containment={containment}
              >
                <p style={{ margin: 0, padding: 8, height: 160 }}>
                  A tall pane that runs past its host
                </p>
                <Pane>Side</Pane>
              </SplitView>
              <div style={{ height: 40, flex: 'none' }}>Footer</div>
            </div>
          )}
        />
      </LabSection>
    </>
  );
}

import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { UiProvider } from '../../src/core/provider.js';
import { ResizeHandle, resolveResizeKeyboardValue } from '../../src/components/split-view/index.js';
import { SplitView, type SplitViewHandle } from '../../src/components/split-view/split-view.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabHelperCalls } from './lab-helper-calls.js';

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

function ControlledSplit() {
  const [size, setSize] = useState(35);
  const [committed, setCommitted] = useState(35);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p>
        First pane: <output data-lab-output="controlled">{Math.round(size)}%</output>, committed:{' '}
        <output data-lab-output="committed">{Math.round(committed)}%</output>{' '}
        <button type="button" onClick={() => setSize(35)}>
          Reset
        </button>
      </p>
      <div style={frame(480, 140)}>
        <SplitView
          panes={[{ id: 'controlled-list' }, { id: 'controlled-detail' }]}
          size={size}
          onSizeChange={setSize}
          onSizeChangeEnd={setCommitted}
          separatorLabel="Resize controlled panes"
        >
          {[<Pane key="a">Controlled list</Pane>, <Pane key="b">Controlled detail</Pane>]}
        </SplitView>
      </div>
    </div>
  );
}

const layouts = ['Reading', 'Editing'] as const;

/** One split saved under a key per layout; switching layouts mid-drag abandons the drag. */
function LayoutSplit() {
  const [layout, setLayout] = useState<(typeof layouts)[number]>('Reading');
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <fieldset style={{ display: 'flex', gap: 12, border: 0, padding: 0, margin: 0 }}>
        <legend>Layout</legend>
        {layouts.map((name) => (
          <label key={name}>
            <input
              type="radio"
              name="split-view-lab-layout"
              checked={layout === name}
              onChange={() => setLayout(name)}
            />{' '}
            {name}
          </label>
        ))}
      </fieldset>
      <div style={frame(480, 140)} data-lab-split="layouts">
        <SplitView
          panes={[{ id: 'layout-list' }, { id: 'layout-detail' }]}
          defaultSize={40}
          persistKey={`split-view-lab.layout.${layout.toLowerCase()}`}
          separatorLabel="Resize layout panes"
        >
          {[<Pane key="a">{layout} list</Pane>, <Pane key="b">{layout} detail</Pane>]}
        </SplitView>
      </div>
    </div>
  );
}

const columns = ['Folders', 'Messages', 'Reading'];

function CollapsibleSplit() {
  const handle = useRef<SplitViewHandle>(null);
  const [log, setLog] = useState('Nothing yet');
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p>
        <button type="button" onClick={() => handle.current?.collapse(2)}>
          Collapse preview
        </button>{' '}
        <button type="button" onClick={() => handle.current?.expand(2)}>
          Expand preview
        </button>{' '}
        <button type="button" onClick={() => handle.current?.resize([25, 45, 30])}>
          Reset sizes
        </button>{' '}
        <output data-lab-output="collapse">{log}</output>
      </p>
      <div style={frame(600, 160)} data-lab-split="collapsible">
        <SplitView
          handleRef={handle}
          panes={[
            { id: 'collapsible-nav', collapsible: true, minSize: 15, collapsedSize: 4 },
            { id: 'collapsible-list' },
            { id: 'collapsible-preview', collapsible: true, minSize: 20 },
          ]}
          defaultSizes={[25, 45, 30]}
          separatorLabel={(index) => `Resize ${columns[index]}`}
          onCollapse={(index) => setLog(`Collapsed ${columns[index]}`)}
          onExpand={(index) => setLog(`Expanded ${columns[index]}`)}
        >
          {columns.map((name) => (
            <Pane key={name}>{name}</Pane>
          ))}
        </SplitView>
      </div>
    </div>
  );
}

/** A side pane opened before the list: the list keeps its draft, focus and size. */
function OpeningSide() {
  const [hasSide, setSide] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 8 }} data-lab-split="opening">
      <label>
        <input
          type="checkbox"
          checked={hasSide}
          onChange={(event) => setSide(event.target.checked)}
        />{' '}
        Show filters
      </label>
      <div style={frame('100%', 160)}>
        <SplitView
          panes={[
            ...(hasSide ? [{ id: 'opening-side', unit: 'pixel' as const, minSize: 120 }] : []),
            { id: 'opening-list', minSize: 20 },
            { id: 'opening-detail' },
          ]}
        >
          {[
            ...(hasSide ? [<Pane key="side">Filters</Pane>] : []),
            <div key="list" style={{ padding: 8 }}>
              <input aria-label="List note" />
            </div>,
            <Pane key="detail">Details</Pane>,
          ]}
        </SplitView>
      </div>
    </div>
  );
}

function PixelHandle({ isDisabled = false, label }: { isDisabled?: boolean; label: string }) {
  const [height, setHeight] = useState(60);
  const [status, setStatus] = useState('idle');
  const [isLocked, setLocked] = useState(false);
  return (
    <div style={{ ...frame(260, 180), justifyContent: 'flex-end' }}>
      <output data-lab-output="handle" style={{ padding: '0 8px', marginBottom: 'auto' }}>
        {status}
      </output>
      <Button size="sm" isDisabled={isDisabled} onPress={() => setLocked((current) => !current)}>
        {isLocked ? 'Unlock handle' : 'Lock handle'}
      </Button>
      <ResizeHandle
        orientation="horizontal"
        value={height}
        minValue={30}
        maxValue={150}
        extent={180}
        sizedPane="after"
        isDisabled={isDisabled || isLocked}
        aria-label={label}
        onChange={setHeight}
        onResizingChange={(isResizing) => setStatus(isResizing ? 'dragging' : 'idle')}
        onChangeEnd={(value) => setStatus(`committed ${value}px`)}
      />
      <div style={{ height, overflow: 'hidden', padding: '0 8px' }}>Details, {height}px tall</div>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Fixed ratios"
      description="Every ratio side by side and stacked, in a 320 by 160 pixel host."
    >
      <StateMatrix
        axes={{
          ratio: ['equal', 'main-sidebar', 'main-rail', 'content-main', 'main-content'],
          orientation: ['horizontal', 'vertical'],
        }}
        render={({ ratio, orientation }) => (
          <div style={frame(320, 160)}>
            <SplitView ratio={ratio} orientation={orientation} space="xs">
              <Pane>Main</Pane>
              <Pane>Side</Pane>
            </SplitView>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Resizable"
      description="Drag a separator or focus it and use the arrow keys (Shift for fine steps), Home and End. A drag shows the resizing state; release or cancellation finishes it."
    >
      <StateMatrix
        axes={{ orientation: ['horizontal', 'vertical'], start: ['30', '50'] }}
        render={({ orientation, start }) => (
          <div style={frame(360, 180)}>
            <SplitView
              orientation={orientation}
              panes={[
                { id: `${orientation}-${start}-first`, minSize: 20 },
                { id: `${orientation}-${start}-second`, minSize: 20 },
              ]}
              defaultSize={Number(start)}
              separatorLabel={`Resize ${orientation} split from ${start}%`}
            >
              {[<Pane key="a">Apples</Pane>, <Pane key="b">Bananas</Pane>]}
            </SplitView>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Bounds and persistence"
      description="Pane bounds keep the first pane between 25% and 60%; persistKey restores its size after a reload."
    >
      <div style={frame(480, 140)} data-lab-split="persisted">
        <SplitView
          panes={[{ id: 'persisted-list', minSize: 25, maxSize: 60 }, { id: 'persisted-detail' }]}
          defaultSize={40}
          persistKey="split-view-lab.persisted"
          separatorLabel="Resize persisted panes"
        >
          {[<Pane key="a">Cities</Pane>, <Pane key="b">Lisbon, Oslo, Kyoto</Pane>]}
        </SplitView>
      </div>
    </LabSection>
    <LabSection
      title="Layouts saved apart"
      description="Each layout saves its own size. Switching layouts during a drag abandons the drag, so it never lands in the other layout."
    >
      <LayoutSplit />
    </LabSection>
    <LabSection
      title="Several panes"
      description="Three panes with a separator between each pair; each separator resizes only its two neighbours."
    >
      <StateMatrix
        axes={{ orientation: ['horizontal', 'vertical'] }}
        render={({ orientation }) => (
          <div style={frame(480, 200)}>
            <SplitView
              orientation={orientation}
              panes={columns.map((name) => ({ id: `${orientation}-${name.toLowerCase()}` }))}
              defaultSizes={[25, 35, 40]}
              separatorLabel={(index) => `Resize ${columns[index]}, ${orientation}`}
            >
              {columns.map((name) => (
                <Pane key={name}>{name}</Pane>
              ))}
            </SplitView>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Opening a pane before another"
      description="Resize the list, type a note in it, then tick Show filters: a pixel pane opens before the list, which keeps its note, focus and share. Untick to close it again."
    >
      <OpeningSide />
    </LabSection>
    <LabSection
      title="Pixel panes"
      description="A tool rail of 160 pixels (between 120 and 280) keeps its width as the split resizes; the percent panes share the rest."
    >
      <StateMatrix
        axes={{ width: ['480', '720'] }}
        render={({ width }) => (
          <div style={frame(Number(width), 140)} data-lab-split={`pixel ${width}`}>
            <SplitView
              panes={[
                { id: `pixel-${width}-rail`, unit: 'pixel', minSize: 120, maxSize: 280 },
                { id: `pixel-${width}-canvas` },
                { id: `pixel-${width}-inspector`, unit: 'pixel', minSize: 100 },
              ]}
              defaultSizes={[160, 100, 120]}
              separatorLabel={(index) => `Resize ${index === 0 ? 'rail' : 'canvas'}, ${width}px`}
            >
              {[
                <Pane key="a">Tools</Pane>,
                <Pane key="b">Canvas</Pane>,
                <Pane key="c">Inspector</Pane>,
              ]}
            </SplitView>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Pixel panes only"
      description="Two pixel panes of 100 and 200 pixels (between 50 and 250) keep their widths in a wider split; the space they leave stays empty. Enter on the separator collapses the layers pane."
    >
      <StateMatrix
        axes={{ width: ['480', '720'] }}
        render={({ width }) => (
          <div style={frame(Number(width), 140)} data-lab-split={`all-pixel ${width}`}>
            <SplitView
              panes={[
                { id: `all-pixel-${width}-tools`, unit: 'pixel', minSize: 50, maxSize: 250 },
                {
                  id: `all-pixel-${width}-layers`,
                  unit: 'pixel',
                  minSize: 50,
                  maxSize: 250,
                  collapsible: true,
                },
              ]}
              defaultSizes={[100, 200]}
              separatorLabel={`Resize tools, ${width}px`}
            >
              {[<Pane key="a">Tools</Pane>, <Pane key="b">Layers</Pane>]}
            </SplitView>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Collapsible panes"
      description="Drag a pane below half its smallest size to collapse it, or press Enter on its separator; Enter again restores it. The navigation collapses to a 4% rail. The buttons use the imperative handle."
    >
      <CollapsibleSplit />
    </LabSection>
    <LabSection title="Controlled" description="The size lives in the lab's state.">
      <ControlledSplit />
    </LabSection>
    <LabSection
      title="Standalone handle"
      description="A handle sizing the pane after it in pixels, enabled and disabled. Locking during a drag clears its shield and ends the gesture without a commit."
    >
      <StateMatrix
        axes={{ state: ['enabled', 'disabled'] }}
        render={({ state }) => (
          <PixelHandle isDisabled={state === 'disabled'} label={`Resize details, ${state}`} />
        )}
      />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left locale the first pane is on the right and the Left arrow grows it."
    >
      <UiProvider locale="he-IL">
        <div dir="rtl" style={frame(480, 140)} data-lab-split="rtl">
          <SplitView
            panes={[{ id: 'rtl-first' }, { id: 'rtl-second' }]}
            defaultSize={40}
            separatorLabel="Resize right-to-left panes"
          >
            {[<Pane key="a">First</Pane>, <Pane key="b">Second</Pane>]}
          </SplitView>
        </div>
      </UiProvider>
    </LabSection>
    <LabSection
      title="Host helpers"
      description="The window-splitter key rules, for a host that draws its own separator."
    >
      <LabHelperCalls
        calls={[
          ...(['ArrowRight', 'Shift+ArrowRight', 'End'] as const).map(
            (press) =>
              [
                `resolveResizeKeyboardValue({ key: '${press.replace('Shift+', '')}', shiftKey: ${String(press.startsWith('Shift+'))} }, input)`,
                String(
                  resolveResizeKeyboardValue(
                    { key: press.replace('Shift+', ''), shiftKey: press.startsWith('Shift+') },
                    { orientation: 'vertical', value: 50, minValue: 20, maxValue: 80, extent: 100 },
                  ),
                ),
              ] as const,
          ),
        ]}
      />
    </LabSection>
    <LabSection
      title="Inside a scaled frame"
      description="A pixel split inside an ancestor with transform: scale(0.75) and one with scale(1.5), as an embedded preview or a zoomed design canvas draws it. Dragging a separator keeps it under the pointer."
    >
      <StateMatrix
        axes={{ scale: ['0.75', '1.5'] }}
        render={({ scale }) => (
          <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
            <div style={frame(360, 120)}>
              <SplitView
                panes={[
                  { id: `scaled-${scale}-rail`, unit: 'pixel', minSize: 80, maxSize: 240 },
                  { id: `scaled-${scale}-canvas` },
                ]}
                defaultSizes={[120, 100]}
                separatorLabel={() => `Resize rail at scale ${scale}`}
              >
                {[<Pane key="a">Tools</Pane>, <Pane key="b">Canvas</Pane>]}
              </SplitView>
            </div>
          </div>
        )}
      />
    </LabSection>
  </>,
);

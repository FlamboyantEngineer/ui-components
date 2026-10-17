import { useState, type CSSProperties, type ReactNode } from 'react';
import { UiProvider } from '../../src/core/provider.js';
import { ResizeHandle } from '../../src/components/split-view/resize-handle.js';
import { SplitView } from '../../src/components/split-view/split-view.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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

function PixelHandle({ isDisabled = false, label }: { isDisabled?: boolean; label: string }) {
  const [height, setHeight] = useState(60);
  const [status, setStatus] = useState('idle');
  return (
    <div style={{ ...frame(260, 180), justifyContent: 'flex-end' }}>
      <output data-lab-output="handle" style={{ padding: '0 8px', marginBottom: 'auto' }}>
        {status}
      </output>
      <ResizeHandle
        orientation="horizontal"
        value={height}
        minValue={30}
        maxValue={150}
        extent={180}
        sizedPane="after"
        isDisabled={isDisabled}
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
      description="Drag a separator or focus it and use the arrow keys (Shift for fine steps), Home and End. A drag shows the resizing state."
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
      description="The first pane stays between 25% and 60%, and its size is restored after a reload."
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
    <LabSection title="Controlled" description="The size lives in the lab's state.">
      <ControlledSplit />
    </LabSection>
    <LabSection
      title="Standalone handle"
      description="A handle sizing the pane after it in pixels, enabled and disabled."
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
  </>,
);

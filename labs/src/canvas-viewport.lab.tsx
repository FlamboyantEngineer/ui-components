import { memo, useRef, useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  type CanvasConnection,
  type CanvasConnectionPreview,
  CanvasViewport,
  type CanvasViewportController,
} from '../../src/components/canvas-viewport/index.js';
import { ZoomControl } from '../../src/components/zoom-control/index.js';
import {
  Assembly,
  canConnectAssembly,
  getAssemblyBounds,
  initialAssemblyViewport,
  initialLinks,
  initialParts,
} from './canvas-viewport-assembly.js';
import { SwitchableScenes } from './canvas-viewport-scenes.js';
import { LabSection, mountLab } from './chrome/index.js';

const AssemblyScene = memo(Assembly);
const denseNodes = Array.from({ length: 100 }, (_, index) => ({
  x: 25 + (index % 10) * 57,
  y: 22 + Math.floor(index / 10) * 29,
}));

function EditableAssembly() {
  const controller = useRef<CanvasViewportController>(null);
  const [viewport, setViewport] = useState(initialAssemblyViewport);
  const [preview, setPreview] = useState<CanvasConnectionPreview | null>(null);
  const [links, setLinks] = useState(initialLinks);
  const [layout, setLayout] = useState(initialParts);
  const [status, setStatus] = useState('');
  const [narrow, setNarrow] = useState(false);
  const [alternateGestures, setAlternateGestures] = useState(false);
  const onConnect = (connection: CanvasConnection) => {
    const { source, target } = connection;
    if (!canConnectAssembly(connection)) {
      setStatus(`Connection rejected: ${String(target.elementId)}`);
      return;
    }
    setLinks((current) =>
      current.some(
        (link) =>
          link.source.elementId === source.elementId && link.target.elementId === target.elementId,
      )
        ? current
        : [...current, connection],
    );
    setStatus(`Connected ${String(source.elementId)} to ${String(target.elementId)}`);
  };
  return (
    <>
      <div style={{ maxWidth: narrow ? 410 : 660 }}>
        <CanvasViewport
          aria-label="Editable assembly"
          gesturePolicy={alternateGestures ? { panButton: 'middle', wheel: 'zoom' } : undefined}
          viewport={viewport}
          onViewportChange={setViewport}
          controllerRef={controller}
          onConnect={onConnect}
          onConnectionPreview={setPreview}
          controls={
            <>
              <ZoomControl
                aria-label="Assembly zoom"
                value={viewport.zoom}
                onChange={(zoom) => controller.current?.zoomTo(zoom)}
                formatOptions={{ maximumFractionDigits: 0 }}
              />
              <Button
                size="sm"
                onPress={() => controller.current?.fitToBounds(getAssemblyBounds(layout), 38)}
              >
                Fit assembly
              </Button>
            </>
          }
        >
          <AssemblyScene
            links={links}
            preview={preview}
            layout={layout}
            onLayoutChange={setLayout}
          />
        </CanvasViewport>
      </div>
      <Button size="sm" onPress={() => setNarrow(!narrow)}>
        {narrow ? 'Widen pane' : 'Narrow pane'}
      </Button>
      <Button size="sm" onPress={() => setAlternateGestures(!alternateGestures)}>
        {alternateGestures ? 'Use default gestures' : 'Use middle drag and wheel zoom'}
      </Button>
      <p role="status">{status}</p>
    </>
  );
}

function DenseScene() {
  return (
    <svg role="img" aria-label="100 nodes and 300 paths" style={{ width: '100%', height: '100%' }}>
      {denseNodes.flatMap((from, index) =>
        [1, 10, 21].flatMap((step) => {
          const to = denseNodes[(index + step) % denseNodes.length];
          return to
            ? [
                <path
                  key={`${index}-${step}`}
                  d={`M ${from.x} ${from.y} Q ${from.x} ${to.y}, ${to.x} ${to.y}`}
                  stroke="var(--ref-border-strong)"
                  strokeWidth={0.65}
                  fill="none"
                  pointerEvents="none"
                />,
              ]
            : [];
        }),
      )}
      {denseNodes.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x - 5}
          y={y - 4}
          width={10}
          height={8}
          rx={2}
          fill="var(--ref-accent)"
        />
      ))}
    </svg>
  );
}

mountLab(
  <>
    <LabSection
      title="Assembly editor"
      description="Drag a part by its title and resize it by its corner. Drag from Source to Receiver to add a link, or try Spare to see a rejected target. With the keyboard, activate Source with Enter or Space, Tab to Receiver, then activate Receiver. Escape ends an unfinished gesture. Ctrl or Command with the wheel zooms at the pointer. The alternate gestures pan with the middle button and zoom with the plain wheel."
    >
      <EditableAssembly />
    </LabSection>
    <LabSection
      title="Switchable scenes"
      description="Tap an SVG port to inspect it. Drag Input to Output to connect. Drag with the middle button to pan and use the wheel to zoom. Each scene remembers its camera."
    >
      <SwitchableScenes />
    </LabSection>
    <LabSection
      title="Large scene"
      description="Pan the 100 shapes and 300 caller-drawn paths together."
    >
      <CanvasViewport
        aria-label="Large scene"
        defaultViewport={{ x: 20, y: 10, zoom: 100 }}
        controls={<span>100 nodes · 300 links</span>}
      >
        <DenseScene />
      </CanvasViewport>
    </LabSection>
  </>,
);

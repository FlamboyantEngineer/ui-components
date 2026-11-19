import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  type CanvasConnection,
  type CanvasConnectionPreview,
  CanvasElement,
  type CanvasPoint,
  CanvasViewport,
  type CanvasViewportController,
  type CanvasViewportState,
  useCanvasAnchor,
} from '../../src/components/canvas-viewport/index.js';

interface Port {
  id: string;
  label: string;
  position: CanvasPoint;
}

const overviewPorts: readonly Port[] = [
  { id: 'input', label: 'Input port', position: { x: 38, y: 64 } },
  { id: 'output', label: 'Output port', position: { x: 230, y: 64 } },
  { id: 'service', label: 'Service port', position: { x: 230, y: 124 } },
];
const detailPorts: readonly Port[] = [
  { id: 'input', label: 'Input port', position: { x: 38, y: 50 } },
  { id: 'output', label: 'Output port', position: { x: 130, y: 50 } },
];

type Scene = 'overview' | 'detail';

function canConnect({ source, target }: CanvasConnection) {
  return source.elementId === 'input' && target.elementId === 'output';
}

function ScenePort({
  port,
  highlighted,
  onTap,
}: {
  port: Port;
  highlighted: boolean;
  onTap: () => void;
}) {
  const anchor = useCanvasAnchor('port', { dragThreshold: 6, onTap });
  return (
    <>
      <circle
        {...anchor}
        role="button"
        tabIndex={0}
        aria-label={port.label}
        r={10}
        stroke="var(--ref-accent)"
        strokeWidth={2}
        fill={highlighted ? 'var(--ref-accent)' : 'var(--ref-canvas)'}
      />
      <text x={16} y={4} fontSize={13}>
        {port.label}
      </text>
    </>
  );
}

function SceneWire({
  from,
  to,
  preview = false,
}: {
  from: CanvasPoint;
  to: CanvasPoint;
  preview?: boolean;
}) {
  return (
    <path
      aria-hidden="true"
      d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
      fill="none"
      stroke="var(--ref-accent)"
      strokeWidth={2}
      strokeDasharray={preview ? '4 4' : undefined}
      pointerEvents="none"
    />
  );
}

export function SwitchableScenes() {
  const controller = useRef<CanvasViewportController>(null);
  const saved = useRef<Partial<Record<Scene, CanvasViewportState>>>({});
  const [scene, setScene] = useState<Scene>('overview');
  const [connection, setConnection] = useState<CanvasConnection | null>(null);
  const [preview, setPreview] = useState<CanvasConnectionPreview | null>(null);
  const [status, setStatus] = useState('');
  const ports = scene === 'overview' ? overviewPorts : detailPorts;
  const other = scene === 'overview' ? 'detail' : 'overview';
  const switchScene = () => {
    const camera = controller.current;
    if (!camera) return;
    saved.current[scene] = camera.getViewport();
    setScene(other);
    setConnection(null);
    setPreview(null);
    setStatus('');
    const restored = saved.current[other];
    if (restored) camera.setViewport(restored);
    else camera.fitToBounds({ x: 0, y: 0, width: 195, height: 100 }, { padding: 30, maxZoom: 65 });
  };
  const locate = (id: CanvasConnection['source']['elementId'] | undefined) =>
    ports.find((port) => port.id === id)?.position;
  const source = locate(connection?.source.elementId);
  const target = locate(connection?.target.elementId);
  const previewSource = locate(preview?.source.elementId);
  const previewTarget = locate(preview?.target?.elementId) ?? preview?.point;
  return (
    <CanvasViewport
      aria-label="Switchable scenes"
      controllerRef={controller}
      defaultViewport={{ x: 24, y: 64, zoom: 100 }}
      gesturePolicy={{ panButton: 'middle', wheel: 'zoom' }}
      canConnect={canConnect}
      onConnect={(link) => {
        setConnection(link);
        setStatus('Connected input to output');
      }}
      onConnectionPreview={setPreview}
      controls={
        <>
          <Button size="sm" onPress={switchScene}>
            {other === 'detail' ? 'Show detail' : 'Show overview'}
          </Button>
          <output>{status}</output>
        </>
      }
    >
      <svg
        role="group"
        aria-label={scene === 'overview' ? 'Overview scene' : 'Detail scene'}
        style={{ width: '100%', height: '100%' }}
      >
        {source && target ? <SceneWire from={source} to={target} /> : null}
        {previewSource && previewTarget ? (
          <SceneWire from={previewSource} to={previewTarget} preview />
        ) : null}
        {ports.map((port) => (
          <CanvasElement key={`${scene}-${port.id}`} elementId={port.id} position={port.position}>
            <ScenePort
              port={port}
              highlighted={preview?.target?.elementId === port.id}
              onTap={() => setStatus(`Inspecting ${port.label}`)}
            />
          </CanvasElement>
        ))}
      </svg>
    </CanvasViewport>
  );
}

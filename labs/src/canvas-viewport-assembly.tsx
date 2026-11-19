import { type CSSProperties, type PointerEvent, useMemo, useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  type CanvasAnchorEndpoint,
  type CanvasBounds,
  type CanvasConnection,
  type CanvasConnectionPreview,
  CanvasElement,
  type CanvasElementLayout,
  type CanvasGesturePosition,
  type CanvasPoint,
  resolveCanvasAnchors,
  useCanvasAnchor,
  useCanvasViewport,
} from '../../src/components/canvas-viewport/index.js';

interface Part extends Omit<CanvasElementLayout, 'anchors' | 'children'> {
  id: string;
  label: string;
  width: number;
  height: number;
  children?: readonly Part[] | undefined;
}

interface Edit {
  id: string;
  kind: 'move' | 'resize';
  delta: CanvasPoint;
}

interface AssemblyProps {
  links: readonly CanvasConnection[];
  preview: CanvasConnectionPreview | null;
}

export const initialParts: readonly Part[] = [
  {
    id: 'frame',
    label: 'Frame',
    position: { x: 0, y: 0 },
    width: 175,
    height: 158,
    children: [
      { id: 'source', label: 'Source', position: { x: 18, y: 46 }, width: 118, height: 82 },
    ],
  },
  {
    id: 'stand',
    label: 'Stand',
    position: { x: 255, y: 30 },
    width: 175,
    height: 177,
    children: [
      { id: 'receiver', label: 'Receiver', position: { x: 30, y: 40 }, width: 119, height: 48 },
      { id: 'spare', label: 'Spare', position: { x: 30, y: 108 }, width: 119, height: 45 },
    ],
  },
];

const layer: CSSProperties = { position: 'absolute', left: 0, top: 0, overflow: 'visible' };
const outline = 'var(--ref-border-strong)';
const highlight = 'var(--ref-accent)';
const rejected = 'var(--ref-danger)';
const surface = 'var(--ref-raised)';

export const initialAssemblyViewport = { x: 38, y: 70, zoom: 100 };
export const initialLinks: readonly CanvasConnection[] = [
  {
    source: { elementId: 'frame', anchorId: 'jack' },
    target: { elementId: 'stand', anchorId: 'jack' },
  },
];

export function canConnectAssembly({ source, target }: CanvasConnection): boolean {
  return source.elementId === 'source' && target.elementId === 'receiver';
}

function getAnchor(part: Part) {
  return {
    id: 'jack',
    position: {
      x: part.id === 'receiver' ? 14 : part.id === 'spare' ? 0 : part.width + 9,
      y: part.height / 2,
    },
  };
}

/** Fits the current shapes and the full hit area of each anchor. */
export function getAssemblyBounds(parts: readonly Part[]): CanvasBounds {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  const visit = (part: Part, parent: CanvasPoint) => {
    const x = parent.x + part.position.x;
    const y = parent.y + part.position.y;
    const { position } = getAnchor(part);
    left = Math.min(left, x, x + position.x - 12);
    top = Math.min(top, y, y + position.y - 12);
    right = Math.max(right, x + part.width, x + position.x + 12);
    bottom = Math.max(bottom, y + part.height, y + position.y + 12);
    for (const child of part.children ?? []) visit(child, { x, y });
  };
  for (const part of parts) visit(part, { x: 0, y: 0 });
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function applyEdit(current: readonly Part[], edit: Edit): Part[] {
  return current.map((part) => {
    const children = part.children ? applyEdit(part.children, edit) : undefined;
    if (edit.id !== part.id) return { ...part, children };
    const { x, y } = edit.delta;
    if (edit.kind === 'resize')
      return {
        ...part,
        children,
        width: Math.max(75, part.width + x),
        height: Math.max(40, part.height + y),
      };
    return { ...part, children, position: { x: part.position.x + x, y: part.position.y + y } };
  });
}

function withAnchors(part: Part): CanvasElementLayout {
  return { ...part, anchors: [getAnchor(part)], children: part.children?.map(withAnchors) };
}

function Anchor({ part }: { part: Part }) {
  const anchor = getAnchor(part);
  const bindings = useCanvasAnchor(anchor.id);
  return (
    <foreignObject x={anchor.position.x - 12} y={anchor.position.y - 12} width={24} height={24}>
      <button type="button" aria-label={`${part.label} anchor`} {...bindings} />
    </foreignObject>
  );
}

function MarkControl() {
  const [isMarked, setMarked] = useState(false);
  return (
    <foreignObject x={10} y={31} width={102} height={40}>
      <Button size="xs" onPress={() => setMarked(!isMarked)}>
        {isMarked ? 'Unmark' : 'Mark'}
      </Button>
    </foreignObject>
  );
}

function PartShape({
  part,
  startEdit,
}: {
  part: Part;
  startEdit: (event: PointerEvent<Element>, part: Part, kind: Edit['kind']) => void;
}) {
  const { width, height, label, position, id } = part;
  return (
    <CanvasElement elementId={id} position={position}>
      <rect width={width} height={height} rx={8} fill={surface} stroke={outline} />
      <rect
        data-lab-handle={`move-${id}`}
        x={8}
        y={3}
        width={width - 27}
        height={26}
        fill="transparent"
        style={{ cursor: 'move' }}
        onPointerDown={(event) => startEdit(event, part, 'move')}
      />
      <text x={19} y={22} fontSize={14} pointerEvents="none">
        {label}
      </text>
      {id === 'source' ? <MarkControl /> : null}
      <rect
        data-lab-handle={`resize-${id}`}
        x={width - 13}
        y={height - 13}
        width={10}
        height={10}
        rx={2}
        fill={outline}
        style={{ cursor: 'nwse-resize' }}
        onPointerDown={(event) => startEdit(event, part, 'resize')}
      />
      {part.children?.map((child) => (
        <PartShape key={child.id} part={child} startEdit={startEdit} />
      ))}
      <Anchor part={part} />
    </CanvasElement>
  );
}

function drawPath(from: CanvasPoint, to: CanvasPoint): string {
  const bend = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${bend} ${from.y}, ${bend} ${to.y}, ${to.x} ${to.y}`;
}

function AssemblyLinks({
  links,
  preview,
  locate,
}: AssemblyProps & {
  locate: (endpoint: CanvasAnchorEndpoint) => CanvasPoint | undefined;
}) {
  const from = preview ? locate(preview.source) : undefined;
  const to = (preview?.target ? locate(preview.target) : undefined) ?? preview?.point;
  const denied =
    preview?.target && !canConnectAssembly({ source: preview.source, target: preview.target });
  return (
    <svg
      aria-hidden="true"
      width={1}
      height={1}
      style={{ ...layer, pointerEvents: 'none' }}
      fill="none"
    >
      {links.map((connection) => {
        const source = locate(connection.source);
        const target = locate(connection.target);
        return source && target ? (
          <path key={JSON.stringify(connection)} d={drawPath(source, target)} stroke={outline} />
        ) : null;
      })}
      {from && to ? (
        <path
          data-lab-overlay="connection"
          d={drawPath(from, to)}
          stroke={denied ? rejected : highlight}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      ) : null}
    </svg>
  );
}

export function Assembly({
  links,
  preview,
  layout,
  onLayoutChange,
}: AssemblyProps & {
  layout: readonly Part[];
  onLayoutChange: (parts: readonly Part[]) => void;
}) {
  const { claimGesture } = useCanvasViewport();
  const [edit, setEdit] = useState<Edit | null>(null);
  const scene = useMemo(() => (edit ? applyEdit(layout, edit) : layout), [layout, edit]);
  const locate = useMemo(() => resolveCanvasAnchors(scene.map(withAnchors)), [scene]);
  const startEdit = (event: PointerEvent<Element>, part: Part, kind: Edit['kind']) => {
    const draftAt = ({ point, start }: CanvasGesturePosition): Edit => ({
      id: part.id,
      kind,
      delta: { x: point.x - start.x, y: point.y - start.y },
    });
    claimGesture(event, {
      onPreview: (position) => setEdit(draftAt(position)),
      onCommit: (position) => {
        onLayoutChange(applyEdit(layout, draftAt(position)));
        setEdit(null);
      },
      onCancel: () => setEdit(null),
    });
  };
  const source = locate({ elementId: 'source', anchorId: 'jack' });
  return (
    <>
      <svg
        style={{ ...layer, width: '100%', height: '100%' }}
        role="group"
        aria-label="Assembly elements"
      >
        {scene.map((part) => (
          <PartShape key={part.id} part={part} startEdit={startEdit} />
        ))}
      </svg>
      <AssemblyLinks {...{ links, preview, locate }} />
      {source ? (
        <span
          style={{
            position: 'absolute',
            left: source.x + 14,
            top: source.y + 9,
            pointerEvents: 'none',
            padding: '2px 5px',
            borderRadius: 3,
            color: 'var(--ref-text)',
            background: 'color-mix(in srgb, var(--ref-accent) 12%, var(--ref-raised))',
            fontSize: 11,
          }}
        >
          Check alignment
        </span>
      ) : null}
    </>
  );
}

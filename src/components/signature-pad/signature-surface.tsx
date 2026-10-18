import { useId, useRef, useState, type PointerEvent } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { Button } from '../button/button.js';
import type { FieldControlProps } from '../field/field.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  formatSignatureStroke,
  signatureSpace,
  type DrawnSignature,
  type SignaturePoint,
} from './signature-path.js';

export interface SignatureSurfaceProps {
  control: FieldControlProps;
  /** The drawing shown, or `null` for an empty pad. */
  drawing: DrawnSignature | null;
  isEditable: boolean;
  /** Called with the drawing after a stroke ends, an undo or a clear; `null` when it is empty. */
  onDraw: (drawing: DrawnSignature | null) => void;
}

export const signaturePadHooks = createHooks('signature-pad', [
  'modes',
  'surface',
  'canvas',
  'stroke',
  'actions',
  'input',
]);

const hooks = signaturePadHooks;

/** The pointer position in the drawing space, kept inside it. */
function toDrawingPoint(event: PointerEvent<SVGSVGElement>, size: DrawnSignature): SignaturePoint {
  const box = event.currentTarget.getBoundingClientRect();
  const x = box.width > 0 ? ((event.clientX - box.left) / box.width) * size.width : 0;
  const y = box.height > 0 ? ((event.clientY - box.top) / box.height) * size.height : 0;
  return { x: clamp(x, 0, size.width), y: clamp(y, 0, size.height) };
}

/**
 * Captures one stroke at a time from the primary button of a mouse, a pen or a touch. The pointer
 * is captured, so a stroke that leaves the surface keeps drawing along its edge until release; a
 * cancelled pointer drops the stroke.
 */
function useStrokeCapture(
  size: DrawnSignature,
  { isEditable, onStroke }: { isEditable: boolean; onStroke: (path: string) => void },
) {
  const pointer = useRef<number | null>(null);
  const points = useRef<SignaturePoint[]>([]);
  const [livePath, setLivePath] = useState<string | null>(null);
  const add = (event: PointerEvent<SVGSVGElement>) => {
    points.current = [...points.current, toDrawingPoint(event, size)];
    setLivePath(formatSignatureStroke(points.current));
  };
  const end = (event: PointerEvent<SVGSVGElement>, isKept: boolean) => {
    if (event.pointerId !== pointer.current) return;
    if (isKept) add(event);
    pointer.current = null;
    setLivePath(null);
    if (isKept) onStroke(formatSignatureStroke(points.current));
  };
  return {
    livePath,
    handlers: {
      onPointerDown: (event: PointerEvent<SVGSVGElement>) => {
        if (!isEditable || event.button !== 0 || pointer.current !== null) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        pointer.current = event.pointerId;
        points.current = [];
        add(event);
      },
      onPointerMove: (event: PointerEvent<SVGSVGElement>) => {
        if (event.pointerId === pointer.current) add(event);
      },
      onPointerUp: (event: PointerEvent<SVGSVGElement>) => end(event, true),
      onPointerCancel: (event: PointerEvent<SVGSVGElement>) => end(event, false),
    },
  };
}

/**
 * The drawing area, an image named by the field's label and described by its stroke count, whose
 * SVG canvas shows the strokes drawn so far, then Undo stroke and Clear buttons.
 */
export function SignatureSurface({ control, drawing, isEditable, onDraw }: SignatureSurfaceProps) {
  const strings = useUiStrings();
  const strokesId = useId();
  const size = drawing ?? { kind: 'drawn' as const, ...signatureSpace, paths: [] };
  const { paths } = size;
  const { livePath, handlers } = useStrokeCapture(size, {
    isEditable,
    onStroke: (path) => onDraw({ ...size, paths: [...paths, path] }),
  });
  const hasStrokes = paths.length > 0;
  return (
    <>
      <div
        {...hooks.slot('surface', { drawing: livePath !== null })}
        ref={control.ref}
        id={control.id}
        role="img"
        tabIndex={-1}
        aria-label={control['aria-label']}
        aria-labelledby={control['aria-labelledby']}
        aria-describedby={[strokesId, control['aria-describedby']].filter(Boolean).join(' ')}
        aria-invalid={control['aria-invalid']}
      >
        <svg
          {...hooks.slot('canvas')}
          {...handlers}
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
        >
          {[...paths, ...(livePath ? [livePath] : [])].map((path, index) => (
            <path
              key={index}
              {...hooks.slot('stroke')}
              d={path}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <VisuallyHidden id={strokesId} elementType="span">
        {strings.signatureStrokes(paths.length)}
      </VisuallyHidden>
      <div {...hooks.slot('actions')}>
        <Button
          size="sm"
          startIcon="undo"
          isDisabled={!isEditable || !hasStrokes}
          onPress={() => onDraw(paths.length > 1 ? { ...size, paths: paths.slice(0, -1) } : null)}
        >
          {strings.undoStroke}
        </Button>
        <Button
          size="sm"
          startIcon="delete"
          isDisabled={!isEditable || !hasStrokes}
          onPress={() => onDraw(null)}
        >
          {strings.clear}
        </Button>
      </div>
    </>
  );
}

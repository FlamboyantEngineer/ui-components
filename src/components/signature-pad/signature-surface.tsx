'use client';

import { DeleteGlyph, UndoGlyph } from '../../core/glyphs.js';
import { useId, useMemo, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useNativeReset } from '../../utils/use-native-reset.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { Button } from '../button/button.js';
import type { FieldControlProps } from '../field/field.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  formatSignatureStroke,
  signatureSpace,
  type DrawnSignature,
  type SignaturePoint,
} from './signature-path.js';
import { joinIds } from '../../utils/join-ids.js';

interface SignatureSurfaceProps {
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
 * What a stroke is drawn against: the drawing's space and strokes, and the form resets accepted so
 * far. A stroke begun against one drawing never lands on another, even an equal one a reset puts
 * back; an equal drawing given again on an unrelated render keeps the stroke.
 */
function useStrokeOwner(size: DrawnSignature, surface: RefObject<Element | null>): string {
  const [resets, setResets] = useState(0);
  useNativeReset(surface, () => setResets((count) => count + 1));
  return `${resets} ${size.width} ${size.height}\n${size.paths.join('\n')}`;
}

/**
 * Captures one stroke at a time from the primary button of a mouse, a pen or a touch. The pointer
 * is captured, so a stroke that leaves the surface keeps drawing along its edge until release; a
 * cancelled pointer drops the stroke, and so does a change of `owner`: the drawing replaced, reset,
 * restored or cleared while the stroke was under way.
 */
function useStrokeCapture(
  size: DrawnSignature,
  {
    isEditable,
    owner,
    onStroke,
  }: { isEditable: boolean; owner: string; onStroke: (path: string) => void },
) {
  const [livePath, setLivePath] = useState<string | null>(null);
  const add = (event: PointerEvent<SVGSVGElement>, points: SignaturePoint[]) => {
    points.push(toDrawingPoint(event, size));
    setLivePath(formatSignatureStroke(points));
  };
  const handlers = usePointerDrag<SVGSVGElement, SignaturePoint[]>({
    isDisabled: !isEditable,
    resetKey: owner,
    onCancel: () => setLivePath(null),
    onStart: (event) => {
      event.preventDefault();
      const points: SignaturePoint[] = [];
      add(event, points);
      return points;
    },
    onMove: add,
    onEnd: (event, points, isCancelled) => {
      if (!isCancelled) {
        points.push(toDrawingPoint(event, size));
        onStroke(formatSignatureStroke(points));
      }
      setLivePath(null);
    },
  });
  return { livePath, handlers };
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
  const surface = useRef<HTMLDivElement>(null);
  const surfaceRef = useMemo(() => mergeRefs<HTMLDivElement>(control.ref, surface), [control.ref]);
  const { livePath, handlers } = useStrokeCapture(size, {
    isEditable,
    owner: useStrokeOwner(size, surface),
    onStroke: (path) => onDraw({ ...size, paths: [...paths, path] }),
  });
  const hasStrokes = paths.length > 0;
  return (
    <>
      <div
        {...hooks.slot('surface', { drawing: livePath !== null })}
        ref={surfaceRef}
        id={control.id}
        role="img"
        tabIndex={-1}
        aria-label={control['aria-label']}
        aria-labelledby={control['aria-labelledby']}
        aria-describedby={joinIds(strokesId, control['aria-describedby'])}
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
          startIcon={UndoGlyph}
          isDisabled={!isEditable || !hasStrokes}
          onPress={() => onDraw(paths.length > 1 ? { ...size, paths: paths.slice(0, -1) } : null)}
        >
          {strings.undoStroke}
        </Button>
        <Button
          size="sm"
          startIcon={DeleteGlyph}
          isDisabled={!isEditable || !hasStrokes}
          onPress={() => onDraw(null)}
        >
          {strings.clear}
        </Button>
      </div>
    </>
  );
}

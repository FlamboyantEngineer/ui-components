'use client';

import { useLayoutEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { BaseProps, Key } from '../../core/props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { AnnotationContext } from './annotation-context.js';
import { annotationLayerHooks as hooks } from './annotation-hooks.js';
import {
  findAnnotationAt,
  getLayerOrigin,
  isSameMeasurement,
  measureTargets,
  type Annotation,
  type AnnotationRect,
} from './anchor-geometry.js';

export { AnnotationMargin } from './annotation-margin.js';
export type { AnnotationCardState, AnnotationMarginProps } from './annotation-margin.js';
export type { Annotation, AnnotationRect } from './anchor-geometry.js';

export interface AnnotationLayerProps extends BaseProps {
  /** The annotations, each anchored by rectangles or by an element inside the layer. */
  annotations: readonly Annotation[];
  /** The active annotation, controlled; `null` for none. */
  activeId?: Key | null | undefined;
  /** The annotation active at first, uncontrolled. */
  defaultActiveId?: Key | null | undefined;
  /** Called with the annotation that becomes active. */
  onActiveChange?: ((id: Key | null) => void) | undefined;
  /** The annotated content, and usually an `AnnotationMargin` beside it. */
  children?: ReactNode;
}

const noRects: readonly AnnotationRect[] = [];

/**
 * Draws the anchors of annotations over its content as highlight marks: caller rectangles, or the
 * boxes of elements inside it, measured again when the layer resizes. Pressing a mark makes its
 * annotation active; an `AnnotationMargin` inside lays out a card for each annotation.
 */
export function AnnotationLayer({
  annotations,
  activeId,
  defaultActiveId = null,
  onActiveChange,
  children,
  className,
  ...rest
}: AnnotationLayerProps) {
  const [active, setActive] = useControllableState(activeId, defaultActiveId, onActiveChange);
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState<ReadonlyMap<Key, readonly AnnotationRect[]>>(new Map());
  const measure = () => {
    if (!layer) return;
    const next = measureTargets(layer, annotations);
    setMeasured((current) => (isSameMeasurement(current, next) ? current : next));
  };
  useLayoutEffect(measure);
  useResizeObserver([layer], measure);

  const anchors = annotations.map((annotation) => ({
    annotation,
    rects: annotation.rects ?? measured.get(annotation.id) ?? noRects,
  }));
  const onClick = (event: MouseEvent) => {
    if (!layer || (event.target as Element).closest(`.${hooks.slotClass('margin')}`)) return;
    const origin = getLayerOrigin(layer);
    const hit = findAnnotationAt(anchors, {
      x: event.clientX - origin.left,
      y: event.clientY - origin.top,
    });
    if (hit !== null && hit !== active) setActive(hit);
  };

  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest })}
      ref={setLayer}
      style={{ position: 'relative' }}
      onClick={onClick}
    >
      <AnnotationContext value={{ anchors, activeId: active, setActiveId: setActive, layer }}>
        {children}
      </AnnotationContext>
      <div
        {...hooks.slot('marks')}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {anchors.flatMap(({ annotation, rects }) =>
          rects.map((rect, index) => (
            <div
              key={`${toKeyIdentity(annotation.id)}-${index}`}
              {...hooks.slot('mark', { active: annotation.id === active })}
              style={{
                position: 'absolute',
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }}
            />
          )),
        )}
      </div>
    </div>
  );
}

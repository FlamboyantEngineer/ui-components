'use client';

import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { BaseProps, Key } from '../../core/props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useLatest } from '../../utils/use-latest.js';
import { AnnotationContext } from './annotation-context.js';
import { annotationLayerHooks as hooks } from './annotation-hooks.js';
import { observeTargets } from './observe-targets.js';
import {
  findAnnotationAt,
  findTargets,
  getLayerOrigin,
  isSameMeasurement,
  measureTargets,
  type Annotation,
  type AnnotationRect,
} from './anchor-geometry.js';
import { isElement } from '../../utils/is-element.js';

export { AnnotationMargin } from './annotation-margin.js';
export type { AnnotationCardState, AnnotationMarginProps } from './annotation-margin.js';
export type { Annotation, AnnotationRect } from './anchor-geometry.js';

export interface AnnotationLayerProps extends BaseProps {
  /** The annotations, each anchored by rectangles or by an element inside the layer. */
  annotations: readonly Annotation[];
  /** The active annotation, controlled; `null` for none. */
  currentKey?: Key | null | undefined;
  /** The annotation active at first, uncontrolled. */
  defaultCurrentKey?: Key | null | undefined;
  /** Called with the annotation that becomes active. */
  onCurrentKeyChange?: ((id: Key | null) => void) | undefined;
  /** The annotated content, and usually an `AnnotationMargin` beside it. */
  children?: ReactNode;
  /** Measures the target elements again on demand, for layout changes the layer cannot see. */
  handleRef?: Ref<AnnotationLayerHandle> | undefined;
}

/** Measures an `AnnotationLayer`'s target elements again. */
export interface AnnotationLayerHandle {
  /**
   * Measures every target element now. The layer already does after its own renders, content
   * changes, resizes and scrolling inside it; call this after a change that moves a target with
   * none of those, such as a CSS transform or a web font loading.
   */
  remeasure: () => void;
}

/** The layer's own output, which never moves a target: its marks and its margin. */
function isOwnOutput(node: Node): boolean {
  const element = isElement(node) ? node : node.parentElement;
  return element?.closest(`.${hooks.slotClass('marks')}, .${hooks.slotClass('margin')}`) != null;
}

/**
 * The boxes of the layer's target elements, by annotation id, measured after each commit that
 * changes the annotations or the content, and again, at most once a frame, when content inside
 * the layer changes, resizes or scrolls. The layer's own state, such as the active annotation,
 * measures nothing.
 */
function useMeasuredTargets(
  layer: HTMLElement | null,
  annotations: readonly Annotation[],
  content: ReactNode,
) {
  const [measured, setMeasured] = useState<ReadonlyMap<Key, readonly AnnotationRect[]>>(new Map());
  const latest = useLatest({ layer, annotations });
  const remeasure = useCallback(() => {
    const { layer, annotations } = latest.current;
    if (!layer) return;
    const next = measureTargets(layer, annotations);
    setMeasured((current) => (isSameMeasurement(current, next) ? current : next));
  }, [latest]);
  // Measures when the layer, the annotations or the content change, which `remeasure` reads.
  useLayoutEffect(() => remeasure(), [remeasure, layer, annotations, content]);
  useLayoutEffect(() => {
    if (!layer) return;
    const observer = observeTargets(layer, {
      measure: remeasure,
      getTargets: () => findTargets(layer, latest.current.annotations).values(),
      isOwnOutput,
    });
    return observer.disconnect;
  }, [layer, latest, remeasure]);
  return { measured, remeasure };
}

const noRects: readonly AnnotationRect[] = [];

/**
 * Draws the anchors of annotations over its content as highlight marks: caller rectangles, or the
 * boxes of elements inside it, measured again when content inside it changes, resizes or scrolls.
 * Pressing a mark makes its annotation active; an `AnnotationMargin` inside lays out a card for
 * each annotation.
 */
export function AnnotationLayer({
  annotations,
  currentKey,
  defaultCurrentKey = null,
  onCurrentKeyChange,
  children,
  handleRef,
  className,
  ...rest
}: AnnotationLayerProps) {
  const [active, setActive] = useControllableState(
    currentKey,
    defaultCurrentKey,
    onCurrentKeyChange,
  );
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const { measured, remeasure } = useMeasuredTargets(layer, annotations, children);
  useImperativeHandle(handleRef, () => ({ remeasure }), [remeasure]);

  const anchors = useMemo(
    () =>
      annotations.map((annotation) => ({
        annotation,
        rects: annotation.rects ?? measured.get(annotation.id) ?? noRects,
      })),
    [annotations, measured],
  );
  const latestSetActive = useLatest(setActive);
  const setCurrentKey = useCallback(
    (key: Key | null) => latestSetActive.current(key),
    [latestSetActive],
  );
  const context = useMemo(
    () => ({ anchors, currentKey: active, setCurrentKey, layer }),
    [anchors, active, setCurrentKey, layer],
  );
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
      <AnnotationContext value={context}>{children}</AnnotationContext>
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

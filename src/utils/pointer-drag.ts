import type { Orientation } from '../core/props.js';

const armedElements = new WeakMap<Element, () => void>();

/** Captures the gesture's pointer on its element, including when a drag starts after a threshold. */
export function capturePointer(event: { currentTarget: Element; pointerId: number }): void {
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

/** Releases a capture only while the element still owns it. */
export function releasePointer(element: Element, pointerId: number): void {
  if (element.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId);
}

/** The half of an item under a local point, in reading order along the collection's axis. */
export function resolveDropPosition(options: {
  width: number;
  height: number;
  x: number;
  y: number;
  orientation: Orientation;
  isRtl: boolean;
}): 'before' | 'after' {
  const { width, height, x, y, orientation, isRtl } = options;
  const before = orientation === 'vertical' ? y < height / 2 : x < width / 2 !== isRtl;
  return before ? 'before' : 'after';
}

/** Listens outside an uncaptured gesture's element, in that element's own document. */
export function listenPointerRelease(options: {
  element: Element;
  pointerId?: number | undefined;
  onRelease: () => void;
  onCancel?: (() => void) | undefined;
}): () => void {
  const { element, pointerId, onRelease, onCancel } = options;
  const document = element.ownerDocument;
  const stop = () => {
    document.removeEventListener('pointerup', release, true);
    document.removeEventListener('pointercancel', cancel, true);
  };
  const finish = (event: PointerEvent, callback: () => void) => {
    if (pointerId !== undefined && pointerId !== event.pointerId) return;
    stop();
    callback();
  };
  const release = (event: PointerEvent) => finish(event, onRelease);
  const cancel = (event: PointerEvent) => finish(event, onCancel ?? onRelease);
  document.addEventListener('pointerup', release, true);
  if (onCancel) document.addEventListener('pointercancel', cancel, true);
  return stop;
}

/**
 * Arms a native drag until the press or drag ends, sharing cleanup across handle-driven rows. A
 * native drag cancels its pointer stream as it starts, so a cancellation disarms only once the
 * task that cancelled has passed without the element's drag starting.
 */
export function armElementDrag(element: Element): void {
  armedElements.get(element)?.();
  const view = element.ownerDocument.defaultView;
  let isDragging = false;
  let timer: number | undefined;
  const disarm = () => {
    element.removeAttribute('draggable');
    stop();
    view?.clearTimeout(timer);
    element.removeEventListener('dragstart', start);
    element.removeEventListener('dragend', disarm);
    armedElements.delete(element);
  };
  const start = () => {
    isDragging = true;
  };
  const onCancel = () => {
    if (isDragging) return;
    if (!view) return disarm();
    timer = view.setTimeout(() => {
      if (!isDragging) disarm();
    }, 0);
  };
  const stop = listenPointerRelease({ element, onRelease: disarm, onCancel });
  element.setAttribute('draggable', 'true');
  armedElements.set(element, disarm);
  element.addEventListener('dragstart', start);
  element.addEventListener('dragend', disarm);
}

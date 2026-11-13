// Cuts a target element's boxes to what the scrolling or clipping elements around it let show.

import { measureScale } from '../../utils/element-scale.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { getOwnerWindow } from '../../utils/owner-window.js';

/** A rectangle in viewport pixels. */
interface ViewportBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** The viewport edges an element clips its content to, per axis; unbounded on a visible axis. */
interface Clip {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/**
 * The area inside an element's border and scrollbars, in viewport pixels, on each axis it clips:
 * any `overflow` other than `visible`. `null` when it clips neither.
 */
function toClip(element: HTMLElement): Clip | null {
  const style = getOwnerWindow(element).getComputedStyle(element);
  const clipsX = style.overflowX !== 'visible';
  const clipsY = style.overflowY !== 'visible';
  if (!clipsX && !clipsY) return null;
  const box = element.getBoundingClientRect();
  const { x: scaleX, y: scaleY } = measureScale(element);
  const left = box.left + element.clientLeft * scaleX;
  const top = box.top + element.clientTop * scaleY;
  return {
    left: clipsX ? left : -Infinity,
    right: clipsX ? left + element.clientWidth * scaleX : Infinity,
    top: clipsY ? top : -Infinity,
    bottom: clipsY ? top + element.clientHeight * scaleY : Infinity,
  };
}

/** The clips of the elements between `target` and `layer`, both left out. */
function collectClips(target: Element, layer: Element): Clip[] {
  const clips: Clip[] = [];
  for (let node = target.parentElement; node && node !== layer; node = node.parentElement) {
    const clip = isHTMLElement(node) ? toClip(node) : null;
    if (clip) clips.push(clip);
  }
  return clips;
}

/** `box` cut to `clip`, or `null` when nothing of it shows. */
function intersect(box: ViewportBox, clip: Clip): ViewportBox | null {
  const left = Math.max(box.left, clip.left);
  const top = Math.max(box.top, clip.top);
  const right = Math.min(box.left + box.width, clip.right);
  const bottom = Math.min(box.top + box.height, clip.bottom);
  return right > left && bottom > top
    ? { left, top, width: right - left, height: bottom - top }
    : null;
}

/**
 * The visible parts of `target`'s viewport boxes: each cut to every element between the target and
 * the layer that clips it; boxes nothing of which shows are left out.
 */
export function clipToAncestors(
  boxes: readonly ViewportBox[],
  target: Element,
  layer: Element,
): ViewportBox[] {
  const clips = collectClips(target, layer);
  if (clips.length === 0) return [...boxes];
  return boxes.flatMap((box) => {
    let visible: ViewportBox | null = box;
    for (const clip of clips) visible = visible && intersect(visible, clip);
    return visible ? [visible] : [];
  });
}

import { findMaximum } from '../../utils/find-maximum.js';
import { useMemo, useState, type Ref, type RefCallback } from 'react';
import { mergeRefs } from '../../utils/merge-props.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useWidestTextWidth } from '../../utils/use-widest-text-width.js';

interface ChartFrame {
  /** The drawing width: the frame's measured width, or 480 pixels before it is measured. */
  width: number;
  /** The frame element, once mounted. */
  element: HTMLDivElement | null;
  /** The ref to put on the frame, which also hands it to the caller's ref. */
  frameRef: RefCallback<HTMLDivElement>;
}

/** The drawing width before the frame is measured, in pixels. */
const defaultWidth = 480;
/** The width of a label character when no canvas can measure text, in pixels. */
const fallbackCharacterWidth = 7;
/** Room between the widest label and the plotted area: the tick mark and its gap. */
const labelRoom = 12;

/** The chart frame's element and width, which the drawing follows. */
export function useChartFrame(ref: Ref<HTMLDivElement> | undefined): ChartFrame {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const frameRef = useMemo(() => mergeRefs(ref, setElement), [ref]);
  const size = useElementSize(element);
  const width = size && size.width > 0 ? Math.floor(size.width) : defaultWidth;
  return { width, element, frameRef };
}

/**
 * The margin that fits the widest of `labels` beside an axis, measured in the frame's font, or
 * estimated from the longest label where text cannot be measured.
 */
export function useLabelMargin(element: Element | null, labels: readonly string[]): number {
  const target = useMemo(() => ({ current: element }), [element]);
  const measured = useWidestTextWidth(target, labels);
  const widest =
    measured ?? findMaximum(labels, (label) => label.length, 0) * fallbackCharacterWidth;
  return widest + labelRoom;
}

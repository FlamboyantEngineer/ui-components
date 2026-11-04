'use client';

import { useLayoutEffect, useState } from 'react';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import type { SequenceMeasurements } from './sequence-layout.js';
import { hooks } from './state-machine-view-hooks.js';

type Sizes = SequenceMeasurements['labels'];

function equalSizes(a: Sizes, b: Sizes): boolean {
  return (
    a.size === b.size &&
    [...a].every(([key, size]) => {
      const other = b.get(key);
      return (
        other &&
        Math.abs(size.width - other.width) < 0.1 &&
        Math.abs(size.height - other.height) < 0.1
      );
    })
  );
}

function readStatePadding(element: HTMLElement): { width: number; height: number } {
  const button = element.querySelector(`.${hooks.slotClass('state')}`);
  const style = button ? element.ownerDocument.defaultView?.getComputedStyle(button) : null;
  const read = (value: string | undefined) => parseFloat(value ?? '') || 0;
  return {
    width: 32 + read(style?.paddingLeft) + read(style?.paddingRight),
    height:
      read(style?.paddingTop) +
      read(style?.paddingBottom) +
      read(style?.borderTopWidth) +
      read(style?.borderBottomWidth),
  };
}

function readSizes(root: HTMLElement, states: boolean): Sizes {
  const sizes = new Map<string, { width: number; height: number }>();
  const selector = hooks.slotClass(states ? 'state-position' : 'transition-label');
  for (const element of root.querySelectorAll<HTMLElement>(`.${selector}`)) {
    const key = element.getAttribute('data-key');
    const label = states
      ? element.querySelector<HTMLElement>(`.${hooks.slotClass('state-content')}`)
      : element;
    if (!key || !label) continue;
    const rect = label.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const padding = states ? readStatePadding(element) : { width: 0, height: 0 };
    sizes.set(key, {
      width: Math.max(rect.width, label.scrollWidth) + padding.width,
      height: rect.height + padding.height,
    });
  }
  return sizes;
}

/** Measures committed label content and its own viewport, including container-only resizes. */
export function useSequenceMeasurements(root: HTMLDivElement | null): SequenceMeasurements {
  const [measurements, setMeasurements] = useState<SequenceMeasurements>(() => ({
    viewportWidth: 0,
    states: new Map(),
    labels: new Map(),
  }));
  const measure = () => {
    if (!root) return;
    const next = {
      viewportWidth: root.clientWidth,
      states: readSizes(root, true),
      labels: readSizes(root, false),
    };
    setMeasurements((previous) =>
      previous.viewportWidth === next.viewportWidth &&
      equalSizes(previous.states, next.states) &&
      equalSizes(previous.labels, next.labels)
        ? previous
        : next,
    );
  };
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intrinsic content sizes exist only after the DOM commits.
    measure();
  });
  useResizeObserver(
    () =>
      root
        ? [
            root,
            ...root.querySelectorAll(
              `.${hooks.slotClass('state-content')}, .${hooks.slotClass('transition-label')}`,
            ),
          ]
        : [],
    measure,
  );
  return measurements;
}

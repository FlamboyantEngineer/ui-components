'use client';

import { type KeyboardEvent, useId, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { Button } from '../button/button.js';
import { defaultZoomLevels, findNextZoomLevel, ZoomControl } from '../zoom-control/index.js';
import { clampHotspotRect, fitImage, type HotspotRect } from './hotspot-layout.js';
import { useCentredZoom } from './use-centred-zoom.js';

/** One pressable area of the image. */
export interface ImageHotspotsItem extends HotspotRect {
  /** Stable key, unique among the hotspots, passed to `onAction` when the hotspot is pressed. */
  id: Key;
  /** The hotspot's accessible name. */
  label: string;
  /** Pressed state of a toggle hotspot (`aria-pressed`). Left out, the hotspot is a plain button. */
  isPressed?: boolean | undefined;
  /** Refuses presses; the hotspot stays focusable so its message can be read. */
  isDisabled?: boolean | undefined;
  /** Advisory tone, published as `data-tone`. */
  tone?: Tone | undefined;
  /** Advisory text shown beside the hotspot and given as its description. */
  message?: string | undefined;
}

export interface ImageHotspotsProps
  extends BaseProps, RefProps<HTMLDivElement>, Omit<AriaLabellingProps, 'aria-describedby'> {
  /** The image's address. A new one loads in place, with the hotspots given beside it. */
  src: string;
  /** What the image shows, in words. An empty string marks it decorative. */
  alt: string;
  /** The image's intrinsic width in pixels, which hotspot percentages refer to. */
  width: number;
  /** The image's intrinsic height in pixels, which hotspot percentages refer to. */
  height: number;
  /** The hotspots, in focus order; a later one draws over an earlier one it overlaps. */
  hotspots: readonly ImageHotspotsItem[];
  /** Called with the key of a pressed hotspot; the caller updates its own state. */
  onAction?: ((id: Key) => void) | undefined;
  /** The zoom in percent of the fitted size, controlled. */
  zoom?: number | undefined;
  /** The starting zoom in percent of the fitted size, uncontrolled. Defaults to `100`. */
  defaultZoom?: number | undefined;
  /** Called with each zoom the reader asks for, from the zoom control or the keys. */
  onZoomChange?: ((zoom: number) => void) | undefined;
  /** Adds a reset button to the zoom control that returns to 100%. */
  showZoomReset?: boolean | undefined;
}

type ImageStatus = 'loading' | 'loaded' | 'error';

const hooks = createHooks('image-hotspots', [
  'zoom',
  'viewport',
  'canvas',
  'image',
  'error',
  'hotspot',
  'message',
]);

/** The zoom a key asks for: `+` or `=` zooms in, `-` out, with no modifier held. */
function toZoomStep(event: KeyboardEvent): 1 | -1 | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.key === '+' || event.key === '=') return 1;
  return event.key === '-' ? -1 : null;
}

/** Positions on the canvas in percent, so they follow the image at every drawn size. */
function toPercentBox(rect: HotspotRect) {
  return {
    position: 'absolute',
    left: `${rect.x}%`,
    top: `${rect.y}%`,
    width: `${rect.width}%`,
    height: `${rect.height}%`,
  } as const;
}

/** One hotspot button, and its advisory message under its rectangle. */
function Hotspot({
  hotspot,
  onAction,
}: {
  hotspot: ImageHotspotsItem;
  onAction: ((id: Key) => void) | undefined;
}) {
  const messageId = useId();
  const rect = clampHotspotRect(hotspot);
  const hasMessage = Boolean(hotspot.message?.trim());
  return (
    <>
      <Button
        {...hooks.slot('hotspot', { tone: hotspot.tone })}
        variant="bare"
        content="parts"
        aria-label={hotspot.label}
        aria-describedby={hasMessage ? messageId : undefined}
        aria-pressed={hotspot.isPressed}
        isSelected={hotspot.isPressed}
        isDisabled={hotspot.isDisabled}
        focusableWhenDisabled
        onPress={() => onAction?.(hotspot.id)}
        render={(props) => <button {...props} style={toPercentBox(rect)} />}
      />
      {hasMessage ? (
        <span
          {...hooks.slot('message', { tone: hotspot.tone })}
          id={messageId}
          style={{ position: 'absolute', left: `${rect.x}%`, top: `${rect.y + rect.height}%` }}
        >
          {hotspot.message}
        </span>
      ) : null}
    </>
  );
}

/** The load status of the image at `src`; a new address starts loading again. */
function useImageStatus(src: string) {
  const [settled, setSettled] = useState<{ src: string; status: ImageStatus } | null>(null);
  const status: ImageStatus = settled?.src === src ? settled.status : 'loading';
  return {
    status,
    settle: (next: Exclude<ImageStatus, 'loading'>) => setSettled({ src, status: next }),
  };
}

/**
 * An image the reader zooms and scrolls, with rectangular hotspot buttons placed in percent of its
 * intrinsic size, so they stay on their parts of the image at every zoom and viewport size. Pressing
 * a hotspot passes its key to `onAction`; the caller holds every pressed, disabled and advisory
 * state, so several hotspots can show the same state.
 */
export function ImageHotspots({
  src,
  alt,
  width,
  height,
  hotspots,
  onAction,
  zoom: givenZoom,
  defaultZoom = 100,
  onZoomChange,
  showZoomReset = false,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-details': ariaDetails,
  ...rest
}: ImageHotspotsProps) {
  const strings = useUiStrings();
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewport = useElementSize(viewportRef, { box: 'client' });
  const [zoom, setZoom] = useControllableState(givenZoom, defaultZoom, onZoomChange);
  const image = useImageStatus(src);
  const drawn = fitImage({ width, height, viewport, zoom });
  useCentredZoom(viewportRef, drawn.width);
  const onKeyDown = (event: KeyboardEvent) => {
    const step = toZoomStep(event);
    if (step === null) return;
    event.preventDefault();
    const next = findNextZoomLevel(defaultZoomLevels, zoom, step);
    if (next !== undefined) setZoom(next);
  };
  return (
    <div {...rest} {...hooks.root({ className, props: rest, data: { status: image.status } })}>
      <ZoomControl
        className={hooks.slotClass('zoom')}
        value={zoom}
        onChange={setZoom}
        resetValue={showZoomReset ? 100 : undefined}
        zoomsOnWheel={false}
      />
      <div
        {...hooks.slot('viewport')}
        ref={viewportRef}
        role="group"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-details={ariaDetails}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div
          {...hooks.slot('canvas')}
          style={{ position: 'relative', width: drawn.width, height: drawn.height }}
        >
          <img
            key={src}
            {...hooks.slot('image')}
            src={src}
            alt={alt}
            draggable={false}
            onLoad={() => image.settle('loaded')}
            onError={() => image.settle('error')}
            style={{ width: '100%', height: '100%' }}
          />
          {image.status === 'error' ? (
            <span {...hooks.slot('error')} role="alert">
              {strings.imageLoadFailed(alt.trim() || src)}
            </span>
          ) : null}
          {hotspots.map((hotspot) => (
            <Hotspot key={hotspot.id} hotspot={hotspot} onAction={onAction} />
          ))}
        </div>
      </div>
    </div>
  );
}

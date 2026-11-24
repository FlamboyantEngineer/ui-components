'use client';

import { type KeyboardEvent, useId, useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { layoutMedia } from '../../utils/layout-media.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useImageLoading } from '../../utils/use-image-loading.js';
import { useZoomViewport } from '../../utils/use-zoom-viewport.js';
import { Button } from '../button/button.js';
import { defaultZoomLevels, findNextZoomLevel, ZoomControl } from '../zoom-control/index.js';
import { clampHotspotRect, type HotspotRect } from './hotspot-layout.js';

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
  /**
   * The wheel over the viewport, and a touchpad pinch, step the zoom through its levels instead of
   * scrolling, keeping the point under the pointer in place.
   */
  zoomsOnWheel?: boolean | undefined;
}

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

/**
 * The surface's zoom over the shared zoomable viewport: the canvas size for the zoom, the `+` and
 * `-` keys and, with `zoomsOnWheel`, the wheel.
 */
function useSurfaceZoom(
  options: Pick<ImageHotspotsProps, 'zoom' | 'defaultZoom' | 'onZoomChange' | 'zoomsOnWheel'> & {
    natural: { width: number; height: number };
  },
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  // Scrollbars from a zoomed canvas must leave its fit unchanged.
  const stage = useElementSize(viewportRef, { box: 'scrollbar-free' }) ?? { width: 0, height: 0 };
  const [zoom, setZoom] = useControllableState(
    options.zoom,
    options.defaultZoom ?? 100,
    options.onZoomChange,
  );
  const { canvas } = layoutMedia({ natural: options.natural, stage, zoom, rotation: 0 });
  const step = (direction: 1 | -1) => {
    const next = findNextZoomLevel(defaultZoomLevels, zoom, direction);
    if (next !== undefined) setZoom(next);
    return next;
  };
  useZoomViewport({
    viewportRef,
    canvasRef,
    zoom,
    onStep: options.zoomsOnWheel ? step : undefined,
    isReady: true,
  });
  const onKeyDown = (event: KeyboardEvent) => {
    const direction = toZoomStep(event);
    if (direction === null) return;
    event.preventDefault();
    step(direction);
  };
  return { viewportRef, canvasRef, zoom, setZoom, canvas, onKeyDown };
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
  defaultZoom,
  onZoomChange,
  showZoomReset = false,
  zoomsOnWheel = false,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-details': ariaDetails,
  ...rest
}: ImageHotspotsProps) {
  const strings = useUiStrings();
  const { viewportRef, canvasRef, zoom, setZoom, canvas, onKeyDown } = useSurfaceZoom({
    natural: { width, height },
    zoom: givenZoom,
    defaultZoom,
    onZoomChange,
    zoomsOnWheel,
  });
  const { imageRef, generation, settle, status: loading } = useImageLoading([src.trim()]);
  const status = loading === 'idle' ? 'error' : loading;
  return (
    <div {...rest} {...hooks.root({ className, props: rest, data: { status } })}>
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
          ref={canvasRef}
          style={{ position: 'relative', width: canvas.width, height: canvas.height }}
        >
          <img
            // A new element per request, so events of a departed image never reach the handlers.
            key={generation}
            {...hooks.slot('image')}
            ref={imageRef}
            src={src}
            alt={alt}
            draggable={false}
            onLoad={() => settle('loaded')}
            onError={() => settle('error')}
            style={{ width: '100%', height: '100%' }}
          />
          {status === 'error' ? (
            <span {...hooks.slot('error')} role="alert">
              {strings.imageLoadFailed(alt.trim() || src)}
            </span>
          ) : null}
          {hotspots.map((hotspot) => (
            <Hotspot key={toKeyIdentity(hotspot.id)} hotspot={hotspot} onAction={onAction} />
          ))}
        </div>
      </div>
    </div>
  );
}

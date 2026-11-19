'use client';

import {
  createContext,
  type FocusEvent,
  type KeyboardEvent,
  useContext,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { isNode } from '../../utils/is-element.js';
import { canvasViewportHooks as hooks } from './canvas-viewport-hooks.js';
import { CanvasViewportSurface } from './canvas-viewport-surface.js';
import type { CanvasViewportController, CanvasViewportProps } from './canvas-viewport-types.js';
import { useCanvasCamera } from './use-canvas-camera.js';
import { CanvasConnectionContext, useCanvasConnection } from './use-canvas-connection.js';
import { useCanvasPointer } from './use-canvas-pointer.js';

// Compositions with their own markup hooks and camera commands share these internals.
export { CanvasViewportSurface } from './canvas-viewport-surface.js';
export { useCanvasCamera } from './use-canvas-camera.js';
export { useCanvasPointer } from './use-canvas-pointer.js';

const CanvasViewportContext = createContext<CanvasViewportController | null>(null);

function getCanvasFocusProps(stepZoom: (direction: 1 | -1) => void, cancelKeyboard: () => boolean) {
  return {
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape' && cancelKeyboard()) event.preventDefault();
      if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey)
        return;
      if (event.key === '+' || event.key === '=') stepZoom(1);
      else if (event.key === '-') stepZoom(-1);
      else return;
      event.preventDefault();
    },
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      if (!isNode(event.relatedTarget) || !event.currentTarget.contains(event.relatedTarget))
        cancelKeyboard();
    },
  };
}

/** Provides the surrounding viewport's coordinate and gesture API. */
export function useCanvasViewport(): CanvasViewportController {
  const controller = useContext(CanvasViewportContext);
  if (!controller) throw new Error('useCanvasViewport requires a CanvasViewport');
  return controller;
}

/** A pan and zoom surface with caller-rendered SVG and HTML layers. */
export function CanvasViewport({
  canConnect,
  className,
  children,
  controls,
  controllerRef,
  viewport: viewportProp,
  defaultViewport,
  gesturePolicy,
  onViewportChange,
  onConnect,
  onConnectionPreview,
  ...rest
}: CanvasViewportProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const { camera, viewport, setViewport, stepZoom, revealElement } = useCanvasCamera(element, {
    viewport: viewportProp,
    defaultViewport,
    onViewportChange,
    zoomsOnWheel: gesturePolicy?.wheel === 'zoom',
  });
  const { connections, cancelKeyboard } = useCanvasConnection({
    canConnect,
    onConnect,
    onConnectionPreview,
  });
  const { claimGesture, pointerProps } = useCanvasPointer({
    element,
    camera,
    setViewport,
    panButton: gesturePolicy?.panButton,
    onStart: cancelKeyboard,
  });
  const controller = useMemo(() => ({ ...camera, claimGesture }), [camera, claimGesture]);
  useImperativeHandle(controllerRef, () => controller, [controller]);
  return (
    <CanvasViewportContext value={controller}>
      <CanvasConnectionContext value={connections}>
        <div
          {...rest}
          {...hooks.root({ className, props: rest })}
          role="group"
          tabIndex={0}
          style={{ position: 'relative' }}
          {...getCanvasFocusProps(stepZoom, cancelKeyboard)}
        >
          <CanvasViewportSurface
            viewport={viewport}
            surfaceProps={{
              ...hooks.slot('surface'),
              ...pointerProps,
              ref: setElement,
              style: { position: 'absolute', inset: 0 },
              onFocus: (event) => {
                if (
                  event.currentTarget.contains(event.target) &&
                  event.target.matches(':focus-visible')
                )
                  revealElement(event.target);
              },
            }}
            worldClassName={hooks.slotClass('world')}
            worldStyle={{ right: 0, bottom: 0 }}
          >
            {children}
          </CanvasViewportSurface>
          {controls != null ? <div {...hooks.slot('controls')}>{controls}</div> : null}
        </div>
      </CanvasConnectionContext>
    </CanvasViewportContext>
  );
}

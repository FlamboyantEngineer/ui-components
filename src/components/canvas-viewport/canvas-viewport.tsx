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
import type { CanvasViewportController, CanvasViewportProps } from './canvas-viewport-types.js';
import { useCanvasCamera } from './use-canvas-camera.js';
import { CanvasConnectionContext, useCanvasConnection } from './use-canvas-connection.js';
import { useCanvasPointer } from './use-canvas-pointer.js';

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
  className,
  children,
  controls,
  controllerRef,
  viewport: viewportProp,
  defaultViewport,
  onViewportChange,
  onConnect,
  onConnectionPreview,
  ...rest
}: CanvasViewportProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const { camera, viewport, setViewport, stepZoom, reveal } = useCanvasCamera(element, {
    viewport: viewportProp,
    defaultViewport,
    onViewportChange,
  });
  const { connections, cancelKeyboard } = useCanvasConnection({ onConnect, onConnectionPreview });
  const { claimGesture, pointerProps } = useCanvasPointer({
    element,
    camera,
    setViewport,
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
          <div
            {...hooks.slot('surface')}
            {...pointerProps}
            ref={setElement}
            style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
            onFocus={(event) => {
              if (
                event.currentTarget.contains(event.target) &&
                event.target.matches(':focus-visible')
              )
                reveal(event.target);
            }}
          >
            <div
              {...hooks.slot('world')}
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '0 0',
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom / 100})`,
              }}
            >
              {children}
            </div>
          </div>
          {controls != null ? <div {...hooks.slot('controls')}>{controls}</div> : null}
        </div>
      </CanvasConnectionContext>
    </CanvasViewportContext>
  );
}

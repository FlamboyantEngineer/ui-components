'use client';

import { createContext, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import type { CanvasPoint } from '../../utils/canvas-transform.js';

export interface CanvasElementProps extends BaseProps, RefProps<SVGGElement> {
  /** Unique in the scene. Use the same identity as the React key when rendering a list. */
  elementId: Key;
  /** Origin in its parent's coordinates, or in world coordinates at the top level. */
  position: CanvasPoint;
  children: ReactNode;
}

export const CanvasElementContext = createContext<Key | null>(null);
const hooks = createHooks('canvas-element');

/** A translated SVG group whose nested elements and anchors share its local coordinates. */
export function CanvasElement({
  elementId,
  position,
  children,
  className,
  ...rest
}: CanvasElementProps) {
  return (
    <g
      {...rest}
      {...hooks.root({ className, props: rest })}
      transform={`translate(${position.x} ${position.y})`}
    >
      <CanvasElementContext value={elementId}>{children}</CanvasElementContext>
    </g>
  );
}

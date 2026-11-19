import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';
import type { CanvasViewportState } from '../../utils/canvas-transform.js';

interface CanvasViewportSurfaceProps {
  viewport: CanvasViewportState;
  surfaceProps: ComponentPropsWithRef<'div'>;
  worldClassName: string;
  worldStyle?: CSSProperties | undefined;
  children: ReactNode;
  overlays?: ReactNode;
}

/** The shared viewport DOM and transform, with hooks supplied by the composing component. */
export function CanvasViewportSurface({
  viewport,
  surfaceProps,
  worldClassName,
  worldStyle,
  children,
  overlays,
}: CanvasViewportSurfaceProps) {
  return (
    <div
      {...surfaceProps}
      style={{ position: 'relative', touchAction: 'none', ...surfaceProps.style }}
    >
      <div
        className={worldClassName}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          ...worldStyle,
          transformOrigin: '0 0',
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom / 100})`,
        }}
      >
        {children}
      </div>
      {overlays}
    </div>
  );
}

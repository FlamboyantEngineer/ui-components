import type { PointerEvent, ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, ContainerProps, Key, RefProps } from '../../core/props.js';
import type {
  CanvasBounds,
  CanvasPoint,
  CanvasViewportState,
} from '../../utils/canvas-transform.js';

export interface CanvasGesturePosition {
  /** The starting point in world coordinates at the time of the press. */
  start: CanvasPoint;
  /** The pointer in the current world coordinates. */
  point: CanvasPoint;
  /** The pointer in client coordinates. */
  client: CanvasPoint;
}

export interface CanvasGesture {
  /** Called on each move while the claim is active. */
  onPreview?: ((position: CanvasGesturePosition) => void) | undefined;
  /** Called once with the release position. */
  onCommit: (position: CanvasGesturePosition) => void;
  /** Clears the preview when the gesture is abandoned. */
  onCancel: () => void;
}

export interface CanvasViewportController {
  /** Reads the camera currently drawn. */
  getViewport: () => CanvasViewportState;
  /** Converts a client point in the viewport's document to world coordinates. */
  clientToWorld: (point: CanvasPoint) => CanvasPoint;
  /** Converts a world point to client coordinates in the viewport's document. */
  worldToClient: (point: CanvasPoint) => CanvasPoint;
  /** Reads the visible world rectangle, or null before the viewport has room. */
  getVisibleWorldBounds: () => CanvasBounds | null;
  /** Centres these bounds with padding in layout pixels. */
  fitToBounds: (bounds: CanvasBounds, padding?: number) => void;
  /** Zooms to a percentage around a client point, or the viewport centre. */
  zoomTo: (zoom: number, client?: CanvasPoint) => void;
  /** Claims the primary pointer press from a scene item's onPointerDown. */
  claimGesture: (event: PointerEvent<Element>, gesture: CanvasGesture) => boolean;
}

export interface CanvasAnchorEndpoint {
  elementId: Key;
  anchorId: string;
}

export interface CanvasConnection {
  source: CanvasAnchorEndpoint;
  target: CanvasAnchorEndpoint;
}

export interface CanvasConnectionPreview {
  source: CanvasAnchorEndpoint;
  target: CanvasAnchorEndpoint | null;
  /** The current world point for a pointer preview, or null for a keyboard preview. */
  point: CanvasPoint | null;
}

export interface CanvasViewportProps
  extends
    BaseProps,
    AriaLabellingProps,
    RefProps<HTMLDivElement>,
    Pick<ContainerProps<'div'>, 'onContextMenu'> {
  /** World layers in drawing order. The caller can combine SVG and HTML. */
  children: ReactNode;
  /** Untransformed controls above the scene. */
  controls?: ReactNode;
  /** Camera controlled by the caller. */
  viewport?: CanvasViewportState | undefined;
  /** Initial uncontrolled camera. Defaults to the origin at 100%. */
  defaultViewport?: CanvasViewportState | undefined;
  /** Called with each requested camera change. */
  onViewportChange?: ((viewport: CanvasViewportState) => void) | undefined;
  /** Access to the viewport from outside the scene. */
  controllerRef?: Ref<CanvasViewportController> | undefined;
  /** Reports a connection attempt for the caller to validate and commit. */
  onConnect?: ((connection: CanvasConnection) => void) | undefined;
  /** Reports a connection preview, or null when it ends or is abandoned. */
  onConnectionPreview?: ((preview: CanvasConnectionPreview | null) => void) | undefined;
}

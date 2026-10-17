export { clamp } from './clamp.js';
export { withStableOccurrenceKeys } from './stable-keys.js';
export type { KeyedValue } from './stable-keys.js';
export { copyRichText, copyText } from './clipboard.js';
export type { ClipboardWriter, CopyOptions, RichCopyOptions, RichCopyResult } from './clipboard.js';
export { DOWNLOAD_URL_LIFETIME, downloadBlob, downloadUrl } from './download.js';
export {
  DEFAULT_OVERLAY_GAP,
  DEFAULT_OVERLAY_GUTTER,
  DEFAULT_SUBMENU_OVERLAP,
  findOverlayScrollContainer,
  getOverlayBoundary,
  isSameOverlayGeometry,
  overlayPointRect,
  resolveOverlayGeometry,
  resolveOverlayPlacement,
  resolveSubmenuPlacement,
  toOverlayRect,
} from './overlay-position.js';
export type {
  OverlayAlign,
  OverlayBoundary,
  OverlayGeometry,
  OverlayGeometryOptions,
  OverlayMode,
  OverlayOffsetParent,
  OverlayPlacement,
  OverlayPlacementInput,
  OverlayRect,
  OverlaySide,
  OverlaySize,
  SubmenuDirection,
  SubmenuPlacement,
  SubmenuPlacementInput,
  SubmenuSide,
} from './overlay-position.js';

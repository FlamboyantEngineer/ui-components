import type { PointerEvent } from 'react';

/**
 * Ends the press React Aria starts on a disabled button: browsers send it pointer events but no
 * click, so the press would otherwise last and swallow the first press once it is enabled.
 */
function endDisabledPress(event: PointerEvent<HTMLButtonElement>) {
  const { currentTarget, pointerId, pointerType } = event;
  const view = currentTarget.ownerDocument.defaultView;
  if (!view) return;
  currentTarget.dispatchEvent(
    new view.PointerEvent('pointercancel', { bubbles: true, pointerId, pointerType }),
  );
}

/** The handler a natively disabled button adds to end React Aria's press on release. */
export function toDisabledPressProps(isDisabled: boolean) {
  return isDisabled ? { onPointerUp: endDisabledPress } : {};
}

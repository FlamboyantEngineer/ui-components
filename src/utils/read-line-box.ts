/** An element's line height and the vertical space around its lines, in pixels. */
interface LineBox {
  /** Its line height: its own, else 1.2 times its font size, else 16. */
  lineHeight: number;
  /** Its top and bottom padding. */
  padding: number;
  /** What its `height` holds beside its content: padding and border under `border-box`, else 0. */
  frame: number;
}

function toPixels(value: string): number {
  return Number.parseFloat(value) || 0;
}

/**
 * The line box of a text input, from its computed style, for sizing it in rows of its own line
 * height; `null` outside a window.
 */
export function readLineBox(element: Element): LineBox | null {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (!style) return null;
  const lineHeight = toPixels(style.lineHeight) || toPixels(style.fontSize) * 1.2 || 16;
  const padding = toPixels(style.paddingTop) + toPixels(style.paddingBottom);
  const border = toPixels(style.borderTopWidth) + toPixels(style.borderBottomWidth);
  const frame = style.boxSizing === 'border-box' ? padding + border : 0;
  return { lineHeight, padding, frame };
}

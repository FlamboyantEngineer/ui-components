import { afterEach, describe, expect, it } from 'vitest';
import { getDeepActiveElement, isFocusableElement, isFocused } from './focus-target.js';

/** A same-origin frame with a button, appended to the page. */
function createFrame() {
  const frame = document.body.appendChild(document.createElement('iframe'));
  const inner = frame.contentDocument?.body;
  if (!inner) throw new Error('No frame document');
  const button = inner.appendChild(inner.ownerDocument.createElement('button'));
  return { frame, button };
}

describe('focus targets', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('UIC-FOCUS-SCOPE-2.7 recognizes elements of a frame that instanceof misses', () => {
    const { button } = createFrame();
    expect(button instanceof HTMLElement).toBe(false);
    expect(isFocusableElement(button)).toBe(true);
    expect(isFocusableElement(button.ownerDocument.createTextNode('text'))).toBe(false);
    expect(isFocusableElement(null)).toBe(false);
    expect(isFocusableElement({ focus() {} })).toBe(false);
  });

  it('UIC-MODAL-3.4 follows focus into a same-origin frame', () => {
    const outside = document.body.appendChild(document.createElement('button'));
    const { frame, button } = createFrame();
    outside.focus();
    expect(getDeepActiveElement()).toBe(outside);
    frame.focus();
    button.focus();
    expect(frame).toHaveFocus();
    expect(getDeepActiveElement()).toBe(button);
  });
  it('UIC-FOCUS-SCOPE-2.8 follows focus into open shadow roots, also through a frame', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = shadow.appendChild(document.createElement('button'));
    const other = shadow.appendChild(document.createElement('button'));
    inner.focus();
    expect(host).toHaveFocus();
    expect(getDeepActiveElement()).toBe(inner);
    expect(isFocused(inner)).toBe(true);
    expect(isFocused(other)).toBe(false);
    expect(isFocused(host)).toBe(false);
    const root = inner.getRootNode();
    inner.remove();
    expect(isFocused(inner)).toBe(false);
    expect(isFocused(null)).toBe(false);
    expect(root).toBe(shadow);
  });
});

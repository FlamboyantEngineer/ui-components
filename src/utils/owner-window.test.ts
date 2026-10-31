import { afterEach, describe, expect, it } from 'vitest';
import { getElementByIdFrom, getOwnerDocument, getOwnerWindow } from './owner-window.js';

function frameWindow(): Window {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const view = frame.contentWindow;
  if (!view) throw new Error('The frame has no window');
  return view;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('owner document and window', () => {
  it("UIC-PORTAL-1.7 resolves a node's own document and window", () => {
    const view = frameWindow();
    const field = view.document.createElement('input');
    view.document.body.append(field);
    expect(getOwnerDocument(field)).toBe(view.document);
    expect(getOwnerDocument(view.document)).toBe(view.document);
    expect(getOwnerWindow(field)).toBe(view);
    expect(getOwnerDocument(null)).toBe(document);
    expect(getOwnerWindow(undefined)).toBe(window);
  });

  it('UIC-PORTAL-1.7 finds an id in the shadow root or the document a node is in', () => {
    const view = frameWindow();
    view.document.body.innerHTML = '<p id="note">Frame</p>';
    expect(getElementByIdFrom(view.document.body, 'note')?.textContent).toBe('Frame');
    const shadowHost = document.createElement('div');
    document.body.append(shadowHost);
    const shadow = shadowHost.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<p id="note">Shadow</p><span></span>';
    expect(getElementByIdFrom(shadow.querySelector('span'), 'note')?.textContent).toBe('Shadow');
    expect(getElementByIdFrom(null, 'note')).toBeNull();
  });
});

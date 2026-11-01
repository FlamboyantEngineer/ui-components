import { afterEach, describe, expect, it } from 'vitest';
import {
  getElementByIdFrom,
  getElementByIdWithin,
  getOwnerDocument,
  getOwnerWindow,
  getTreeRoot,
} from './owner-window.js';

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

  it('UIC-PORTAL-1.7 finds an id inside a container in its shadow root, never outside it', () => {
    document.body.innerHTML = '<p id="row">Outside</p>';
    const shadow = document.body
      .appendChild(document.createElement('div'))
      .attachShadow({ mode: 'open' });
    shadow.innerHTML = '<section><p id="row">Inside</p></section><p id="beside">Beside</p>';
    const section = shadow.querySelector('section');
    expect(getElementByIdWithin(section, 'row')?.textContent).toBe('Inside');
    expect(getElementByIdWithin(section, 'beside')).toBeNull();
    const light = document.body.appendChild(document.createElement('section'));
    expect(getElementByIdWithin(light, 'row')).toBeNull();
    expect(getElementByIdWithin(null, 'row')).toBeNull();
  });

  it('UIC-FIELD-2.6 takes the shadow root a node is in as its tree root, else its document', () => {
    const shadow = document.body
      .appendChild(document.createElement('div'))
      .attachShadow({ mode: 'open' });
    shadow.innerHTML = '<form><div></div></form>';
    const inner = shadow.querySelector('div') as HTMLDivElement;
    const nested = inner.attachShadow({ mode: 'open' });
    nested.innerHTML = '<input>';
    expect(getTreeRoot(inner)).toBe(shadow);
    expect(getTreeRoot(nested.querySelector('input') as Element)).toBe(nested);
    expect(getTreeRoot(document.body)).toBe(document);
    expect(getTreeRoot(document.createElement('p'))).toBe(document);
  });
});

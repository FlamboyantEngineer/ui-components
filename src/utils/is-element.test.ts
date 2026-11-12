import { afterEach, describe, expect, it } from 'vitest';
import { isFocusableElement } from './focus-target.js';
import { isEditableTarget } from './is-editable-target.js';
import { isElement, isHTMLElement, isNode, isShadowRoot } from './is-element.js';

/** A same-origin frame's document: its nodes come from the frame window's own constructors. */
function frameDocument(): Document {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const owner = frame.contentDocument;
  if (!owner) throw new Error('The frame has no document');
  return owner;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('node checks', () => {
  it('UIC-PORTAL-1.6 recognises the nodes of another window', () => {
    const owner = frameDocument();
    const input = owner.createElement('input');
    owner.body.append(input);
    expect(input instanceof HTMLElement).toBe(false);
    expect(isNode(input)).toBe(true);
    expect(isElement(input)).toBe(true);
    expect(isHTMLElement(input)).toBe(true);
    expect(isHTMLElement(input, 'input')).toBe(true);
    expect(isHTMLElement(input, 'textarea')).toBe(false);
    expect(isFocusableElement(input)).toBe(true);
    expect(isEditableTarget(input)).toBe(true);
  });

  it('UIC-PORTAL-1.6 recognises the shadow roots of another window', () => {
    const owner = frameDocument();
    const host = owner.createElement('div');
    owner.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    expect(root instanceof ShadowRoot).toBe(false);
    expect(isShadowRoot(root)).toBe(true);
    expect(isShadowRoot(owner.createDocumentFragment())).toBe(false);
    expect(isShadowRoot(host)).toBe(false);
  });

  it('UIC-PORTAL-1.6 tells nodes, elements and HTML elements apart', () => {
    const text = document.createTextNode('Lisbon');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expect(isNode(text)).toBe(true);
    expect(isElement(text)).toBe(false);
    expect(isElement(svg)).toBe(true);
    expect(isHTMLElement(svg)).toBe(false);
    expect(isHTMLElement(document.createElement('form'), 'form')).toBe(true);
    for (const value of [null, undefined, 'div', {}, { nodeType: 1 }, window]) {
      expect(isNode(value)).toBe(false);
    }
  });
});

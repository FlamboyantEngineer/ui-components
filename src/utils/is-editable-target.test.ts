import { describe, expect, it } from 'vitest';
import { isEditableTarget } from './is-editable-target.js';
import { requireDefined } from './require-defined.js';

function element(markup: string, selector: string): Element {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return requireDefined(host.querySelector(selector));
}

describe('isEditableTarget', () => {
  it('owns keys in fields and editable content of any value but false', () => {
    expect(isEditableTarget(element('<input />', 'input'))).toBe(true);
    expect(isEditableTarget(element('<textarea></textarea>', 'textarea'))).toBe(true);
    expect(isEditableTarget(element('<select></select>', 'select'))).toBe(true);
    expect(isEditableTarget(element('<div contenteditable=""></div>', 'div'))).toBe(true);
    expect(isEditableTarget(element('<div contenteditable="true"><b></b></div>', 'b'))).toBe(true);
    expect(isEditableTarget(element('<div contenteditable="plaintext-only"></div>', 'div'))).toBe(
      true,
    );
  });

  it('owns keys in elements matching the extra selector', () => {
    const thumb = element('<div role="slider"><span></span></div>', 'span');
    expect(isEditableTarget(thumb)).toBe(false);
    expect(isEditableTarget(thumb, '[role="slider"]')).toBe(true);
  });

  it('leaves keys elsewhere to the surrounding widget', () => {
    expect(isEditableTarget(element('<button></button>', 'button'))).toBe(false);
    expect(isEditableTarget(element('<div contenteditable="false"></div>', 'div'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(window)).toBe(false);
  });
});

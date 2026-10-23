import { describe, expect, it } from 'vitest';
import { isKeyOwner } from './is-key-owner.js';

function element(markup: string, selector: string): Element {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return host.querySelector(selector)!;
}

describe('isKeyOwner', () => {
  it('owns keys in fields, sliders and editable content of any value but false', () => {
    expect(isKeyOwner(element('<input />', 'input'))).toBe(true);
    expect(isKeyOwner(element('<textarea></textarea>', 'textarea'))).toBe(true);
    expect(isKeyOwner(element('<select></select>', 'select'))).toBe(true);
    expect(isKeyOwner(element('<div role="slider"><span></span></div>', 'span'))).toBe(true);
    expect(isKeyOwner(element('<div contenteditable=""></div>', 'div'))).toBe(true);
    expect(isKeyOwner(element('<div contenteditable="true"><b></b></div>', 'b'))).toBe(true);
    expect(isKeyOwner(element('<div contenteditable="plaintext-only"></div>', 'div'))).toBe(true);
  });

  it('leaves keys elsewhere to the surrounding widget', () => {
    expect(isKeyOwner(element('<button></button>', 'button'))).toBe(false);
    expect(isKeyOwner(element('<div contenteditable="false"></div>', 'div'))).toBe(false);
    expect(isKeyOwner(null)).toBe(false);
    expect(isKeyOwner(window)).toBe(false);
  });
});

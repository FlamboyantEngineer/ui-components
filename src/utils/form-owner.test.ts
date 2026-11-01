import { describe, expect, it } from 'vitest';
import { findFormOwner, hasNativeFormOwner } from './form-owner.js';

function mount(html: string) {
  document.body.innerHTML = html;
  return (selector: string) => document.querySelector(selector) as Element;
}

describe('findFormOwner', () => {
  it('UIC-FIELD-2.6 takes a native control’s own owner, null included', () => {
    const find = mount(
      '<form id="near"><input id="own"><input id="none" form="missing"><div id="group"></div></form><form id="far"></form><input id="away" form="far">',
    );
    expect(findFormOwner(find('#own'))).toBe(find('#near'));
    expect(findFormOwner(find('#none'))).toBeNull();
    expect(findFormOwner(find('#away'))).toBe(find('#far'));
    expect(findFormOwner(find('#group'))).toBe(find('#near'));
    expect(hasNativeFormOwner(find('#group'))).toBe(false);
    expect(hasNativeFormOwner(find('#none'))).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { clickOwnerSelector, isInteractiveTarget } from './is-interactive-target.js';
import { requireDefined } from './require-defined.js';

function render(markup: string) {
  const container = document.createElement('div');
  container.setAttribute('role', 'group');
  container.innerHTML = markup;
  const find = (selector: string) => requireDefined(container.querySelector(selector));
  return { container, find };
}

describe('isInteractiveTarget', () => {
  it('UIC-DIAGRAM-CANVAS-4.3 leaves presses on nested controls and editable content to them', () => {
    const { container, find } = render(
      '<button><span class="icon"></span></button><a href="#x">Link</a><input />' +
        '<div contenteditable="true"><b>text</b></div><div contenteditable="false">fixed</div>' +
        '<span role="switch"></span><span class="plain">Plain</span>',
    );
    expect(isInteractiveTarget(find('.icon'), container)).toBe(true);
    expect(isInteractiveTarget(find('a'), container)).toBe(true);
    expect(isInteractiveTarget(find('input'), container)).toBe(true);
    expect(isInteractiveTarget(find('b'), container)).toBe(true);
    expect(isInteractiveTarget(find('[role="switch"]'), container)).toBe(true);
    expect(isInteractiveTarget(find('[contenteditable="false"]'), container)).toBe(false);
    expect(isInteractiveTarget(find('.plain'), container)).toBe(false);
    expect(isInteractiveTarget(container, container)).toBe(false);
    expect(isInteractiveTarget(null, container)).toBe(false);
  });

  it('UIC-TABLE-14.1 UIC-PDF-VIEWER-11.2 leaves presses on focusable and editable content to it', () => {
    const { container, find } = render(
      '<span class="tab" tabindex="0">Tab</span><span class="skip" tabindex="-1">Focus</span>' +
        '<span contenteditable="">Edit</span><span contenteditable="plaintext-only">Text</span>',
    );
    expect(isInteractiveTarget(find('.tab'), container)).toBe(true);
    expect(isInteractiveTarget(find('.skip'), container)).toBe(true);
    expect(isInteractiveTarget(find('[contenteditable=""]'), container)).toBe(true);
    expect(isInteractiveTarget(find('[contenteditable="plaintext-only"]'), container)).toBe(true);
  });

  it('UIC-DIAGRAM-CANVAS-4.3 ignores controls around the container', () => {
    const outer = document.createElement('button');
    const { container, find } = render('<span class="plain">Plain</span>');
    outer.append(container);
    expect(isInteractiveTarget(find('.plain'), container)).toBe(false);
  });

  it('UIC-TABLE-14.1 UIC-CARD-3.2 leaves presses on the library gesture surfaces to them', () => {
    const { container, find } = render(
      '<div class="ui-slider__track"><span class="ui-slider__thumb"><b>thumb</b></span></div>' +
        '<span class="ui-number-field__scrubber" aria-hidden="true"></span>' +
        '<div class="ui-scroll-region__track"><i>thumb</i></div>' +
        '<div class="ui-signature-pad__surface" role="img" tabindex="-1"></div>' +
        '<span role="spinbutton">1</span><h3 tabindex="-1">Heading</h3>',
    );
    for (const selector of [
      'b',
      '.ui-slider__track',
      '.ui-number-field__scrubber',
      'i',
      '.ui-signature-pad__surface',
      '[role="spinbutton"]',
    ]) {
      expect(isInteractiveTarget(find(selector), container)).toBe(true);
      expect(find(selector).closest(clickOwnerSelector)).not.toBeNull();
    }
    expect(find('h3').closest(clickOwnerSelector)).toBeNull();
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { listTabbables, listTabStops } from './tabbable.js';

const checkVisibility = Object.getOwnPropertyDescriptor(Element.prototype, 'checkVisibility');
const appended: Element[] = [];

function mount(markup: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = markup;
  document.body.append(root);
  appended.push(root);
  return root;
}

afterEach(() => {
  for (const root of appended.splice(0)) root.remove();
  if (checkVisibility) {
    Object.defineProperty(Element.prototype, 'checkVisibility', checkVisibility);
  } else {
    Reflect.deleteProperty(Element.prototype, 'checkVisibility');
  }
});

describe('listTabbables', () => {
  it('UIC-PORTAL-3.4 lists the elements Tab reaches, in document order', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <a href="#one">One</a>
      <a>No link</a>
      <input type="hidden" />
      <input aria-label="Two" />
      <button disabled>Disabled</button>
      <fieldset disabled><button>Disabled by fieldset</button></fieldset>
      <button tabindex="-1">Skipped</button>
      <div hidden><button>Hidden</button></div>
      <div inert><button>Inert</button></div>
      <span tabindex="0">Three</span>
    `;
    expect(listTabbables(root).map((element) => element.textContent || element.ariaLabel)).toEqual([
      'One',
      'Two',
      'Three',
    ]);
  });

  for (const option of ['visibilityProperty', 'checkVisibilityCSS'] as const) {
    it(`UIC-PORTAL-3.4 skips invisible controls with only ${option} supported`, () => {
      Object.defineProperty(Element.prototype, 'checkVisibility', {
        configurable: true,
        value(this: HTMLElement, options?: CheckVisibilityOptions) {
          return !options?.[option] || this.style.visibility !== 'hidden';
        },
      });
      const root = mount(`
        <button style="visibility:hidden">Hidden</button>
        <button>Visible</button>
      `);
      expect(listTabbables(root).map((element) => element.textContent)).toEqual(['Visible']);
    });
  }

  describe('without checkVisibility', () => {
    // Shadow the API even if the DOM implementation gains it in a future release.
    function omitCheckVisibility() {
      Object.defineProperty(Element.prototype, 'checkVisibility', {
        configurable: true,
        value: undefined,
      });
    }

    it('UIC-PORTAL-3.4 excludes CSS-hidden controls and ancestors, preserving visible overrides', () => {
      omitCheckVisibility();
      const root = mount(`
        <button style="display:none">No display</button>
        <div style="display:none"><button>Hidden ancestor</button></div>
        <button style="visibility:hidden">Invisible</button>
        <div style="visibility:hidden">
          <button>Inherited invisibility</button>
          <button style="visibility:visible">Restored</button>
        </div>
        <button style="visibility:collapse">Collapsed</button>
        <button>Visible</button>
      `);
      expect(listTabbables(root).map((element) => element.textContent)).toEqual([
        'Restored',
        'Visible',
      ]);
    });

    it('UIC-PORTAL-3.4 keeps transparent, fixed, offscreen and zero-size controls and display:contents descendants', () => {
      omitCheckVisibility();
      const root = mount(`
        <button style="opacity:0">Transparent</button>
        <button style="position:fixed">Fixed</button>
        <button style="position:absolute;left:-10000px">Offscreen</button>
        <button style="width:0;height:0;padding:0;border:0">Zero size</button>
        <div style="display:contents" tabindex="0">
          <button>Contents descendant</button>
        </div>
      `);
      expect(listTabbables(root).map((element) => element.textContent)).toEqual([
        'Transparent',
        'Fixed',
        'Offscreen',
        'Zero size',
        'Contents descendant',
      ]);
    });

    it('UIC-PORTAL-3.4 follows slots through hidden shadow wrappers and display:contents', () => {
      omitCheckVisibility();
      const root = mount('<div><button>Slotted</button></div><button>Visible</button>');
      const host = root.querySelector('div');
      if (!host) throw new Error('Missing shadow host');
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<div style="display:none"><slot></slot></div>';
      expect(listTabbables(root).map((element) => element.textContent)).toEqual(['Visible']);
      shadow.innerHTML = '<div style="content-visibility:hidden"><slot></slot></div>';
      expect(listTabbables(root).map((element) => element.textContent)).toEqual(['Visible']);
      shadow.innerHTML = '<div style="display:contents"><slot></slot></div>';
      expect(listTabbables(root).map((element) => element.textContent)).toEqual([
        'Slotted',
        'Visible',
      ]);
    });

    it('UIC-PORTAL-3.4 checks shadow hosts and their ancestors for controls inside a shadow root', () => {
      omitCheckVisibility();
      const root = mount('<section><div></div></section>');
      const host = root.querySelector('div');
      const ancestor = root.querySelector('section');
      if (!host || !ancestor) throw new Error('Missing shadow host or ancestor');
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<button>Shadow tool</button>';
      host.style.display = 'none';
      expect(listTabbables(shadow)).toEqual([]);
      host.style.display = 'contents';
      expect(listTabbables(shadow).map((element) => element.textContent)).toEqual(['Shadow tool']);
      ancestor.style.display = 'none';
      expect(listTabbables(shadow)).toEqual([]);
    });

    it('UIC-PORTAL-3.4 keeps shadow content inside the first summary of closed details', () => {
      omitCheckVisibility();
      const root = mount('<details><summary><span></span></summary><div></div></details>');
      const summaryHost = root.querySelector('span');
      const contentHost = root.querySelector('details > div');
      if (!summaryHost || !contentHost) throw new Error('Missing shadow hosts');
      const summary = summaryHost.attachShadow({ mode: 'open' });
      const content = contentHost.attachShadow({ mode: 'open' });
      summary.innerHTML = '<button>Summary tool</button>';
      content.innerHTML = '<button>Closed content</button>';
      expect(listTabbables(summary).map((element) => element.textContent)).toEqual([
        'Summary tool',
      ]);
      expect(listTabbables(content)).toEqual([]);
    });

    it('UIC-PORTAL-3.4 keeps the first summary and its controls while skipping closed details content', () => {
      omitCheckVisibility();
      const root = mount(`
        <details>
          <summary tabindex="0" aria-label="Summary"><button>Summary tool</button></summary>
          <summary tabindex="0">Later summary</summary>
          <button>Closed content</button>
        </details>
        <details open>
          <summary tabindex="0" aria-label="Open summary">More</summary>
          <button>Open content</button>
        </details>
      `);
      expect(
        listTabbables(root).map((element) => element.ariaLabel || element.textContent),
      ).toEqual(['Summary', 'Summary tool', 'Open summary', 'Open content']);
    });

    it('UIC-PORTAL-3.4 excludes content-visibility:hidden descendants while keeping the container', () => {
      omitCheckVisibility();
      const root = mount(`
        <div style="content-visibility:hidden" tabindex="0" aria-label="Container">
          <button>Unrendered</button>
        </div>
        <button>Visible</button>
      `);
      expect(
        listTabbables(root).map((element) => element.ariaLabel || element.textContent),
      ).toEqual(['Container', 'Visible']);
    });

    it('UIC-PORTAL-3.4 skips a CSS-hidden checked radio and keeps the first visible group member', () => {
      omitCheckVisibility();
      const root = mount(`
        <input type="radio" name="size" aria-label="Small" />
        <input type="radio" name="size" aria-label="Large" checked style="display:none" />
        <input type="radio" name="size" aria-label="Medium" />
      `);
      expect(listTabStops(root).map((element) => element.ariaLabel)).toEqual(['Small']);
    });
  });

  it('UIC-PORTAL-3.4 counts a radio group as one stop, its checked button or else its first', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <input type="radio" name="size" aria-label="Small" />
      <input type="radio" name="size" aria-label="Large" checked />
      <input type="radio" name="fruit" aria-label="Plum" />
      <input type="radio" name="fruit" aria-label="Fig" />
      <input type="radio" aria-label="Alone" />
      <form><input type="radio" name="size" aria-label="Form size" /></form>
    `;
    expect(listTabStops(root).map((element) => element.ariaLabel)).toEqual([
      'Large',
      'Plum',
      'Alone',
      'Form size',
    ]);
  });
});

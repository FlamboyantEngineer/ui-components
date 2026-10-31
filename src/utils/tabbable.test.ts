import { describe, expect, it } from 'vitest';
import { listTabbables, listTabStops } from './tabbable.js';

describe('listTabbables', () => {
  it('lists the elements Tab reaches, in document order', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <a href="#one">One</a>
      <a>No link</a>
      <input type="hidden" />
      <input aria-label="Two" />
      <button disabled>Disabled</button>
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

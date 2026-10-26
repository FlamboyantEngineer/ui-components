import { describe, expect, it } from 'vitest';
import { listTabbables } from './tabbable.js';

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
});

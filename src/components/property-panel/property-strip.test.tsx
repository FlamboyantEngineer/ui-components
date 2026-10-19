import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { PropertyStrip, PropertyStripCell } from './property-strip.js';

describe('PropertyStrip', () => {
  it('UIC-PROPERTY-PANEL-3.5 runs cells whose decorative letters leave naming to the controls', () => {
    const { container } = render(
      <PropertyStrip>
        <PropertyStripCell letter="B" label="Before">
          <input aria-label="Space before" />
        </PropertyStripCell>
        <PropertyStripCell letter="A" label="After">
          <input aria-label="Space after" />
        </PropertyStripCell>
      </PropertyStrip>,
    );
    const strip = container.firstElementChild as HTMLElement;
    expect(strip.tagName).toBe('SPAN');
    expect(strip).toHaveClass('ui-property-strip');
    const cells = strip.querySelectorAll('.ui-property-strip-cell');
    expect(cells).toHaveLength(2);
    const letter = cells[0]?.querySelector('.ui-property-strip-cell__letter');
    expect(letter).toHaveTextContent('B');
    expect(letter).toHaveAttribute('title', 'Before');
    expect(letter).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('textbox', { name: 'Space before' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', {
      slots: ['ui-property-strip-cell__letter'],
    });
  });
});

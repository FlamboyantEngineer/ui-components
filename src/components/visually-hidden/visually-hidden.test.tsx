import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { VisuallyHidden } from './visually-hidden.js';

function isHidden(element: Element): boolean {
  const style = (element as HTMLElement).style;
  return style.position === 'absolute' && style.width === '1px' && style.overflow === 'hidden';
}

describe('VisuallyHidden', () => {
  it('UIC-VISUALLY-HIDDEN-1.1 UIC-VISUALLY-HIDDEN-2.1 hides content visually and keeps it for assistive technology', () => {
    const { container } = render(
      <button type="button">
        <span aria-hidden="true">×</span>
        <VisuallyHidden>Remove Lemon tart</VisuallyHidden>
      </button>,
    );
    const hidden = container.querySelector('.ui-visually-hidden') as HTMLElement;
    expect(hidden.tagName).toBe('DIV');
    expect(isHidden(hidden)).toBe(true);
    expect(hidden).toHaveTextContent('Remove Lemon tart');
    expect(screen.getByRole('button', { name: 'Remove Lemon tart' })).toBeInTheDocument();
    expect(hidden).not.toHaveAttribute('data-focus-within');
    expectHooksMatchSpec(container, 'VISUALLY-HIDDEN');
  });

  it('UIC-VISUALLY-HIDDEN-1.2 renders the element type the content needs', () => {
    const { container } = render(
      <p>
        12 kg <VisuallyHidden elementType="span">of apples</VisuallyHidden>
      </p>,
    );
    const hidden = container.querySelector('.ui-visually-hidden') as HTMLElement;
    expect(hidden.tagName).toBe('SPAN');
    expect(isHidden(hidden)).toBe(true);
    expect(container.querySelector('p')).toHaveTextContent('12 kg of apples');
  });

  it('UIC-VISUALLY-HIDDEN-1.3 appends the caller class and forwards id, data and DOM props', async () => {
    const onFocus = vi.fn();
    const { container } = render(
      <VisuallyHidden
        isFocusable
        className="caller"
        id="hint"
        data-variant="caller"
        onFocus={onFocus}
      >
        <a href="#main">Skip</a>
      </VisuallyHidden>,
    );
    const hidden = screen.getByRole('link', { name: 'Skip' }).parentElement;
    expect(hidden).toHaveClass('ui-visually-hidden', 'caller');
    expect(hidden).toHaveAttribute('id', 'hint');
    expect(hidden).toHaveAttribute('data-variant', 'caller');
    await userEvent.tab();
    expect(onFocus).toHaveBeenCalled();
    expect(hidden).toHaveAttribute('data-focus-within', 'true');
    expectHooksMatchSpec(container, 'VISUALLY-HIDDEN', { callerAttributes: ['data-variant'] });
  });

  it('UIC-VISUALLY-HIDDEN-2.2 shows focusable content while it or a descendant has focus', async () => {
    const { container } = render(
      <>
        <VisuallyHidden isFocusable>
          <a href="#recipes">Skip to recipes</a>
        </VisuallyHidden>
        <button type="button">Next</button>
      </>,
    );
    const hidden = container.querySelector('.ui-visually-hidden') as HTMLElement;
    expect(isHidden(hidden)).toBe(true);
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Skip to recipes' })).toHaveFocus();
    expect(isHidden(hidden)).toBe(false);
    expect(hidden).toHaveAttribute('data-focus-within', 'true');
    expectHooksMatchSpec(container, 'VISUALLY-HIDDEN');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    expect(isHidden(hidden)).toBe(true);
    expect(hidden).not.toHaveAttribute('data-focus-within');
  });

  it('UIC-VISUALLY-HIDDEN-2.2 keeps content hidden while focused unless it is focusable', () => {
    const { container } = render(
      <VisuallyHidden>
        <a href="#recipes">Skip to recipes</a>
      </VisuallyHidden>,
    );
    act(() => screen.getByRole('link').focus());
    const hidden = container.querySelector('.ui-visually-hidden') as HTMLElement;
    expect(isHidden(hidden)).toBe(true);
    expect(hidden).not.toHaveAttribute('data-focus-within');
  });
});

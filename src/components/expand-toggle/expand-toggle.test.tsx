import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { ExpandToggle } from './expand-toggle.js';

function glyph(element: Element) {
  return element.querySelector('[data-glyph]')?.getAttribute('data-glyph');
}

describe('ExpandToggle', () => {
  it('UIC-EXPAND-TOGGLE-1.1 toggles an uncontrolled state with the chevron and aria-expanded', async () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <ExpandToggle onExpandedChange={onExpandedChange} aria-controls="fruit-children" />,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveClass('ui-icon-button', 'ui-expand-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'fruit-children');
    expect(toggle).not.toHaveAttribute('data-expanded');
    expect(glyph(toggle)).toBe('chevron-right');
    await userEvent.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('data-expanded', 'true');
    expect(glyph(toggle)).toBe('chevron-down');
    expectHooksMatchSpec(container, 'EXPAND-TOGGLE');
  });

  it('UIC-EXPAND-TOGGLE-1.1 follows a controlled state and points left right to left', async () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <ExpandToggle isExpanded={false} onExpandedChange={onExpandedChange} />,
    );
    const toggle = screen.getByRole('button');
    await userEvent.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    rerender(<ExpandToggle isExpanded onExpandedChange={onExpandedChange} />);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    rerender(
      <UiProvider locale="ar-EG">
        <ExpandToggle defaultExpanded={false} />
      </UiProvider>,
    );
    expect(glyph(screen.getByRole('button'))).toBe('chevron-left');
  });

  it('UIC-EXPAND-TOGGLE-1.2 is named Expand or Collapse, or by a constant label', async () => {
    const { rerender } = render(<ExpandToggle />);
    const toggle = screen.getByRole('button', { name: 'Expand' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAccessibleName('Collapse');
    rerender(<ExpandToggle label="Citrus" />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Citrus');
    rerender(
      <UiProvider strings={{ expand: 'Déplier' }}>
        <ExpandToggle defaultExpanded={false} />
      </UiProvider>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Déplier');
  });

  it('UIC-EXPAND-TOGGLE-1.3 keeps presses from reaching the row around it', async () => {
    const onRowClick = vi.fn();
    const onToggle = vi.fn();
    render(
      <div onClick={onRowClick} onKeyDown={onRowClick} role="presentation">
        <ExpandToggle onExpandedChange={onToggle} />
        <span>Citrus</span>
      </div>,
    );
    const toggle = screen.getByRole('button');
    await userEvent.click(toggle);
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onToggle).toHaveBeenCalledTimes(3);
    expect(onRowClick).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText('Citrus'));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it('UIC-EXPAND-TOGGLE-1.4 stays out of the tab order on request and can be disabled', async () => {
    function Row() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <ExpandToggle excludeFromTabOrder isExpanded={open} onExpandedChange={setOpen} />
          <button type="button">Citrus</button>
        </>
      );
    }
    const { unmount } = render(<Row />);
    const toggle = screen.getByRole('button', { name: 'Expand' });
    expect(toggle).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Citrus' })).toHaveFocus();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    unmount();

    const onExpandedChange = vi.fn();
    render(<ExpandToggle isDisabled onExpandedChange={onExpandedChange} />);
    expect(screen.getByRole('button')).toBeDisabled();
    await userEvent.click(screen.getByRole('button'));
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it('UIC-EXPAND-TOGGLE-1.5 renders an empty hidden box for a row that cannot expand', () => {
    const { container } = render(<ExpandToggle isExpandable={false} size="md" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.tagName).toBe('SPAN');
    expect(box).toHaveClass('ui-expand-toggle');
    expect(box).toHaveAttribute('data-leaf', 'true');
    expect(box).toHaveAttribute('data-size', 'md');
    expect(box).toHaveAttribute('aria-hidden', 'true');
    expect(box).toBeEmptyDOMElement();
    expect(screen.queryByRole('button')).toBeNull();
    expectHooksMatchSpec(container, 'EXPAND-TOGGLE');
  });

  it('UIC-EXPAND-TOGGLE-1.6 publishes the size and forwards caller hooks and ref', () => {
    const ref = createRef<HTMLButtonElement>();
    const { rerender, unmount } = render(<ExpandToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<ExpandToggle size={size} />);
      expect(screen.getByRole('button')).toHaveAttribute('data-size', size);
    }
    unmount();
    const { container } = render(
      <ExpandToggle
        ref={ref}
        className="caller"
        id="toggle-1"
        data-testid="probe"
        data-expanded="spoof"
      />,
    );
    const toggle = screen.getByRole('button');
    expect(ref.current).toBe(toggle);
    expect(toggle).toHaveClass('ui-expand-toggle', 'caller');
    expect(toggle).toHaveAttribute('id', 'toggle-1');
    expect(toggle).toHaveAttribute('data-testid', 'probe');
    expect(toggle).not.toHaveAttribute('data-expanded');
    expectHooksMatchSpec(container, 'EXPAND-TOGGLE');
  });
});

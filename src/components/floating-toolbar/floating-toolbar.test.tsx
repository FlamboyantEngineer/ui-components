import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { FloatingToolbar, type FloatingToolbarProps } from './floating-toolbar.js';

function Host(props: Partial<FloatingToolbarProps>) {
  const anchor = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={anchor} type="button">
        Text
      </button>
      <FloatingToolbar isOpen triggerRef={anchor} aria-label="Actions" {...props}>
        <button type="button">First</button>
        <button type="button">Second</button>
      </FloatingToolbar>
    </>
  );
}

describe('FloatingToolbar', () => {
  it('UIC-FLOATING-TOOLBAR-1.1 opens without taking focus, and stays closed while not open', async () => {
    const { rerender } = render(<Host isOpen={false} />);
    expect(screen.queryByRole('toolbar', { name: 'Actions' })).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Text' }).focus();
    rerender(<Host getTargetRect={() => new DOMRect(10, 20, 30, 10)} targetKey="a" />);
    expect(await screen.findByRole('toolbar', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Text' })).toHaveFocus();
    rerender(<Host getTargetRect={() => new DOMRect(40, 20, 30, 10)} targetKey="b" />);
    expect(screen.getByRole('toolbar', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Text' })).toHaveFocus();
  });

  it('UIC-FLOATING-TOOLBAR-1.2 reaches the row, hears focus and calls onDismiss on Escape', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const rowRef = { current: null as HTMLDivElement | null };
    render(
      <Host
        onDismiss={onDismiss}
        onFocus={onFocus}
        onBlur={onBlur}
        rowRef={rowRef}
        rowClassName="caller-row"
      />,
    );
    const toolbar = await screen.findByRole('toolbar', { name: 'Actions' });
    expect(rowRef.current).toHaveClass('ui-floating-toolbar__row', 'ui-toolbar-row', 'caller-row');
    screen.getByRole('button', { name: 'First' }).focus();
    expect(onFocus).toHaveBeenCalled();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(toolbar).toBeInTheDocument();
  });

  it('UIC-FLOATING-TOOLBAR-1.3 carries its hooks, the caller class and data attributes', async () => {
    render(<Host className="caller" data-place="selection" />);
    await screen.findByRole('toolbar', { name: 'Actions' });
    const root = document.querySelector('.ui-floating-toolbar');
    expect(root).toHaveClass('caller');
    expect(root).toHaveAttribute('data-place', 'selection');
    root?.removeAttribute('data-place');
    expectHooksMatchSpec(root as HTMLElement, 'FLOATING-TOOLBAR');
  });
});

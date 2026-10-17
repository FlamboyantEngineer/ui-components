import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { IconButton } from './icon-button.js';

describe('IconButton', () => {
  it('UIC-ICON-BUTTON-1.1 names the button with its label and draws a decorative icon', async () => {
    const onPress = vi.fn();
    render(<IconButton icon="close" label="Close" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Close' });
    const icon = button.querySelector('.ui-icon-button__icon');
    expect(icon).toHaveClass('ui-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(button).not.toHaveTextContent(/\S/);
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(document.body, 'ICON-BUTTON', { slots: ['icon'] });
  });

  it('UIC-ICON-BUTTON-1.1 accepts icon nodes and rejects an empty label', () => {
    render(<IconButton icon={<svg data-testid="custom" />} label="Custom" />);
    expect(screen.getByTestId('custom').parentElement).toHaveClass('ui-icon-button__icon');
    expect(() => render(<IconButton icon="close" label="  " />)).toThrow(/label/);
  });

  it('UIC-ICON-BUTTON-1.2 publishes variant and size, ghost and medium by default', () => {
    const { rerender } = render(<IconButton icon="more" label="More" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'md');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<IconButton icon="more" label="More" variant="secondary" size={size} />);
      expect(button).toHaveAttribute('data-size', size);
      expect(button).toHaveAttribute('data-variant', 'secondary');
    }
  });

  it('UIC-ICON-BUTTON-1.3 offers disabled, focusable disabled, pending and selected states', async () => {
    const onPress = vi.fn();
    const { rerender } = render(
      <IconButton icon="undo" label="Undo" isDisabled onPress={onPress} />,
    );
    expect(screen.getByRole('button')).toBeDisabled();

    rerender(
      <IconButton icon="undo" label="Undo" isDisabled focusableWhenDisabled onPress={onPress} />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-disabled', 'true');
    await userEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();

    rerender(<IconButton icon="undo" label="Undo" isPending onPress={onPress} />);
    expect(button.querySelector('.ui-icon-button__spinner')).not.toBeNull();
    expect(button.querySelector('.ui-icon-button__icon')).toBeNull();
    expect(button).toHaveAttribute('data-pending', 'true');
    expectHooksMatchSpec(document.body, 'ICON-BUTTON', { slots: ['spinner'] });

    rerender(<IconButton icon="undo" label="Undo" isSelected />);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-selected', 'true');
  });

  it('UIC-ICON-BUTTON-1.4 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <IconButton
        icon="help"
        label="Help"
        className="caller"
        id="help"
        ref={ref}
        data-testid="probe"
      />,
    );
    const button = screen.getByTestId('probe');
    expect(button).toHaveClass('ui-icon-button', 'caller');
    expect(button).toHaveAttribute('id', 'help');
    expect(ref.current).toBe(button);
    expectHooksMatchSpec(document.body, 'ICON-BUTTON');
  });

  it('UIC-ICON-BUTTON-1.5 shows a tooltip that describes the button and keeps its label', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <IconButton icon="undo" label="Undo" tooltip="Undo the last edit" />,
    );
    const button = screen.getByRole('button', { name: 'Undo' });
    expect(button.parentElement).toBe(container);
    await user.tab();
    const panel = screen.getByRole('tooltip');
    expect(panel).toHaveTextContent('Undo the last edit');
    expect(button).toHaveAccessibleName('Undo');
    expect(button).toHaveAccessibleDescription('Undo the last edit');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(button).toHaveFocus();
  });

  it('UIC-ICON-BUTTON-1.6 shows its label and shortcut in the tooltip and publishes aria-keyshortcuts', async () => {
    const user = userEvent.setup();
    render(
      <>
        <IconButton icon="undo" label="Undo" shortcut="Ctrl+Z" />
        <IconButton icon="redo" label="Redo" tooltip="Redo the last edit" shortcut="Ctrl+Shift+Z" />
      </>,
    );
    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(undo).toHaveAttribute('aria-keyshortcuts', 'Control+Z');
    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveTextContent(/^Undo Ctrl\+ZControl Z$/);
    expect(undo).toHaveAccessibleName('Undo');
    expect(undo).toHaveAccessibleDescription('Undo Control Z');
    await user.tab();
    const redo = screen.getByRole('button', { name: 'Redo' });
    expect(redo).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+Z');
    expect(redo).toHaveAccessibleDescription('Redo the last edit Control Shift Z');
    expectHooksMatchSpec(document.body, 'ICON-BUTTON');
  });
});

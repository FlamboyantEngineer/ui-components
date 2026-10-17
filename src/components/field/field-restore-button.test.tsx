import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { FieldRestoreButton } from './field-restore-button.js';

describe('FieldRestoreButton', () => {
  it('UIC-FIELD-4.2 is an icon button named after what it restores', () => {
    const { container, rerender } = render(
      <FieldRestoreButton label="Apple" className="caller" data-value="apple" onPress={() => {}} />,
    );
    const button = screen.getByRole('button', { name: 'Restore Apple' });
    expect(button).toHaveClass('ui-icon-button', 'ui-field-restore-button', 'caller');
    expect(button).toHaveAttribute('data-value', 'apple');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button.querySelector('[data-glyph="restore"]')).not.toBeNull();
    expectHooksMatchSpec(container, 'FIELD', { callerAttributes: ['data-value'] });
    rerender(
      <UiProvider strings={{ restoreValue: (label) => `Rétablir ${label}` }}>
        <FieldRestoreButton label="Pomme" size="sm" isDisabled />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Rétablir Pomme' })).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm');
  });

  it('UIC-FIELD-4.2 leaves focus on the control when pressed and works from the keyboard', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <>
        <input aria-label="Name" />
        <FieldRestoreButton label="Name" onPress={onPress} />
      </>,
    );
    const input = screen.getByRole('textbox');
    act(() => input.focus());
    await user.click(screen.getByRole('button', { name: 'Restore Name' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(input).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Switch } from './switch.js';

describe('Switch', () => {
  it('UIC-SWITCH-1.1 draws a track and thumb around a native switch input and its label', () => {
    const { container } = render(<Switch defaultSelected>Wi-Fi</Switch>);
    const root = container.querySelector('label.ui-switch');
    const input = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(root).toContainElement(input);
    expect(input).toBeChecked();
    expect(root).toHaveAttribute('data-selected', 'true');
    const track = container.querySelector('.ui-switch__track');
    expect(track).toHaveAttribute('aria-hidden', 'true');
    expect(track?.querySelector('.ui-switch__thumb')).not.toBeNull();
    expect(container.querySelector('.ui-switch__label')).toHaveTextContent('Wi-Fi');
    expectHooksMatchSpec(container, 'SWITCH', { slots: 'all' });
  });

  it('UIC-SWITCH-1.2 flips from the track, the label and Space', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Switch onChange={onChange}>Dark mode</Switch>);
    await user.click(container.querySelector('.ui-switch__track') as Element);
    expect(onChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByText('Dark mode'));
    expect(onChange).toHaveBeenLastCalledWith(false);
    screen.getByRole('switch').focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('UIC-SWITCH-1.2 keeps its state while read-only and leaves the focus order while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <Switch isReadOnly isSelected onChange={onChange}>
        Sync
      </Switch>,
    );
    await user.click(screen.getByText('Sync'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('switch')).toBeChecked();
    expect(container.querySelector('.ui-switch')).toHaveAttribute('data-readonly', 'true');
    rerender(
      <Switch isDisabled onChange={onChange}>
        Sync
      </Switch>,
    );
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(container.querySelector('.ui-switch')).toHaveAttribute('data-disabled', 'true');
    await user.tab();
    expect(screen.getByRole('switch')).not.toHaveFocus();
  });

  it('UIC-SWITCH-1.3 is named without visible text, submits its value and rings on keyboard focus', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form aria-label="Settings">
        <Switch id="alerts" aria-label="Alerts" name="alerts" value="on" defaultSelected />
      </form>,
    );
    const input = screen.getByRole('switch', { name: 'Alerts' });
    expect(input).toHaveAttribute('id', 'alerts');
    expect(container.querySelector('.ui-switch__label')).toBeNull();
    const data = new FormData(screen.getByRole<HTMLFormElement>('form', { name: 'Settings' }));
    expect(data.get('alerts')).toBe('on');
    await user.tab();
    expect(container.querySelector('.ui-switch')).toHaveAttribute('data-focus-visible', 'true');
    expectHooksMatchSpec(container, 'SWITCH');
  });

  it('UIC-SWITCH-1.4 forwards the class name and data attributes to its root', () => {
    const { container } = render(
      <Switch className="dense" data-test="toggle">
        Option
      </Switch>,
    );
    const root = container.querySelector('.ui-switch');
    expect(root).toHaveClass('ui-switch', 'dense');
    expect(root).toHaveAttribute('data-test', 'toggle');
    expectHooksMatchSpec(container, 'SWITCH', { callerAttributes: ['data-test'] });
  });
});

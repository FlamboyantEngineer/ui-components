import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Disclosure, DisclosureGroup, DisclosurePanel } from '../../primitives/index.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import { Button } from './button.js';

function Section({ isDisabled, onPress }: { isDisabled?: boolean; onPress: () => void }) {
  return (
    <Disclosure isDisabled={isDisabled}>
      <Button slot="trigger" onPress={onPress}>
        Details
      </Button>
      <DisclosurePanel>Lemon, orange and lime.</DisclosurePanel>
    </Disclosure>
  );
}

describe('Button in a slot', () => {
  it('UIC-BUTTON-1.10 takes the disabled state of a disabled disclosure it triggers', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(<Section isDisabled onPress={onPress} />);
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('data-disabled', 'true');
    await user.tab();
    expect(trigger).not.toHaveFocus();
    rerender(<Section onPress={onPress} />);
    expect(trigger).toBeEnabled();
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledOnce();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    rerender(<Section isDisabled onPress={onPress} />);
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(onPress).toHaveBeenCalledOnce();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-BUTTON-1.10 keeps its own state with slot={null} or an explicit isDisabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Disclosure isDisabled>
        <Button slot="trigger" isDisabled={false} onPress={onPress}>
          Forced
        </Button>
        <Button slot={null} onPress={onPress}>
          Outside
        </Button>
        <DisclosurePanel>Panel</DisclosurePanel>
      </Disclosure>,
    );
    expect(screen.getByRole('button', { name: 'Forced' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('UIC-EXPAND-TOGGLE-1.7 reports nothing as the trigger of a disabled disclosure or group', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <>
        <Disclosure isDisabled>
          <ExpandToggle label="Citrus" onExpandedChange={onExpandedChange} />
          <DisclosurePanel>Lemon</DisclosurePanel>
        </Disclosure>
        <DisclosureGroup isDisabled>
          <Disclosure>
            <ExpandToggle label="Berries" onExpandedChange={onExpandedChange} />
            <DisclosurePanel>Currant</DisclosurePanel>
          </Disclosure>
        </DisclosureGroup>
      </>,
    );
    for (const name of ['Citrus', 'Berries']) {
      const toggle = screen.getByRole('button', { name });
      expect(toggle).toBeDisabled();
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    }
    await user.tab();
    expect(document.body).toHaveFocus();
    expect(onExpandedChange).not.toHaveBeenCalled();
  });
});

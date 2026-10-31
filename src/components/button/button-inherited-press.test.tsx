import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionRow } from '../action-row/action-row.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../menu/menu.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { Button } from './button.js';

type Press = (event: unknown) => void;

function InMenu(props: { button: ReactNode; onOpenChange: (isOpen: boolean) => void }) {
  return (
    <MenuTrigger onOpenChange={props.onOpenChange}>
      {props.button}
      <MenuPopover>
        <Menu aria-label="Commands">
          <MenuItem id="run">Run</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

const trigger = () => screen.getByRole('button', { name: /Actions/ });

/** Every way to activate a focused trigger: pointer, Enter, Space, a menu's arrows, a programmatic click. */
async function tryEveryActivation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(trigger());
  for (const key of ['{Enter}', ' ', '{ArrowDown}', '{ArrowUp}']) {
    act(() => trigger().focus());
    await user.keyboard(key);
  }
  act(() => trigger().click());
  // eslint-disable-next-line testing-library/prefer-user-event -- a virtual click, as assistive technology sends
  fireEvent.click(trigger(), { detail: 0 });
}

afterEach(() => vi.useRealTimers());

describe('Button refusing a trigger it sits in', () => {
  it('UIC-BUTTON-2.1 keeps a focusable disabled button from opening its menu', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const lifecycle = vi.fn<Press>();
    render(
      <InMenu
        onOpenChange={onOpenChange}
        button={
          <Button
            isDisabled
            focusableWhenDisabled
            onPressStart={lifecycle}
            onPressEnd={lifecycle}
            onPressUp={lifecycle}
            onPressChange={lifecycle}
          >
            Actions
          </Button>
        }
      />,
    );
    await tryEveryActivation(user);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(lifecycle).not.toHaveBeenCalled();
    act(() => trigger().focus());
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute('aria-disabled', 'true');
  });

  it('UIC-BUTTON-2.1 keeps a focusable disabled button from opening its popover', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <PopoverTrigger onOpenChange={onOpenChange}>
        <Button isDisabled focusableWhenDisabled>
          Actions
        </Button>
        <Popover aria-label="Details">Details</Popover>
      </PopoverTrigger>,
    );
    await tryEveryActivation(user);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('UIC-BUTTON-2.1 hands a custom render the disabled state of a focusable disabled button', () => {
    const states: boolean[] = [];
    render(
      <Button
        isDisabled
        focusableWhenDisabled
        render={(props, state) => {
          states.push(state.isDisabled);
          return <button {...props} />;
        }}
      >
        Actions
      </Button>,
    );
    expect(states.length).toBeGreaterThan(0);
    expect(states.every(Boolean)).toBe(true);
  });

  it('UIC-BUTTON-2.1 keeps a disabled action row menu shut while its tooltip explains why', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ActionRow
        actions={[
          {
            verb: 'more',
            label: 'Actions',
            isDisabled: true,
            tooltip: 'Unavailable while saving',
            items: [{ id: 'run', label: 'Run' }],
            onAction,
          },
        ]}
      />,
    );
    await user.tab();
    expect(trigger()).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Unavailable while saving');
    await tryEveryActivation(user);
    expect(screen.queryByRole('menuitem', { name: 'Run' })).not.toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();
  });

  it('UIC-BUTTON-21.7 keeps a pending button from opening its menu while pendingDelay holds the indicator back', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const lifecycle = vi.fn<Press>();
    render(
      <InMenu
        onOpenChange={onOpenChange}
        button={
          <Button isPending pendingDelay={5000} onPressStart={lifecycle} onPressEnd={lifecycle}>
            Actions
          </Button>
        }
      />,
    );
    expect(trigger()).not.toHaveAttribute('data-pending');
    await tryEveryActivation(user);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(lifecycle).not.toHaveBeenCalled();
  });

  it('UIC-BUTTON-21.7 refuses its menu while its own action runs, and opens it once the action settles', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    let settle: () => void = () => undefined;
    const onPress = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)));
    render(
      <InMenu
        onOpenChange={onOpenChange}
        button={
          <Button pendingDelay={5000} onPress={onPress}>
            Actions
          </Button>
        }
      />,
    );
    await user.click(trigger());
    expect(onPress).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    onOpenChange.mockClear();
    await tryEveryActivation(user);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => settle());
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('UIC-BUTTON-21.7 opens its menu again once a delayed action rejects', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onError = vi.fn();
    let fail: (reason: Error) => void = () => undefined;
    const onPress = () => new Promise<void>((_resolve, reject) => (fail = reject));
    render(
      <InMenu
        onOpenChange={onOpenChange}
        button={
          <Button pendingDelay={5000} onPress={onPress} onError={onError}>
            Actions
          </Button>
        }
      />,
    );
    await user.click(trigger());
    await user.keyboard('{Escape}');
    onOpenChange.mockClear();
    await tryEveryActivation(user);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => fail(new Error('offline')));
    expect(onError).toHaveBeenCalledTimes(1);
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('UIC-BUTTON-21.7 opens its menu once the caller ends pending before the delay, and keeps its tooltip while pending', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const menu = (isPending: boolean) => (
      <InMenu
        onOpenChange={onOpenChange}
        button={
          <Button isPending={isPending} pendingDelay={5000} tooltip="Loads the commands">
            Actions
          </Button>
        }
      />
    );
    const { rerender } = render(menu(true));
    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Loads the commands');
    await tryEveryActivation(user);
    expect(onOpenChange).not.toHaveBeenCalled();
    rerender(menu(false));
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('UIC-BUTTON-21.7 stays shut when a running action is followed by the button being disabled', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    let settle: () => void = () => undefined;
    const onPress = () => new Promise<void>((resolve) => (settle = resolve));
    const menu = (isDisabled: boolean) => (
      <InMenu
        onOpenChange={onOpenChange}
        button={
          <Button
            pendingDelay={5000}
            onPress={onPress}
            isDisabled={isDisabled}
            focusableWhenDisabled
          >
            Actions
          </Button>
        }
      />
    );
    const { rerender } = render(menu(false));
    await user.click(trigger());
    await user.keyboard('{Escape}');
    onOpenChange.mockClear();
    rerender(menu(true));
    await act(async () => settle());
    await tryEveryActivation(user);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

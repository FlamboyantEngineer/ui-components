import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Button as AriaButton } from '../../primitives/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { PortalContainerProvider } from '../portal/portal.js';
import { Tooltip } from './tooltip.js';

const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

let user: ReturnType<typeof userEvent.setup>;

/**
 * Fake timers with a user-event session. Testing Library drains a zero timeout after each user-event
 * call and advances it only under Jest's fake timers, so it is pointed at Vitest's clock here.
 */
function useFakeClock() {
  vi.useFakeTimers();
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

/** Moves the mouse across the page and onto `element`, so React Aria sees a pointer before the hover. */
async function hover(element: Element) {
  await user.pointer({ target: document.body });
  await user.hover(element);
}

const leave = (element: Element) => user.unhover(element);

/** Reaches `element` with Tab, as a keyboard user does, stepping back first if it has focus. */
async function tabTo(element: HTMLElement) {
  if (element === document.activeElement) await user.tab({ shift: true });
  for (let step = 0; step < 10 && document.activeElement !== element; step += 1) {
    await user.tab();
  }
  expect(element).toHaveFocus();
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('Tooltip', () => {
  beforeEach(() => {
    user = useFakeClock();
  });
  afterEach(async () => {
    // Let React Aria's global warm-up and cool-down timers settle between tests.
    await advance(5000);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('UIC-TOOLTIP-1.1 UIC-TOOLTIP-1.2 opens after the hover delay in a portalled tooltip panel', async () => {
    const { container } = render(
      <Tooltip content="Save changes">
        <Button>Save</Button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Save' });
    expect(trigger.parentElement).toBe(container);
    await hover(trigger);
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    const panel = tooltip();
    expect(panel).toHaveTextContent('Save changes');
    expect(container.contains(panel)).toBe(false);
    expect(panel?.querySelector('.ui-tooltip__content')).toHaveTextContent('Save changes');
    expect(panel?.querySelector('a, button, input, [tabindex]')).toBeNull();
    expectHooksMatchSpec(document.body, 'TOOLTIP', { slots: 'all' });
  });

  it('UIC-TOOLTIP-1.2 opens at once on keyboard focus and honours a custom delay', async () => {
    render(
      <>
        <Tooltip content="First hint">
          <Button>First</Button>
        </Tooltip>
        <Tooltip content="Slow hint" delay={1200}>
          <Button>Slow</Button>
        </Tooltip>
      </>,
    );
    await tabTo(screen.getByRole('button', { name: 'First' }));
    expect(tooltip()).toHaveTextContent('First hint');
    act(() => screen.getByRole('button', { name: 'First' }).blur());
    await advance(3000);
    expect(tooltip()).toBeNull();

    const slow = screen.getByRole('button', { name: 'Slow' });
    await hover(slow);
    await advance(1199);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()).toHaveTextContent('Slow hint');
  });

  it('UIC-TOOLTIP-1.2 keeps one tooltip open and warms up neighbours', async () => {
    render(
      <>
        <Tooltip content="Alpha hint">
          <Button>Alpha</Button>
        </Tooltip>
        <Tooltip content="Blue hint">
          <Button>Blue</Button>
        </Tooltip>
      </>,
    );
    const alpha = screen.getByRole('button', { name: 'Alpha' });
    const blue = screen.getByRole('button', { name: 'Blue' });
    await hover(alpha);
    await advance(500);
    expect(tooltip()).toHaveTextContent('Alpha hint');
    await leave(alpha);
    await hover(blue);
    await advance(0);
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1);
    expect(tooltip()).toHaveTextContent('Blue hint');
  });

  it('UIC-TOOLTIP-1.2 never opens when disabled or for touch, and focus-only triggers ignore hover', async () => {
    render(
      <>
        <Tooltip content="Off" isDisabled>
          <Button>Disabled hint</Button>
        </Tooltip>
        <Tooltip content="Focus only" trigger="focus">
          <Button>Focus</Button>
        </Tooltip>
      </>,
    );
    await hover(screen.getByRole('button', { name: 'Disabled hint' }));
    await advance(1000);
    expect(tooltip()).toBeNull();
    await user.pointer([
      { keys: '[TouchA>]', target: screen.getByRole('button', { name: 'Focus' }) },
      { keys: '[/TouchA]' },
    ]);
    await hover(screen.getByRole('button', { name: 'Focus' }));
    await advance(1000);
    expect(tooltip()).toBeNull();
    await tabTo(screen.getByRole('button', { name: 'Focus' }));
    expect(tooltip()).toHaveTextContent('Focus only');
  });

  it('UIC-TOOLTIP-1.3 closes on Escape without moving focus, and on press', async () => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    const user = userEvent.setup();
    render(
      <Tooltip content="Copy the link">
        <Button>Copy</Button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Copy' });
    await user.tab();
    expect(tooltip()).toHaveTextContent('Copy the link');
    await user.keyboard('{Escape}');
    expect(tooltip()).toBeNull();
    expect(trigger).toHaveFocus();
    await user.tab({ shift: true });
    await user.tab();
    expect(tooltip()).not.toBeNull();
    await user.keyboard('{Enter}');
    expect(tooltip()).toBeNull();
    vi.useFakeTimers();
  });

  it('UIC-TOOLTIP-1.3 cancels a pending opening when the pointer leaves and closes after the close delay', async () => {
    render(
      <Tooltip content="Hint" closeDelay={0}>
        <Button>Target</Button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Target' });
    await hover(trigger);
    await advance(300);
    await leave(trigger);
    await advance(1000);
    expect(tooltip()).toBeNull();
    await hover(trigger);
    await advance(500);
    expect(tooltip()).not.toBeNull();
    await leave(trigger);
    await advance(0);
    expect(tooltip()).toBeNull();
  });

  it('UIC-TOOLTIP-1.4 describes the trigger only while open and keeps its name', async () => {
    render(
      <Tooltip content="Helpful hint">
        <AriaButton aria-label="Help">?</AriaButton>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Help' });
    expect(trigger).not.toHaveAttribute('aria-describedby');
    await tabTo(trigger);
    const panel = tooltip();
    expect(panel?.id).toBeTruthy();
    expect(trigger).toHaveAttribute('aria-describedby', panel?.id);
    expect(trigger).toHaveAccessibleName('Help');
    expect(trigger).toHaveAccessibleDescription('Helpful hint');
    act(() => trigger.blur());
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('UIC-TOOLTIP-1.5 UIC-TOOLTIP-1.6 publishes placement and variant', () => {
    render(
      <Tooltip content="Below" placement="bottom" variant="info" defaultOpen>
        <Button>Info</Button>
      </Tooltip>,
    );
    const panel = tooltip();
    expect(panel).toHaveAttribute('data-variant', 'info');
    expect(panel).toHaveAttribute('data-placement', 'bottom');
    expect(panel?.querySelector('.ui-tooltip__arrow')).toHaveAttribute('data-placement', 'bottom');
    expectHooksMatchSpec(document.body, 'TOOLTIP', { slots: ['arrow', 'content'] });
  });

  it('UIC-TOOLTIP-1.5 sits on the tooltip layer with its z-index, above menus and below toasts', () => {
    render(
      <>
        <Tooltip content="Layered" defaultOpen>
          <Button>Default</Button>
        </Tooltip>
        <PortalContainerProvider layerZIndex={{ tooltip: 900 }}>
          <Tooltip content="Raised" defaultOpen>
            <Button>Raised</Button>
          </Tooltip>
        </PortalContainerProvider>
      </>,
    );
    const layered = screen.getByRole('tooltip', { name: 'Layered' });
    expect(layered).toHaveAttribute('data-layer', 'tooltip');
    expect(layered.style.zIndex).toBe('150');
    expect(screen.getByRole('tooltip', { name: 'Raised' }).style.zIndex).toBe('900');
  });

  it('UIC-TOOLTIP-1.6 defaults to the default variant', () => {
    render(
      <Tooltip content="Plain" defaultOpen>
        <Button>Plain</Button>
      </Tooltip>,
    );
    expect(tooltip()).toHaveAttribute('data-variant', 'default');
    expect(tooltip()).toHaveAttribute('data-placement', 'top');
  });

  it('UIC-TOOLTIP-1.7 follows controlled state and reports changes', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Tooltip content="Controlled" isOpen={false} onOpenChange={onOpenChange}>
        <Button>Controlled</Button>
      </Tooltip>,
    );
    await hover(screen.getByRole('button', { name: 'Controlled' }));
    await advance(500);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(tooltip()).toBeNull();
    rerender(
      <Tooltip content="Controlled" isOpen onOpenChange={onOpenChange}>
        <Button>Controlled</Button>
      </Tooltip>,
    );
    expect(tooltip()).toHaveTextContent('Controlled');
  });

  it('UIC-TOOLTIP-1.7 draws a disabled hint closed and asks once to close it', async () => {
    const onOpenChange = vi.fn();
    const onPress = vi.fn();
    const hint = (props: { isOpen?: boolean; defaultOpen?: boolean; isDisabled?: boolean }) => (
      <Tooltip content="Hint" onOpenChange={onOpenChange} {...props}>
        <Button onPress={onPress}>Help</Button>
      </Tooltip>
    );
    const { rerender, unmount } = render(hint({ isOpen: true, isDisabled: true }));
    expect(tooltip()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(hint({ isOpen: true, isDisabled: true }));
    await advance(1000);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    rerender(hint({ isOpen: true }));
    expect(tooltip()).toHaveTextContent('Hint');
    const button = screen.getByRole('button', { name: 'Help' });
    rerender(hint({ isOpen: true, isDisabled: true }));
    expect(tooltip()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Help' })).toBe(button);
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    unmount();

    // An uncontrolled hint that opened stays closed once it is enabled again.
    const uncontrolled = render(hint({ defaultOpen: true, isDisabled: true }));
    expect(tooltip()).toBeNull();
    uncontrolled.rerender(hint({ defaultOpen: true }));
    expect(tooltip()).toBeNull();
  });

  it('UIC-TOOLTIP-1.8 appends the caller class and forwards data attributes to the panel', () => {
    render(
      <Tooltip content="Hint" defaultOpen className="caller" data-test="panel" data-variant="x">
        <Button>Probe</Button>
      </Tooltip>,
    );
    const panel = screen.getByRole('tooltip');
    expect(panel).toHaveClass('ui-tooltip', 'caller');
    expect(panel).toHaveAttribute('data-test', 'panel');
    expect(panel).toHaveAttribute('data-variant', 'default');
    expect(panel).toHaveAttribute('role', 'tooltip');
    expectHooksMatchSpec(document.body, 'TOOLTIP', { callerAttributes: ['data-test'] });
  });

  it('UIC-TOOLTIP-1.9 names the trigger by the hint, open or not, without describing it', async () => {
    render(
      <>
        <Tooltip relationship="label" content="Bold">
          <AriaButton>
            <svg aria-hidden="true" />
          </AriaButton>
        </Tooltip>
        <Tooltip relationship="label" content="Italic">
          <Button aria-describedby="italic-note">I</Button>
        </Tooltip>
        <span id="italic-note">Slanted text</span>
      </>,
    );
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAccessibleDescription('');
    await tabTo(bold);
    expect(tooltip()).toHaveTextContent('Bold');
    expect(bold).toHaveAccessibleName('Bold');
    expect(bold).toHaveAccessibleDescription('');
    act(() => bold.blur());
    await advance(3000);
    expect(tooltip()).toBeNull();
    expect(bold).toHaveAccessibleName('Bold');

    const italic = screen.getByRole('button', { name: 'Italic' });
    await tabTo(italic);
    expect(tooltip()).toHaveTextContent('Italic');
    expect(italic).toHaveAccessibleDescription('Slanted text');
    act(() => italic.blur());
    await advance(3000);
  });

  it("UIC-TOOLTIP-1.9 keeps a trigger's own name and still adds no description", async () => {
    render(
      <Tooltip relationship="label" content="Inbox">
        <AriaButton aria-label="Inbox, 3 unread">
          <svg aria-hidden="true" />
        </AriaButton>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Inbox, 3 unread' });
    await tabTo(trigger);
    expect(tooltip()).toHaveTextContent('Inbox');
    expect(trigger).toHaveAccessibleName('Inbox, 3 unread');
    expect(trigger).toHaveAccessibleDescription('');
  });

  it('UIC-TOOLTIP-1.9 describes the trigger when the hint is not a string', async () => {
    render(
      <Tooltip relationship="label" content={<strong>Underline</strong>}>
        <AriaButton aria-label="U">U</AriaButton>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'U' });
    await tabTo(trigger);
    expect(trigger).toHaveAccessibleName('U');
    expect(trigger).toHaveAccessibleDescription('Underline');
  });
});

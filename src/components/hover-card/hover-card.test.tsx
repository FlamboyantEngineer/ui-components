import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { Dialog, Link } from '../../primitives/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { HoverCard, HoverCardTrigger, type HoverCardProps } from './hover-card.js';

type TriggerOptions = Omit<Parameters<typeof HoverCardTrigger>[0], 'children'>;
type User = ReturnType<typeof userEvent.setup>;

/**
 * Moves the pointer in the window. React Aria keeps an open card while the pointer is over the
 * trigger, the card or the area between them; jsdom lays both out at the origin.
 */
async function movePointer(user: User, at: 'between' | 'away') {
  const point = at === 'between' ? 2 : 500;
  await user.pointer({ target: document.body, coords: { clientX: point, clientY: point } });
}

/**
 * Rests the pointer on `element`. React Aria opens a preview only for a pointer it has seen move, and
 * a reader's pointer crosses the page before it enters the trigger, so it moves over the page first.
 */
async function hover(user: User, element: Element) {
  await user.pointer([
    { target: document.body, coords: { clientX: 1, clientY: 1 } },
    { target: element },
  ]);
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

function Preview({
  triggerProps = {},
  onPress,
  ...props
}: Partial<HoverCardProps> & { triggerProps?: TriggerOptions; onPress?: () => void }) {
  return (
    <>
      <button type="button">Before</button>
      <HoverCardTrigger {...triggerProps}>
        <Button onPress={onPress}>Lisbon</Button>
        <HoverCard aria-label="About Lisbon" {...props}>
          {props.children ?? (
            <>
              <p>Capital of Portugal, on the Tagus.</p>
              <button type="button">Save city</button>
            </>
          )}
        </HoverCard>
      </HoverCardTrigger>
    </>
  );
}

const card = () => document.querySelector<HTMLElement>('.ui-hover-card');
const trigger = () => screen.getByRole('button', { name: 'Lisbon' });

describe('HoverCard', () => {
  let user: User;

  beforeEach(() => {
    vi.useFakeTimers();
    // Testing Library's async wrapper ends each user-event call on a zero-delay timer, which it only
    // advances under Jest's fake timers; point it at Vitest's clock so no real time passes.
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  });

  afterEach(async () => {
    // Let React Aria's global warm-up and cool-down timers settle between tests.
    await advance(5000);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each(['button hint', 'tooltip'])(
    'UIC-HOVER-CARD-1.1 opens the card from a trigger that has its own %s',
    async (kind) => {
      const lisbon =
        kind === 'tooltip' ? (
          <Tooltip content="City page">
            <Button>Lisbon</Button>
          </Tooltip>
        ) : (
          <Button tooltip="City page">Lisbon</Button>
        );
      render(
        <HoverCardTrigger>
          {lisbon}
          <HoverCard aria-label="About Lisbon">
            <p>Capital of Portugal.</p>
          </HoverCard>
        </HoverCardTrigger>,
      );
      expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
      await hover(user, trigger());
      await advance(1000);
      const dialog = screen.getByRole('dialog', { name: 'About Lisbon' });
      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
      expect(trigger()).toHaveAttribute('aria-describedby', expect.stringContaining(dialog.id));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    },
  );

  it('UIC-HOVER-CARD-1.1 UIC-HOVER-CARD-2.1 UIC-HOVER-CARD-2.3 opens a named card that describes its trigger', async () => {
    const onPress = vi.fn();
    const { container } = render(
      <Preview
        onPress={onPress}
        className="extra"
        id="lisbon-card"
        data-lab="card"
        showArrow
        triggerProps={{ delay: 300 }}
      />,
    );
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    await hover(user, trigger());
    await advance(300);
    const dialog = screen.getByRole('dialog', { name: 'About Lisbon' });
    expect(dialog).toBe(card());
    expect(container.contains(dialog)).toBe(false);
    expect(dialog).toHaveClass('ui-hover-card', 'extra');
    expect(dialog).toHaveAttribute('data-lab', 'card');
    expect(dialog).toHaveAttribute('data-trigger', 'PreviewTrigger');
    expect(dialog.id).toContain('lisbon-card');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-describedby', expect.stringContaining(dialog.id));
    expectHooksMatchSpec(document.body, 'HOVER-CARD', {
      slots: 'all',
      callerAttributes: ['data-lab'],
    });

    await user.click(trigger());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(card()).not.toBeNull();
    expect(trigger()).toHaveFocus();
    await user.keyboard('{Escape}');
    await advance(1000);
    expect(card()).toBeNull();
  });

  it('UIC-HOVER-CARD-1.2 opens after the hover delay without taking focus and cancels on leave', async () => {
    render(<Preview />);
    await hover(user, trigger());
    await advance(599);
    expect(card()).toBeNull();
    await advance(1);
    expect(card()).not.toBeNull();
    expect(card()?.contains(document.activeElement)).toBe(false);
    await user.unhover(trigger());
    await movePointer(user, 'away');
    await advance(1000);
    expect(card()).toBeNull();

    await advance(5000);
    await hover(user, trigger());
    await advance(300);
    await user.unhover(trigger());
    await advance(1000);
    expect(card()).toBeNull();
  });

  it('UIC-HOVER-CARD-1.2 opens on a long touch and moves focus into the card', async () => {
    vi.stubGlobal('ontouchstart', null);
    render(<Preview />);
    expect(trigger()).toHaveAccessibleDescription(/long press/i);
    await user.pointer({ keys: '[TouchA>]', target: trigger() });
    await advance(500);
    expect(card()).not.toBeNull();
    await user.pointer({ keys: '[/TouchA]', target: trigger() });
    await advance(0);
    expect(card()?.contains(document.activeElement)).toBe(true);
  });

  it('UIC-HOVER-CARD-1.2 opens a neighbouring card at once right after one closes', async () => {
    render(
      <>
        <Preview />
        <HoverCardTrigger>
          <Button>Oslo</Button>
          <HoverCard aria-label="About Oslo">Capital of Norway.</HoverCard>
        </HoverCardTrigger>
      </>,
    );
    await hover(user, trigger());
    await advance(600);
    expect(screen.getByRole('dialog', { name: 'About Lisbon' })).toBeInTheDocument();
    await user.unhover(trigger());
    await hover(user, screen.getByRole('button', { name: 'Oslo' }));
    await advance(0);
    expect(screen.getByRole('dialog', { name: 'About Oslo' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'About Lisbon' })).not.toBeInTheDocument();
    await user.unhover(screen.getByRole('button', { name: 'Oslo' }));
    await movePointer(user, 'away');
    await advance(1000);
    expect(card()).toBeNull();
  });

  it('UIC-HOVER-CARD-1.2 UIC-HOVER-CARD-1.3 opens on keyboard focus, lets Tab in and closes on Escape', async () => {
    render(
      <>
        <Preview triggerProps={{ delay: 300 }} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(trigger()).toHaveFocus();
    expect(card()).toBeNull();
    await advance(300);
    expect(card()).not.toBeNull();
    expect(trigger()).toHaveFocus();
    // The card is portalled after the After button; Tab still moves into it first.
    await user.tab();
    expect(card()?.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Escape}');
    await advance(1000);
    expect(card()).toBeNull();
    // Focus returns in an animation frame once the card has gone.
    await advance(100);
    expect(trigger()).toHaveFocus();
  });

  it('UIC-HOVER-CARD-1.3 opens the tooltip of a control inside the open card and stays open', async () => {
    render(
      <Preview triggerProps={{ delay: 0 }}>
        <Button tooltip="Keep this city">Save city</Button>
      </Preview>,
    );
    await user.tab();
    await user.tab();
    await advance(0);
    expect(card()).not.toBeNull();
    await user.tab();
    const save = screen.getByRole('button', { name: 'Save city' });
    expect(save).toHaveFocus();
    await advance(1000);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Keep this city');
    expect(card()).not.toBeNull();
    await hover(user, save);
    await advance(1000);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Keep this city');
    expect(card()).not.toBeNull();
  });

  it('UIC-HOVER-CARD-1.3 stays open while the pointer moves into the card, then closes after the close delay', async () => {
    render(<Preview triggerProps={{ delay: 0, closeDelay: 400 }} />);
    await hover(user, trigger());
    await advance(0);
    await user.unhover(trigger());
    await movePointer(user, 'between');
    await hover(user, card() as HTMLElement);
    await advance(1000);
    expect(card()).not.toBeNull();
    await movePointer(user, 'away');
    await advance(399);
    expect(card()).not.toBeNull();
    await advance(1);
    expect(card()).toBeNull();
  });

  it('UIC-HOVER-CARD-1.4 follows a controlled state, opens with defaultOpen and stays closed while disabled', async () => {
    const onOpenChange = vi.fn();
    function Controlled() {
      const [isOpen, setOpen] = useState(true);
      return (
        <Preview
          triggerProps={{
            isOpen,
            onOpenChange: (next) => {
              onOpenChange(next);
              setOpen(next);
            },
          }}
        />
      );
    }
    const { unmount } = render(<Controlled />);
    expect(card()).not.toBeNull();
    act(() => trigger().focus());
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await advance(1000);
    expect(card()).toBeNull();
    unmount();

    const { unmount: unmountDefault } = render(<Preview triggerProps={{ defaultOpen: true }} />);
    expect(card()).not.toBeNull();
    unmountDefault();

    render(<Preview triggerProps={{ isDisabled: true, delay: 0 }} />);
    await hover(user, screen.getByRole('button', { name: 'Lisbon' }));
    await advance(1000);
    expect(card()).toBeNull();
  });

  it('UIC-HOVER-CARD-1.4 keeps the trigger while it is disabled, closing its card and popup semantics', async () => {
    const { rerender } = render(<Preview triggerProps={{ delay: 0 }} />);
    const button = trigger();
    await user.tab();
    await user.tab();
    await advance(100);
    expect(card()).not.toBeNull();
    rerender(<Preview triggerProps={{ delay: 0, isDisabled: true }} />);
    await advance(1000);
    expect(card()).toBeNull();
    expect(trigger()).toBe(button);
    expect(button).toHaveFocus();
    for (const name of ['aria-haspopup', 'aria-expanded', 'aria-describedby']) {
      expect(button).not.toHaveAttribute(name);
    }
    rerender(<Preview triggerProps={{ delay: 0 }} />);
    expect(trigger()).toBe(button);
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('UIC-HOVER-CARD-1.4 draws a disabled card closed and asks once to close it', async () => {
    const onOpenChange = vi.fn();
    const onPress = vi.fn();
    const preview = (props: TriggerOptions) => (
      <Preview onPress={onPress} triggerProps={{ closeDelay: 0, onOpenChange, ...props }} />
    );
    const { rerender, unmount } = render(preview({ isOpen: true, isDisabled: true }));
    expect(card()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(preview({ isOpen: true, isDisabled: true }));
    await advance(1000);
    expect(card()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    rerender(preview({ isOpen: true }));
    expect(card()).not.toBeNull();
    const button = trigger();
    rerender(preview({ isOpen: true, isDisabled: true }));
    await advance(1000);
    expect(card()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(trigger()).toBe(button);
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    unmount();

    // An uncontrolled card that opened stays closed once the trigger is enabled again.
    const uncontrolled = render(preview({ defaultOpen: true, isDisabled: true }));
    expect(card()).toBeNull();
    uncontrolled.rerender(preview({ defaultOpen: true }));
    await advance(1000);
    expect(card()).toBeNull();
  });

  it('UIC-HOVER-CARD-2.1 becomes a plain container around content with its own dialog', async () => {
    render(
      <HoverCardTrigger defaultOpen>
        <Link href="#maria">Maria</Link>
        <HoverCard>
          <Dialog aria-label="Maria Santos">Research team</Dialog>
        </HoverCard>
      </HoverCardTrigger>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Maria Santos' });
    expect(card()).not.toHaveAttribute('role');
    expect(card()?.contains(dialog)).toBe(true);
  });

  it('UIC-HOVER-CARD-2.2 places the card, points an arrow at the trigger and stacks it on the dropdown layer', async () => {
    const { unmount } = render(
      <Preview
        placement="top"
        offset={12}
        crossOffset={4}
        showArrow
        triggerProps={{ defaultOpen: true }}
      />,
    );
    expect(card()).toHaveAttribute('data-placement', 'top');
    expect(card()?.querySelector(':scope > .ui-hover-card__arrow')).toHaveAttribute(
      'data-placement',
      'top',
    );
    expect(card()?.style.zIndex).toBe('130');
    unmount();
    render(<Preview triggerProps={{ defaultOpen: true }} />);
    expect(card()).toHaveAttribute('data-placement', 'bottom');
    expect(document.querySelector('.ui-hover-card__arrow')).toBeNull();
  });
});

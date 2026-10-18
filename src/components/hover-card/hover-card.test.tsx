import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Dialog, Link } from 'react-aria-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { HoverCard, HoverCardTrigger, type HoverCardProps } from './hover-card.js';

type TriggerOptions = Omit<Parameters<typeof HoverCardTrigger>[0], 'children'>;

function hover(element: Element) {
  fireEvent.pointerMove(element, { pointerType: 'mouse' });
  fireEvent.pointerEnter(element, { pointerType: 'mouse' });
  fireEvent.mouseEnter(element);
}

function unhover(element: Element) {
  fireEvent.pointerLeave(element, { pointerType: 'mouse' });
  fireEvent.mouseLeave(element);
}

/**
 * Moves the pointer in the window. React Aria keeps an open card while the pointer is over the
 * trigger, the card or the area between them; jsdom lays both out at the origin.
 */
function movePointer(at: 'between' | 'away') {
  const point = at === 'between' ? 2 : 500;
  fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: point, clientY: point });
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

function focusByKeyboard(element: HTMLElement) {
  act(() => {
    fireEvent.keyDown(document.body, { key: 'Tab' });
    element.focus();
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
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // Let React Aria's global warm-up and cool-down timers settle between tests.
    await advance(5000);
    vi.useRealTimers();
  });

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
    hover(trigger());
    await advance(300);
    const dialog = screen.getByRole('dialog', { name: 'About Lisbon' });
    expect(dialog).toBe(card());
    expect(container.contains(dialog)).toBe(false);
    expect(dialog).toHaveClass('ui-hover-card', 'extra');
    expect(dialog).toHaveAttribute('data-lab', 'card');
    expect(dialog).toHaveAttribute('data-trigger', 'PreviewTrigger');
    expect(dialog.id).toContain('lisbon-card');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger().getAttribute('aria-describedby')).toContain(dialog.id);
    expectHooksMatchSpec(document.body, 'HOVER-CARD', {
      slots: 'all',
      callerAttributes: ['data-lab'],
    });

    fireEvent.click(trigger());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(card()).not.toBeNull();
    act(() => {
      fireEvent.keyDown(trigger(), { key: 'Escape' });
    });
    await advance(1000);
    expect(card()).toBeNull();
  });

  it('UIC-HOVER-CARD-1.2 opens after the hover delay without taking focus and cancels on leave', async () => {
    render(<Preview />);
    hover(trigger());
    await advance(599);
    expect(card()).toBeNull();
    await advance(1);
    expect(card()).not.toBeNull();
    expect(card()?.contains(document.activeElement)).toBe(false);
    unhover(trigger());
    movePointer('away');
    await advance(1000);
    expect(card()).toBeNull();

    await advance(5000);
    hover(trigger());
    await advance(300);
    unhover(trigger());
    await advance(1000);
    expect(card()).toBeNull();
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
    hover(trigger());
    await advance(600);
    expect(screen.getByRole('dialog', { name: 'About Lisbon' })).toBeInTheDocument();
    unhover(trigger());
    hover(screen.getByRole('button', { name: 'Oslo' }));
    await advance(0);
    expect(screen.getByRole('dialog', { name: 'About Oslo' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'About Lisbon' })).toBeNull();
    unhover(screen.getByRole('button', { name: 'Oslo' }));
    movePointer('away');
    await advance(1000);
    expect(card()).toBeNull();
  });

  it('UIC-HOVER-CARD-1.2 UIC-HOVER-CARD-1.3 opens on keyboard focus, lets Tab in and closes on Escape', async () => {
    render(<Preview triggerProps={{ delay: 300 }} />);
    focusByKeyboard(trigger());
    expect(card()).toBeNull();
    await advance(300);
    expect(card()).not.toBeNull();
    expect(trigger()).toHaveFocus();
    act(() => {
      fireEvent.keyDown(trigger(), { key: 'Tab' });
    });
    expect(card()?.contains(document.activeElement)).toBe(true);
    act(() => {
      fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    });
    await advance(1000);
    expect(card()).toBeNull();
    // Focus returns in an animation frame once the card has gone.
    await advance(100);
    expect(trigger()).toHaveFocus();
  });

  it('UIC-HOVER-CARD-1.3 stays open while the pointer moves into the card, then closes after the close delay', async () => {
    render(<Preview triggerProps={{ delay: 0, closeDelay: 400 }} />);
    hover(trigger());
    await advance(0);
    unhover(trigger());
    movePointer('between');
    hover(card() as HTMLElement);
    await advance(1000);
    expect(card()).not.toBeNull();
    movePointer('away');
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
    act(() => {
      fireEvent.keyDown(trigger(), { key: 'Escape' });
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await advance(1000);
    expect(card()).toBeNull();
    unmount();

    const { unmount: unmountDefault } = render(<Preview triggerProps={{ defaultOpen: true }} />);
    expect(card()).not.toBeNull();
    unmountDefault();

    render(<Preview triggerProps={{ isDisabled: true, delay: 0 }} />);
    hover(screen.getByRole('button', { name: 'Lisbon' }));
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

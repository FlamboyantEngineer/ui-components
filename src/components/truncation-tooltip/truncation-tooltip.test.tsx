import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { TruncationTooltip } from './truncation-tooltip.js';

const FULL_TEXT = 'Quarterly report for the northern region.pdf';

const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

/** jsdom has no layout: give an element the box of cut (or whole) text. */
function setBox(element: HTMLElement, { cut }: { cut: boolean }) {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 100 });
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: cut ? 240 : 100 });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: 20 });
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: 20 });
}

let user: ReturnType<typeof userEvent.setup>;

/**
 * Fake timers with a user-event session. Testing Library drains a zero timeout after each user-event
 * call and advances it only under Jest's fake timers, so it is pointed at Vitest's clock here.
 */
function useFakeClock() {
  vi.useFakeTimers();
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

/** Brings the mouse to rest on `element`, arriving from elsewhere on the page. */
async function rest(element: Element) {
  await user.pointer({ target: document.body });
  await user.hover(element);
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('TruncationTooltip', () => {
  beforeEach(() => {
    user = useFakeClock();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('UIC-TRUNCATION-TOOLTIP-1.1 renders the text without semantics of its own', () => {
    const { container } = render(<TruncationTooltip>{FULL_TEXT}</TruncationTooltip>);
    const text = container.firstElementChild as HTMLElement;
    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveClass('ui-truncation-tooltip');
    expect(text).toHaveTextContent(FULL_TEXT);
    expect(text).not.toHaveAttribute('role');
    expect(text).not.toHaveAttribute('tabindex');
    expect(text).not.toHaveAttribute('aria-label');
    expect(tooltip()).toBeNull();
    expectHooksMatchSpec(container, 'TRUNCATION-TOOLTIP');
  });

  it('UIC-TRUNCATION-TOOLTIP-1.2 UIC-TRUNCATION-TOOLTIP-1.5 shows the full text after the delay only when cut', async () => {
    render(
      <>
        <TruncationTooltip>{FULL_TEXT}</TruncationTooltip>
        <TruncationTooltip>Fits</TruncationTooltip>
      </>,
    );
    const cut = screen.getByText(FULL_TEXT);
    const whole = screen.getByText('Fits');
    setBox(cut, { cut: true });
    setBox(whole, { cut: false });

    await rest(whole);
    await advance(1000);
    expect(tooltip()).toBeNull();

    await rest(cut);
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    const panel = tooltip();
    expect(panel).toHaveTextContent(FULL_TEXT);
    expect(panel).toHaveClass('ui-tooltip', 'ui-truncation-tooltip__panel');
    expect(panel).toHaveAttribute('data-variant', 'default');
    expect(cut).not.toHaveAttribute('aria-describedby');
    expect(document.body).toHaveFocus();
    expectHooksMatchSpec(document.body, 'TRUNCATION-TOOLTIP', { slots: ['panel'] });
    expectHooksMatchSpec(document.body, 'TOOLTIP', { slots: ['content'] });
  });

  it('UIC-TRUNCATION-TOOLTIP-1.2 cancels on leave, ignores touch and honours a custom delay', async () => {
    render(<TruncationTooltip delay={200}>{FULL_TEXT}</TruncationTooltip>);
    const text = screen.getByText(FULL_TEXT);
    setBox(text, { cut: true });
    // user-event enters with a touch pointer only by pressing it, and a press closes the tooltip by
    // itself; a lone touch enter checks that touch is ignored.
    // eslint-disable-next-line testing-library/prefer-user-event -- a touch enter without a press
    fireEvent.pointerEnter(text, { pointerType: 'touch' });
    await advance(1000);
    expect(tooltip()).toBeNull();
    await rest(text);
    await advance(100);
    await user.unhover(text);
    await advance(1000);
    expect(tooltip()).toBeNull();
    await rest(text);
    await advance(200);
    expect(tooltip()).not.toBeNull();
  });

  it('UIC-TRUNCATION-TOOLTIP-1.3 opens at once when keyboard focus reaches the holding link', async () => {
    render(
      <>
        <a href="#report">
          <TruncationTooltip>{FULL_TEXT}</TruncationTooltip>
        </a>
        <button type="button">Next</button>
      </>,
    );
    const link = screen.getByRole('link', { name: FULL_TEXT });
    setBox(screen.getByText(FULL_TEXT), { cut: true });
    await user.tab();
    expect(link).toHaveFocus();
    expect(tooltip()).toHaveTextContent(FULL_TEXT);
    await act(async () => screen.getByRole('button', { name: 'Next' }).focus());
    expect(tooltip()).toBeNull();
    await user.pointer({ keys: '[MouseLeft>]', target: link });
    await act(async () => link.focus());
    expect(tooltip()).toBeNull();
  });

  it('UIC-TRUNCATION-TOOLTIP-1.3 stays closed when a script moves focus after a pointer press', async () => {
    render(
      <>
        <button type="button">Close menu</button>
        <a href="#report">
          <TruncationTooltip>{FULL_TEXT}</TruncationTooltip>
        </a>
      </>,
    );
    const link = screen.getByRole('link', { name: FULL_TEXT });
    setBox(screen.getByText(FULL_TEXT), { cut: true });
    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    // Focus restoration after a menu or dialog closes is not keyboard focus.
    await act(async () => link.focus());
    expect(link).toHaveFocus();
    expect(tooltip()).toBeNull();
    await user.tab({ shift: true });
    await user.tab();
    expect(link).toHaveFocus();
    expect(tooltip()).toHaveTextContent(FULL_TEXT);
  });

  it('UIC-TRUNCATION-TOOLTIP-1.3 stays closed when the focused text fits', async () => {
    render(
      <a href="#short">
        <TruncationTooltip>Short</TruncationTooltip>
      </a>,
    );
    setBox(screen.getByText('Short'), { cut: false });
    const link = screen.getByRole('link', { name: 'Short' });
    await act(async () => link.focus());
    expect(tooltip()).toBeNull();
  });

  it('UIC-TRUNCATION-TOOLTIP-1.4 closes on leave, press and Escape', async () => {
    const outer = vi.fn();
    render(
      <div onKeyDown={outer}>
        <TruncationTooltip>{FULL_TEXT}</TruncationTooltip>
        <button type="button">Rename</button>
      </div>,
    );
    const text = screen.getByText(FULL_TEXT);
    setBox(text, { cut: true });

    await rest(text);
    await advance(500);
    expect(tooltip()).not.toBeNull();
    await user.unhover(text);
    expect(tooltip()).toBeNull();

    await rest(text);
    await advance(500);
    await user.pointer({ keys: '[MouseLeft]', target: text });
    expect(tooltip()).toBeNull();

    // Keys reach the wrapper from a control inside it, as they would from the focused control.
    act(() => screen.getByRole('button', { name: 'Rename' }).focus());
    await rest(text);
    await advance(500);
    expect(tooltip()).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(tooltip()).toBeNull();
    expect(outer).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it('UIC-TRUNCATION-TOOLTIP-1.5 keeps its own panel inside a control that has a hint', async () => {
    render(
      <Tooltip content="Open the file">
        <Button>
          <TruncationTooltip>{FULL_TEXT}</TruncationTooltip>
        </Button>
      </Tooltip>,
    );
    setBox(screen.getByText(FULL_TEXT), { cut: true });
    const button = screen.getByRole('button');
    await user.tab();
    expect(button).toHaveFocus();
    const panels = [...document.querySelectorAll('[role="tooltip"]')];
    expect(panels).toHaveLength(2);
    const [hint, full] = [
      panels.find((panel) => panel.textContent === 'Open the file'),
      panels.find((panel) => panel.classList.contains('ui-truncation-tooltip__panel')),
    ];
    expect(full).toHaveTextContent(FULL_TEXT);
    expect(hint?.id).toBeTruthy();
    expect(full?.id).not.toBe(hint?.id);
    expect(button).toHaveAttribute('aria-describedby', hint?.id);
    act(() => button.blur());
    await advance(5000);
  });

  it('UIC-TRUNCATION-TOOLTIP-1.5 uses the requested placement', async () => {
    render(<TruncationTooltip placement="bottom">{FULL_TEXT}</TruncationTooltip>);
    const text = screen.getByText(FULL_TEXT);
    setBox(text, { cut: true });
    await rest(text);
    await advance(500);
    expect(tooltip()).toHaveAttribute('data-placement', 'bottom');
  });

  it('UIC-TRUNCATION-TOOLTIP-1.6 appends the caller class and forwards id, ref, native and data attributes', async () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <TruncationTooltip
        className="caller"
        id="name"
        ref={ref}
        aria-live="polite"
        dir="ltr"
        data-test="probe"
      >
        {FULL_TEXT}
      </TruncationTooltip>,
    );
    const text = screen.getByText(FULL_TEXT);
    expect(ref.current).toBe(text);
    expect(text).toHaveAttribute('data-test', 'probe');
    expect(text).toHaveClass('ui-truncation-tooltip', 'caller');
    expect(text).toHaveAttribute('id', 'name');
    expect(text).toHaveAttribute('aria-live', 'polite');
    expect(text).toHaveAttribute('dir', 'ltr');
    expectHooksMatchSpec(document.body, 'TRUNCATION-TOOLTIP', { callerAttributes: ['data-test'] });
    setBox(text, { cut: true });
    await rest(text);
    await advance(500);
    expect(tooltip()).toHaveTextContent(FULL_TEXT);
  });

  it('UIC-TRUNCATION-TOOLTIP-2.1 shows cut text whole in place and cuts it again', async () => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    const user = userEvent.setup();
    // Text measures as cut until it is shown whole, as the reference sheet draws it.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.hasAttribute('data-expanded') ? 100 : 240;
    });
    const onExpandedChange = vi.fn();
    const { container } = render(
      <>
        <TruncationTooltip expandable onExpandedChange={onExpandedChange}>
          {FULL_TEXT}
        </TruncationTooltip>
        <TruncationTooltip>{FULL_TEXT}</TruncationTooltip>
      </>,
    );
    const [text] = Array.from(container.querySelectorAll('.ui-truncation-tooltip'));
    const more = screen.getByRole('button', { name: 'Show more' });
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(more).toHaveClass('ui-button', 'ui-truncation-tooltip__toggle');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveAttribute('aria-controls', text?.id);
    expect(text?.nextElementSibling).toBe(more);
    expect(text).not.toHaveAttribute('data-expanded');
    expectHooksMatchSpec(container, 'TRUNCATION-TOOLTIP', { slots: ['toggle'] });

    await user.click(more);
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(text).toHaveAttribute('data-expanded', 'true');
    const less = screen.getByRole('button', { name: 'Show less' });
    expect(less).toHaveAttribute('aria-expanded', 'true');
    await user.hover(text as Element);
    await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
    expect(tooltip()).toBeNull();

    await user.click(less);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(text).not.toHaveAttribute('data-expanded');
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('UIC-TRUNCATION-TOOLTIP-2.1 draws no control for text that fits and follows controlled state', () => {
    const { rerender } = render(
      <TruncationTooltip expandable id="notes">
        Fits
      </TruncationTooltip>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(
      <UiProvider strings={{ showLess: 'Moins' }}>
        <TruncationTooltip expandable id="notes" isExpanded>
          Fits
        </TruncationTooltip>
      </UiProvider>,
    );
    const less = screen.getByRole('button', { name: 'Moins' });
    expect(less).toHaveAttribute('aria-controls', 'notes');
    expect(document.getElementById('notes')).toHaveAttribute('data-expanded', 'true');
  });
});

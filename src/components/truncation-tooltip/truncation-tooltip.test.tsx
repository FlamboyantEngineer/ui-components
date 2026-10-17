import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
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

function rest(element: Element, pointerType = 'mouse') {
  fireEvent.pointerEnter(element, { pointerType });
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('TruncationTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
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
        <TruncationTooltip data-testid="cut">{FULL_TEXT}</TruncationTooltip>
        <TruncationTooltip data-testid="whole">Fits</TruncationTooltip>
      </>,
    );
    const cut = screen.getByTestId('cut');
    const whole = screen.getByTestId('whole');
    setBox(cut, { cut: true });
    setBox(whole, { cut: false });

    rest(whole);
    await advance(1000);
    expect(tooltip()).toBeNull();

    rest(cut);
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    const panel = tooltip();
    expect(panel).toHaveTextContent(FULL_TEXT);
    expect(panel).toHaveClass('ui-tooltip', 'ui-truncation-tooltip__panel');
    expect(panel).toHaveAttribute('data-variant', 'default');
    expect(cut).not.toHaveAttribute('aria-describedby');
    expect(document.activeElement).toBe(document.body);
    expectHooksMatchSpec(document.body, 'TRUNCATION-TOOLTIP', { slots: ['panel'] });
    expectHooksMatchSpec(document.body, 'TOOLTIP', { slots: ['content'] });
  });

  it('UIC-TRUNCATION-TOOLTIP-1.2 cancels on leave, ignores touch and honours a custom delay', async () => {
    render(<TruncationTooltip delay={200}>{FULL_TEXT}</TruncationTooltip>);
    const text = screen.getByText(FULL_TEXT);
    setBox(text, { cut: true });
    rest(text, 'touch');
    await advance(1000);
    expect(tooltip()).toBeNull();
    rest(text);
    await advance(100);
    fireEvent.pointerLeave(text, { pointerType: 'mouse' });
    await advance(1000);
    expect(tooltip()).toBeNull();
    rest(text);
    await advance(200);
    expect(tooltip()).not.toBeNull();
  });

  it('UIC-TRUNCATION-TOOLTIP-1.3 opens at once when keyboard focus reaches the holding link', async () => {
    render(
      <>
        <a href="#report" data-testid="link">
          <TruncationTooltip>{FULL_TEXT}</TruncationTooltip>
        </a>
        <button type="button">Next</button>
      </>,
    );
    const link = screen.getByTestId('link');
    setBox(screen.getByText(FULL_TEXT), { cut: true });
    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      link.focus();
    });
    expect(tooltip()).toHaveTextContent(FULL_TEXT);
    await act(async () => screen.getByRole('button', { name: 'Next' }).focus());
    expect(tooltip()).toBeNull();
    fireEvent.pointerDown(link, { pointerType: 'mouse' });
    await act(async () => link.focus());
    expect(tooltip()).toBeNull();
  });

  it('UIC-TRUNCATION-TOOLTIP-1.3 stays closed when the focused text fits', async () => {
    render(
      <a href="#short" data-testid="link">
        <TruncationTooltip>Short</TruncationTooltip>
      </a>,
    );
    setBox(screen.getByText('Short'), { cut: false });
    await act(async () => screen.getByTestId('link').focus());
    expect(tooltip()).toBeNull();
  });

  it('UIC-TRUNCATION-TOOLTIP-1.4 closes on leave, press and Escape', async () => {
    const outer = vi.fn();
    render(
      <div onKeyDown={outer}>
        <TruncationTooltip>{FULL_TEXT}</TruncationTooltip>
      </div>,
    );
    const text = screen.getByText(FULL_TEXT);
    setBox(text, { cut: true });

    rest(text);
    await advance(500);
    expect(tooltip()).not.toBeNull();
    fireEvent.pointerLeave(text, { pointerType: 'mouse' });
    expect(tooltip()).toBeNull();

    rest(text);
    await advance(500);
    fireEvent.pointerDown(text, { pointerType: 'mouse' });
    expect(tooltip()).toBeNull();

    rest(text);
    await advance(500);
    expect(tooltip()).not.toBeNull();
    fireEvent.keyDown(text, { key: 'Escape' });
    expect(tooltip()).toBeNull();
    expect(outer).not.toHaveBeenCalled();
    fireEvent.keyDown(text, { key: 'Escape' });
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
    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      button.focus();
    });
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
    rest(text);
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
        data-testid="probe"
      >
        {FULL_TEXT}
      </TruncationTooltip>,
    );
    const text = screen.getByTestId('probe');
    expect(ref.current).toBe(text);
    expect(text).toHaveClass('ui-truncation-tooltip', 'caller');
    expect(text).toHaveAttribute('id', 'name');
    expect(text).toHaveAttribute('aria-live', 'polite');
    expect(text).toHaveAttribute('dir', 'ltr');
    expectHooksMatchSpec(document.body, 'TRUNCATION-TOOLTIP');
    setBox(text, { cut: true });
    rest(text);
    await advance(500);
    expect(tooltip()).toHaveTextContent(FULL_TEXT);
  });
});

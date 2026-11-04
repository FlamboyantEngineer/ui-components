import { act, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Modal } from '../modal/modal.js';
import { AnchoredTooltip, type AnchoredTooltipProps, type TooltipAnchor } from './tooltip.js';

const tooltip = () => document.querySelector<HTMLElement>('.ui-tooltip');

/** A host-owned chip and a hint the host shows for it. */
function HostChip(props: Omit<AnchoredTooltipProps, 'anchor' | 'content'>) {
  const chipRef = useRef<HTMLSpanElement>(null);
  return (
    <>
      <span ref={chipRef} role="note" aria-describedby="chip-help" aria-label="Status chip">
        Ready
      </span>
      <span id="chip-help">Updated hourly</span>
      <AnchoredTooltip {...props} anchor={chipRef} content="Ready to ship" />
    </>
  );
}

describe('AnchoredTooltip', () => {
  it('UIC-TOOLTIP-1.5 keeps a modal anchor hint outside the inert background', async () => {
    function DialogHint() {
      const anchor = useRef<HTMLSpanElement>(null);
      return (
        <>
          <Modal isOpen title="Build details" cancelAction={{ label: 'Close' }}>
            <span ref={anchor} role="status" aria-label="Build status">
              Passing
            </span>
          </Modal>
          <AnchoredTooltip isOpen anchor={anchor} content="All checks passed" />
        </>
      );
    }
    render(<DialogHint />);
    const panel = await screen.findByRole('tooltip');
    expect(panel.closest('[inert], [aria-hidden="true"]')).toBeNull();
    expect(panel).toHaveAttribute('data-react-aria-top-layer', 'true');
    expect(screen.getByRole('status', { name: 'Build status' })).toHaveAccessibleDescription(
      'All checks passed',
    );
  });

  it('UIC-TOOLTIP-2.1 UIC-TOOLTIP-2.3 shows on an existing element and describes it while open', () => {
    const { rerender } = render(<HostChip isOpen={false} />);
    const chip = screen.getByRole('note', { name: 'Status chip' });
    expect(tooltip()).toBeNull();
    rerender(<HostChip isOpen id="chip-hint" className="hint" data-kind="status" />);
    const panel = screen.getByRole('tooltip');
    expect(panel).toHaveTextContent('Ready to ship');
    expect(panel).toHaveAttribute('id', 'chip-hint');
    expect(panel).toHaveClass('ui-tooltip', 'hint');
    expect(panel).toHaveAttribute('data-kind', 'status');
    expect(panel).toHaveAttribute('data-variant', 'default');
    expect(chip).toHaveAttribute('aria-describedby', 'chip-help chip-hint');
    expect(chip).toHaveAccessibleDescription('Updated hourly Ready to ship');
    expectHooksMatchSpec(document.body, 'TOOLTIP', {
      slots: ['arrow', 'content'],
      callerAttributes: ['data-kind'],
    });
    rerender(<HostChip isOpen={false} id="chip-hint" />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(chip).toHaveAttribute('aria-describedby', 'chip-help');
  });

  it('UIC-TOOLTIP-1.5 UIC-TOOLTIP-2.1 sits on the tooltip layer like the child-trigger tooltip', () => {
    render(<HostChip isOpen />);
    expect(tooltip()).toHaveAttribute('data-layer', 'tooltip');
    expect(tooltip()?.style.zIndex).toBe('150');
  });

  it('UIC-TOOLTIP-2.1 UIC-TOOLTIP-2.4 points at an SVG element and cleans up when unmounted open', () => {
    function Shape({ isShown }: { isShown: boolean }) {
      const [circle, setCircle] = useState<SVGCircleElement | null>(null);
      return (
        <svg aria-label="Chart">
          <circle ref={setCircle} r={4} />
          {isShown ? (
            <AnchoredTooltip isOpen anchor={circle} content="Peak" variant="info" />
          ) : null}
        </svg>
      );
    }
    const { rerender } = render(<Shape isShown />);
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-variant', 'info');
    const circle = document.querySelector('circle');
    expect(circle?.getAttribute('aria-describedby')).toBe(screen.getByRole('tooltip').id);
    rerender(<Shape isShown={false} />);
    expect(tooltip()).toBeNull();
    expect(circle).not.toHaveAttribute('aria-describedby');
  });

  it('UIC-TOOLTIP-2.2 points at a rectangle without rendering a trigger', () => {
    const rect = { top: 40, left: 60, width: 20, height: 10 };
    render(
      <AnchoredTooltip
        isOpen
        anchor={{ getBoundingClientRect: () => rect }}
        content="Selection"
        placement="bottom"
      />,
    );
    const panel = screen.getByRole('tooltip');
    expect(panel).toHaveTextContent('Selection');
    expect(panel.style.position).not.toBe('');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('UIC-TOOLTIP-2.3 names an element by the open hint, or stays visual only', () => {
    const anchor = document.createElement('button');
    anchor.setAttribute('aria-labelledby', 'existing');
    document.body.append(anchor);
    const { rerender, unmount } = render(
      <AnchoredTooltip isOpen anchor={anchor} content="Bold" relationship="label" id="bold" />,
    );
    expect(anchor).toHaveAttribute('aria-labelledby', 'existing bold');
    rerender(
      <AnchoredTooltip isOpen anchor={anchor} content="Bold" relationship="none" id="bold" />,
    );
    expect(anchor).toHaveAttribute('aria-labelledby', 'existing');
    expect(anchor).not.toHaveAttribute('aria-describedby');
    expect(tooltip()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    unmount();
    anchor.remove();
  });

  it('UIC-TOOLTIP-2.4 shows nothing without an anchor or for a detached element', () => {
    const detached = document.createElement('span');
    const anchors: Array<TooltipAnchor | null> = [null, detached, { current: null }];
    for (const anchor of anchors) {
      const { unmount } = render(<AnchoredTooltip isOpen anchor={anchor} content="Hint" />);
      expect(tooltip()).toBeNull();
      expect(detached).not.toHaveAttribute('aria-describedby');
      unmount();
    }
  });

  it('UIC-TOOLTIP-2.4 follows a stable ref to a replacement element and back from removal', async () => {
    function Swapped({ shown }: { shown: 'first' | 'second' | 'none' }) {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <>
          {shown === 'none' ? null : (
            <button key={shown} ref={ref} type="button">
              {shown}
            </button>
          )}
          <AnchoredTooltip isOpen anchor={ref} id="swap-hint" content="Swap hint" />
        </>
      );
    }
    const { rerender } = render(<Swapped shown="first" />);
    const first = screen.getByRole('button', { name: 'first' });
    expect(first).toHaveAttribute('aria-describedby', 'swap-hint');
    rerender(<Swapped shown="second" />);
    expect(first).not.toHaveAttribute('aria-describedby');
    await act(async () => first.setAttribute('aria-describedby', 'latest-host-context'));
    expect(first).toHaveAttribute('aria-describedby', 'latest-host-context');
    expect(screen.getByRole('button', { name: 'second' })).toHaveAccessibleDescription('Swap hint');
    rerender(<Swapped shown="none" />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    rerender(<Swapped shown="first" />);
    expect(screen.getByRole('button', { name: 'first' })).toHaveAccessibleDescription('Swap hint');
  });

  it('UIC-TOOLTIP-2.4 hides when its anchor leaves the page outside its renders, and returns', async () => {
    const host = document.createElement('button');
    host.textContent = 'Host';
    document.body.append(host);
    render(<AnchoredTooltip isOpen anchor={host} id="host-hint" content="Host hint" />);
    expect(host).toHaveAttribute('aria-describedby', 'host-hint');
    act(() => host.remove());
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
    expect(host).not.toHaveAttribute('aria-describedby');
    await act(async () => host.setAttribute('aria-describedby', 'latest-host-context'));
    expect(host).toHaveAttribute('aria-describedby', 'latest-host-context');
    act(() => document.body.append(host));
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Host hint'));
    expect(host).toHaveAttribute('aria-describedby', 'latest-host-context host-hint');
    host.remove();
  });
});

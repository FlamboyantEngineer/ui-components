import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { InfoGlyph, PlusGlyph } from '../../core/glyphs.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Label } from './label.js';

describe('Label', () => {
  it('UIC-LABEL-1.1 draws a decorative icon before the label without extra semantics', () => {
    const { container } = render(<Label icon={InfoGlyph} label="Details" />);
    const root = container.firstElementChild as HTMLElement;
    const [icon, label] = Array.from(root.children);
    expect(icon).toHaveClass('ui-icon', 'ui-label__icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(label).toHaveClass('ui-label__label');
    expect(label).toHaveTextContent('Details');
    expect(root.querySelector('[role], [tabindex], [aria-label]')).toBeNull();
    expectHooksMatchSpec(container, 'LABEL', { slots: 'all' });
  });

  it('UIC-LABEL-1.1 draws text alone or an icon alone', () => {
    const { container } = render(
      <>
        <Label label="Plain text" />
        <Label icon={InfoGlyph} />
      </>,
    );
    const [text, icon] = Array.from(container.children);
    expect(text?.children).toHaveLength(1);
    expect(text?.firstElementChild).toHaveClass('ui-label__label');
    expect(text).toHaveTextContent('Plain text');
    expect(icon?.children).toHaveLength(1);
    expect(icon?.firstElementChild).toHaveClass('ui-label__icon');
    expect(icon?.querySelector('.ui-label__label')).toBeNull();
  });

  it('UIC-LABEL-1.1 accepts icon nodes and label nodes', () => {
    render(<Label icon={<svg aria-label="Custom glyph" />} label={<strong>Bold</strong>} />);
    expect(screen.getByLabelText('Custom glyph').parentElement).toHaveClass('ui-label__icon');
    expect(screen.getByText('Bold').tagName).toBe('STRONG');
  });

  it('UIC-LABEL-1.1 draws text inside a custom element', () => {
    render(<Label icon={<span>★</span>} label="Starred" />);
    expect(screen.getByText('★').parentElement).toHaveClass('ui-icon');
    expect(screen.getByText('Starred')).toBeInTheDocument();
  });

  it('UIC-LABEL-1.2 sizes the icon and publishes the size', () => {
    const { container, rerender } = render(<Label icon={PlusGlyph} label="Add" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<Label icon={PlusGlyph} label="Add" size={size} />);
      expect(container.firstElementChild).toHaveAttribute('data-size', size);
      expect(container.querySelector('.ui-icon')).toHaveAttribute('data-size', size);
    }
  });

  it('UIC-LABEL-1.3 publishes truncate, grow and collapsible, keeping the full text', () => {
    const text = 'A long label that the stylesheet may ellipsize';
    const { container } = render(<Label icon={InfoGlyph} label={text} truncate grow collapsible />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-truncate', 'true');
    expect(root).toHaveAttribute('data-grow', 'true');
    expect(root).toHaveAttribute('data-collapsible', 'true');
    expect(root).toHaveTextContent(text);
    expectHooksMatchSpec(container, 'LABEL');
  });

  it('UIC-LABEL-1.6 shows a cut label whole in a tooltip', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    try {
      const text = 'A long label that the stylesheet cuts';
      const { container } = render(<Label icon={InfoGlyph} label={text} truncate />);
      const label = requireDefined(container.querySelector<HTMLElement>('.ui-label__label'));
      expect(label).toHaveClass('ui-truncation-tooltip');
      Object.defineProperty(label, 'clientWidth', { configurable: true, value: 80 });
      Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 240 });
      await user.hover(label);
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(document.querySelector('[role="tooltip"]')).toHaveTextContent(text);
      expectHooksMatchSpec(container, 'LABEL', { slots: ['icon', 'label'] });
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-LABEL-1.6 keeps a plain label without truncate', () => {
    const { container } = render(<Label icon={InfoGlyph} label="Short" />);
    expect(container.querySelector('.ui-label__label')).not.toHaveClass('ui-truncation-tooltip');
  });

  it('UIC-LABEL-1.4 hides the whole label or only its text, and announces when asked', () => {
    const { container, rerender } = render(<Label icon={InfoGlyph} label="Quiet" />);
    expect(container.querySelector('[aria-live]')).toBeNull();

    rerender(<Label icon={InfoGlyph} label="Rail" hideLabel live="polite" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('.ui-label__label')?.hidden).toBe(true);
    expect(root).toHaveAttribute('aria-live', 'polite');

    rerender(<Label icon={InfoGlyph} label="Gone" hidden />);
    expect((container.firstElementChild as HTMLElement).hidden).toBe(true);
  });

  it('UIC-LABEL-1.5 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <Label icon={InfoGlyph} label="Hooks" className="caller" id="label-1" data-testid="probe" />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-label', 'caller');
    expect(root).toHaveAttribute('id', 'label-1');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'LABEL');
  });
});

describe('Label root ref', () => {
  it('UIC-LABEL-1.5 forwards ref to its root', () => {
    const ref = { current: null as HTMLSpanElement | null };
    const { container } = render(<Label ref={ref} icon={InfoGlyph} label="Details" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('.ui-label'));
  });
});

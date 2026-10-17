import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { IconLabel } from './icon-label.js';

describe('IconLabel', () => {
  it('UIC-ICON-LABEL-1.1 draws a decorative icon before the label without extra semantics', () => {
    const { container } = render(<IconLabel icon="info" label="Details" />);
    const root = container.firstElementChild as HTMLElement;
    const [icon, label] = Array.from(root.children);
    expect(icon).toHaveClass('ui-icon', 'ui-icon-label__icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(label).toHaveClass('ui-icon-label__label');
    expect(label).toHaveTextContent('Details');
    expect(root.querySelector('[role], [tabindex], [aria-label]')).toBeNull();
    expectHooksMatchSpec(container, 'ICON-LABEL', { slots: 'all' });
  });

  it('UIC-ICON-LABEL-1.1 accepts icon nodes and label nodes', () => {
    render(<IconLabel icon={<svg data-testid="custom" />} label={<strong>Bold</strong>} />);
    expect(screen.getByTestId('custom').parentElement).toHaveClass('ui-icon-label__icon');
    expect(screen.getByText('Bold').tagName).toBe('STRONG');
  });

  it('UIC-ICON-LABEL-1.2 sizes the icon and publishes the size', () => {
    const { container, rerender } = render(<IconLabel icon="plus" label="Add" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<IconLabel icon="plus" label="Add" size={size} />);
      expect(container.firstElementChild).toHaveAttribute('data-size', size);
      expect(container.querySelector('.ui-icon')).toHaveAttribute('data-size', size);
    }
  });

  it('UIC-ICON-LABEL-1.3 publishes truncate, grow and collapsible, keeping the full text', () => {
    const text = 'A long label that the stylesheet may ellipsize';
    const { container } = render(<IconLabel icon="info" label={text} truncate grow collapsible />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-truncate', 'true');
    expect(root).toHaveAttribute('data-grow', 'true');
    expect(root).toHaveAttribute('data-collapsible', 'true');
    expect(root).toHaveTextContent(text);
    expectHooksMatchSpec(container, 'ICON-LABEL');
  });

  it('UIC-ICON-LABEL-1.4 hides the whole label or only its text, and announces when asked', () => {
    const { container, rerender } = render(<IconLabel icon="info" label="Quiet" />);
    expect(container.querySelector('[aria-live]')).toBeNull();

    rerender(<IconLabel icon="info" label="Rail" hideLabel live="polite" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('.ui-icon-label__label')?.hidden).toBe(true);
    expect(root).toHaveAttribute('aria-live', 'polite');

    rerender(<IconLabel icon="info" label="Gone" hidden />);
    expect((container.firstElementChild as HTMLElement).hidden).toBe(true);
  });

  it('UIC-ICON-LABEL-1.5 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <IconLabel icon="info" label="Hooks" className="caller" id="label-1" data-testid="probe" />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-icon-label', 'caller');
    expect(root).toHaveAttribute('id', 'label-1');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'ICON-LABEL');
  });
});

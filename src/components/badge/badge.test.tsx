import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CheckGlyph, InfoGlyph } from '../../core/glyphs.js';
import { UiProvider } from '../../core/provider.js';
import { Badge, type BadgeProps } from './badge.js';

const tones = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const variants = ['subtle', 'solid', 'status'] as const;

// Count badges own their text: no children, no status variant and no string count.
const countProps: BadgeProps = { count: 12, max: 9 };
// @ts-expect-error A count badge requires a number.
const stringCount: BadgeProps = { count: '9+' };
// @ts-expect-error A count badge owns its visible label.
const countChildren: BadgeProps = { count: 12, children: '12' };
// @ts-expect-error A label badge does not cap its children.
const cappedLabel: BadgeProps = { children: 'Tag', max: 9 };
// @ts-expect-error A count badge cannot be a status.
const countVariant: BadgeProps = { count: 3, variant: 'status' };
// @ts-expect-error A dot badge has no text.
const dotChildren: BadgeProps = { variant: 'dot', children: 'New' };
// @ts-expect-error A count badge takes no icons.
const countIcon: BadgeProps = { count: 3, startIcon: 'info' };
void [countProps, stringCount, countChildren, cappedLabel, countVariant, dotChildren, countIcon];

describe('Badge', () => {
  it('UIC-BADGE-1.1 renders a non-interactive span with its label and no states', () => {
    const { container } = render(<Badge>Seasonal</Badge>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('tabindex');
    expect(root.querySelector('.ui-badge__label')).toHaveTextContent('Seasonal');
    expect(container.querySelector('button, [tabindex]')).toBeNull();
    for (const state of ['data-pressed', 'data-selected', 'data-disabled', 'data-pending']) {
      expect(root).not.toHaveAttribute(state);
    }
    expectHooksMatchSpec(container, 'BADGE', { slots: ['label'] });
  });

  it('UIC-BADGE-1.2 UIC-BADGE-1.3 UIC-BADGE-1.4 publishes variant, tone and size with defaults', () => {
    const { container, rerender } = render(<Badge>Value</Badge>);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-variant', 'subtle');
    expect(root).toHaveAttribute('data-tone', 'neutral');
    expect(root).toHaveAttribute('data-size', 'md');
    for (const variant of variants) {
      for (const tone of tones) {
        for (const size of sizes) {
          rerender(
            <Badge variant={variant} tone={tone} size={size}>
              Value
            </Badge>,
          );
          const badge = container.firstElementChild;
          expect(badge).toHaveAttribute('data-variant', variant);
          expect(badge).toHaveAttribute('data-tone', tone);
          expect(badge).toHaveAttribute('data-size', size);
          expect(badge).not.toHaveAttribute('data-placement');
          expectHooksMatchSpec(container, 'BADGE', { slots: ['label'] });
        }
      }
    }
  });

  it('UIC-BADGE-1.5 publishes bare for label and count badges', () => {
    const { container, rerender } = render(<Badge>Value</Badge>);
    expect(container.firstElementChild).not.toHaveAttribute('data-bare');
    rerender(
      <Badge bare variant="status" tone="success">
        Online
      </Badge>,
    );
    expect(container.firstElementChild).toHaveAttribute('data-bare', 'true');
    expect(container.querySelector('.ui-badge__dot')).not.toBeNull();
    rerender(<Badge bare count={4} />);
    expect(container.firstElementChild).toHaveAttribute('data-bare', 'true');
    expectHooksMatchSpec(container, 'BADGE');
  });

  it('UIC-BADGE-1.6 appends the caller class and forwards id, visibility and data attributes', () => {
    const { container, rerender } = render(
      <Badge
        className="caller"
        id="kind"
        data-owner="probe"
        data-tone="caller"
        aria-label="Kind: report"
      >
        Report
      </Badge>,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-badge', 'caller');
    expect(root).toHaveAttribute('id', 'kind');
    expect(root).toHaveAttribute('data-tone', 'neutral');
    expect(root).toHaveAttribute('data-owner', 'probe');
    expect(screen.getByText('Kind: report')).toHaveClass('ui-badge__accessible-label');
    expectHooksMatchSpec(container, 'BADGE', { callerAttributes: ['data-owner'] });

    rerender(
      <Badge hidden aria-hidden>
        Report
      </Badge>,
    );
    const hidden = container.firstElementChild as HTMLElement;
    expect(hidden.hidden).toBe(true);
    expect(hidden).toHaveAttribute('aria-hidden', 'true');
  });

  it('UIC-BADGE-2.1 draws a decorative dot and a polite status unless quiet', () => {
    const { container, rerender } = render(
      <Badge variant="status" tone="success">
        Active
      </Badge>,
    );
    const status = screen.getByRole('status');
    const [dot, label] = Array.from(status.children);
    expect(dot).toHaveClass('ui-badge__dot');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(label).toHaveTextContent('Active');
    expect(status).not.toHaveAttribute('data-muted-dot');
    expectHooksMatchSpec(container, 'BADGE', { slots: ['dot', 'label'] });

    rerender(
      <Badge variant="status" announce={false} mutedDot>
        Checking
      </Badge>,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.querySelector('.ui-badge__dot')).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-muted-dot', 'true');
    expectHooksMatchSpec(container, 'BADGE', { slots: ['dot'] });

    for (const variant of ['subtle', 'solid'] as const) {
      rerender(
        <Badge variant={variant} mutedDot>
          Plain
        </Badge>,
      );
      expect(container.querySelector('.ui-badge__dot')).toBeNull();
      expect(container.firstElementChild).not.toHaveAttribute('role');
      expect(container.firstElementChild).not.toHaveAttribute('data-muted-dot');
    }
  });

  it('UIC-BADGE-3.1 formats counts in every tone and size', () => {
    const { container, rerender } = render(<Badge count={7} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-variant', 'subtle');
    expect(root.querySelector('.ui-badge__label')).toHaveTextContent('7');
    for (const tone of tones) {
      for (const size of sizes) {
        rerender(<Badge count={12} max={9} tone={tone} size={size} />);
        expect(container.querySelector('.ui-badge__label')).toHaveTextContent('9+');
        expect(container.firstElementChild).toHaveAttribute('data-tone', tone);
        expect(container.firstElementChild).toHaveAttribute('data-size', size);
        expectHooksMatchSpec(container, 'BADGE', { slots: ['label', 'accessible-label'] });
      }
    }
    rerender(<Badge count={0} />);
    expect(container.querySelector('.ui-badge__label')).toHaveTextContent('0');
    rerender(<Badge count={12} more />);
    expect(container.querySelector('.ui-badge__label')).toHaveTextContent('12+');
    rerender(<Badge count={Number.NaN} />);
    expect(container.querySelector('.ui-badge__label')?.textContent).toBe('');
  });

  it('UIC-BADGE-3.1 UIC-COUNT-1.4 writes counts in the provider locale digits and grouping', () => {
    const { container, rerender } = render(
      <UiProvider locale="fr-FR">
        <Badge count={12345} />
      </UiProvider>,
    );
    const label = () => container.querySelector('.ui-badge__label')?.textContent;
    expect(label()).toBe('12\u202f345');
    rerender(
      <UiProvider locale="ar-EG">
        <Badge count={120} max={99} />
      </UiProvider>,
    );
    expect(label()).toBe('٩٩+');
    expect(container.querySelector('.ui-badge__accessible-label')?.textContent).toBe('١٢٠');
  });

  it('UIC-BADGE-3.2 keeps the full count for assistive technology without naming a generic element', () => {
    const { container, rerender } = render(<Badge count={12} max={9} />);
    const label = () => container.querySelector('.ui-badge__label');
    const spoken = () => container.querySelector('.ui-badge__accessible-label');
    expect(label()).toHaveAttribute('aria-hidden', 'true');
    expect(spoken()?.textContent).toBe('12');
    expect(container.querySelector('[aria-label], [role], [aria-live]')).toBeNull();

    rerender(<Badge count={120} />);
    expect(label()).not.toHaveAttribute('aria-hidden');
    expect(spoken()).toBeNull();

    rerender(<Badge count={120} aria-label="120 matching files" />);
    expect(label()).toHaveTextContent('120');
    expect(spoken()?.textContent).toBe('120 matching files');
    expect(container.firstElementChild).not.toHaveAttribute('aria-label');

    rerender(<Badge count={12} more />);
    expect(spoken()?.textContent).toBe('12 or more');

    rerender(
      <UiProvider messages={{ countOrMore: 'au moins {count}' }}>
        <Badge count={12} more />
      </UiProvider>,
    );
    expect(spoken()?.textContent).toBe('au moins 12');

    rerender(<Badge count={12} max={9} aria-hidden />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(spoken()).toBeNull();
    expect(label()).not.toHaveAttribute('aria-hidden');
    expectHooksMatchSpec(container, 'BADGE');
  });

  it('UIC-BADGE-3.3 publishes the count placement, inline by default', () => {
    const { container, rerender } = render(<Badge count={3} />);
    expect(container.firstElementChild).toHaveAttribute('data-placement', 'inline');
    rerender(<Badge count={12} max={9} placement="overlay" tone="danger" size="sm" />);
    expect(container.firstElementChild).toHaveAttribute('data-placement', 'overlay');
    expectHooksMatchSpec(container, 'BADGE');
  });

  it('UIC-BADGE-1.8 reads a label badge by its aria-label without naming a generic element', () => {
    const { container, rerender } = render(<Badge aria-label="Priority high">High</Badge>);
    expect(container.querySelector('.ui-badge:not([role])[aria-label]')).toBeNull();
    expect(screen.getByText('Priority high')).toHaveClass('ui-badge__accessible-label');
    expect(screen.getByText('High')).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'BADGE', { slots: ['label', 'accessible-label'] });

    rerender(
      <Badge variant="status" announce={false} aria-label="Build passing">
        Passing
      </Badge>,
    );
    expect(container.querySelector('[aria-label]')).toBeNull();
    expect(screen.getByText('Build passing')).toHaveClass('ui-badge__accessible-label');

    rerender(
      <Badge variant="status" aria-label="Build passing">
        Passing
      </Badge>,
    );
    expect(screen.getByRole('status', { name: 'Build passing' })).toHaveTextContent('Passing');
    expect(container.querySelector('.ui-badge__accessible-label')).toBeNull();

    rerender(
      <Badge aria-label="Priority high" aria-hidden>
        High
      </Badge>,
    );
    expect(container.querySelector('.ui-badge__accessible-label, [aria-label]')).toBeNull();
  });

  it('UIC-BADGE-1.7 draws decorative icons before and after the label', () => {
    const { container, rerender } = render(
      <Badge
        startIcon={CheckGlyph}
        endIcon={<svg role="img" aria-label="Custom glyph" />}
        tone="success"
      >
        Ripe
      </Badge>,
    );
    const root = container.firstElementChild as HTMLElement;
    const [start, label, end] = Array.from(root.children);
    expect(start).toHaveClass('ui-icon', 'ui-badge__start-icon');
    expect(start).toHaveAttribute('data-glyph', 'check');
    expect(start).toHaveAttribute('aria-hidden', 'true');
    expect(label).toHaveClass('ui-badge__label');
    expect(end).toHaveClass('ui-badge__end-icon');
    expect(screen.getByRole('img', { name: 'Custom glyph', hidden: true }).parentElement).toBe(end);
    expectHooksMatchSpec(container, 'BADGE', { slots: ['start-icon', 'label', 'end-icon'] });

    rerender(
      <Badge variant="status" startIcon={InfoGlyph} endIcon={null}>
        Fresh
      </Badge>,
    );
    const status = container.firstElementChild as HTMLElement;
    expect(
      Array.from(status.children, (node) => node.classList[node.classList.length - 1]),
    ).toEqual(['ui-badge__dot', 'ui-badge__start-icon', 'ui-badge__label']);
    expect(container.querySelector('.ui-badge__end-icon')).toBeNull();
  });

  it('UIC-BADGE-3.4 hides a zero count only when asked', () => {
    const { container, rerender } = render(<Badge count={0} showZero={false} />);
    expect(container.firstElementChild).toBeNull();
    rerender(<Badge count={0.4} showZero={false} />);
    expect(container.firstElementChild).toBeNull();
    rerender(<Badge count={0} showZero={false} more />);
    expect(container.querySelector('.ui-badge__label')).toHaveTextContent('0+');
    rerender(<Badge count={2} showZero={false} />);
    expect(container.querySelector('.ui-badge__label')).toHaveTextContent('2');
    rerender(<Badge count={0} />);
    expect(container.querySelector('.ui-badge__label')).toHaveTextContent('0');
    expectHooksMatchSpec(container, 'BADGE');
  });

  it('UIC-BADGE-4.1 draws an empty dot marker, decorative unless labelled', () => {
    const { container, rerender } = render(<Badge variant="dot" tone="danger" />);
    const root = () => container.firstElementChild as HTMLElement;
    expect(root()).toHaveAttribute('data-variant', 'dot');
    expect(root()).toHaveAttribute('data-tone', 'danger');
    expect(root()).toHaveAttribute('data-size', 'md');
    expect(root()).toHaveAttribute('data-placement', 'inline');
    expect(root()).toHaveAttribute('aria-hidden', 'true');
    expect(root()).toBeEmptyDOMElement();
    expectHooksMatchSpec(container, 'BADGE');

    rerender(<Badge variant="dot" placement="overlay" size="sm" aria-label="New messages" />);
    expect(root()).toHaveAttribute('data-placement', 'overlay');
    expect(root()).not.toHaveAttribute('aria-hidden');
    expect(root()).not.toHaveAttribute('aria-label');
    expect(root().querySelector('.ui-badge__accessible-label')?.textContent).toBe('New messages');
    expect(container.querySelector('[role], [aria-live]')).toBeNull();
    expectHooksMatchSpec(container, 'BADGE', { slots: ['accessible-label'] });

    rerender(<Badge variant="dot" aria-label="New messages" aria-hidden />);
    expect(root()).toHaveAttribute('aria-hidden', 'true');
    expect(root()).toBeEmptyDOMElement();
  });
});

describe('Badge root ref', () => {
  it('UIC-BADGE-1.6 forwards ref to its root', () => {
    const ref = { current: null as HTMLSpanElement | null };
    const { container } = render(<Badge ref={ref}>Seasonal</Badge>);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('.ui-badge'));
  });
});

it('UIC-BADGE-3.1 UIC-BADGE-1.2 shares numeric geometry hooks across subtle and solid independent of tone', () => {
  const { container, rerender } = render(<Badge count={0} variant="subtle" tone="danger" />);
  expect(container.firstElementChild).toHaveAttribute('data-count', 'true');
  expect(container.firstElementChild).toHaveAttribute('data-variant', 'subtle');
  expectHooksMatchSpec(container, 'BADGE');
  rerender(<Badge count={128} variant="solid" tone="info" max={100} />);
  expect(container.firstElementChild).toHaveAttribute('data-variant', 'solid');
  expect(container.firstElementChild).toHaveAttribute('data-tone', 'info');
  expect(screen.getByText('100+')).toBeInTheDocument();
  expect(screen.getByText('128')).toBeInTheDocument();
});

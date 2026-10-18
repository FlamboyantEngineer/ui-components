import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { StatusLight } from './status-light.js';

describe('StatusLight', () => {
  it('UIC-STATUS-LIGHT-1.1 draws a decorative dot before its label', () => {
    const { container } = render(<StatusLight tone="success">Running</StatusLight>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveClass('ui-status-light');
    expect(root.firstElementChild).toHaveClass('ui-status-light__dot');
    expect(root.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(root.querySelector('.ui-status-light__label')).toHaveTextContent('Running');
    expect(root).toHaveTextContent('Running');
    expectHooksMatchSpec(container, 'STATUS-LIGHT', { slots: 'all' });
  });

  it('UIC-STATUS-LIGHT-1.2 publishes the tone, neutral by default', () => {
    const { container, rerender } = render(<StatusLight>Unknown</StatusLight>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-tone', 'neutral');
    for (const tone of ['neutral', 'info', 'success', 'warning', 'danger'] as const) {
      rerender(<StatusLight tone={tone}>State</StatusLight>);
      expect(root).toHaveAttribute('data-tone', tone);
      expectHooksMatchSpec(container, 'STATUS-LIGHT');
    }
  });

  it('UIC-STATUS-LIGHT-1.3 publishes the size, medium by default', () => {
    const { container, rerender } = render(<StatusLight>Idle</StatusLight>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<StatusLight size={size}>Idle</StatusLight>);
      expect(root).toHaveAttribute('data-size', size);
    }
    expectHooksMatchSpec(container, 'STATUS-LIGHT');
  });

  it('UIC-STATUS-LIGHT-1.4 labels a presence state from the provider strings', () => {
    const { container, rerender } = render(<StatusLight status="away" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-status', 'away');
    expect(root).toHaveTextContent('Away');
    const labels = (['active', 'away', 'busy', 'idle'] as const).map((status) => {
      rerender(<StatusLight status={status} />);
      expectHooksMatchSpec(container, 'STATUS-LIGHT', { slots: ['label'] });
      return root.textContent;
    });
    expect(labels).toEqual(['Active', 'Away', 'Busy', 'Idle']);
    rerender(<StatusLight status="busy">In a meeting</StatusLight>);
    expect(root).toHaveTextContent('In a meeting');
    expect(root).toHaveAttribute('data-status', 'busy');
    rerender(
      <UiProvider strings={{ presenceStatus: (status) => `[${status}]` }}>
        <StatusLight status="idle" data-testid="translated" />
      </UiProvider>,
    );
    expect(screen.getByTestId('translated')).toHaveTextContent('[idle]');
  });

  it('UIC-STATUS-LIGHT-1.5 publishes the processing state', () => {
    const { container, rerender } = render(<StatusLight tone="info">Deploying</StatusLight>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveAttribute('data-processing');
    rerender(
      <StatusLight tone="info" isProcessing>
        Deploying
      </StatusLight>,
    );
    expect(root).toHaveAttribute('data-processing', 'true');
    expectHooksMatchSpec(container, 'STATUS-LIGHT');
  });

  it('UIC-STATUS-LIGHT-1.6 appends the caller class and forwards id and data attributes', () => {
    render(
      <StatusLight className="caller" id="probe" data-testid="probe" data-tone="caller">
        Probe
      </StatusLight>,
    );
    const root = screen.getByTestId('probe');
    expect(root).toHaveClass('ui-status-light', 'caller');
    expect(root).toHaveAttribute('id', 'probe');
    expect(root).toHaveAttribute('data-tone', 'neutral');
    expectHooksMatchSpec(document.body, 'STATUS-LIGHT');
  });

  it('UIC-STATUS-LIGHT-2.1 is an image named by aria-label without a visible label', () => {
    const { container, rerender } = render(<StatusLight tone="danger" aria-label="Stopped" />);
    const image = screen.getByRole('img', { name: 'Stopped' });
    expect(image).toHaveClass('ui-status-light');
    expect(image.querySelector('.ui-status-light__label')).toBeNull();

    rerender(<StatusLight status="away" aria-label="Jon is away" />);
    expect(screen.getByRole('img', { name: 'Jon is away' })).toHaveAttribute('data-status', 'away');
    expect(container.querySelector('.ui-status-light__label')).toBeNull();

    rerender(<StatusLight aria-label="Ignored">Running</StatusLight>);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute('aria-label');
    expect(container.firstElementChild).not.toHaveAttribute('aria-hidden');

    rerender(<StatusLight tone="success" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).not.toHaveAttribute('role');
    expectHooksMatchSpec(container, 'STATUS-LIGHT');
  });

  it('UIC-STATUS-LIGHT-2.2 takes no tab stop and is no live region', async () => {
    const user = userEvent.setup();
    render(
      <>
        <StatusLight status="active" />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(screen.queryByRole('status')).toBeNull();
  });
});

import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Sparkline } from '../sparkline/sparkline.js';
import { StatTile } from './stat-tile.js';

const slot = (tile: HTMLElement, name: string) => tile.querySelector(`.ui-stat-tile__${name}`);

describe('StatTile', () => {
  it('UIC-STAT-TILE-1.1 UIC-STAT-TILE-2.1 is a card region named by its label with every part', () => {
    render(
      <StatTile
        label="Open requests"
        value={1284}
        delta={12}
        description="Since last week"
        chart={<Sparkline aria-label="Last seven days" values={[3, 5, 4, 8]} />}
      />,
    );
    const tile = screen.getByRole('region', { name: 'Open requests' });
    expect(tile).toHaveClass('ui-card', 'ui-stat-tile');
    expect(within(tile).getByRole('heading', { name: 'Open requests' })).toBeInTheDocument();
    expect(slot(tile, 'value')).toHaveTextContent('1,284');
    expect(slot(tile, 'delta')).toHaveTextContent('+12');
    expect(slot(tile, 'description')).toHaveTextContent('Since last week');
    expect(within(tile).getByRole('img', { name: 'Last seven days' }).parentElement).toBe(
      slot(tile, 'chart'),
    );
    expect(tile).toHaveTextContent('Open requests1,284+12Since last weekLow 3, high 8, last 8');
    expectHooksMatchSpec(document.body, 'STAT-TILE', { slots: 'all' });
  });

  it('UIC-STAT-TILE-1.1 renders only the parts it is given', () => {
    render(<StatTile label="Uptime" />);
    const tile = screen.getByRole('region', { name: 'Uptime' });
    for (const name of ['value', 'delta', 'description', 'chart']) {
      expect(slot(tile, name)).toBeNull();
    }
    expect(tile).not.toHaveAttribute('data-trend');
    expect(tile).not.toHaveAttribute('data-tone');
  });

  it('UIC-STAT-TILE-1.2 formats the value or shows a value label', () => {
    const { rerender } = render(
      <StatTile
        label="Uptime"
        value={0.9987}
        formatOptions={{ style: 'percent', maximumFractionDigits: 2 }}
      />,
    );
    const tile = screen.getByRole('region');
    expect(slot(tile, 'value')).toHaveTextContent('99.87%');
    rerender(<StatTile label="Uptime" value={0.9987} valueLabel="Healthy" />);
    expect(slot(tile, 'value')).toHaveTextContent('Healthy');
  });

  it('UIC-STAT-TILE-1.2 formats for the provider locale', () => {
    render(
      <UiProvider locale="de-DE">
        <StatTile label="Umsatz" value={1234.5} delta={-0.5} />
      </UiProvider>,
    );
    const tile = screen.getByRole('region');
    expect(slot(tile, 'value')).toHaveTextContent('1.234,5');
    expect(slot(tile, 'delta')).toHaveTextContent('-0,5');
  });

  it('UIC-STAT-TILE-1.3 signs the delta and publishes its trend with a glyph', () => {
    const { rerender } = render(<StatTile label="Errors" value={40} delta={-3} />);
    const tile = screen.getByRole('region');
    const cases = [
      [5, '+5', 'up', 'trend-up'],
      [-3, '-3', 'down', 'trend-down'],
      [0, '0', 'flat', 'trend-flat'],
    ] as const;
    for (const [delta, text, trend, glyph] of cases) {
      rerender(<StatTile label="Errors" value={40} delta={delta} />);
      expect(slot(tile, 'delta')).toHaveTextContent(text);
      expect(tile).toHaveAttribute('data-trend', trend);
      const icon = slot(tile, 'trend-icon');
      expect(icon).toHaveAttribute('data-glyph', glyph);
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expectHooksMatchSpec(document.body, 'STAT-TILE');
    }
    rerender(<StatTile label="Errors" value={40} delta={Number.NaN} />);
    expect(slot(tile, 'delta')).toBeNull();
    expect(tile).not.toHaveAttribute('data-trend');
  });

  it('UIC-STAT-TILE-1.3 UIC-STAT-TILE-1.4 keeps the direction of a change that rounds to zero', () => {
    const { rerender } = render(<StatTile label="Errors" value={100} delta={-0.0001} />);
    const tile = screen.getByRole('region');
    const precise = { maximumFractionDigits: 0 };
    const cases = [
      [-0.0001, undefined, '-0', 'down'],
      [0.0001, undefined, '+0', 'up'],
      [0.4, precise, '+0', 'up'],
      [-0.4, precise, '-0', 'down'],
      [-0.00001, { style: 'percent' }, '-0%', 'down'],
      [0, precise, '0', 'flat'],
      [-0, precise, '0', 'flat'],
    ] as const;
    for (const [delta, options, text, trend] of cases) {
      for (const goal of ['increase', 'decrease', 'none'] as const) {
        rerender(
          <StatTile
            label="Errors"
            value={100}
            delta={delta}
            deltaFormatOptions={options}
            goal={goal}
          />,
        );
        // The delta's text is all a reader hears of the change: the glyph is decorative.
        expect(slot(tile, 'delta')?.textContent).toBe(text);
        expect(tile).toHaveAttribute('data-trend', trend);
      }
    }
    rerender(<StatTile label="Errors" value={100} delta={-3} />);
    expect(slot(tile, 'delta')?.textContent).toBe('-3');
  });

  it('UIC-STAT-TILE-1.3 formats the delta with its own options or the value options', () => {
    const { rerender } = render(
      <StatTile
        label="Visitors"
        value={5200}
        delta={0.125}
        deltaFormatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
      />,
    );
    const tile = screen.getByRole('region');
    expect(slot(tile, 'delta')).toHaveTextContent('+12.5%');
    rerender(
      <StatTile
        label="Visitors"
        value={5200}
        delta={1500}
        formatOptions={{ notation: 'compact' }}
      />,
    );
    expect(slot(tile, 'value')).toHaveTextContent('5.2K');
    expect(slot(tile, 'delta')).toHaveTextContent('+1.5K');
  });

  it('UIC-STAT-TILE-1.4 judges the change against the goal', () => {
    const { rerender } = render(<StatTile label="Score" value={1} delta={1} />);
    const tile = screen.getByRole('region');
    const cases = [
      [undefined, 2, 'success'],
      [undefined, -2, 'danger'],
      ['increase', 0, 'neutral'],
      ['decrease', 2, 'danger'],
      ['decrease', -2, 'success'],
      ['none', 2, 'neutral'],
      ['none', -2, 'neutral'],
    ] as const;
    for (const [goal, delta, tone] of cases) {
      rerender(<StatTile label="Score" value={1} delta={delta} goal={goal} />);
      expect(tile).toHaveAttribute('data-tone', tone);
      expectHooksMatchSpec(document.body, 'STAT-TILE');
    }
  });

  it('UIC-STAT-TILE-1.5 shows the card skeleton while loading', () => {
    render(<StatTile label="Revenue" value={10} delta={2} isLoading />);
    const tile = screen.getByRole('region', { name: 'Revenue' });
    expect(tile).toHaveAttribute('aria-busy', 'true');
    expect(tile).toHaveAttribute('data-loading', 'true');
    expect(tile.querySelector('.ui-card__skeleton')).not.toBeNull();
    expect(slot(tile, 'value')).toBeNull();
  });

  it('UIC-STAT-TILE-1.5 is a link or a press target through its label', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { rerender } = render(
      <StatTile label="Open requests" value={7} href="#requests" target="_blank" />,
    );
    const link = screen.getByRole('link', { name: 'Open requests' });
    expect(link).toHaveAttribute('href', '#requests');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    rerender(<StatTile label="Open requests" value={7} onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Open requests' }));
    await user.click(screen.getByText('7'));
    expect(onAction).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('region')).toHaveAttribute('data-interactive', 'true');
  });

  it('UIC-STAT-TILE-1.6 appends the caller class and forwards id and data attributes', () => {
    render(
      <StatTile
        label="Probe"
        className="caller"
        id="probe"
        data-sample="probe"
        data-trend="caller"
        value={1}
        delta={1}
      />,
    );
    const tile = screen.getByRole('region', { name: 'Probe' });
    expect(tile).toHaveClass('ui-card', 'ui-stat-tile', 'caller');
    expect(tile).toHaveAttribute('id', 'probe');
    expect(tile).toHaveAttribute('data-trend', 'up');
    expect(tile).toHaveAttribute('data-sample', 'probe');
    expectHooksMatchSpec(document.body, 'STAT-TILE', { callerAttributes: ['data-sample'] });
  });
});

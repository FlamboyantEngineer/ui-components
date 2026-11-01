import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BarChart, type BarChartSeries } from './bar-chart.js';
import { LineChart } from './line-chart.js';

const categories = ['First', 'Second', 'Third'];
const alpha: BarChartSeries = { id: 'a', label: 'Alpha', values: [1, 2, 3] };
const blue: BarChartSeries = { id: 'b', label: 'Blue', values: [3, 4, 5] };

describe('chart legend for a hidden series left alone', () => {
  it('UIC-CHART-2.1 keeps the legend while the only series left is hidden, to show it again', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <BarChart aria-label="Values" categories={categories} series={[alpha, blue]} />,
    );
    await user.click(screen.getByRole('button', { name: 'Blue' }));
    rerender(<BarChart aria-label="Values" categories={categories} series={[blue]} />);
    const toggle = screen.getByRole('button', { name: 'Blue' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(screen.getAllByRole('img')).toHaveLength(3);
    // Shown again, a single series needs no legend.
    expect(screen.queryByRole('button', { name: 'Blue' })).not.toBeInTheDocument();
  });

  it('UIC-CHART-2.1 keeps a line legend after the collection is replaced and an id comes back', async () => {
    const user = userEvent.setup();
    const level = (id: string, label: string) => ({ id, label, points: [{ x: 1, y: 2 }] });
    const { rerender } = render(
      <LineChart aria-label="Levels" series={[level('a', 'Alpha'), level('b', 'Blue')]} />,
    );
    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    rerender(<LineChart aria-label="Levels" series={[level('a', 'Alpha again')]} />);
    expect(screen.getByRole('button', { name: 'Alpha again' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    rerender(<LineChart aria-label="Levels" series={[level('c', 'Gamma')]} />);
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('UIC-CHART-2.1 follows an explicit showLegend and controlled hidden series', () => {
    const { rerender } = render(
      <BarChart
        aria-label="Values"
        categories={categories}
        series={[blue]}
        hiddenKeys={new Set(['b'])}
        showLegend={false}
      />,
    );
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    rerender(
      <BarChart
        aria-label="Values"
        categories={categories}
        series={[blue]}
        hiddenKeys={new Set(['b'])}
      />,
    );
    expect(screen.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'false');
  });
});

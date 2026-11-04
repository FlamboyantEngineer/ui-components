import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { type ChartPoint, useChartPoints } from './chart-points.js';

const values: ChartPoint[] = [
  { key: 'middle', series: 0, index: 2 },
  { key: 'last', series: 0, index: 4 },
  { key: 'first', series: 0, index: 0 },
  { key: 'lower', series: 2, index: 1 },
  { key: 'upper', series: 2, index: 3 },
  { key: 'far', series: 5, index: 2 },
];

function Points({ points = values, isVertical = false }) {
  const navigation = useChartPoints(points, isVertical);
  return (
    <>
      <svg role="group" aria-label="Values">
        {points.map((point) => (
          <circle
            key={point.key}
            role="img"
            aria-label={point.key}
            {...navigation.getPointProps(point)}
          />
        ))}
      </svg>
      <button type="button">After chart</button>
    </>
  );
}

describe('chart point navigation', () => {
  it('UIC-CHART-4.3 follows point indices in either direction without wrapping', async () => {
    const user = userEvent.setup();
    render(<Points />);
    await user.tab();
    expect(screen.getByRole('img', { name: 'middle' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('img', { name: 'last' })).toHaveFocus();
    await user.keyboard('{Home}{ArrowLeft}');
    expect(screen.getByRole('img', { name: 'first' })).toHaveFocus();
    await user.keyboard('{End}{ArrowLeft}');
    expect(screen.getByRole('img', { name: 'middle' })).toHaveFocus();
  });

  it('UIC-CHART-4.3 skips absent series and keeps the first equally close point', async () => {
    const user = userEvent.setup();
    render(<Points />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('img', { name: 'lower' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('img', { name: 'far' })).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('img', { name: 'middle' })).toHaveFocus();
  });

  it('UIC-CHART-4.3 swaps arrow directions for vertical categories', async () => {
    const user = userEvent.setup();
    render(<Points isVertical />);
    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(screen.getByRole('img', { name: 'upper' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(screen.getByRole('img', { name: 'first' })).toHaveFocus();
  });

  it('UIC-CHART-4.3 leaves Tab unhandled without reading point indices', async () => {
    const user = userEvent.setup();
    let reads = 0;
    const points = values.map((point) => ({
      ...point,
      get index() {
        reads++;
        return point.index;
      },
    }));
    render(<Points points={points} />);
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After chart' })).toHaveFocus();
    expect(reads).toBe(0);
  });
});

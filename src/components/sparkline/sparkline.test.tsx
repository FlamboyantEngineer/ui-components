import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Sparkline } from './sparkline.js';

const week = [4, 9, 6, 18, 12, 15];

describe('Sparkline', () => {
  it('UIC-SPARKLINE-1.1 UIC-SPARKLINE-2.1 is a named image of a line in a sized box', () => {
    render(<Sparkline aria-label="Daily builds" values={week} />);
    const image = screen.getByRole('img', { name: 'Daily builds' });
    expect(image.tagName.toLowerCase()).toBe('svg');
    expect(image).toHaveClass('ui-sparkline');
    expect(image).toHaveAttribute('width', '80');
    expect(image).toHaveAttribute('height', '24');
    expect(image).toHaveAttribute('viewBox', '0 0 80 24');
    expect(image).toHaveAttribute('data-variant', 'line');
    expect(image).not.toHaveAttribute('data-empty');
    expect(image.querySelector('.ui-sparkline__line')).toHaveAttribute('fill', 'none');
    expect(image.querySelector('.ui-sparkline__area')).toBeNull();
    expectHooksMatchSpec(document.body, 'SPARKLINE', { slots: ['line'] });
  });

  it('UIC-SPARKLINE-1.1 fills an area under the line and takes a size', () => {
    render(<Sparkline aria-label="Visits" values={week} variant="area" width={120} height={32} />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('data-variant', 'area');
    expect(image).toHaveAttribute('viewBox', '0 0 120 32');
    const area = image.querySelector('.ui-sparkline__area');
    expect(area?.nextElementSibling).toHaveClass('ui-sparkline__line');
    expect(area?.getAttribute('d')).toMatch(/Z$/);
    expectHooksMatchSpec(document.body, 'SPARKLINE', { slots: ['area', 'line'] });
  });

  it('UIC-SPARKLINE-1.2 draws on a shared range when given one', () => {
    render(
      <Sparkline
        aria-label="Score"
        values={[0, 50, 100]}
        minValue={0}
        maxValue={200}
        width={46}
        height={26}
      />,
    );
    expect(screen.getByRole('img').querySelector('.ui-sparkline__line')).toHaveAttribute(
      'd',
      'M3,23L23,18L43,13',
    );
  });

  it('UIC-SPARKLINE-1.3 marks an empty series and draws nothing', () => {
    render(
      <Sparkline
        aria-label="Nothing yet"
        values={[Number.NaN]}
        variant="area"
        markers={['last']}
      />,
    );
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('data-empty', 'true');
    expect(image.querySelector('path, circle')).toBeNull();
    expect(image).toHaveAccessibleDescription('No data');
    expectHooksMatchSpec(document.body, 'SPARKLINE');
  });

  it('UIC-SPARKLINE-1.4 marks the lowest, highest and last values', () => {
    render(
      <Sparkline
        aria-label="Builds"
        values={week}
        markers={['min', 'max', 'last']}
        width={46}
        height={26}
      />,
    );
    const markers = [...screen.getByRole('img').querySelectorAll('.ui-sparkline__marker')];
    expect(markers.map((marker) => marker.getAttribute('data-marker'))).toEqual([
      'min',
      'max',
      'last',
    ]);
    expect(markers.map((marker) => [marker.getAttribute('cx'), marker.getAttribute('cy')])).toEqual(
      [
        ['3', '23'],
        ['27', '3'],
        ['43', '7.29'],
      ],
    );
    expectHooksMatchSpec(document.body, 'SPARKLINE', { slots: ['line', 'marker'] });
  });

  it('UIC-SPARKLINE-1.5 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as SVGSVGElement | null };
    render(
      <Sparkline
        aria-label="Probe"
        className="caller"
        id="probe"
        ref={ref}
        data-sample="probe"
        data-variant="caller"
        values={week}
      />,
    );
    const image = screen.getByRole('img', { name: 'Probe' });
    expect(image).toHaveClass('ui-sparkline', 'caller');
    expect(image).toHaveAttribute('id', 'probe');
    expect(image).toHaveAttribute('data-variant', 'line');
    expect(image).toHaveAttribute('data-sample', 'probe');
    expect(ref.current).toBe(image);
    expectHooksMatchSpec(document.body, 'SPARKLINE', { callerAttributes: ['data-sample'] });
  });

  it('UIC-SPARKLINE-2.1 takes no tab stop', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Sparkline aria-label="Builds" values={week} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(screen.getByRole('img')).toHaveAttribute('focusable', 'false');
  });

  it('UIC-SPARKLINE-2.2 is described by its lowest, highest and last values', () => {
    render(
      <>
        <p id="note">Updated hourly</p>
        <Sparkline aria-label="Builds" aria-describedby="note" values={week} />
      </>,
    );
    expect(screen.getByRole('img')).toHaveAccessibleDescription(
      'Low 4, high 18, last 15 Updated hourly',
    );
  });

  it('UIC-SPARKLINE-2.2 formats the summary for the locale through the provider', () => {
    render(
      <UiProvider
        locale="de-DE"
        strings={{ seriesSummary: ({ low, high, last }) => `${low} bis ${high}, zuletzt ${last}` }}
      >
        <Sparkline
          aria-label="Quote"
          values={[0.125, 0.5, 0.25]}
          formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
        />
      </UiProvider>,
    );
    expect(screen.getByRole('img')).toHaveAccessibleDescription(
      /^12,5\s% bis 50\s%, zuletzt 25\s%$/,
    );
  });
});

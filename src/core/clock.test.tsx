import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useNow, useTimeZone, useToday } from './clock.js';
import { UiProvider } from './provider.js';

const instant = new Date('2026-10-31T23:30:00Z');
const getNow = () => instant;

function ClockReadout({ timeZone }: { timeZone?: string }) {
  const now = useNow();
  const zone = useTimeZone(timeZone);
  const today = useToday(timeZone);
  return (
    <output aria-label="Clock">
      {[now?.toISOString() ?? 'unknown', zone, today ?? 'unknown'].join(' | ')}
    </output>
  );
}

describe('Clock', () => {
  it('UIC-PROVIDER-8.1 reads now and today from the provider clock in its zone', () => {
    render(
      <UiProvider getNow={getNow} timeZone="Asia/Tokyo">
        <ClockReadout />
      </UiProvider>,
    );
    expect(screen.getByRole('status', { name: 'Clock' })).toHaveTextContent(
      '2026-10-31T23:30:00.000Z | Asia/Tokyo | 2026-11-01',
    );
  });

  it('UIC-PROVIDER-8.1 lets a nested provider and a component override one source at a time', () => {
    render(
      <UiProvider getNow={getNow} timeZone="Asia/Tokyo">
        <UiProvider timeZone="America/New_York">
          <ClockReadout />
          <ClockReadout timeZone="UTC" />
        </UiProvider>
      </UiProvider>,
    );
    const [nested, own] = screen.getAllByRole('status', { name: 'Clock' });
    expect(nested).toHaveTextContent('2026-10-31T23:30:00.000Z | America/New_York | 2026-10-31');
    expect(own).toHaveTextContent('2026-10-31T23:30:00.000Z | UTC | 2026-10-31');
  });

  it('UIC-PROVIDER-8.2 reads neither the clock nor the device zone on the server', () => {
    const view = renderToString(
      <>
        <ClockReadout />
        <UiProvider getNow={getNow} timeZone="Asia/Tokyo">
          <ClockReadout />
        </UiProvider>
      </>,
    );
    expect(view).toContain('unknown | UTC | unknown');
    expect(view).toContain('unknown | Asia/Tokyo | unknown');
  });
});

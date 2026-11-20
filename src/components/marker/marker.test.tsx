import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Marker, MarkerContent, MarkerIcon, type MarkerVariant } from './index.js';

const variants: MarkerVariant[] = ['default', 'separator', 'border'];

it.each(variants)('UIC-MARKER-1.1 publishes the %s variant around its parts', (variant) => {
  const { container } = render(
    <Marker variant={variant} role="separator" aria-label="Today" data-testid="day">
      <MarkerIcon>●</MarkerIcon>
      <MarkerContent>
        Today, <a href="#unread">2 unread</a>
      </MarkerContent>
    </Marker>,
  );
  const marker = screen.getByRole('separator', { name: 'Today' });
  expect(marker).toHaveAttribute('data-variant', variant);
  expect(marker).toHaveAttribute('data-testid', 'day');
  expect(marker.querySelector('.ui-marker__icon')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByRole('link', { name: '2 unread' })).toHaveAttribute('href', '#unread');
  expectHooksMatchSpec(container, 'MARKER', { slots: 'all', callerAttributes: ['data-testid'] });
});

it('UIC-MARKER-1.1 defaults to the plain variant without a role of its own', () => {
  render(<Marker>Stopped</Marker>);
  const marker = screen.getByText('Stopped');
  expect(marker).toHaveAttribute('data-variant', 'default');
  expect(marker).not.toHaveAttribute('role');
});

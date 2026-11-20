import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Bubble, BubbleContent, type BubbleVariant } from './index.js';

const variants: BubbleVariant[] = ['default', 'muted', 'outline', 'ghost'];

it.each(variants)(
  'UIC-BUBBLE-1.1 exposes the %s surface and forwards its content markup',
  (variant) => {
    const { container } = render(
      <Bubble variant={variant} align="end" role="group" aria-label="Attachment">
        <BubbleContent>
          <a href="#plan">View plan</a>
        </BubbleContent>
      </Bubble>,
    );
    const bubble = screen.getByRole('group', { name: 'Attachment' });
    expect(bubble).toHaveAttribute('data-variant', variant);
    expect(bubble).toHaveAttribute('data-align', 'end');
    expect(within(bubble).getByRole('link', { name: 'View plan' })).toHaveAttribute(
      'href',
      '#plan',
    );
    expectHooksMatchSpec(container, 'BUBBLE', { slots: 'all' });
  },
);

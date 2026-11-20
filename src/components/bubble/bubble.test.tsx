import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  type BubbleVariant,
} from './index.js';

const variants: BubbleVariant[] = [
  'default',
  'secondary',
  'muted',
  'tinted',
  'outline',
  'ghost',
  'destructive',
];

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
    expectHooksMatchSpec(container, 'BUBBLE', { slots: ['content'] });
  },
);

it('UIC-BUBBLE-1.2 stacks bubbles and publishes where their reactions sit', () => {
  const { container } = render(
    <BubbleGroup role="list" aria-label="Bubbles">
      <Bubble role="listitem">
        <BubbleContent>Take the ferry.</BubbleContent>
        <BubbleReactions aria-label="Reactions">👍 2</BubbleReactions>
      </Bubble>
      <Bubble role="listitem">
        <BubbleContent>At six.</BubbleContent>
        <BubbleReactions side="top" align="start" aria-label="Top reactions">
          ⭐ 1
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>,
  );
  const group = screen.getByRole('list', { name: 'Bubbles' });
  expect(group).toHaveClass('ui-bubble-group');
  expect(within(group).getAllByRole('listitem')).toHaveLength(2);
  const reactions = screen.getByLabelText('Reactions');
  expect(reactions).toHaveAttribute('data-side', 'bottom');
  expect(reactions).toHaveAttribute('data-align', 'end');
  expect(reactions).toHaveTextContent('👍 2');
  const top = screen.getByLabelText('Top reactions');
  expect(top).toHaveAttribute('data-side', 'top');
  expect(top).toHaveAttribute('data-align', 'start');
  expectHooksMatchSpec(container, 'BUBBLE', { slots: 'all' });
});

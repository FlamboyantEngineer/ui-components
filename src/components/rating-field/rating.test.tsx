import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ThumbsUpGlyph } from '../../core/glyphs.js';
import { fr } from '../../core/locales/index.js';
import { UiProvider } from '../../core/provider.js';
import { Rating } from './rating.js';

function fills(element: Element) {
  return [...element.querySelectorAll('.ui-rating__item')].map((item) =>
    item.getAttribute('data-fill'),
  );
}

describe('Rating', () => {
  it('UIC-RATING-FIELD-4.1 is one image named by its score', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Rating value={4.3} />
        <button type="button">After</button>
      </>,
    );
    const rating = screen.getByRole('img', { name: '4.3 out of 5' });
    expect(rating.tagName).toBe('SPAN');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    for (const glyph of rating.querySelectorAll('svg')) {
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
    }
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expectHooksMatchSpec(document.body, 'RATING-FIELD', {
      slots: ['ui-rating__item', 'ui-rating__glyph', 'ui-rating__fill'],
    });
  });

  it('UIC-RATING-FIELD-4.1 names a missing score, a value label or the caller name', () => {
    const { rerender } = render(<Rating value={null} />);
    const rating = screen.getByRole('img', { name: 'No rating' });
    expect(rating).toHaveAttribute('data-empty', 'true');
    rerender(<Rating value={Number.NaN} />);
    expect(rating).toHaveAccessibleName('No rating');
    rerender(<Rating value={4.3} valueLabel="4.3 out of 5, 120 reviews" />);
    expect(rating).toHaveAccessibleName('4.3 out of 5, 120 reviews');
    rerender(<Rating value={4.3} valueLabel="  " />);
    expect(rating).toHaveAccessibleName('4.3 out of 5');
    rerender(<Rating value={4.3} aria-label="Average score" />);
    expect(rating).toHaveAccessibleName('Average score');
    rerender(
      <>
        <span id="heading">Reviews</span>
        <Rating value={4.3} aria-labelledby="heading" />
      </>,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('Reviews');
  });

  it('UIC-RATING-FIELD-4.1 formats the score for the locale', () => {
    render(
      <UiProvider locale="fr-FR" messages={fr}>
        <Rating value={4.5} />
      </UiProvider>,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('4,5 sur 5');
  });

  it('UIC-RATING-FIELD-4.2 fills glyphs up to a fractional score within the range', () => {
    const { rerender } = render(<Rating value={4.3} />);
    const rating = screen.getByRole('img');
    expect(fills(rating)).toEqual(['full', 'full', 'full', 'full', 'partial']);
    const last = rating.querySelectorAll<HTMLElement>('.ui-rating__item')[4];
    expect(last?.style.getPropertyValue('--ui-rating-fill')).toBe('30%');
    rerender(<Rating value={12} maxValue={3} />);
    expect(rating).toHaveAccessibleName('3 out of 3');
    expect(fills(rating)).toEqual(['full', 'full', 'full']);
    rerender(<Rating value={-2} />);
    expect(rating).toHaveAccessibleName('0 out of 5');
    expect(fills(rating)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
    expect(rating).not.toHaveAttribute('data-empty');
    expectHooksMatchSpec(document.body, 'RATING-FIELD');
  });

  it('UIC-RATING-FIELD-4.3 publishes its size, draws custom glyphs and forwards caller attributes', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(
      <Rating
        ref={ref}
        id="score"
        className="caller"
        data-probe="rating"
        value={2}
        size="lg"
        icon={ThumbsUpGlyph}
      />,
    );
    const rating = screen.getByRole('img');
    expect(rating).toHaveAttribute('data-size', 'lg');
    expect(rating).toHaveClass('ui-rating', 'caller');
    expect(rating).toHaveAttribute('id', 'score');
    expect(rating).toHaveAttribute('data-probe', 'rating');
    expect(ref.current).toBe(rating);
    expect(rating.querySelectorAll('[data-glyph="thumbs-up"]')).toHaveLength(10);
    expectHooksMatchSpec(document.body, 'RATING-FIELD', { callerAttributes: ['data-probe'] });
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { InlineTextDiff } from './inline-text-diff.js';
import { createInlineTextDiffExcerpt, createInlineWordDiff, splitTextDiff } from './text-diff.js';

describe('text diff helpers', () => {
  it('UIC-INLINE-TEXT-DIFF-1.1 splits around one contiguous change', () => {
    expect(splitTextDiff('The red apple', 'The green apple')).toEqual({
      prefix: 'The ',
      removed: 'red',
      added: 'green',
      suffix: ' apple',
    });
    expect(splitTextDiff('aaa', 'aa')).toEqual({
      prefix: 'aa',
      removed: 'a',
      added: '',
      suffix: '',
    });
    expect(splitTextDiff('same', 'same')).toEqual({
      prefix: 'same',
      removed: '',
      added: '',
      suffix: '',
    });
    expect(splitTextDiff('plum 🍑', 'plum 🍐')).toEqual({
      prefix: 'plum ',
      removed: '🍑',
      added: '🍐',
      suffix: '',
    });
  });

  it('UIC-INLINE-TEXT-DIFF-1.2 bounds context and runs, and drops empty segments', () => {
    expect(createInlineTextDiffExcerpt('', 'First value')).toEqual([
      { kind: 'added', text: 'First value' },
    ]);
    expect(createInlineTextDiffExcerpt('Old value', '')).toEqual([
      { kind: 'removed', text: 'Old value' },
    ]);
    const before = `${'a'.repeat(40)}X${'b'.repeat(40)}`;
    const after = `${'a'.repeat(40)}${'Y'.repeat(150)}${'b'.repeat(40)}`;
    expect(createInlineTextDiffExcerpt(before, after)).toEqual([
      { kind: 'text', text: `…${'a'.repeat(24)}` },
      { kind: 'removed', text: 'X' },
      { kind: 'added', text: `${'Y'.repeat(100)}…` },
      { kind: 'text', text: `${'b'.repeat(24)}…` },
    ]);
    expect(createInlineTextDiffExcerpt(before, after, { context: 2, run: 3 })).toEqual([
      { kind: 'text', text: '…aa' },
      { kind: 'removed', text: 'X' },
      { kind: 'added', text: 'YYY…' },
      { kind: 'text', text: 'bb…' },
    ]);
  });
});

describe('word changes', () => {
  it('UIC-INLINE-TEXT-DIFF-1.3 shows every changed run of words in place, uncut', () => {
    expect(
      createInlineWordDiff('Ship pears to Lisbon on Monday', 'Ship plums to Porto on Monday'),
    ).toEqual([
      { kind: 'text', text: 'Ship ' },
      { kind: 'removed', text: 'pears' },
      { kind: 'added', text: 'plums' },
      { kind: 'text', text: ' to ' },
      { kind: 'removed', text: 'Lisbon' },
      { kind: 'added', text: 'Porto' },
      { kind: 'text', text: ' on Monday' },
    ]);
    expect(createInlineWordDiff('', 'First value')).toEqual([
      { kind: 'added', text: 'First value' },
    ]);
    const long = 'word '.repeat(60);
    expect(createInlineWordDiff('', long)).toEqual([{ kind: 'added', text: long }]);
    const { container } = render(
      <InlineTextDiff segments={createInlineWordDiff('red and blue', 'green and yellow')} />,
    );
    expect(container.firstElementChild?.innerHTML).toBe(
      '<del class="ui-inline-text-diff__removed">red</del><ins class="ui-inline-text-diff__added">green</ins> and <del class="ui-inline-text-diff__removed">blue</del><ins class="ui-inline-text-diff__added">yellow</ins>',
    );
  });
});

describe('InlineTextDiff', () => {
  it('UIC-INLINE-TEXT-DIFF-2.1 renders removed and added runs as del and ins in reading order', () => {
    const { container } = render(
      <InlineTextDiff segments={createInlineTextDiffExcerpt('The red apple', 'The green apple')} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveClass('ui-inline-text-diff');
    expect(root.innerHTML).toBe(
      'The <del class="ui-inline-text-diff__removed">red</del><ins class="ui-inline-text-diff__added">green</ins> apple',
    );
    expect(screen.getByRole('deletion')).toHaveTextContent('red');
    expect(screen.getByRole('insertion')).toHaveTextContent('green');
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('aria-label');
    expectHooksMatchSpec(container, 'INLINE-TEXT-DIFF', { slots: 'all' });
  });

  it('UIC-INLINE-TEXT-DIFF-2.2 shows markup in values as text', () => {
    const { container } = render(
      <InlineTextDiff
        segments={[
          { kind: 'text', text: 'Text ' },
          { kind: 'removed', text: '<script>alert(1)</script>' },
          { kind: 'added', text: '<img src=x onerror=alert(1)>' },
        ]}
      />,
    );
    expect(container.querySelector('script, img')).toBeNull();
    expect(container.querySelector('del')).toHaveTextContent('<script>alert(1)</script>');
    expect(container.querySelector('ins')?.innerHTML).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('UIC-INLINE-TEXT-DIFF-2.3 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <InlineTextDiff
        segments={[{ kind: 'added', text: 'new' }]}
        className="caller"
        id="change"
        data-testid="probe"
      />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-inline-text-diff', 'caller');
    expect(root).toHaveAttribute('id', 'change');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'INLINE-TEXT-DIFF', { slots: ['added'] });
  });
});

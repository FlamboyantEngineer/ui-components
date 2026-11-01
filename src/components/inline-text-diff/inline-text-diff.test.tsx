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

  it('UIC-INLINE-TEXT-DIFF-1.2 keeps no context and no ellipsis with a zero context', () => {
    expect(
      createInlineTextDiffExcerpt('The quick brown fox', 'The quick red fox', { context: 0 }),
    ).toEqual([
      { kind: 'removed', text: 'brown' },
      { kind: 'added', text: 'red' },
    ]);
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

  /** Matches the whole text content, not a part of it. */
  const exactly = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

  it('UIC-INLINE-TEXT-DIFF-2.4 shows the final text without marks, from the segments or finalText', () => {
    const cases: Array<[string, string]> = [
      ['Pack the crates.', 'Pack the crates. Label each one.'],
      ['Pears, plums and cherries', 'Pears and cherries'],
      ['The red apple', 'The green apple'],
      ['Unchanged', 'Unchanged'],
      ['An old description', ''],
      ['two  spaces\nand a line', 'two  spaces\nand  a\nline'],
    ];
    for (const [before, after] of cases) {
      const { container, unmount } = render(
        <InlineTextDiff segments={createInlineWordDiff(before, after)} view="final" />,
      );
      const root = container.querySelector('.ui-inline-text-diff');
      expect(root).toHaveAttribute('data-view', 'final');
      expect(root).toHaveTextContent(exactly(after), { normalizeWhitespace: false });
      expect(container.querySelector('del, ins')).not.toBeInTheDocument();
      unmount();
    }
    const long = `${'Pack the apples gently, '.repeat(4)}then label each crate.`;
    const changed = long.replace('label', 'stamp');
    const excerpt = createInlineTextDiffExcerpt(long, changed, { context: 8 });
    const { container, rerender } = render(
      <InlineTextDiff segments={excerpt} view="final" finalText={changed} />,
    );
    expect(container).toHaveTextContent(exactly(changed), { normalizeWhitespace: false });
    rerender(<InlineTextDiff segments={excerpt} finalText={changed} />);
    expect(container.querySelector('.ui-inline-text-diff')).toHaveAttribute('data-view', 'changes');
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(container).not.toHaveTextContent(changed, { normalizeWhitespace: false });
  });
});

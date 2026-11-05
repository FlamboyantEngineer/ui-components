import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { FindBar, type FindBarProps } from './find-bar.js';

const fruit = ['Apple', 'apricot', 'Pear', 'apple pie'];

/** A caller that finds the query in a list of words, ignoring case, and steps through the matches. */
function Finder(props: Partial<FindBarProps>) {
  const [query, setQuery] = useState(props.defaultQuery ?? '');
  const [current, setCurrent] = useState(0);
  const matches = query ? fruit.filter((word) => word.toLowerCase().includes(query)) : [];
  const count = matches.length;
  return (
    <FindBar
      {...props}
      query={query}
      onQueryChange={(next) => {
        setQuery(next);
        setCurrent(0);
        props.onQueryChange?.(next);
      }}
      matchCount={query ? count : undefined}
      currentIndex={current}
      onNext={() => setCurrent((current + 1) % count)}
      onPrevious={() => setCurrent((current - 1 + count) % count)}
    />
  );
}

function status() {
  return screen.getByRole('status');
}

describe('FindBar', () => {
  it('UIC-FIND-BAR-1.1 draws a find box named by its label that reports the query', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <FindBar placeholder="Find a fruit" onQueryChange={onQueryChange} inputRef={inputRef} />,
    );
    const box = screen.getByRole('searchbox', { name: 'Find' });
    expect(box).toHaveAttribute('placeholder', 'Find a fruit');
    expect(inputRef.current).toBe(box);
    expect(box.closest('.ui-find-bar__query')).toHaveClass('ui-search-field');
    await user.type(box, 'ap');
    expect(onQueryChange.mock.calls.map(([query]) => query)).toEqual(['a', 'ap']);
    await user.keyboard('{Escape}');
    expect(box).toHaveValue('');
    expectHooksMatchSpec(container, 'FIND-BAR', {
      slots: ['query', 'navigation', 'status', 'previous', 'next'],
    });
  });

  it('UIC-FIND-BAR-1.1 takes a starting query and its own label', () => {
    render(<FindBar label="Find in the list" defaultQuery="pear" />);
    expect(screen.getByRole('searchbox', { name: 'Find in the list' })).toHaveValue('pear');
  });

  it('UIC-FIND-BAR-1.2 reads nothing, no results, the current match, the total or searching', () => {
    const { container, rerender } = render(<FindBar />);
    expect(status()).toHaveClass('ui-find-bar__status');
    expect(status()).toHaveTextContent('');
    rerender(<FindBar matchCount={0} />);
    expect(status()).toHaveTextContent('No results');
    rerender(<FindBar matchCount={12} currentIndex={2} />);
    expect(status()).toHaveTextContent('3 of 12');
    rerender(<FindBar matchCount={12} currentIndex={-1} />);
    expect(status()).toHaveTextContent('12 matches');
    rerender(<FindBar matchCount={1} />);
    expect(status()).toHaveTextContent('1 match');
    const root = container.querySelector('.ui-find-bar');
    expect(root).not.toHaveAttribute('data-pending');
    rerender(<FindBar matchCount={1} isPending />);
    expect(status()).toHaveTextContent('Searching…');
    expect(root).toHaveAttribute('data-pending', 'true');
    expect(container.querySelector('.ui-search-field__spinner')).not.toBeNull();
    expectHooksMatchSpec(container, 'FIND-BAR');
  });

  it('UIC-FIND-BAR-1.3 steps with the buttons, Enter and Shift+Enter, disabled without matches', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Finder />
      </form>,
    );
    const previous = screen.getByRole('button', { name: 'Previous match' });
    const next = screen.getByRole('button', { name: 'Next match' });
    expect(previous).toBeDisabled();
    expect(next).toBeDisabled();
    expect(previous.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'arrow-up');
    expect(next.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'arrow-down');
    await user.type(screen.getByRole('searchbox'), 'ap');
    expect(status()).toHaveTextContent('1 of 3');
    await user.keyboard('{Enter}');
    expect(status()).toHaveTextContent('2 of 3');
    await user.keyboard('{Shift>}{Enter}{/Shift}{Shift>}{Enter}{/Shift}');
    expect(status()).toHaveTextContent('3 of 3');
    await user.click(next);
    expect(status()).toHaveTextContent('1 of 3');
    await user.click(previous);
    expect(status()).toHaveTextContent('3 of 3');
    await user.type(screen.getByRole('searchbox'), 'x{Enter}');
    expect(status()).toHaveTextContent('No results');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('UIC-FIND-BAR-1.4 checks the options that are on in a menu that stays open', async () => {
    const user = userEvent.setup();
    const onSelectedOptionsChange = vi.fn();
    const options = [
      { id: 'case', label: 'Match case' },
      { id: 'words', label: 'Whole words' },
    ];
    const { container } = render(
      <FindBar
        options={options}
        defaultSelectedOptions={['words']}
        onSelectedOptionsChange={onSelectedOptionsChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Find options' });
    expect(trigger).toHaveClass('ui-find-bar__options', 'ui-dropdown-menu');
    await user.click(trigger);
    const menu = await screen.findByRole('menu', { name: 'Find options' });
    const words = within(menu).getByRole('menuitemcheckbox', { name: 'Whole words' });
    expect(words).toBeChecked();
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Match case' }));
    expect(onSelectedOptionsChange).toHaveBeenLastCalledWith(new Set<Key>(['words', 'case']));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(words);
    expect(onSelectedOptionsChange).toHaveBeenLastCalledWith(new Set<Key>(['case']));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'FIND-BAR', { slots: ['options'] });
  });

  it('UIC-FIND-BAR-1.4 follows controlled options and shows no menu without options', () => {
    const { rerender } = render(<FindBar />);
    expect(screen.queryByRole('button', { name: 'Find options' })).not.toBeInTheDocument();
    rerender(
      <FindBar options={[{ id: 'case', label: 'Match case' }]} selectedOptions={['case']} />,
    );
    expect(screen.getByRole('button', { name: 'Find options' })).toBeInTheDocument();
  });

  it('UIC-FIND-BAR-1.5 replaces with the replacement text from the buttons and Enter', async () => {
    const user = userEvent.setup();
    const onReplace = vi.fn();
    const onReplaceAll = vi.fn();
    const onReplacementChange = vi.fn();
    const { container, rerender } = render(
      <FindBar
        matchCount={0}
        defaultReplacement="fig"
        onReplacementChange={onReplacementChange}
        onReplace={onReplace}
        onReplaceAll={onReplaceAll}
      />,
    );
    const box = screen.getByRole('textbox', { name: 'Replace with' });
    expect(box).toHaveClass('ui-find-bar__replacement');
    expect(box).toHaveValue('fig');
    expect(screen.getByRole('button', { name: 'Replace' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Replace all' })).toBeDisabled();
    await user.type(box, '{Enter}');
    expect(onReplace).not.toHaveBeenCalled();
    rerender(
      <FindBar
        matchCount={2}
        defaultReplacement="fig"
        onReplacementChange={onReplacementChange}
        onReplace={onReplace}
        onReplaceAll={onReplaceAll}
      />,
    );
    await user.type(box, 's');
    expect(onReplacementChange).toHaveBeenLastCalledWith('figs');
    await user.keyboard('{Enter}');
    expect(onReplace).toHaveBeenLastCalledWith('figs');
    await user.click(screen.getByRole('button', { name: 'Replace' }));
    expect(onReplace).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Replace all' }));
    expect(onReplaceAll).toHaveBeenCalledWith('figs');
    expectHooksMatchSpec(container, 'FIND-BAR', {
      slots: ['replacement', 'replace', 'replace-all'],
    });
  });

  it.each([
    ['while composing', { isComposing: true }],
    ['with key code 229', { keyCode: 229 }],
  ])(
    'UIC-FIND-BAR-1.3 UIC-FIND-BAR-1.5 ignores the Enter that confirms a text composition, %s',
    (_, composition) => {
      const onReplace = vi.fn();
      const onNext = vi.fn();
      render(<FindBar matchCount={3} currentIndex={0} onReplace={onReplace} onNext={onNext} />);
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing or keyCode on a keydown
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Replace with' }), {
        key: 'Enter',
        ...composition,
      });
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing or keyCode on a keydown
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter', ...composition });
      expect(onReplace).not.toHaveBeenCalled();
      expect(onNext).not.toHaveBeenCalled();
    },
  );

  it('UIC-FIND-BAR-1.2 keeps the count and its arrows in one navigation part', () => {
    const { container } = render(<FindBar matchCount={3} currentIndex={0} />);
    const navigation = container.querySelector('.ui-find-bar__navigation');
    expect(navigation).toContainElement(status());
    expect(navigation).toContainElement(screen.getByRole('button', { name: 'Previous match' }));
    expect(navigation).toContainElement(screen.getByRole('button', { name: 'Next match' }));
  });

  it('UIC-FIND-BAR-1.5 disables Replace and Replace all on their own, and hands out the replacement box', async () => {
    const user = userEvent.setup();
    const onReplace = vi.fn();
    const onReplaceAll = vi.fn();
    const replacementInputRef = createRef<HTMLInputElement>();
    const bar = (props: Partial<FindBarProps>) => (
      <FindBar
        matchCount={2}
        currentIndex={0}
        defaultReplacement="fig"
        onReplace={onReplace}
        onReplaceAll={onReplaceAll}
        replacementInputRef={replacementInputRef}
        {...props}
      />
    );
    const { rerender } = render(bar({ isReplaceDisabled: true }));
    const box = screen.getByRole('textbox', { name: 'Replace with' });
    expect(replacementInputRef.current).toBe(box);
    expect(screen.getByRole('button', { name: 'Replace' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Replace all' })).toBeEnabled();
    await user.type(box, '{Enter}');
    expect(onReplace).not.toHaveBeenCalled();
    rerender(bar({ isReplaceAllDisabled: true }));
    expect(screen.getByRole('button', { name: 'Replace' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Replace all' })).toBeDisabled();
    await user.keyboard('{Enter}');
    expect(onReplace).toHaveBeenCalledWith('fig');
    expect(onReplaceAll).not.toHaveBeenCalled();
  });

  it('UIC-FIND-BAR-1.5 shows only the replace buttons asked for, with a controlled replacement', () => {
    const { rerender } = render(<FindBar matchCount={1} />);
    expect(screen.queryByRole('textbox', { name: 'Replace with' })).not.toBeInTheDocument();
    rerender(<FindBar matchCount={1} replacement="kiwi" onReplaceAll={() => undefined} />);
    expect(screen.getByRole('textbox', { name: 'Replace with' })).toHaveValue('kiwi');
    expect(screen.queryByRole('button', { name: 'Replace' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replace all' })).toBeInTheDocument();
  });

  it('UIC-FIND-BAR-1.6 closes from its button and from Escape anywhere in the bar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <FindBar
        defaultQuery="pear"
        onClose={onClose}
        options={[{ id: 'case', label: 'Match case' }]}
        onReplace={() => undefined}
      />,
    );
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('ui-find-bar__close');
    await user.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('searchbox')).toHaveValue('pear');
    await user.click(screen.getByRole('textbox', { name: 'Replace with' }));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(3);
    await user.click(screen.getByRole('button', { name: 'Find options' }));
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(3);
    expectHooksMatchSpec(container, 'FIND-BAR', { slots: ['close'] });
  });

  it('UIC-FIND-BAR-1.6 leaves a composing Escape to the input method', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FindBar defaultQuery="pear" onClose={onClose} />);
    const search = screen.getByRole('searchbox');
    await user.click(search);
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(search, { key: 'Escape', isComposing: true, keyCode: 229 });
    expect(onClose).not.toHaveBeenCalled();
    expect(search).toHaveValue('pear');
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('UIC-FIND-BAR-2.1 names every control and keeps them in reading order', async () => {
    const user = userEvent.setup();
    render(
      <FindBar
        defaultQuery="pear"
        matchCount={1}
        options={[{ id: 'case', label: 'Match case' }]}
        onReplace={() => undefined}
        onReplaceAll={() => undefined}
        onClose={() => undefined}
      />,
    );
    expect(status()).toHaveAttribute('role', 'status');
    const names: string[] = [];
    await user.click(screen.getByRole('searchbox'));
    for (let step = 0; step < 9; step += 1) {
      const focused = document.activeElement as HTMLElement;
      names.push(focused.getAttribute('aria-label') ?? focused.textContent ?? '');
      await user.tab();
    }
    expect(names).toEqual([
      'Find',
      'Clear search',
      'Previous match',
      'Next match',
      'Find options',
      'Replace with',
      'Replace',
      'Replace all',
      'Close',
    ]);
  });

  it('UIC-FIND-BAR-2.2 forwards the caller class, id and data attributes to the root', () => {
    const { container } = render(<FindBar className="toolbar-find" id="find" data-region="top" />);
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-find-bar', 'toolbar-find');
    expect(root).toHaveAttribute('id', 'find');
    expect(root).toHaveAttribute('data-region', 'top');
    expectHooksMatchSpec(container, 'FIND-BAR', { callerAttributes: ['data-region'] });
  });
});

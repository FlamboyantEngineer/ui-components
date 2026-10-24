import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ControlCompletionList,
  matchCompletions,
  scoreCompletion,
  useTextCompletions,
  type Completion,
  type CompletionSource,
  type CompletionsModel,
} from './completion-list.js';

const fruit: Completion[] = [
  { label: 'apple', insertText: 'apple pie' },
  { label: 'apricot' },
  { label: 'banana' },
];

/** A plain text area with completions, as a text control would wire them. */
function Notes({
  completions,
  isLocked = false,
  onKeyDown,
  onModel,
  onInsert,
}: {
  completions: readonly Completion[] | CompletionSource;
  isLocked?: boolean;
  onKeyDown?: () => void;
  onModel?: (model: CompletionsModel) => void;
  onInsert?: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { model, listId, inputProps } = useTextCompletions({
    completions,
    inputRef,
    isLocked,
    setValue: (next) => {
      onInsert?.(next);
      setValue(next);
    },
  });
  onModel?.(model);
  return (
    <>
      <textarea
        {...inputProps}
        ref={inputRef}
        aria-label="Notes"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          model.track('input');
        }}
        onKeyDown={(event) => {
          if (!model.handleKeyDown(event)) onKeyDown?.();
        }}
        onBlur={() => model.close()}
      />
      <ControlCompletionList
        model={model}
        listId={listId}
        anchorRef={inputRef}
        className="ui-probe"
      />
    </>
  );
}

const input = () => screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Notes' });
const optionTexts = () => screen.queryAllByRole('option').map((option) => option.textContent);

afterEach(() => vi.restoreAllMocks());

describe('Completions engine', () => {
  it('UIC-COMPLETION-LIST-2.1 ranks prefixes first, then word starts, leaving out an exact label', () => {
    expect(scoreCompletion('Maria Santos', 'mar')).toBe(0);
    expect(scoreCompletion('Maria Santos', 'san')).toBe(1);
    expect(scoreCompletion('Maria Santos', 'msa')).toBe(2);
    expect(scoreCompletion('Maria Santos', 'aria')).toBeNull();
    const labels = (query: string) => matchCompletions(fruit, query).map(({ label }) => label);
    expect(labels('ap')).toEqual(['apple', 'apricot']);
    expect(labels('apple')).toEqual([]);
    expect(labels('')).toEqual(['apple', 'apricot', 'banana']);
  });

  it('UIC-COMPLETION-LIST-2.1 ranks a later word prefix as a word prefix when an earlier word shares its first letter', () => {
    expect(scoreCompletion('new_name', 'na')).toBe(1);
    expect(scoreCompletion('new_name_number', 'nu')).toBe(1);
    expect(scoreCompletion('new_name', 'nwa')).toBe(3);
    const labels = matchCompletions([{ label: 'new_name' }, { label: 'first_name' }], 'na');
    expect(labels.map(({ label }) => label)).toEqual(['new_name', 'first_name']);
  });

  it('UIC-COMPLETION-LIST-2.2 UIC-COMPLETION-LIST-2.4 completes the word before the caret from a vocabulary', async () => {
    const user = userEvent.setup();
    render(<Notes completions={fruit} />);
    expect(input()).toHaveAttribute('aria-autocomplete', 'list');
    expect(input()).toHaveAttribute('aria-haspopup', 'listbox');
    expect(input()).not.toHaveAttribute('aria-controls');
    await user.click(input());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('I like ap');
    const list = await screen.findByRole('listbox', { name: 'Suggestions' });
    expect(optionTexts()).toEqual(['apple', 'apricot']);
    expect(input()).toHaveAttribute('aria-controls', list.id);
    expect(input()).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0]?.id);
    await user.keyboard('{Enter}');
    expect(input()).toHaveValue('I like apple pie');
    expect(input().selectionStart).toBe('I like apple pie'.length);
    expect(input()).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input()).not.toHaveAttribute('aria-activedescendant');
  });

  it('UIC-COMPLETION-LIST-2.2 asks a source and replaces the range it names, filtered or as given', async () => {
    const user = userEvent.setup();
    const source = vi.fn<CompletionSource>(({ value, caret }) => {
      const at = value.lastIndexOf('#', caret - 1);
      if (at === -1) return [];
      return { from: at, filter: false, options: [{ label: '#12', insertText: 'Requirement 12' }] };
    });
    render(<Notes completions={source} />);
    await user.click(input());
    await user.keyboard('See #9');
    expect(source).toHaveBeenLastCalledWith({
      value: 'See #9',
      caret: 6,
      query: '9',
      isExplicit: false,
    });
    await waitFor(() => expect(optionTexts()).toEqual(['#12']));
    await user.keyboard('{Tab}');
    expect(input()).toHaveValue('See Requirement 12');
  });

  it('UIC-COMPLETION-LIST-2.2 shows only the latest answer and nothing for a locked control', async () => {
    const user = userEvent.setup();
    const answers: Array<(options: Completion[]) => void> = [];
    const source: CompletionSource = () =>
      new Promise<Completion[]>((resolve) => answers.push(resolve));
    const { unmount } = render(<Notes completions={source} />);
    await user.click(input());
    await user.keyboard('ap');
    await act(async () => answers.at(-1)?.([{ label: 'apricot' }]));
    await waitFor(() => expect(optionTexts()).toEqual(['apricot']));
    await act(async () => answers.at(-2)?.([{ label: 'apple' }]));
    await waitFor(() => expect(optionTexts()).toEqual(['apricot']));
    unmount();
    render(<Notes completions={fruit} isLocked />);
    await user.click(input());
    await user.keyboard('ap{Control>} {/Control}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-COMPLETION-LIST-2.2 keeps an open list, narrowed to the typed text, while a source answers a later edit', async () => {
    const user = userEvent.setup();
    const answers: Array<(options: Completion[]) => void> = [];
    const source: CompletionSource = () =>
      new Promise<Completion[]>((resolve) => answers.push(resolve));
    render(<Notes completions={source} />);
    await user.click(input());
    await user.keyboard('a');
    await act(async () => answers.at(-1)?.(fruit));
    await waitFor(() => expect(optionTexts()).toEqual(['apple', 'apricot']));
    const list = screen.getByRole('listbox');
    await user.keyboard('pr');
    expect(input()).toHaveAttribute('aria-controls', list.id);
    expect(optionTexts()).toEqual(['apricot']);
    await user.keyboard('{Enter}');
    expect(input()).toHaveValue('apricot');
  });

  it('UIC-COMPLETION-LIST-2.2 discards a pending answer when locked and requires a new lookup after unlocking', async () => {
    const user = userEvent.setup();
    const answers: Array<(options: Completion[]) => void> = [];
    const source: CompletionSource = () =>
      new Promise<Completion[]>((resolve) => answers.push(resolve));
    const { rerender } = render(<Notes completions={source} />);
    await user.click(input());
    await user.keyboard('ap');
    const pending = answers.at(-1);
    rerender(<Notes completions={source} isLocked />);
    await act(async () => pending?.([{ label: 'apple' }]));
    rerender(<Notes completions={source} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{Control>} {/Control}');
    await act(async () => answers.at(-1)?.([{ label: 'apricot' }]));
    await waitFor(() => expect(optionTexts()).toEqual(['apricot']));
  });

  it('UIC-COMPLETION-LIST-2.2 UIC-COMPLETION-LIST-2.4 refuses a captured insertion callback after locking and keeps the old list closed', async () => {
    const user = userEvent.setup();
    let model: CompletionsModel | undefined;
    const onModel = (current: CompletionsModel) => (model = current);
    const onInsert = vi.fn();
    const props = { completions: fruit, onModel, onInsert };
    const { rerender } = render(<Notes {...props} />);
    await user.click(input());
    await user.keyboard('ap');
    const choose = model!.apply;
    const option = model!.options[0]!;
    rerender(<Notes {...props} isLocked />);
    act(() => choose(option));
    expect(onInsert).not.toHaveBeenCalled();
    expect(input()).toHaveValue('ap');
    rerender(<Notes {...props} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-COMPLETION-LIST-2.4 inserts only once when a callback is repeated before the next render', async () => {
    const user = userEvent.setup();
    let model: CompletionsModel | undefined;
    const onInsert = vi.fn();
    render(
      <Notes completions={fruit} onInsert={onInsert} onModel={(current) => (model = current)} />,
    );
    await user.click(input());
    await user.keyboard('ap');
    const choose = model!.apply;
    const option = model!.options[0]!;
    act(() => {
      choose(option);
      choose(option);
    });
    expect(onInsert).toHaveBeenCalledExactlyOnceWith('apple pie');
    expect(input()).toHaveValue('apple pie');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-COMPLETION-LIST-2.3 moves with the arrows, closes with Escape and keeps used keys from the control', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<Notes completions={fruit} onKeyDown={onKeyDown} />);
    await user.click(input());
    await user.keyboard('{Control>} {/Control}');
    await screen.findByRole('listbox');
    onKeyDown.mockClear();
    const active = () => screen.getByRole('option', { selected: true }).textContent;
    expect(active()).toBe('apple');
    await user.keyboard('{ArrowDown}');
    expect(active()).toBe('apricot');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(active()).toBe('apple');
    await user.keyboard('{ArrowUp}');
    expect(active()).toBe('banana');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onKeyDown).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    await user.keyboard('a');
    await waitFor(() => expect(optionTexts()).toEqual(['apple', 'apricot']));
    expect(onKeyDown).toHaveBeenCalledTimes(2);
  });

  it('UIC-COMPLETION-LIST-2.3 shows nothing after a bare caret move and follows the caret into a word', async () => {
    const user = userEvent.setup();
    render(<Notes completions={fruit} />);
    await user.click(input());
    await user.keyboard('ban ');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => expect(optionTexts()).toEqual(['banana']));
    await user.keyboard('{End}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-COMPLETION-LIST-2.4 inserts as a browser edit when the browser offers one', async () => {
    const user = userEvent.setup();
    const execCommand = vi.fn((command: string, _ui?: boolean, text?: string) => {
      const control = document.activeElement as HTMLTextAreaElement;
      control.setRangeText(text ?? '', control.selectionStart, control.selectionEnd, 'end');
      control.dispatchEvent(new Event('input', { bubbles: true }));
      return command === 'insertText';
    });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    render(<Notes completions={fruit} />);
    await user.click(input());
    await user.keyboard('ba{Enter}');
    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'banana');
    expect(input()).toHaveValue('banana');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    Reflect.deleteProperty(document, 'execCommand');
  });
});

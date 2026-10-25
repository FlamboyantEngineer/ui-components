import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../../test/hooks.js';
import { installEditorDom } from '../../../../test/rich-text-fixtures.js';
import { UiProvider } from '../../../core/provider.js';
import { createMemoryStorage } from '../../../core/storage.js';
import type { MessageComposerMessage } from '../composer-message.js';
import {
  RichMessageComposer,
  type MessageComposerCommand,
  type MessageComposerMention,
  type RichMessageComposerProps,
} from './rich-message-composer.js';

installEditorDom();

const people: MessageComposerMention[] = [
  { id: 'maria', label: 'Maria Santos', description: 'Design', colorKey: 'maria' },
  { id: 'jon', label: 'Jon Berg', description: 'Research' },
];

const commands: MessageComposerCommand[] = [
  { id: 'summarize', label: 'summarize', description: 'Summarize the thread' },
  { id: 'translate', label: 'translate', description: 'Translate the last reply' },
];

const maria = { kind: 'mention', id: 'maria', label: 'Maria Santos' } as const;

const box = (name = 'Message') => screen.getByRole('textbox', { name });
const root = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('.ui-message-composer') as HTMLElement;

/** Renders a rich composer with people and commands, recording what it sends. */
function renderComposer(props: Partial<RichMessageComposerProps> = {}) {
  const onSubmit = vi.fn<(message: MessageComposerMessage) => void>();
  const user = userEvent.setup();
  const view = render(
    <RichMessageComposer mentions={people} commands={commands} onSubmit={onSubmit} {...props} />,
  );
  return { ...view, user, onSubmit };
}

/** A native data transfer carrying files and text, as a drag or a paste reads it. */
function transfer(files: File[], data: Record<string, string> = {}) {
  return {
    types: [...(files.length > 0 ? ['Files'] : []), ...Object.keys(data)],
    files,
    items: files.map((entry) => ({ kind: 'file', type: entry.type, getAsFile: () => entry })),
    dropEffect: 'none',
    effectAllowed: 'all',
    getData: (type: string) => data[type] ?? '',
  } as unknown as DataTransfer;
}

describe('RichMessageComposer', () => {
  it('UIC-MESSAGE-COMPOSER-4.2 UIC-MESSAGE-COMPOSER-2.1 UIC-MESSAGE-COMPOSER-2.2 is a named multi-line text box with a placeholder in the composer frame', async () => {
    const ref = createRef<HTMLDivElement>();
    const onChange = vi.fn();
    const { container, user } = renderComposer({
      id: 'composer',
      className: 'caller',
      'data-testid': 'probe',
      placeholder: 'Ask anything',
      ref,
      onChange,
    });
    const content = box();
    expect(ref.current).toBe(content);
    expect(content).toHaveAttribute('aria-multiline', 'true');
    expect(content).toHaveAttribute('aria-placeholder', 'Ask anything');
    expect(content).toHaveAttribute('aria-autocomplete', 'list');
    expect(content).toHaveClass('ui-message-composer__input', 'ProseMirror');
    const line = content.querySelector('p');
    expect(line).toHaveClass('ui-message-composer__placeholder');
    expect(line).toHaveAttribute('data-placeholder', 'Ask anything');
    expect(root(container)).toHaveAttribute('id', 'composer');
    expect(root(container)).toHaveClass('caller');
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', {
      slots: ['input', 'placeholder', 'footer', 'action'],
      callerAttributes: ['data-testid'],
    });
    await user.click(content);
    expect(content).toHaveAttribute('data-focused', 'true');
    await user.keyboard('Hi');
    expect(content.querySelector('.ui-message-composer__placeholder')).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith({ text: 'Hi', tokens: [] });
  });

  it('UIC-MESSAGE-COMPOSER-4.2 UIC-MESSAGE-COMPOSER-1.4 is not editable while disabled', () => {
    const { container } = renderComposer({
      isDisabled: true,
      defaultValue: { text: 'Hi', tokens: [] },
    });
    expect(box()).toHaveAttribute('contenteditable', 'false');
    expect(box()).toHaveAttribute('aria-disabled', 'true');
    expect(box()).toHaveAttribute('data-disabled', 'true');
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('UIC-MESSAGE-COMPOSER-4.4 UIC-MESSAGE-COMPOSER-4.3 UIC-MESSAGE-COMPOSER-4.8 mentions people as pills from the keyboard', async () => {
    const { user, onSubmit, container } = renderComposer();
    await user.click(box());
    await user.keyboard('Ask @');
    const list = await screen.findByRole('listbox', { name: 'Suggestions' });
    const options = within(list).getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAccessibleName('Maria Santos Design');
    expect(options[1]).toHaveAccessibleName('Jon Berg Research');
    expect(options[0]?.querySelector('.ui-user-identity')).not.toBeNull();
    expect(document.querySelector('.ui-message-composer__completions')).toHaveClass(
      'ui-completion-list',
    );
    expect(box()).toHaveAttribute('aria-controls', list.id);
    expect(box()).toHaveAttribute('aria-activedescendant', options[0]?.id);
    await user.keyboard('{ArrowUp}');
    expect(box()).toHaveAttribute('aria-activedescendant', options[1]?.id);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(box()).toHaveAttribute('aria-activedescendant', options[1]?.id);
    await user.keyboard('{Enter}about it');
    const pill = box().querySelector('.ui-message-composer__pill');
    expect(pill).toHaveTextContent('@Jon Berg');
    expect(pill).toHaveAttribute('data-kind', 'mention');
    expect(pill).toHaveAttribute('contenteditable', 'false');
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', { slots: ['pill'] });
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard(' and @san');
    expect(within(await screen.findByRole('listbox')).getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Tab}{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({
      text: 'Ask @Jon Berg about it and @Maria Santos ',
      tokens: [
        { start: 4, end: 13, kind: 'mention', id: 'jon', label: 'Jon Berg' },
        { start: 27, end: 40, ...maria },
      ],
    });
  });

  it('UIC-MESSAGE-COMPOSER-4.4 closes the list with Escape until the next edit and opens nothing in a word', async () => {
    const { user, onSubmit } = renderComposer();
    await user.click(box());
    await user.keyboard('mail@m');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard(' /tr');
    expect(within(await screen.findByRole('listbox')).getByRole('option')).toHaveTextContent(
      '/translate Translate the last reply',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('a');
    await user.keyboard('{Enter}');
    const pill = box().querySelector('.ui-message-composer__pill');
    expect(pill).toHaveTextContent('/translate');
    expect(pill).toHaveAttribute('data-kind', 'command');
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({
      text: 'mail@m /translate ',
      tokens: [{ start: 7, end: 17, kind: 'command', id: 'translate', label: 'translate' }],
    });
  });

  it('UIC-MESSAGE-COMPOSER-4.3 removes a pill whole with one Backspace and announces it', async () => {
    const { user, onSubmit } = renderComposer({
      defaultValue: { text: 'Hi @Maria Santos', tokens: [{ start: 3, end: 16, ...maria }] },
    });
    // Focus from the keyboard keeps the caret where the composer put it: after the pill.
    await user.tab();
    await user.keyboard('{Backspace}');
    expect(box().querySelector('.ui-message-composer__pill')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Maria Santos removed');
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({ text: 'Hi ', tokens: [] });
  });

  it('UIC-MESSAGE-COMPOSER-4.5 opens a code block on three backticks where Enter adds lines', async () => {
    const { user, onSubmit, container } = renderComposer();
    await user.click(box());
    await user.keyboard('Look:{Shift>}{Enter}{/Shift}```');
    const block = box().querySelector('pre');
    expect(block).toHaveClass('ui-message-composer__code-block');
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', { slots: ['code-block'] });
    await user.keyboard('if (ok) {{{Enter}  run(@x){Enter}}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{ArrowDown}done{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({
      text: 'Look:\n```\nif (ok) {\n  run(@x)\n}\n```\ndone',
      tokens: [],
    });
  });

  it('UIC-MESSAGE-COMPOSER-4.5 undoes the fence with Backspace and sends from a code block with Ctrl+Enter', async () => {
    const { user, onSubmit } = renderComposer();
    await user.click(box());
    await user.keyboard('```{Backspace}');
    expect(box().querySelector('pre')).toBeNull();
    expect(box()).toHaveTextContent('```');
    await user.keyboard('{Control>}a{/Control}{Backspace}```x = 1{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith({ text: '```\nx = 1\n```', tokens: [] });
  });

  it('UIC-MESSAGE-COMPOSER-4.5 turns an empty code block back into a line with Backspace', async () => {
    const { user } = renderComposer({ defaultValue: { text: 'Run:\n```\n\n```', tokens: [] } });
    expect(box().querySelector('pre')).not.toBeNull();
    await user.tab();
    await user.keyboard('{Backspace}');
    expect(box().querySelector('pre')).toBeNull();
    expect(box().querySelectorAll('p')).toHaveLength(2);
  });

  it('UIC-MESSAGE-COMPOSER-4.6 wraps the selection in Markdown markers with Ctrl+B and Ctrl+I', async () => {
    const onChange = vi.fn();
    const { user } = renderComposer({ onChange });
    await user.click(box());
    await user.keyboard('bold{Control>}a{/Control}{Control>}b{/Control}');
    expect(onChange).toHaveBeenLastCalledWith({ text: '**bold**', tokens: [] });
    await user.keyboard('{Control>}i{/Control}');
    expect(onChange).toHaveBeenLastCalledWith({ text: '**_bold_**', tokens: [] });
    await user.keyboard('{Control>}a{/Control}{Backspace}```{Control>}b{/Control}');
    expect(onChange).toHaveBeenLastCalledWith({ text: '```\n\n```', tokens: [] });
  });

  it('UIC-MESSAGE-COMPOSER-4.6 puts a pair of markers around the caret and undoes with Ctrl+Z', async () => {
    const onChange = vi.fn();
    const { user } = renderComposer({ onChange });
    await user.click(box());
    await user.keyboard('{Control>}b{/Control}x');
    expect(onChange).toHaveBeenLastCalledWith({ text: '**x**', tokens: [] });
    // The markers and the typing are one step of the undo history.
    await user.keyboard('{Control>}z{/Control}');
    expect(onChange).toHaveBeenLastCalledWith({ text: '', tokens: [] });
  });

  it('UIC-MESSAGE-COMPOSER-4.7 UIC-MESSAGE-COMPOSER-3.2 pastes plain text with its spacing and attaches pasted and dropped files', async () => {
    const onAttach = vi.fn();
    const onChange = vi.fn();
    const { user, container } = renderComposer({ onAttach, onChange });
    await user.click(box());
    await user.paste(
      transfer([], { 'text/plain': 'def f():\n\treturn  1', 'text/html': '<b>x</b>' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({ text: 'def f():\n\treturn  1', tokens: [] });
    expect(box().querySelectorAll('p')).toHaveLength(2);
    expect(box().querySelector('b')).toBeNull();
    const notes = new File(['x'], 'Notes.txt', { type: 'text/plain' });
    await user.paste(transfer([notes]));
    expect(onAttach).toHaveBeenCalledWith([notes]);
    const dataTransfer = transfer([notes]);
    fireEvent.dragEnter(box(), { dataTransfer });
    expect(root(container)).toHaveAttribute('data-drop-target', 'true');
    fireEvent.drop(box(), { dataTransfer });
    expect(onAttach).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-MESSAGE-COMPOSER-4.8 never sends the Enter of an input method composition', async () => {
    const { user, onSubmit } = renderComposer({ defaultValue: { text: 'にほん', tokens: [] } });
    await user.click(box());
    fireEvent.compositionStart(box());
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(box(), { key: 'Enter', isComposing: true });
    fireEvent.compositionEnd(box());
    // eslint-disable-next-line testing-library/prefer-user-event -- the Enter some browsers report as a composition ends
    fireEvent.keyDown(box(), { key: 'Enter', keyCode: 229 });
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({ text: 'にほん', tokens: [] });
  });

  it('UIC-MESSAGE-COMPOSER-3.3 UIC-MESSAGE-COMPOSER-2.1 edits a message with its pills and cancels with Escape', async () => {
    const onCancel = vi.fn();
    const keys: string[] = [];
    const editValue = { text: 'Ping @Maria Santos', tokens: [{ start: 5, end: 18, ...maria }] };
    const { user, onSubmit, container } = renderComposer({
      editValue,
      onCancel,
      onKeyDown: (event) => keys.push(event.key),
    });
    expect(root(container)).toHaveAttribute('data-editing', 'true');
    expect(box().querySelector('.ui-message-composer__pill')).toHaveTextContent('@Maria Santos');
    await user.tab();
    await user.keyboard('!{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({ ...editValue, text: 'Ping @Maria Santos!' });
    expect(keys).toEqual(['!']);
  });

  it('UIC-MESSAGE-COMPOSER-3.8 sends while pending with allowsPendingSubmit and offers Stop once empty', async () => {
    const onStop = vi.fn();
    const { user, onSubmit } = renderComposer({
      defaultValue: { text: 'And a dessert', tokens: [] },
      isPending: true,
      allowsPendingSubmit: true,
      onStop,
    });
    const action = screen.getByRole('button', { name: 'Send' });
    await user.click(box());
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({ text: 'And a dessert', tokens: [] });
    expect(screen.getByRole('button', { name: 'Stop' })).toBe(action);
    await user.click(action);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('UIC-MESSAGE-COMPOSER-3.5 recalls earlier prompts as text until the reader edits one', async () => {
    const onChange = vi.fn();
    const { user } = renderComposer({ history: ['Plan a trip', '```\nls\n```'], onChange });
    await user.click(box());
    await user.keyboard('{ArrowUp}');
    expect(box().querySelector('pre')).toHaveTextContent('ls');
    await user.keyboard('{ArrowUp}');
    expect(box()).toHaveTextContent('Plan a trip');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith({ text: '', tokens: [] });
    await user.keyboard('{ArrowUp}{ArrowUp}!{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith({ text: 'Plan a trip!', tokens: [] });
  });

  it('UIC-MESSAGE-COMPOSER-3.6 keeps the draft and its pills in the provider storage', async () => {
    const storage = createMemoryStorage();
    const user = userEvent.setup();
    const { unmount } = render(
      <UiProvider storage={storage}>
        <RichMessageComposer mentions={people} persistKey="draft" />
      </UiProvider>,
    );
    await user.click(box());
    await user.keyboard('@mar{Enter}hi');
    expect(JSON.parse(storage.getItem('draft') ?? '')).toEqual({
      text: '@Maria Santos hi',
      tokens: [{ start: 0, end: 13, ...maria }],
    });
    unmount();
    render(
      <UiProvider storage={storage}>
        <RichMessageComposer persistKey="draft" />
      </UiProvider>,
    );
    expect(box().querySelector('.ui-message-composer__pill')).toHaveTextContent('@Maria Santos');
  });
});

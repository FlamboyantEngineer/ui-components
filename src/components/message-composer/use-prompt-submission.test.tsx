import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { pressComposingKeys } from '../../../test/composition.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '../input-group/input-group.js';
import { type PromptSubmissionOptions, usePromptSubmission } from './message-composer.js';

interface PromptProps extends Omit<PromptSubmissionOptions, 'value' | 'onChange'> {
  initialValue?: string;
}

function Prompt({ initialValue = '', ...props }: PromptProps) {
  const [value, setValue] = useState(initialValue);
  const prompt = usePromptSubmission({ ...props, value, onChange: setValue });
  return (
    <form aria-label="Prompt" aria-busy={prompt.isSubmitting} onSubmit={prompt.onSubmit}>
      <InputGroup>
        <InputGroupTextarea
          aria-label="Message"
          value={value}
          onChange={prompt.onChange}
          onKeyDown={prompt.onKeyDown}
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton type="submit" isDisabled={!prompt.canSubmit}>
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function textarea() {
  return screen.getByRole('textbox', { name: 'Message' });
}

function sendButton() {
  return screen.getByRole('button', { name: 'Send' });
}

it('UIC-INPUT-GROUP-2.1 inserts a Shift+Enter newline, leaves IME keys alone, and submits through the form', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<Prompt onSubmit={onSubmit} />);
  await user.type(textarea(), 'First{Shift>}{Enter}{/Shift}Second');
  pressComposingKeys(textarea());
  expect(textarea()).toHaveValue('First\nSecond');
  expect(onSubmit).not.toHaveBeenCalled();

  await user.keyboard('{Enter}');
  expect(onSubmit).toHaveBeenCalledWith('First\nSecond');
  expect(textarea()).toHaveValue('');

  await user.type(textarea(), 'Third');
  await user.click(sendButton());
  expect(onSubmit).toHaveBeenLastCalledWith('Third');
});

it('UIC-INPUT-GROUP-2.1 leaves bare Enter as a newline with a coarse pointer', async () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(pointer: coarse)',
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<Prompt onSubmit={onSubmit} />);
  try {
    await user.type(textarea(), 'First{Enter}Second');
    expect(textarea()).toHaveValue('First\nSecond');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('First\nSecond');
  } finally {
    vi.unstubAllGlobals();
  }
});

it('UIC-INPUT-GROUP-2.2 sends once while a promise is pending and keeps later edits', async () => {
  const user = userEvent.setup();
  let accept: () => void = () => undefined;
  const submission = new Promise<void>((resolve) => {
    accept = resolve;
  });
  const onSubmit = vi.fn(() => submission);
  render(<Prompt onSubmit={onSubmit} initialValue="First" />);
  await user.click(sendButton());
  await user.type(textarea(), ' and second{Enter}');
  expect(sendButton()).toBeDisabled();
  const form = screen.getByRole('form', { name: 'Prompt', busy: true });
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit).toHaveBeenCalledWith('First');
  await act(async () => accept());
  expect(textarea()).toHaveValue('First and second');
  expect(form).toHaveAttribute('aria-busy', 'false');
  expect(sendButton()).toBeEnabled();
});

it('UIC-INPUT-GROUP-2.2 keeps a rejected prompt and allows retry', async () => {
  const user = userEvent.setup();
  const error = new Error('Could not send');
  const onSubmit = vi.fn().mockRejectedValueOnce(error);
  const onSubmitError = vi.fn();
  render(<Prompt onSubmit={onSubmit} onSubmitError={onSubmitError} initialValue="First" />);
  await user.click(sendButton());
  expect(onSubmitError).toHaveBeenCalledWith(error);
  expect(textarea()).toHaveValue('First');
  await user.click(sendButton());
  expect(textarea()).toHaveValue('');
});

it('UIC-INPUT-GROUP-2.2 blocks empty prompts and prompts while a reply is pending', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const { rerender } = render(<Prompt onSubmit={onSubmit} isPending />);
  await user.type(textarea(), ' {Enter}');
  expect(sendButton()).toBeDisabled();
  rerender(<Prompt onSubmit={onSubmit} />);
  expect(sendButton()).toBeDisabled();
  await user.keyboard('Next');
  expect(sendButton()).toBeEnabled();
  rerender(<Prompt onSubmit={onSubmit} isDisabled />);
  await user.keyboard('{Enter}');
  expect(sendButton()).toBeDisabled();
  expect(onSubmit).not.toHaveBeenCalled();
});

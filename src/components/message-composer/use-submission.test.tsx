import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../core/storage.js';
import { MessageComposer, type MessageComposerProps } from './message-composer.js';

const input = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const send = () => screen.getByRole('button', { name: 'Send' });

/** A promise the test settles. */
function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function renderInStorage(storage: UiStorage, props: MessageComposerProps) {
  const view = render(
    <UiProvider storage={storage}>
      <MessageComposer {...props} />
    </UiProvider>,
  );
  return {
    ...view,
    rerenderWith: (next: MessageComposerProps) =>
      view.rerender(
        <UiProvider storage={storage}>
          <MessageComposer {...next} />
        </UiProvider>,
      ),
  };
}

describe('MessageComposer sending', () => {
  it('UIC-MESSAGE-COMPOSER-3.9 holds the text while the host accepts it, sends once, then empties', async () => {
    const user = userEvent.setup();
    const accepted = deferred();
    const onSubmit = vi.fn(() => accepted.promise);
    const { container } = render(<MessageComposer onSubmit={onSubmit} />);
    await user.type(input(), 'Hello');
    await user.keyboard('{Enter}{Enter}');
    await user.click(send());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('Hello');
    expect(input()).toHaveValue('Hello');
    expect(container.firstElementChild).toHaveAttribute('data-submitting', 'true');
    expect(send()).toHaveAttribute('aria-disabled', 'true');
    await act(async () => accepted.resolve());
    expect(input()).toHaveValue('');
    expect(container.firstElementChild).not.toHaveAttribute('data-submitting');
  });

  it('UIC-MESSAGE-COMPOSER-3.9 keeps the text when sending fails, reports it, and sends again once', async () => {
    const user = userEvent.setup();
    const failure = new Error('Offline');
    const onSubmitError = vi.fn();
    const onSubmit = vi
      .fn<(value: string) => Promise<void>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(undefined);
    render(<MessageComposer onSubmit={onSubmit} onSubmitError={onSubmitError} />);
    await user.type(input(), 'Hello{Enter}');
    expect(onSubmitError).toHaveBeenCalledWith(failure);
    expect(input()).toHaveValue('Hello');
    expect(send()).not.toHaveAttribute('aria-disabled');
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(input()).toHaveValue('');
    expect(onSubmitError).toHaveBeenCalledTimes(1);
  });

  it('UIC-MESSAGE-COMPOSER-3.9 keeps a message whose sending throws, and words typed while the host decides', async () => {
    const user = userEvent.setup();
    const onSubmitError = vi.fn();
    const { rerender } = render(
      <MessageComposer
        onSubmit={() => {
          throw new Error('Refused');
        }}
        onSubmitError={onSubmitError}
      />,
    );
    await user.type(input(), 'Hello{Enter}');
    expect(onSubmitError).toHaveBeenCalledTimes(1);
    expect(input()).toHaveValue('Hello');
    const accepted = deferred();
    rerender(<MessageComposer onSubmit={() => accepted.promise} />);
    await user.keyboard('{Enter}');
    await user.type(input(), ' again');
    await act(async () => accepted.resolve());
    expect(input()).toHaveValue('Hello again');
  });

  it('UIC-MESSAGE-COMPOSER-3.9 settles a message in the draft it was sent from', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const accepted = deferred();
    const onSubmit = vi.fn(() => accepted.promise);
    const { rerenderWith } = renderInStorage(storage, { persistKey: 'first', onSubmit });
    await user.type(input(), 'For the first{Enter}');
    rerenderWith({ persistKey: 'second', onSubmit });
    expect(input()).toHaveValue('');
    await user.type(input(), 'For the second');
    expect(send()).not.toHaveAttribute('aria-disabled');
    rerenderWith({ persistKey: 'first', onSubmit });
    expect(input()).toHaveValue('For the first');
    expect(send()).toHaveAttribute('aria-disabled', 'true');
    rerenderWith({ persistKey: 'second', onSubmit });
    await act(async () => accepted.resolve());
    expect(input()).toHaveValue('For the second');
    rerenderWith({ persistKey: 'first', onSubmit });
    expect(input()).toHaveValue('');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

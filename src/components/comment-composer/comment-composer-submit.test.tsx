import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../core/storage.js';
import { CommentComposer, type CommentComposerProps } from './comment-composer.js';

const box = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const submitButton = () => screen.getByRole('button', { name: 'Comment' });

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

function renderInStorage(storage: UiStorage, props: CommentComposerProps) {
  const view = render(
    <UiProvider storage={storage}>
      <CommentComposer {...props} />
    </UiProvider>,
  );
  return {
    ...view,
    rerenderWith: (nextStorage: UiStorage, next: CommentComposerProps) =>
      view.rerender(
        <UiProvider storage={nextStorage}>
          <CommentComposer {...next} />
        </UiProvider>,
      ),
  };
}

describe('CommentComposer submission', () => {
  it('UIC-COMMENT-COMPOSER-1.3 keeps a draft typed while a submit settles', async () => {
    const user = userEvent.setup();
    const accepted = deferred();
    const onSubmit = vi.fn(() => accepted.promise);
    render(<CommentComposer defaultValue="Submitted " onSubmit={onSubmit} />);
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledWith('Submitted');
    await user.clear(box());
    await user.type(box(), 'Next draft');
    await act(async () => accepted.resolve());
    expect(box()).toHaveValue('Next draft');
  });

  it('UIC-COMMENT-COMPOSER-1.3 settles a submit in the stored draft it came from', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ A: '"Comment A"', B: '"Draft B"' });
    const accepted = deferred();
    const onSubmit = vi.fn(() => accepted.promise);
    const { container, rerenderWith } = renderInStorage(storage, { persistKey: 'A', onSubmit });
    await user.click(submitButton());
    rerenderWith(storage, { persistKey: 'B', onSubmit });
    expect(box()).toHaveValue('Draft B');
    expect(container.firstElementChild).not.toHaveAttribute('data-pending');
    await act(async () => accepted.resolve());
    expect(box()).toHaveValue('Draft B');
    expect(storage.getItem('B')).toBe('"Draft B"');
    expect(storage.getItem('A')).toBe('""');
    rerenderWith(storage, { persistKey: 'A', onSubmit });
    expect(box()).toHaveValue('');
  });

  it('UIC-COMMENT-COMPOSER-1.3 settles a submit in the storage it came from', async () => {
    const user = userEvent.setup();
    const first = createMemoryStorage({ draft: '"Same text"' });
    const second = createMemoryStorage({ draft: '"Same text"' });
    const accepted = deferred();
    const onSubmit = () => accepted.promise;
    const { rerenderWith } = renderInStorage(first, { persistKey: 'draft', onSubmit });
    await user.click(submitButton());
    rerenderWith(second, { persistKey: 'draft', onSubmit });
    await act(async () => accepted.resolve());
    expect(box()).toHaveValue('Same text');
    expect(second.getItem('draft')).toBe('"Same text"');
    expect(first.getItem('draft')).toBe('""');
  });

  it('UIC-COMMENT-COMPOSER-1.3 empties the stored draft of a composer that unmounted while it submitted', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ draft: '"Leaving"' });
    const accepted = deferred();
    const props = { persistKey: 'draft', onSubmit: () => accepted.promise };
    const { unmount } = renderInStorage(storage, props);
    await user.click(submitButton());
    unmount();
    await act(async () => accepted.resolve());
    expect(storage.getItem('draft')).toBe('""');
    renderInStorage(storage, props);
    expect(box()).toHaveValue('');
  });

  it('UIC-COMMENT-COMPOSER-1.3 leaves the newer draft when a submit is refused late', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ A: '"Comment A"', B: '"Draft B"' });
    const refused = deferred();
    const onSubmit = () => refused.promise;
    const { rerenderWith } = renderInStorage(storage, { persistKey: 'A', onSubmit });
    await user.click(submitButton());
    rerenderWith(storage, { persistKey: 'B', onSubmit });
    await act(async () => refused.reject(new Error('offline')));
    expect(box()).toHaveValue('Draft B');
    expect(storage.getItem('A')).toBe('"Comment A"');
  });

  it('UIC-COMMENT-COMPOSER-1.3 clears a controlled draft only while it is the one submitted', async () => {
    const user = userEvent.setup();
    const accepted = deferred();
    function Controlled() {
      const [value, setValue] = useState('Kept');
      return (
        <CommentComposer value={value} onChange={setValue} onSubmit={() => accepted.promise} />
      );
    }
    render(<Controlled />);
    await user.click(submitButton());
    await user.type(box(), ' longer');
    await act(async () => accepted.resolve());
    expect(box()).toHaveValue('Kept longer');
  });
});

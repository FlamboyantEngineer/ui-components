import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SnippetField, type SnippetFieldValue } from './snippet-field.js';
import type { SnippetRequest } from './snippet-request.js';
import type { SnippetLoad, SnippetLoader } from './use-snippet-preview.js';

const saved: SnippetFieldValue = {
  source: 'notes/greeting.ts',
  lines: { start: 2, end: 3 },
  code: 'const a = 1;\nconst b = 2;',
  language: 'ts',
};

/** A loader whose answers the test settles one by one, in any order. */
function createLoader() {
  const calls: Array<{
    request: SnippetRequest;
    signal: AbortSignal;
    resolve: (load: SnippetLoad) => void;
    reject: (error: Error) => void;
  }> = [];
  const loadSnippet: SnippetLoader = vi.fn(
    (request, { signal }) =>
      new Promise<SnippetLoad>((resolve, reject) => {
        calls.push({ request, signal, resolve, reject });
      }),
  );
  return { loadSnippet, calls };
}

const field = () => screen.getByRole('textbox', { name: 'Example' });
const firstLine = () => screen.getByRole('textbox', { name: 'First line' });
const lastLine = () => screen.getByRole('textbox', { name: 'Last line' });
const previewButton = () => screen.getByRole('button', { name: 'Preview' });

describe('SnippetField', () => {
  it('UIC-SNIPPET-FIELD-1.1 UIC-SNIPPET-FIELD-2.4 renders the request row and the saved snippet', () => {
    const { container } = render(
      <SnippetField
        label="Example"
        defaultValue={saved}
        loadSnippet={createLoader().loadSnippet}
        className="host"
        data-kind="sample"
      />,
    );
    expect(field()).toHaveValue('notes/greeting.ts');
    expect(firstLine()).toHaveValue('2');
    expect(lastLine()).toHaveValue('3');
    expect(screen.getByText('notes/greeting.ts · Lines 2–3')).toBeInTheDocument();
    const root = container.querySelector('.ui-snippet-field');
    expect(root).toHaveClass('ui-field', 'host');
    expect(root).toHaveAttribute('data-kind', 'sample');
    expectHooksMatchSpec(container, 'SNIPPET-FIELD', {
      slots: ['request', 'source', 'line', 'preview-button', 'saved'],
      callerAttributes: ['data-kind'],
    });
  });

  it('UIC-SNIPPET-FIELD-1.1 sizes its buttons with the field', async () => {
    const user = userEvent.setup();
    const { loadSnippet, calls } = createLoader();
    const { container } = render(
      <SnippetField label="Example" size="lg" loadSnippet={loadSnippet} />,
    );
    expect(container.querySelector('.ui-snippet-field')).toHaveAttribute('data-size', 'lg');
    expect(previewButton()).toHaveAttribute('data-size', 'lg');
    await user.type(field(), 'notes/a.ts');
    await user.click(previewButton());
    calls[0]?.resolve({ ok: true, code: 'a();' });
    expect(await screen.findByRole('button', { name: 'Use snippet' })).toHaveAttribute(
      'data-size',
      'lg',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-size', 'lg');
  });

  it('UIC-SNIPPET-FIELD-1.1 says when no snippet is saved', () => {
    const { container } = render(<SnippetField label="Example" loadSnippet={vi.fn()} />);
    expect(container.querySelector('.ui-snippet-field__empty')).toHaveTextContent(
      'No snippet saved.',
    );
    expect(previewButton()).toBeDisabled();
  });

  it('UIC-SNIPPET-FIELD-1.2 explains unreadable ranges and blocks the preview', async () => {
    const user = userEvent.setup();
    render(<SnippetField label="Example" defaultValue={saved} loadSnippet={vi.fn()} />);
    await user.clear(lastLine());
    expect(lastLine()).toHaveAccessibleDescription(
      'Give both lines, or neither for the whole source.',
    );
    expect(firstLine()).toHaveAttribute('aria-invalid', 'true');
    expect(previewButton()).toBeDisabled();
    await user.type(lastLine(), '1');
    expect(firstLine()).toHaveAccessibleDescription('The last line comes before the first.');
    await user.clear(firstLine());
    await user.clear(lastLine());
    expect(previewButton()).toBeEnabled();
  });

  it('UIC-SNIPPET-FIELD-1.3 UIC-SNIPPET-FIELD-2.1 UIC-SNIPPET-FIELD-2.2 previews, applies and restores focus', async () => {
    const user = userEvent.setup();
    const { loadSnippet, calls } = createLoader();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <SnippetField
        label="Example"
        loadSnippet={loadSnippet}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    await user.type(field(), '  notes/farewell.ts ');
    expect(onChange).not.toHaveBeenCalled();
    await user.click(previewButton());
    expect(calls[0]?.request).toEqual({ source: 'notes/farewell.ts', lines: null });
    expect(screen.getByRole('status')).toHaveTextContent('Loading snippet…');
    expect(container.querySelector('.ui-snippet-field')).toHaveAttribute('data-status', 'loading');
    expect(screen.getByRole('button', { name: 'Use snippet' })).toBeDisabled();
    calls[0]?.resolve({ ok: true, code: 'bye();', language: 'js' });
    const apply = await screen.findByRole('button', { name: 'Use snippet' });
    await waitFor(() => expect(apply).toBeEnabled());
    expectHooksMatchSpec(container, 'SNIPPET-FIELD', {
      slots: ['preview', 'status', 'apply', 'cancel', 'empty'],
    });
    await user.click(apply);
    const value = { source: 'notes/farewell.ts', lines: null, code: 'bye();', language: 'js' };
    expect(onChange).toHaveBeenLastCalledWith(value);
    expect(onCommit).toHaveBeenLastCalledWith(value);
    expect(container.querySelector('.ui-snippet-field__preview')).toBeNull();
    expect(field()).toHaveFocus();
    expect(field()).toHaveValue('notes/farewell.ts');
  });

  it('UIC-SNIPPET-FIELD-2.1 keeps the saved snippet through failures and rejections', async () => {
    const user = userEvent.setup();
    const { loadSnippet, calls } = createLoader();
    const onChange = vi.fn();
    render(
      <SnippetField
        label="Example"
        defaultValue={saved}
        loadSnippet={loadSnippet}
        onChange={onChange}
      />,
    );
    await user.click(previewButton());
    calls[0]?.resolve({ ok: false, message: 'Not allowed.' });
    expect(await screen.findByText('Not allowed.')).toBeInTheDocument();
    await user.click(previewButton());
    calls[1]?.reject(new Error('Offline.'));
    expect(await screen.findByText('Offline.')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('notes/greeting.ts · Lines 2–3')).toBeInTheDocument();
  });

  it('UIC-SNIPPET-FIELD-2.1 ignores out-of-order, replaced and cancelled loads', async () => {
    const user = userEvent.setup();
    const { loadSnippet, calls } = createLoader();
    render(<SnippetField label="Example" loadSnippet={loadSnippet} />);
    await user.type(field(), 'one.ts');
    await user.click(previewButton());
    await user.click(previewButton());
    expect(calls[0]?.signal.aborted).toBe(true);
    calls[1]?.resolve({ ok: true, code: 'second' });
    calls[0]?.resolve({ ok: true, code: 'first' });
    expect(await screen.findByText('second')).toBeInTheDocument();
    expect(screen.queryByText('first')).not.toBeInTheDocument();
    // Replacing the source drops the preview and aborts its load.
    await user.click(previewButton());
    await user.type(field(), 'x');
    expect(calls[2]?.signal.aborted).toBe(true);
    calls[2]?.resolve({ ok: true, code: 'late' });
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.queryByText('late')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(calls[3]?.signal.aborted).toBe(true);
    expect(field()).toHaveValue('');
    expect(field()).toHaveFocus();
  });

  it('UIC-SNIPPET-FIELD-2.1 aborts a load when the field unmounts', async () => {
    const user = userEvent.setup();
    const { loadSnippet, calls } = createLoader();
    const { unmount } = render(
      <SnippetField label="Example" defaultValue={saved} loadSnippet={loadSnippet} />,
    );
    await user.click(previewButton());
    unmount();
    expect(calls[0]?.signal.aborted).toBe(true);
  });

  it('UIC-SNIPPET-FIELD-2.3 marks a changed source stale and updates only on request', async () => {
    const user = userEvent.setup();
    const { loadSnippet, calls } = createLoader();
    const onCommit = vi.fn();
    const { container } = render(
      <SnippetField
        label="Example"
        defaultValue={saved}
        loadSnippet={loadSnippet}
        onCommit={onCommit}
      />,
    );
    await user.click(previewButton());
    expect(calls[0]?.request).toEqual({ source: saved.source, lines: saved.lines });
    calls[0]?.resolve({ ok: true, code: saved.code, language: 'ts' });
    expect(await screen.findByText('The saved snippet is up to date.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use snippet' })).toBeDisabled();
    await user.click(previewButton());
    calls[1]?.resolve({ ok: true, code: 'const a = 10;\nconst b = 2;', language: 'ts' });
    const update = await screen.findByRole('button', { name: 'Update snippet' });
    expect(container.querySelector('.ui-snippet-field__status')).toHaveTextContent(
      'The source changed since this snippet was saved.',
    );
    expect(container.querySelector('.ui-snippet-field')).toHaveAttribute('data-stale', 'true');
    expect(onCommit).not.toHaveBeenCalled();
    await user.click(update);
    expect(onCommit).toHaveBeenLastCalledWith({ ...saved, code: 'const a = 10;\nconst b = 2;' });
  });

  it('UIC-SNIPPET-FIELD-1.3 UIC-SNIPPET-FIELD-2.4 follows a new value and locks while read-only or disabled', async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<SnippetFieldValue | null>(saved);
      return (
        <>
          <SnippetField label="Example" value={value} onChange={setValue} loadSnippet={vi.fn()} />
          <SnippetField label="Locked" defaultValue={saved} isReadOnly loadSnippet={vi.fn()} />
          <SnippetField label="Off" defaultValue={saved} isDisabled loadSnippet={vi.fn()} />
          <button
            type="button"
            onClick={() => setValue({ ...saved, source: 'other.ts', lines: null })}
          >
            Replace
          </button>
        </>
      );
    }
    render(<Host />);
    await user.type(field(), 'x');
    await user.click(screen.getByRole('button', { name: 'Replace' }));
    expect(field()).toHaveValue('other.ts');
    expect(screen.getByRole('textbox', { name: 'Locked' })).toHaveAttribute('readonly');
    expect(screen.getAllByRole('button', { name: 'Preview' })).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: 'Off' })).toBeDisabled();
  });

  it('UIC-SNIPPET-FIELD-2.1 reports a loader that throws at once', async () => {
    const user = userEvent.setup();
    const loadSnippet: SnippetLoader = () => {
      throw new Error('No reader yet.');
    };
    render(<SnippetField label="Example" defaultValue={saved} loadSnippet={loadSnippet} />);
    await user.click(previewButton());
    expect(await screen.findByText('No reader yet.')).toBeInTheDocument();
  });

  it('UIC-SNIPPET-FIELD-1.3 keeps the typed source when the host passes an equal value inline', async () => {
    const user = userEvent.setup();
    function Host() {
      const [, setTick] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setTick((tick) => tick + 1)}>
            Render again
          </button>
          <SnippetField label="Example" value={{ ...saved }} loadSnippet={vi.fn()} />
        </>
      );
    }
    render(<Host />);
    await user.clear(field());
    await user.type(field(), 'notes/other.ts');
    await user.clear(lastLine());
    await user.type(lastLine(), '4');
    await user.click(screen.getByRole('button', { name: 'Render again' }));
    expect(field()).toHaveValue('notes/other.ts');
    expect(lastLine()).toHaveValue('4');
  });
});

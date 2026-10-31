import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  UnsavedChangesGuard,
  useUnsavedChanges,
  useUnsavedChangesGuard,
  type UnsavedChangesGuardState,
  type UnsavedChangesOptions,
} from './unsaved-changes-guard.js';

// The sources of an open question change under it (UIC-UNSAVED-CHANGES-GUARD-2.7).

type Sources = Record<string, UnsavedChangesOptions>;

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function Source(props: UnsavedChangesOptions) {
  useUnsavedChanges(props);
  return null;
}

/** Sources named by their keys, which the test adds, replaces and removes. */
function LiveSources({
  initial,
  onUpdate,
}: {
  initial: Sources;
  onUpdate: (update: (sources: Sources) => void) => void;
}) {
  const [sources, setSources] = useState(initial);
  onUpdate(setSources);
  return Object.entries(sources).map(([name, options]) => (
    <Source key={name} label={name} {...options} />
  ));
}

function Probe({ onState }: { onState: (state: UnsavedChangesGuardState) => void }) {
  onState(useUnsavedChangesGuard());
  return null;
}

/** Renders `initial` under a guard, inside a nested guard with `isNested`. */
function setup(initial: Sources, { isNested = false } = {}) {
  let guard!: UnsavedChangesGuardState;
  let setSources!: (sources: Sources) => void;
  const live = <LiveSources initial={initial} onUpdate={(update) => (setSources = update)} />;
  const content: ReactNode = isNested ? <UnsavedChangesGuard>{live}</UnsavedChangesGuard> : live;
  render(
    <UnsavedChangesGuard>
      {content}
      <Probe onState={(state) => (guard = state)} />
    </UnsavedChangesGuard>,
  );
  const leave = () => {
    let result!: Promise<boolean>;
    act(() => {
      result = guard.confirmLeave();
    });
    return result;
  };
  const update = (sources: Sources) => {
    act(() => setSources(sources));
  };
  return { leave, update };
}

async function settled<T>(promise: Promise<T>): Promise<T | 'pending'> {
  let value: T | 'pending' = 'pending';
  void promise.then((result) => (value = result));
  await act(async () => {
    await Promise.resolve();
  });
  return value;
}

const actionNames = () =>
  [...document.querySelectorAll('.ui-modal__actions button')].map((button) => button.textContent);

const listed = () => document.querySelector('.ui-unsaved-changes-guard__list')?.textContent;

describe('UnsavedChangesGuard sources', () => {
  it('UIC-UNSAVED-CHANGES-GUARD-2.7 follows the dirty sources while the question is open', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const { leave, update } = setup({ Profile: { isDirty: true, onSave } });
    const result = leave();
    await screen.findByRole('alertdialog');
    expect(actionNames()).toEqual(['Stay', 'Discard', 'Save']);
    update({ Profile: { isDirty: true }, Notes: { isDirty: true, onSave } });
    expect(actionNames()).toEqual(['Stay', 'Discard']);
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
      'Your changes are not saved. Leave and discard them?',
    );
    expect(listed()).toBe('ProfileNotes');
    update({ Profile: { isDirty: true, onSave } });
    expect(actionNames()).toEqual(['Stay', 'Discard', 'Save']);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await expect(result).resolves.toBe(true);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.7 keeps the reader here when a later source loses its save', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const notesSave = vi.fn();
    const sources: Sources = {
      Profile: { isDirty: true, onSave: () => first.promise },
      Notes: { isDirty: true, onSave: notesSave },
    };
    const { leave, update } = setup(sources);
    const result = leave();
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    update({ ...sources, Notes: { isDirty: true } });
    expect(actionNames()).toEqual(['Stay', 'Discard', 'Save']);
    await act(async () => first.resolve());
    expect(await settled(result)).toBe('pending');
    expect(notesSave).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(actionNames()).toEqual(['Stay', 'Discard']));
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.7 saves with the current actions of the current sources', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const calls: string[] = [];
    const save = (name: string) => () => void calls.push(name);
    const profile = { isDirty: true, onSave: () => first.promise };
    const { leave, update } = setup({
      Profile: profile,
      Notes: { isDirty: true, onSave: save('old notes') },
      Draft: { isDirty: true, onSave: save('draft') },
      Address: { isDirty: false, onSave: save('address') },
    });
    const result = leave();
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    update({
      Profile: profile,
      Notes: { isDirty: true, onSave: save('new notes') },
      Address: { isDirty: true, onSave: save('address') },
      Title: { isDirty: true, onSave: save('title') },
    });
    await act(async () => first.resolve());
    await expect(result).resolves.toBe(true);
    expect(calls).toEqual(['new notes', 'address', 'title']);
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.7 discards with the current actions of the current sources', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const calls: string[] = [];
    const discard = (name: string) => () => void calls.push(name);
    const profile = { isDirty: true, onDiscard: () => first.promise };
    const { leave, update } = setup({
      Profile: profile,
      Notes: { isDirty: true, onDiscard: discard('old notes') },
      Draft: { isDirty: true, onDiscard: discard('draft') },
    });
    const result = leave();
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    update({
      Profile: profile,
      Notes: { isDirty: true, onDiscard: discard('new notes') },
      Title: { isDirty: true, onDiscard: discard('title') },
    });
    await act(async () => first.resolve());
    await expect(result).resolves.toBe(true);
    expect(calls).toEqual(['new notes', 'title']);
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.7 follows the sources again after a failed save', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const { leave, update } = setup({ Profile: { isDirty: true, onSave: () => first.promise } });
    const result = leave();
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await act(async () => first.reject(new Error('The server is busy.')));
    expect(await screen.findByRole('alert')).toHaveTextContent('The server is busy.');
    update({ Profile: { isDirty: true } });
    expect(actionNames()).toEqual(['Stay', 'Discard']);
    expect(await settled(result)).toBe('pending');
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.7 UIC-UNSAVED-CHANGES-GUARD-3.1 keeps the reader here when a nested source loses its save', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const notesSave = vi.fn();
    const sources: Sources = {
      Profile: { isDirty: true, onSave: () => first.promise },
      Notes: { isDirty: true, onSave: notesSave },
    };
    const { leave, update } = setup(sources, { isNested: true });
    const result = leave();
    await screen.findByRole('alertdialog');
    expect(listed()).toBe('ProfileNotes');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    update({ ...sources, Notes: { isDirty: true } });
    await act(async () => first.resolve());
    expect(await settled(result)).toBe('pending');
    expect(notesSave).not.toHaveBeenCalled();
    await waitFor(() => expect(actionNames()).toEqual(['Stay', 'Discard']));
  });

  it.each([
    ['becomes clean', { Profile: { isDirty: false } }],
    ['unmounts', {}],
  ])(
    'UIC-UNSAVED-CHANGES-GUARD-2.6 closes the open question when a clean leave replaces it after the source %s',
    async (_, clean: Sources) => {
      const { leave, update } = setup({ Profile: { isDirty: true } });
      const first = leave();
      await screen.findByRole('alertdialog');
      update(clean);
      await expect(leave()).resolves.toBe(true);
      await expect(first).resolves.toBe(false);
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    },
  );

  it('UIC-UNSAVED-CHANGES-GUARD-2.6 keeps a late save of a question a clean leave replaced to itself', async () => {
    const user = userEvent.setup();
    const save = deferred();
    const dirty: Sources = { Profile: { isDirty: true, onSave: () => save.promise } };
    const { leave, update } = setup(dirty);
    const first = leave();
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    update({ Profile: { isDirty: false } });
    await expect(leave()).resolves.toBe(true);
    await expect(first).resolves.toBe(false);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    update(dirty);
    const third = leave();
    await screen.findByRole('alertdialog');
    await act(async () => save.resolve());
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(document.querySelector('.ui-modal__primary')).not.toHaveAttribute('data-pending');
    expect(await settled(third)).toBe('pending');
    await user.click(screen.getByRole('button', { name: 'Stay' }));
    await expect(third).resolves.toBe(false);
  });
});

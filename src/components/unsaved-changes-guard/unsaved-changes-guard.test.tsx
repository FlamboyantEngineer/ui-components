import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import {
  UnsavedChangesGuard,
  useUnsavedChanges,
  useUnsavedChangesGuard,
  type ConfirmLeaveOptions,
  type UnsavedChangesOptions,
  type UnsavedChangesGuardState,
} from './unsaved-changes-guard.js';

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

/** Exposes the nearest guard to the test. */
function Probe({ onState }: { onState: (state: UnsavedChangesGuardState) => void }) {
  const state = useUnsavedChangesGuard();
  onState(state);
  return <output aria-label="Dirty">{String(state.isDirty)}</output>;
}

function setup(children: ReactNode, guardProps: Parameters<typeof UnsavedChangesGuard>[0] = {}) {
  let guard!: UnsavedChangesGuardState;
  const view = render(
    <UnsavedChangesGuard {...guardProps}>
      {children}
      <Probe onState={(state) => (guard = state)} />
    </UnsavedChangesGuard>,
  );
  const leave = (options?: ConfirmLeaveOptions) => {
    let result!: Promise<boolean>;
    act(() => {
      result = guard.confirmLeave(options);
    });
    return result;
  };
  return { ...view, leave, guard: () => guard };
}

/** Settles `promise` within the test's act scope and reports what it resolved to, or `pending`. */
async function settled<T>(promise: Promise<T>): Promise<T | 'pending'> {
  let value: T | 'pending' = 'pending';
  void promise.then((result) => (value = result));
  await act(async () => {
    await Promise.resolve();
  });
  return value;
}

const dirtyState = () => screen.getByRole('status', { name: 'Dirty' });

const actionNames = () =>
  [...document.querySelectorAll('.ui-modal__actions button')].map((button) => button.textContent);

describe('UnsavedChangesGuard', () => {
  it('UIC-UNSAVED-CHANGES-GUARD-1.1 UIC-UNSAVED-CHANGES-GUARD-1.2 tracks registered sources while mounted', () => {
    function Editor({ isDirty, isMounted }: { isDirty: boolean; isMounted: boolean }) {
      return (
        <>
          {isMounted ? <Source isDirty={isDirty} label="Profile" /> : null}
          <Source isDirty={false} label="Address" />
        </>
      );
    }
    const { rerender } = render(
      <UnsavedChangesGuard>
        <Editor isDirty={false} isMounted />
        <Probe onState={() => {}} />
      </UnsavedChangesGuard>,
    );
    expect(dirtyState()).toHaveTextContent('false');
    const renderWith = (isDirty: boolean, isMounted: boolean) =>
      rerender(
        <UnsavedChangesGuard>
          <Editor isDirty={isDirty} isMounted={isMounted} />
          <Probe onState={() => {}} />
        </UnsavedChangesGuard>,
      );
    renderWith(true, true);
    expect(dirtyState()).toHaveTextContent('true');
    renderWith(true, false);
    expect(dirtyState()).toHaveTextContent('false');
  });

  it('UIC-UNSAVED-CHANGES-GUARD-1.1 refuses hooks outside a guard', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Source isDirty />)).toThrow(
      'useUnsavedChanges needs an UnsavedChangesGuard above it.',
    );
    expect(() => render(<Probe onState={() => {}} />)).toThrow(
      'useUnsavedChangesGuard needs an UnsavedChangesGuard above it.',
    );
    vi.mocked(console.error).mockRestore();
  });

  it('UIC-UNSAVED-CHANGES-GUARD-1.3 asks the browser to confirm closing the page while dirty', () => {
    const unload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const { rerender, unmount } = render(
      <UnsavedChangesGuard>
        <Source isDirty={false} />
      </UnsavedChangesGuard>,
    );
    expect(unload()).toBe(false);
    rerender(
      <UnsavedChangesGuard>
        <Source isDirty />
      </UnsavedChangesGuard>,
    );
    expect(unload()).toBe(true);
    rerender(
      <UnsavedChangesGuard shouldConfirmUnload={false}>
        <Source isDirty />
      </UnsavedChangesGuard>,
    );
    expect(unload()).toBe(false);
    rerender(
      <UnsavedChangesGuard>
        <Source isDirty />
      </UnsavedChangesGuard>,
    );
    unmount();
    expect(unload()).toBe(false);
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.1 lets a clean leave through without asking', async () => {
    const { leave } = setup(<Source isDirty={false} label="Profile" />);
    await expect(leave()).resolves.toBe(true);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.2 asks with a title, a question and the list of unsaved sources', async () => {
    const { leave } = setup(
      <>
        <Source isDirty label="Profile" onSave={() => {}} />
        <Source isDirty={false} label="Address" onSave={() => {}} />
        <Source isDirty label="Notes" onSave={() => {}} />
        <Source isDirty onSave={() => {}} />
      </>,
    );
    void leave();
    const dialog = await screen.findByRole('alertdialog', { name: 'Unsaved changes' });
    expect(dialog).toHaveAccessibleDescription('Save your changes before you leave?');
    const list = document.querySelector('.ui-unsaved-changes-guard__list');
    expect([...(list?.children ?? [])].map((item) => item.textContent)).toEqual([
      'Profile',
      'Notes',
    ]);
    expect(document.querySelector('.ui-modal')).toHaveClass(
      'ui-unsaved-changes-guard',
      'ui-confirm-dialog',
    );
    expectHooksMatchSpec(document.body, 'UNSAVED-CHANGES-GUARD', { slots: ['list'] });
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.2 takes the text from props, each call and the provider', async () => {
    let guard!: UnsavedChangesGuardState;
    render(
      <UiProvider strings={{ unsavedChanges: 'Changements non enregistrés' }}>
        <UnsavedChangesGuard message="Switching sections drops your edits.">
          <Source isDirty />
          <Probe onState={(state) => (guard = state)} />
        </UnsavedChangesGuard>
      </UiProvider>,
    );
    act(() => void guard.confirmLeave());
    const dialog = await screen.findByRole('alertdialog', { name: 'Changements non enregistrés' });
    expect(dialog).toHaveAccessibleDescription('Switching sections drops your edits.');
    expect(document.querySelector('.ui-unsaved-changes-guard__list')).toBeNull();
    act(() => void guard.confirmLeave({ title: 'Leave the editor?', message: 'Close anyway?' }));
    expect(await screen.findByRole('alertdialog', { name: 'Leave the editor?' })).toBeVisible();
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription('Close anyway?');
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.3 saves every dirty source in turn, pending until they finish', async () => {
    const first = deferred();
    const calls: string[] = [];
    const { leave } = setup(
      <>
        <Source
          isDirty
          label="Profile"
          onSave={() => {
            calls.push('profile');
            return first.promise;
          }}
        />
        <Source isDirty={false} label="Address" onSave={() => void calls.push('address')} />
        <Source isDirty label="Notes" onSave={() => void calls.push('notes')} />
      </>,
    );
    const result = leave();
    await screen.findByRole('alertdialog');
    expect(actionNames()).toEqual(['Stay', 'Discard', 'Save']);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(calls).toEqual(['profile']);
    expect(document.querySelector('.ui-modal__primary')).toHaveAttribute('data-pending', 'true');
    expect(await settled(result)).toBe('pending');
    await act(async () => first.resolve());
    await expect(result).resolves.toBe(true);
    expect(calls).toEqual(['profile', 'notes']);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.3 keeps the reader here when a save fails', async () => {
    const save = deferred();
    const { leave } = setup(<Source isDirty label="Profile" onSave={() => save.promise} />);
    const result = leave();
    await screen.findByRole('alertdialog');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await act(async () => save.reject(new Error('The server is busy.')));
    expect(await screen.findByRole('alert')).toHaveTextContent('The server is busy.');
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(await settled(result)).toBe('pending');
    await userEvent.click(screen.getByRole('button', { name: 'Stay' }));
    await expect(result).resolves.toBe(false);
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.4 discards every dirty source and leaves', async () => {
    const discards: string[] = [];
    const { leave } = setup(
      <>
        <Source
          isDirty
          label="Profile"
          onSave={() => {}}
          onDiscard={() => void discards.push('profile')}
        />
        <Source isDirty={false} onSave={() => {}} onDiscard={() => void discards.push('address')} />
        <Source isDirty onSave={() => {}} />
      </>,
    );
    const result = leave();
    await screen.findByRole('alertdialog');
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await expect(result).resolves.toBe(true);
    expect(discards).toEqual(['profile']);
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.4 offers Discard alone, as a danger, when a source cannot save', async () => {
    const onDiscard = vi.fn();
    const { leave } = setup(
      <>
        <Source isDirty label="Profile" onSave={() => {}} />
        <Source isDirty label="Sketch" onDiscard={onDiscard} />
      </>,
    );
    const result = leave();
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAccessibleDescription(
      'Your changes are not saved. Leave and discard them?',
    );
    expect(actionNames()).toEqual(['Stay', 'Discard']);
    expect(document.querySelector('.ui-modal')).toHaveAttribute('data-tone', 'danger');
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await expect(result).resolves.toBe(true);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.5 UIC-UNSAVED-CHANGES-GUARD-4.1 stays on Stay or Escape, with focus on Stay', async () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const { leave } = setup(
      <Source isDirty label="Profile" onSave={onSave} onDiscard={onDiscard} />,
    );
    const first = leave();
    await screen.findByRole('alertdialog');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stay' })).toHaveFocus());
    await userEvent.click(screen.getByRole('button', { name: 'Stay' }));
    await expect(first).resolves.toBe(false);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    const second = leave();
    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    await expect(second).resolves.toBe(false);
    expect(onSave).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('UIC-UNSAVED-CHANGES-GUARD-2.6 answers an earlier question no when a new one replaces it or the guard leaves', async () => {
    const { leave, unmount } = setup(<Source isDirty label="Profile" />);
    const first = leave();
    await screen.findByRole('alertdialog');
    const second = leave({ title: 'Close the panel?' });
    await expect(first).resolves.toBe(false);
    expect(await screen.findByRole('alertdialog', { name: 'Close the panel?' })).toBeVisible();
    unmount();
    await expect(second).resolves.toBe(false);
  });

  it('UIC-UNSAVED-CHANGES-GUARD-3.1 lets a nested guard ask about its own sources and stand in its parent', async () => {
    const outerSave = vi.fn();
    const innerSave = vi.fn();
    let outer!: UnsavedChangesGuardState;
    let inner!: UnsavedChangesGuardState;
    function Panel() {
      const [isDirty, setDirty] = useState(true);
      return (
        <UnsavedChangesGuard title="Close the panel?">
          <Source
            isDirty={isDirty}
            label="Panel notes"
            onSave={() => {
              innerSave();
              setDirty(false);
            }}
          />
          <Probe onState={(state) => (inner = state)} />
        </UnsavedChangesGuard>
      );
    }
    render(
      <UnsavedChangesGuard>
        <Source isDirty={false} label="Page" onSave={outerSave} />
        <Panel />
        <Probe onState={(state) => (outer = state)} />
      </UnsavedChangesGuard>,
    );
    expect(outer.isDirty).toBe(true);
    let innerResult!: Promise<boolean>;
    act(() => {
      innerResult = inner.confirmLeave();
    });
    expect(await screen.findByRole('alertdialog', { name: 'Close the panel?' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Stay' }));
    await expect(innerResult).resolves.toBe(false);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());

    let outerResult!: Promise<boolean>;
    act(() => {
      outerResult = outer.confirmLeave();
    });
    await screen.findByRole('alertdialog', { name: 'Unsaved changes' });
    expect(document.querySelector('.ui-unsaved-changes-guard__list')).toHaveTextContent(
      'Panel notes',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await expect(outerResult).resolves.toBe(true);
    expect(innerSave).toHaveBeenCalledTimes(1);
    expect(outerSave).not.toHaveBeenCalled();
    expect(outer.isDirty).toBe(false);
  });

  it('UIC-UNSAVED-CHANGES-GUARD-4.2 forwards its class, caller attributes and id to the dialog', async () => {
    const { leave } = setup(<Source isDirty />, {
      className: 'leave-prompt',
      id: 'leave-dialog',
      'data-surface': 'editor',
    });
    void leave();
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAttribute('id', 'leave-dialog');
    const overlay = document.querySelector('.ui-unsaved-changes-guard');
    expect(overlay).toHaveClass('ui-modal', 'leave-prompt');
    expect(overlay).toHaveAttribute('data-surface', 'editor');
    expectHooksMatchSpec(document.body, 'UNSAVED-CHANGES-GUARD', {
      callerAttributes: ['data-surface'],
    });
  });
});

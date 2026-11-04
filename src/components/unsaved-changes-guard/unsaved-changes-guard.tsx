'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Modal } from '../modal/modal.js';
import {
  createUnsavedChangesStore,
  isUnsavable,
  type UnsavedChangesAction,
  type UnsavedChangesEntry,
  type UnsavedChangesStore,
  type UnsavedChangesSummary,
} from './unsaved-changes-store.js';

export interface UnsavedChangesGuardProps extends BaseProps {
  children?: ReactNode;
  /** Titles the confirmation. Defaults to the provider's `unsavedChanges` string. */
  title?: ReactNode;
  /** The question. Defaults to the provider's `saveBeforeLeaving` or `discardBeforeLeaving` string. */
  message?: ReactNode;
  /** Asks the browser to confirm closing or reloading the page while anything is dirty. Defaults to true. */
  shouldConfirmUnload?: boolean | undefined;
}

export interface UnsavedChangesOptions {
  /** Whether the source holds changes that leaving would lose. */
  isDirty: boolean;
  /** Names the source in the confirmation's list of what is unsaved. */
  label?: string | undefined;
  /** Saves the changes; a returned promise keeps Save pending, and a rejection keeps the reader here. */
  onSave?: UnsavedChangesAction | undefined;
  /** Throws the changes away. */
  onDiscard?: UnsavedChangesAction | undefined;
}

/** Overrides the guard's text for one confirmation. */
export interface ConfirmLeaveOptions {
  title?: ReactNode;
  message?: ReactNode;
}

export interface UnsavedChangesGuardState {
  /** Whether any source under the guard is dirty. */
  isDirty: boolean;
  /**
   * Resolves `true` at once when nothing is dirty; otherwise asks the reader and resolves `true`
   * after they save or discard, `false` when they stay.
   */
  confirmLeave: (options?: ConfirmLeaveOptions) => Promise<boolean>;
}

interface GuardContextValue {
  store: UnsavedChangesStore;
  confirmLeave: UnsavedChangesGuardState['confirmLeave'];
}

interface LeaveRequest extends ConfirmLeaveOptions {
  /** Names this question, so each one gets a dialog of its own. */
  id: number;
  /** Answers the question; only the first answer counts. */
  settle: (allowed: boolean) => void;
}

const hooks = createHooks('unsaved-changes-guard', ['list']);

const GuardContext = createContext<GuardContextValue | null>(null);

function useGuardContext(hook: string): GuardContextValue {
  const context = useContext(GuardContext);
  if (!context) throw new Error(`${hook} needs an UnsavedChangesGuard above it.`);
  return context;
}

/** Keeps `entry` registered in `store` under this component's key until it unmounts. */
function useRegistration(store: UnsavedChangesStore | null, entry: UnsavedChangesEntry) {
  const key = useId();
  // A layout effect, so a navigation in the same task as the edit already sees it.
  useLayoutEffect(() => {
    store?.set(key, entry);
  });
  useLayoutEffect(() => () => store?.delete(key), [store, key]);
}

function preventUnload(event: BeforeUnloadEvent) {
  event.preventDefault();
  // Browsers that predate `preventDefault` here ask when `returnValue` is set.
  event.returnValue = '';
}

/**
 * Asks the browser to confirm leaving the page while `isActive`. The guard renders no element, and
 * leaving is the script's own page, so it listens on the script's window.
 */
function useUnloadConfirmation(isActive: boolean) {
  /* eslint-disable no-restricted-globals */
  useEffect(() => {
    if (!isActive) return undefined;
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [isActive]);
  /* eslint-enable no-restricted-globals */
}

/**
 * The open confirmation and `confirmLeave`, which answers any question still open `false` and
 * replaces it.
 */
function useLeaveRequests(store: UnsavedChangesStore) {
  const pending = useRef<LeaveRequest | null>(null);
  const nextId = useRef(0);
  const [shown, setShown] = useState<LeaveRequest | null>(null);
  const [isOpen, setOpen] = useState(false);
  const confirmLeave = useCallback(
    (options: ConfirmLeaveOptions = {}) => {
      const displaced = pending.current;
      displaced?.settle(false);
      if (!store.getSummary().isDirty) {
        if (displaced) setOpen(false);
        return Promise.resolve(true);
      }
      return new Promise<boolean>((resolve) => {
        let isSettled = false;
        nextId.current += 1;
        const request: LeaveRequest = {
          ...options,
          id: nextId.current,
          settle: (allowed) => {
            if (isSettled) return;
            isSettled = true;
            if (pending.current === request) pending.current = null;
            resolve(allowed);
          },
        };
        pending.current = request;
        setShown(request);
        setOpen(true);
      });
    },
    [store],
  );
  useEffect(() => () => pending.current?.settle(false), []);
  return { shown, isOpen, setOpen, confirmLeave };
}

interface LeaveConfirmationProps extends Omit<
  UnsavedChangesGuardProps,
  'children' | 'shouldConfirmUnload'
> {
  store: UnsavedChangesStore;
  request: LeaveRequest | null;
  summary: UnsavedChangesSummary;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type LeaveAction = 'save' | 'discard';

/**
 * Whether a finished action covered the work there is now: after Save nothing is dirty, and after
 * Discard no dirty source has a discard of its own (one without it is left behind by leaving).
 */
function isCovered(action: LeaveAction, summary: UnsavedChangesSummary): boolean {
  return action === 'save' ? !summary.isDirty : !summary.canDiscard;
}

/**
 * Resolves once React has committed the updates already scheduled, and with them the registrations
 * those updates change: the passive effects of a commit run after all of its layout effects.
 */
function useAfterCommit() {
  const waiting = useRef<Array<() => void>>([]);
  const [requests, setRequests] = useState(0);
  useEffect(() => {
    const resolved = waiting.current.splice(0);
    for (const resolve of resolved) resolve();
  }, [requests]);
  return useCallback(
    () =>
      new Promise<void>((resolve) => {
        waiting.current.push(resolve);
        setRequests((count) => count + 1);
      }),
    [],
  );
}

function resolveLeaveActions({
  canSave,
  strings,
  leaveAfter,
}: {
  canSave: boolean;
  strings: ReturnType<typeof useUiStrings>;
  leaveAfter: (action: LeaveAction) => (close: () => void) => Promise<void>;
}) {
  return {
    primaryAction: {
      label: canSave ? strings.save : strings.discard,
      pendingLabel: canSave ? strings.saving : undefined,
      onPress: leaveAfter(canSave ? 'save' : 'discard'),
    },
    secondaryAction: canSave
      ? { label: strings.discard, onPress: leaveAfter('discard') }
      : undefined,
  };
}

/**
 * Save, Discard and Stay when every dirty source can save; otherwise Discard and Stay. The question
 * follows the dirty sources until an action starts or it closes, then holds what it showed.
 */
function LeaveConfirmation({
  store,
  request,
  summary,
  title,
  message,
  className,
  ...rest
}: LeaveConfirmationProps) {
  const strings = useUiStrings();
  const [held, setHeld] = useState<UnsavedChangesSummary | null>(null);
  const { canSave, labels } = held ?? summary;
  const afterCommit = useAfterCommit();
  const leaveAfter = (action: LeaveAction) => async (close: () => void) => {
    setHeld(summary);
    try {
      await store[action]();
    } catch (error) {
      setHeld(null);
      // A source lost its save meanwhile: the question now offers Discard alone.
      if (isUnsavable(error)) return;
      throw error;
    }
    // The sources' own updates from their actions land first, so the check reads what they left.
    await afterCommit();
    if (!isCovered(action, store.getSummary())) {
      // Work arrived that the action did not cover: the question asks again about what is there.
      setHeld(null);
      return;
    }
    request?.settle(true);
    close();
  };
  return (
    <Modal
      {...rest}
      role="alertdialog"
      tone={canSave ? 'neutral' : 'danger'}
      onOpenChange={(next) => {
        if (!next) {
          setHeld((current) => current ?? summary);
          request?.settle(false);
        }
        rest.onOpenChange(next);
      }}
      {...resolveLeaveActions({ canSave, strings, leaveAfter })}
      className={hooks.root({ className }).className}
      title={request?.title ?? title ?? strings.unsavedChanges}
      description={
        request?.message ??
        message ??
        (canSave ? strings.saveBeforeLeaving : strings.discardBeforeLeaving)
      }
      cancelAction={{ label: strings.stay, autoFocus: true }}
    >
      {labels.length > 0 ? (
        <ul {...hooks.slot('list')}>
          {labels.map((label, index) => (
            <li key={`${index}:${label}`}>{label}</li>
          ))}
        </ul>
      ) : null}
    </Modal>
  );
}

/**
 * Protects unsaved edits. Editors under it register with `useUnsavedChanges`; code that leaves
 * (a route change, a tab switch, closing a panel) awaits `confirmLeave()` from
 * `useUnsavedChangesGuard`, which asks the reader to save, discard or stay while anything is dirty.
 * The browser confirms closing the page meanwhile. A guard inside another stands in its parent for
 * the sources under it, so a panel can ask about its own edits alone.
 */
export function UnsavedChangesGuard({
  children,
  shouldConfirmUnload = true,
  ...rest
}: UnsavedChangesGuardProps) {
  const parent = useContext(GuardContext);
  const [store] = useState(createUnsavedChangesStore);
  const summary = useSyncExternalStore(store.subscribe, store.getSummary, store.getSummary);
  const { shown, isOpen, setOpen, confirmLeave } = useLeaveRequests(store);
  const context = useMemo(() => ({ store, confirmLeave }), [store, confirmLeave]);
  useRegistration(parent?.store ?? null, {
    isDirty: summary.isDirty,
    labels: summary.labels,
    onSave: summary.canSave ? store.save : undefined,
    onDiscard: summary.canDiscard ? store.discard : undefined,
  });
  useUnloadConfirmation(shouldConfirmUnload && summary.isDirty);
  return (
    <GuardContext value={context}>
      {children}
      {/* A dialog per question: an action still running for a replaced question settles, fails and
          closes only its own dialog, so the new question starts with none running. */}
      <LeaveConfirmation
        key={shown?.id}
        {...rest}
        store={store}
        request={shown}
        summary={summary}
        isOpen={isOpen}
        onOpenChange={setOpen}
      />
    </GuardContext>
  );
}

/**
 * Registers an editor's changes with the nearest `UnsavedChangesGuard` while it is mounted: whether
 * they are dirty, what to call them, and how to save or discard them.
 */
export function useUnsavedChanges({ isDirty, label, onSave, onDiscard }: UnsavedChangesOptions) {
  const { store } = useGuardContext('useUnsavedChanges');
  useRegistration(store, { isDirty, labels: label ? [label] : [], onSave, onDiscard });
}

/** The nearest `UnsavedChangesGuard`'s dirty state and its `confirmLeave`. */
export function useUnsavedChangesGuard(): UnsavedChangesGuardState {
  const { store, confirmLeave } = useGuardContext('useUnsavedChangesGuard');
  const { isDirty } = useSyncExternalStore(store.subscribe, store.getSummary, store.getSummary);
  return { isDirty, confirmLeave };
}

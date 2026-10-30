'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Modal } from '../modal/modal.js';
import {
  createUnsavedChangesStore,
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
  /** What was unsaved when the reader was asked; the dialog keeps it while it closes. */
  summary: UnsavedChangesSummary;
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

/** Asks the browser to confirm leaving the page while `isActive`. */
function useUnloadConfirmation(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return undefined;
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [isActive]);
}

/** The open confirmation and `confirmLeave`, which replaces any confirmation still open. */
function useLeaveRequests(store: UnsavedChangesStore) {
  const pending = useRef<LeaveRequest | null>(null);
  const [shown, setShown] = useState<LeaveRequest | null>(null);
  const [isOpen, setOpen] = useState(false);
  const confirmLeave = useCallback(
    (options: ConfirmLeaveOptions = {}) => {
      const summary = store.getSummary();
      if (!summary.isDirty) return Promise.resolve(true);
      return new Promise<boolean>((resolve) => {
        pending.current?.settle(false);
        const request: LeaveRequest = {
          ...options,
          summary,
          settle: (allowed) => {
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

function resolveLeaveActions({
  canSave,
  strings,
  leaveAfter,
  store,
}: {
  canSave: boolean;
  strings: ReturnType<typeof useUiStrings>;
  leaveAfter: (run: () => Promise<void>) => (close: () => void) => Promise<void>;
  store: UnsavedChangesStore;
}) {
  return {
    primaryAction: {
      label: canSave ? strings.save : strings.discard,
      pendingLabel: canSave ? strings.saving : undefined,
      onPress: leaveAfter(canSave ? store.save : store.discard),
    },
    secondaryAction: canSave
      ? { label: strings.discard, onPress: leaveAfter(store.discard) }
      : undefined,
  };
}

/** Save, Discard and Stay when every dirty source can save; otherwise Discard and Stay. */
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
  const { canSave, labels } = request?.summary ?? summary;
  const leaveAfter = (run: () => Promise<void>) => async (close: () => void) => {
    await run();
    request?.settle(true);
    close();
  };
  return (
    <Modal
      {...rest}
      role="alertdialog"
      tone={canSave ? 'neutral' : 'danger'}
      onOpenChange={(next) => {
        if (!next) request?.settle(false);
        rest.onOpenChange(next);
      }}
      {...resolveLeaveActions({ canSave, strings, leaveAfter, store })}
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
    onDiscard: store.discard,
  });
  useUnloadConfirmation(shouldConfirmUnload && summary.isDirty);
  return (
    <GuardContext value={context}>
      {children}
      <LeaveConfirmation
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

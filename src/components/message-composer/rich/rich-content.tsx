'use client';

import {
  ProseMirrorDoc,
  useEditorEffect,
  useEditorEventCallback,
  useEditorEventListener,
  useEditorState,
} from '@handlewithcare/react-prosemirror';
import type { EditorView } from 'prosemirror-view';
import {
  type FocusEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useUiStrings } from '../../../core/provider.js';
import { useFocusRing, useHover } from '../../../primitives/index.js';
import { isComposingKey } from '../../../utils/is-composing-key.js';
import { mergeProps } from '../../../utils/merge-props.js';
import { readLineBox } from '../../../utils/read-line-box.js';
import { useForwardedRef } from '../../../utils/use-forwarded-ref.js';
import { useLatest } from '../../../utils/use-latest.js';
import { useResizeObserver } from '../../../utils/use-resize-observer.js';
import { CompletionList, type CompletionListItem } from '../../completion-list/completion-list.js';
import { UserIdentity } from '../../user-identity/user-identity.js';
import { VisuallyHidden } from '../../visually-hidden/visually-hidden.js';
import { composerHooks as hooks } from '../composer-hooks.js';
import { type ComposerKeyActions, runComposerKey } from '../composer-keys.js';
import { toComposerLabelling } from '../use-message-composer.js';
import {
  findAdjacentPill,
  insertPillAtCaret,
  insertPillAtSelection,
  isInCode,
  syncSelectionFromDom,
} from './composer-commands.js';
import { type MessageComposerRange, readTextSelection } from './composer-edits.js';
import type { PillAttributes } from './composer-schema.js';
import type { RichComposerEditorProps, RichEditorHandle } from './rich-editor.js';
import type { MessageComposerMention } from './rich-message-composer.js';
import { type RichCompletionItem, useRichCompletions } from './use-rich-completions.js';

type RichCompletions = ReturnType<typeof useRichCompletions>;

/**
 * Keeps the input between `minRows` and `maxRows` rows of its own line height; past that it
 * scrolls. The limits follow the row counts and, through the input's size, its font metrics.
 */
function useRowLimits(ref: RefObject<HTMLElement | null>, minRows: number, maxRows: number) {
  const apply = useCallback(() => {
    const element = ref.current;
    const box = element && readLineBox(element);
    if (!element || !box) return;
    const { lineHeight, frame } = box;
    element.style.minHeight = `${minRows * lineHeight + frame}px`;
    element.style.maxHeight = `${maxRows * lineHeight + frame}px`;
  }, [ref, minRows, maxRows]);
  useResizeObserver([ref], apply);
  useLayoutEffect(apply, [apply]);
}

/**
 * Gives the frame's tools a way to insert text or a pill at the caret and to focus the editor, and
 * the composer's handle a way to add a pill at the caret.
 */
function useEditorHandle(handleRef: RefObject<RichEditorHandle | null>) {
  const insertText = useEditorEventCallback((view, text: string) => {
    view.dispatch(view.state.tr.insertText(text).scrollIntoView());
  });
  const insertPill = useEditorEventCallback((view, pill: PillAttributes) =>
    insertPillAtSelection(view, pill),
  );
  const addPill = useEditorEventCallback((view, pill: PillAttributes) =>
    insertPillAtCaret(view, pill),
  );
  const focus = useEditorEventCallback((view) => view.focus());
  const withView = useEditorEventCallback((view, run: (view: EditorView) => unknown) => run(view));
  useLayoutEffect(() => {
    handleRef.current = {
      insertText,
      insertPill,
      addPill,
      focus,
      withView: withView as RichEditorHandle['withView'],
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef, insertText, insertPill, addPill, focus, withView]);
}

/**
 * Reports the selection in the message's text to `onSelectionChange` after each render that moved
 * it, whether the reader, an edit or a value from outside moved it.
 */
function useSelectionReport(
  onSelectionChange: RichComposerEditorProps['props']['onSelectionChange'],
) {
  const state = useEditorState();
  const range = useMemo(() => readTextSelection(state), [state]);
  const reported = useRef<MessageComposerRange | null>(null);
  const latest = useLatest(onSelectionChange);
  useEffect(() => {
    const last = reported.current;
    if (last && last.start === range.start && last.end === range.end) return;
    reported.current = range;
    latest.current?.(range);
  }, [range, latest]);
}

/** A key the composer used: the editor and the caller's handlers do not see it. */
function stop(event: KeyboardEvent): true {
  event.preventDefault();
  event.stopPropagation();
  return true;
}

/**
 * The editor's keys, in order: nothing during an input method composition; the completion list's
 * while it is open; Enter alone in a code block adds a line; then the sending chords, Escape and the
 * recall arrows; then Backspace or Delete next to a pill removes it whole and says so. Each key
 * first reads a selection change the editor has not heard of yet.
 */
function useRichKeys(
  completions: RichCompletions,
  actions: ComposerKeyActions,
  announce: (label: string) => void,
) {
  useEditorEventListener('keydown', (view, event) => {
    if (isComposingKey(event) || view.composing) return false;
    syncSelectionFromDom(view);
    if (completions.handleKeyDown(event)) return stop(event);
    const isCommand = event.ctrlKey || event.metaKey;
    if (event.key === 'Enter' && !isCommand && isInCode(view.state)) return false;
    if (runComposerKey(event, actions)) return stop(event);
    const side = ({ Backspace: -1, Delete: 1 } as const)[event.key as 'Backspace' | 'Delete'];
    const pill = side && !isCommand && !event.altKey ? findAdjacentPill(view.state, side) : null;
    if (!pill) return false;
    view.dispatch(view.state.tr.delete(pill.from, pill.to));
    announce(pill.label);
    return stop(event);
  });
}

function renderMention(item: CompletionListItem) {
  const mention = (item as RichCompletionItem).source as MessageComposerMention;
  return (
    <UserIdentity
      name={mention.label}
      description={mention.description}
      src={mention.src}
      initials={mention.initials}
      colorKey={mention.colorKey}
      size="sm"
    />
  );
}

/** What the list shows without options: that the answer is loading, failed or found nothing. */
function useEmptyState(completions: RichCompletions) {
  const strings = useUiStrings();
  if (completions.status === 'pending') return () => strings.loading;
  if (completions.status === 'error') return () => strings.actionFailed;
  return () => strings.noResults;
}

/** The completion list, against the composer's root. */
function RichCompletionList({
  completions,
  rootRef,
}: {
  completions: RichCompletions;
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  const renderEmptyState = useEmptyState(completions);
  return (
    <CompletionList
      id={completions.listId}
      className={hooks.slotClass('completions')}
      aria-label={completions.label}
      isOpen={completions.isOpen}
      onOpenChange={(open) => (open ? undefined : completions.close())}
      onShownChange={completions.setShown}
      anchorRef={rootRef}
      items={completions.matches}
      activeKey={completions.activeItem?.id ?? null}
      onActiveKeyChange={(key) => completions.setActiveKey(String(key))}
      onAction={(key) => {
        const item = completions.matches.find((candidate) => candidate.id === key);
        if (item) completions.choose(item);
      }}
      renderItem={completions.kind === 'mention' ? renderMention : undefined}
      renderEmptyState={renderEmptyState}
    />
  );
}

/** Focuses the view once, as soon as it exists, when `autoFocus` asks for it on mount. */
function useAutoFocus(autoFocus: boolean) {
  const pendingRef = useRef(autoFocus);
  useEditorEffect((view) => {
    if (!pendingRef.current) return;
    pendingRef.current = false;
    view.focus();
  });
}

/** The editable document, a multi-line text box, with its completion list and announcements. */
export function RichComposerContent(editor: RichComposerEditorProps) {
  const { props, state, rootRef } = editor;
  const strings = useUiStrings();
  const isEditable = !props.isDisabled;
  const hasCompletions = Boolean(
    props.mentions?.length || props.commands?.length || props.triggers?.length,
  );
  const completions = useRichCompletions({
    mentions: props.mentions,
    commands: props.commands,
    triggers: props.triggers,
    isEditable,
    owner: state.owner,
  });
  const [status, setStatus] = useState('');
  const [contentRef, docRef] = useForwardedRef(props.ref);
  useRowLimits(contentRef, props.minRows ?? 1, props.maxRows ?? 8);
  useEditorHandle(editor.handleRef);
  useAutoFocus(Boolean(editor.autoFocus));
  useSelectionReport(props.onSelectionChange);
  const actions = { ...state, keys: editor.keys, onCancel: props.onCancel };
  useRichKeys(completions, actions, (label) => setStatus(strings.removedFromMessage(label)));
  const focus = useFocusRing({ isTextInput: true });
  const hover = useHover({ isDisabled: !isEditable });
  const handlers = {
    onFocus: props.onFocus,
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      state.flushDraft();
      props.onBlur?.(event);
    },
    onKeyDown: props.onKeyDown,
  };
  const data = {
    focused: focus.isFocused,
    focusVisible: focus.isFocusVisible,
    hovered: hover.isHovered,
    disabled: !isEditable,
  };
  return (
    <>
      <ProseMirrorDoc
        {...mergeProps(focus.focusProps, hover.hoverProps, handlers, { onKeyUp: props.onKeyUp })}
        {...toComposerLabelling(props, strings.message)}
        {...(hasCompletions ? completions.contentAttributes : {})}
        {...hooks.slot('input', data)}
        id={props.inputId}
        ref={docRef}
        role="textbox"
        aria-multiline="true"
        aria-placeholder={props.placeholder}
        aria-disabled={isEditable ? undefined : true}
      />
      {hasCompletions ? <RichCompletionList completions={completions} rootRef={rootRef} /> : null}
      <VisuallyHidden role="status">{status}</VisuallyHidden>
    </>
  );
}

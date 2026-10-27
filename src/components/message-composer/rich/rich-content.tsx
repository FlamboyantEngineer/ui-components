import {
  ProseMirrorDoc,
  useEditorEventCallback,
  useEditorEventListener,
} from '@handlewithcare/react-prosemirror';
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useFocusRing, useHover } from '../../../primitives/index.js';
import { useUiStrings } from '../../../core/provider.js';
import { mergeProps, mergeRefs } from '../../../utils/merge-props.js';
import { CompletionList, type CompletionListItem } from '../../completion-list/completion-list.js';
import { UserIdentity } from '../../user-identity/user-identity.js';
import { VisuallyHidden } from '../../visually-hidden/visually-hidden.js';
import { composerHooks as hooks } from '../composer-hooks.js';
import { isComposingKey, runComposerKey, type ComposerKeyActions } from '../composer-keys.js';
import { toComposerLabelling } from '../use-message-composer.js';
import {
  findAdjacentPill,
  insertPillAtCaret,
  insertPillAtSelection,
  isInCode,
  syncSelectionFromDom,
} from './composer-commands.js';
import type { PillAttributes } from './composer-schema.js';
import type { RichComposerEditorProps, RichEditorHandle } from './rich-editor.js';
import type { MessageComposerMention } from './rich-message-composer.js';
import { useRichCompletions, type RichCompletionItem } from './use-rich-completions.js';

type RichCompletions = ReturnType<typeof useRichCompletions>;

function toPixels(value: string | undefined): number {
  return Number.parseFloat(value ?? '') || 0;
}

/** Keeps the input between `minRows` and `maxRows` rows of its own line height; past that it scrolls. */
function useRowLimits(ref: RefObject<HTMLElement | null>, minRows: number, maxRows: number) {
  useLayoutEffect(() => {
    const element = ref.current;
    const style = element?.ownerDocument.defaultView?.getComputedStyle(element);
    if (!element || !style) return;
    const lineHeight = toPixels(style.lineHeight) || toPixels(style.fontSize) * 1.2 || 16;
    const padding = toPixels(style.paddingTop) + toPixels(style.paddingBottom);
    const border = toPixels(style.borderTopWidth) + toPixels(style.borderBottomWidth);
    const frame = style.boxSizing === 'border-box' ? padding + border : 0;
    element.style.minHeight = `${minRows * lineHeight + frame}px`;
    element.style.maxHeight = `${maxRows * lineHeight + frame}px`;
  });
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
  useLayoutEffect(() => {
    handleRef.current = { insertText, insertPill, addPill, focus };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef, insertText, insertPill, addPill, focus]);
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

/** The mention or command list, against the composer's root. */
function RichCompletionList({
  completions,
  rootRef,
}: {
  completions: RichCompletions;
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <CompletionList
      id={completions.listId}
      className={hooks.slotClass('completions')}
      isOpen={completions.isOpen}
      onOpenChange={(open) => (open ? undefined : completions.close())}
      anchorRef={rootRef}
      items={completions.matches}
      activeKey={completions.activeItem?.id ?? null}
      onActiveKeyChange={(key) => completions.setActiveKey(String(key))}
      onAction={(key) => {
        const item = completions.matches.find((candidate) => candidate.id === key);
        if (item) completions.choose(item);
      }}
      renderItem={completions.kind === 'mention' ? renderMention : undefined}
    />
  );
}

/** The editable document, a multi-line text box, with its completion list and announcements. */
export function RichComposerContent(editor: RichComposerEditorProps) {
  const { props, state, rootRef } = editor;
  const strings = useUiStrings();
  const isEditable = !props.isDisabled;
  const hasCompletions = Boolean(props.mentions?.length || props.commands?.length);
  const completions = useRichCompletions({
    mentions: props.mentions,
    commands: props.commands,
    isEditable,
  });
  const [status, setStatus] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  useRowLimits(contentRef, props.minRows ?? 1, props.maxRows ?? 8);
  useEditorHandle(editor.handleRef);
  const actions = { ...state, keys: editor.keys, onCancel: props.onCancel };
  useRichKeys(completions, actions, (label) => setStatus(strings.removedFromMessage(label)));
  const focus = useFocusRing({ isTextInput: true });
  const hover = useHover({ isDisabled: !isEditable });
  const handlers = { onFocus: props.onFocus, onBlur: props.onBlur, onKeyDown: props.onKeyDown };
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
        ref={mergeRefs(contentRef, props.ref)}
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

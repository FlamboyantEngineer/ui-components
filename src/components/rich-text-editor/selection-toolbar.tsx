'use client';

import {
  useEditorEffect,
  useEditorEventListener,
  useEditorState,
} from '@handlewithcare/react-prosemirror';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { type FocusEvent, type ReactNode, useRef, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isElement } from '../../utils/is-element.js';
import { autoUpdateOverlay } from '../../utils/overlay-auto-update.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { FloatingToolbar } from '../floating-toolbar/floating-toolbar.js';
import { FormatButtons, LinkButton } from './format-controls.js';
import { getMarkItems } from './format-items.js';
import { useRichTextEditorContext } from './rich-text-context.js';
import { useRichTextController } from './rich-text-controller.js';
import { useFocusReturn } from './use-focus-return.js';

export interface SelectionToolbarProps
  extends RefProps<HTMLElement>, BaseProps, AriaLabellingProps {
  /** Controls after the marks and the link button. */
  children?: ReactNode;
}

interface SelectionBox {
  key: string;
  rect: DOMRect;
  /** Whether any of the range shows in the window, so the toolbar has something to stay with. */
  isVisible: boolean;
}

const hooks = createHooks('selection-toolbar', ['row', 'link-editor']);

/** Whether focus moved to the toolbar or the link editor it opened, which keep it open. */
function isInsideToolbar(target: EventTarget | null, toolbar: HTMLElement | null): boolean {
  if (!isElement(target)) return false;
  return Boolean(toolbar?.contains(target) || target.closest(`.${hooks.slotClass('link-editor')}`));
}

/** The viewport box of the selected text range, or null for a caret or a node selection. */
function measureSelection(view: EditorView, current: SelectionBox | null): SelectionBox | null {
  const { selection } = view.state;
  if (selection.empty || !(selection instanceof TextSelection)) return null;
  const start = view.coordsAtPos(selection.from);
  const end = view.coordsAtPos(selection.to);
  const [left, right] = [Math.min(start.left, end.left), Math.max(start.right, end.right)];
  const key = `${selection.from}:${selection.to}:${left}:${start.top}:${right}:${end.bottom}`;
  if (current?.key === key) return current;
  const window = view.dom.ownerDocument.defaultView;
  const content = view.dom.getBoundingClientRect();
  // Edges count: a range touching the visible content still has the toolbar.
  const isVisible =
    end.bottom >= Math.max(0, content.top) &&
    start.top <= Math.min(window?.innerHeight ?? Infinity, content.bottom) &&
    right >= Math.max(0, content.left) &&
    left <= Math.min(window?.innerWidth ?? Infinity, content.right);
  return {
    key,
    rect: new DOMRect(left, start.top, right - left, end.bottom - start.top),
    isVisible,
  };
}

/**
 * The selected range's box, measured again after each state change and, while there is a range
 * the toolbar may show for (`canShow`: the editor is editable and focused, and the reader has not
 * dismissed this range), whenever the layout may have moved it: a scroll, a window resize, the
 * content resizing or moving (a sidebar opening, wrapping, fonts loading), at most once per
 * animation frame. A range the toolbar cannot show for is not followed.
 */
function useSelectionBox(canShow: (box: SelectionBox) => boolean): SelectionBox | null {
  const state = useEditorState();
  const [box, setBox] = useState<SelectionBox | null>(null);
  useEditorEffect((view) => setBox((current) => measureSelection(view, current)), [state]);
  const isFollowed = box !== null && canShow(box);
  useEditorEffect(
    (view) => {
      if (!isFollowed) return undefined;
      return autoUpdateOverlay({
        anchor: view.dom,
        everyFrame: true,
        update: () => setBox((current) => measureSelection(view, current)),
      });
    },
    [isFollowed],
  );
  return box;
}

/**
 * A toolbar floating above selected text in the enclosing `RichTextEditor`, for its children: the
 * marks and the link button. Alt+F10 moves focus into it from the document and Escape returns.
 */
export function SelectionToolbar({ ref, className, children, ...rest }: SelectionToolbarProps) {
  const strings = useUiStrings();
  const controller = useRichTextController();
  const { ref: returnFocusRef, request: returnFocus } = useFocusReturn(controller);
  const { surfaceRef } = useRichTextEditorContext('SelectionToolbar');
  const rowRef = useRef<HTMLDivElement>(null);
  const rowRefs = useMergedRefs(rowRef, returnFocusRef);
  const [hasEditorFocus, setEditorFocus] = useState(false);
  const [hasOwnFocus, setOwnFocus] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const canShow = (range: SelectionBox) =>
    controller.isEditable && dismissed !== range.key && (hasEditorFocus || hasOwnFocus);
  const box = useSelectionBox(canShow);
  const isOpen = box !== null && box.isVisible && canShow(box);

  useEditorEventListener('focus', () => (setEditorFocus(true), false));
  useEditorEventListener('blur', (_view, event) => {
    if (!isInsideToolbar(event.relatedTarget, rowRef.current)) setEditorFocus(false);
    return false;
  });
  useEditorEventListener('keydown', (_view, event) => {
    if (!isOpen || !event.altKey || event.key !== 'F10') return false;
    rowRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    event.preventDefault();
    return true;
  });

  const dismiss = () => {
    setDismissed(box?.key ?? null);
    controller.focus();
  };
  const onBlur = (event: FocusEvent) => {
    if (!isInsideToolbar(event.relatedTarget, rowRef.current)) setOwnFocus(false);
  };
  const label = rest['aria-labelledby']
    ? undefined
    : (rest['aria-label'] ?? strings.selectionFormatting);
  return (
    <FloatingToolbar
      ref={ref}
      {...hooks.root({ className, props: rest })}
      isOpen={isOpen}
      triggerRef={surfaceRef}
      getTargetRect={() => box?.rect ?? null}
      targetKey={box?.key ?? ''}
      onDismiss={dismiss}
      rowRef={rowRefs}
      rowClassName={hooks.slotClass('row')}
      aria-label={label}
      aria-labelledby={rest['aria-labelledby']}
      onFocus={() => setOwnFocus(true)}
      onBlur={onBlur}
    >
      <FormatButtons controller={controller} items={getMarkItems(strings)} />
      {controller.supports({ type: 'set-link', href: null }) ? (
        <LinkButton
          controller={controller}
          className={hooks.slotClass('link-editor')}
          onCommand={returnFocus}
        />
      ) : null}
      {children}
    </FloatingToolbar>
  );
}

'use client';

import type { RefObject } from 'react';
import { FormulaGlyph } from '../../core/glyphs.js';
import type { ControlSize, Key } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import type { Completion } from '../completion-list/completion-list.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { formulaBarHooks as hooks } from './formula-bar-hooks.js';

/**
 * The content with a function call inserted over the selection `[start, end)`: the function's
 * name, then the selected text inside brackets, starting an empty content with `=`. Returns the
 * new content and the caret after the bracketed text.
 */
function insertFunctionCall(
  content: string,
  { name, start, end }: { name: string; start: number; end: number },
): { content: string; caret: number } {
  const lead = content === '' ? '=' : '';
  const before = `${content.slice(0, start)}${lead}${name}(${content.slice(start, end)}`;
  return { content: `${before})${content.slice(end)}`, caret: before.length };
}

/**
 * Inserting a chosen function into the draft at the editor's selection, then returning focus to
 * the editor with the caret inside the call's brackets once the menu has closed.
 */
function useFunctionInsertion(
  editorRef: RefObject<HTMLTextAreaElement | null>,
  { text, setDraft }: { text: string; setDraft: (value: string) => void },
) {
  return (name: string) => {
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? text.length;
    const end = editor?.selectionEnd ?? text.length;
    const next = insertFunctionCall(text, { name, start, end });
    setDraft(next.content);
    // The menu hands focus back to its button as it closes; take it on the following frame.
    getOwnerWindow(editor).requestAnimationFrame(() => {
      const target = editorRef.current;
      if (!target) return;
      target.focus();
      target.setSelectionRange(next.caret, next.caret);
    });
  };
}

/**
 * The fₓ mark: with `functions`, a menu button listing them, which inserts the chosen one into
 * the draft at the editor's selection; without them, a decorative glyph.
 */
export function FormulaBarFunctions({
  functions,
  isDisabled,
  editorRef,
  draft,
  size,
}: {
  functions: readonly Completion[] | undefined;
  isDisabled: boolean;
  /** The content editor's text area, whose selection the call replaces. */
  editorRef: RefObject<HTMLTextAreaElement | null>;
  draft: { text: string; setDraft: (value: string) => void };
  /** The button's size. */
  size: ControlSize;
}) {
  const strings = useUiStrings();
  const onInsert = useFunctionInsertion(editorRef, draft);
  if (!functions) return <Glyph icon={FormulaGlyph} className={hooks.slotClass('glyph')} />;
  const items = functions.map((entry) => ({
    id: entry.label,
    label: entry.label,
    description: entry.description,
  }));
  const onAction = (key: Key) => {
    const entry = functions.find((candidate) => candidate.label === key);
    if (entry) onInsert(entry.insertText ?? entry.label);
  };
  return (
    <DropdownMenu
      iconOnly
      icon={FormulaGlyph}
      label={strings.formulaFunctions}
      variant="ghost"
      size={size}
      menuSize="sm"
      className={hooks.slotClass('functions')}
      isDisabled={isDisabled}
      items={items}
      onAction={onAction}
    />
  );
}

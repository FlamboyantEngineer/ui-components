'use client';

import { createContext, useContext, type RefObject } from 'react';
import { createHooks } from '../../core/hooks.js';

/** What the editor shares with the chrome rendered inside it. */
export interface RichTextEditorContextValue {
  isEditable: boolean;
  /** Disabled, not just read-only: interactive node views leave the tab sequence too. */
  isDisabled: boolean;
  /** The element the content and the floating chrome are positioned in. */
  surfaceRef: RefObject<HTMLDivElement | null>;
  /** Adds attributes to the content element, such as the active option of a list it controls. */
  setContentAttributes: (attributes: Readonly<Record<string, string | undefined>>) => void;
  /** Keeps the surface's gutter for a block handle while it is mounted; returns the release. */
  reserveGutter: () => () => void;
}

export const richTextEditorHooks = createHooks('rich-text-editor', [
  'frame',
  'toolbar',
  'surface',
  'content',
  'placeholder',
  'task-item',
  'task-checkbox',
  'task-content',
]);

export const RichTextEditorContext = createContext<RichTextEditorContextValue | null>(null);

/** The enclosing editor's shared state; chrome outside a `RichTextEditor` is an error. */
export function useRichTextEditorContext(component: string): RichTextEditorContextValue {
  const context = useContext(RichTextEditorContext);
  if (!context) throw new Error(`${component} must be rendered inside a RichTextEditor.`);
  return context;
}

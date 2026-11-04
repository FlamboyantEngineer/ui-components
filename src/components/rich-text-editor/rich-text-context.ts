'use client';

import { createContext, type RefObject, useContext } from 'react';
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
  /** Keeps the surface's gutter for a block handle's controls, if any, while it is mounted; returns the release. */
  reserveGutter: (controls: GutterControls) => () => void;
}

/** The block handle controls a surface keeps room for. */
export interface GutterControls {
  grip: boolean;
  menu: boolean;
}

/** The surface's `data-gutter`: the controls its gutter holds, or none. */
export function getGutter({ grip, menu }: GutterControls) {
  if (grip && menu) return 'both';
  if (grip) return 'grip';
  return menu ? 'menu' : undefined;
}

export const richTextEditorHooks = createHooks('rich-text-editor', [
  'frame',
  'toolbar',
  'body',
  'surface',
  'scrollbars',
  'scroll-marker',
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

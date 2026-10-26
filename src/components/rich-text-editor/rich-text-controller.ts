import { useEditorEventCallback, useEditorState } from '@handlewithcare/react-prosemirror';
import { useMemo } from 'react';
import {
  getLinkAt,
  isCommandActive,
  isCommandSupported,
  toEngineCommand,
} from './engine-commands.js';
import type { RichTextCommand } from './rich-text-command.js';
import { useRichTextEditorContext } from './rich-text-context.js';

/** The editor's state at the selection, and the commands that change the document. */
export interface RichTextController {
  /** The reader may change the document: it is neither read-only nor disabled. */
  isEditable: boolean;
  /** The selection is a caret. */
  isSelectionEmpty: boolean;
  /** The address of the link at the selection, if any. */
  link: string | null;
  /** Whether the schema has the node or mark types the command needs. */
  supports(command: RichTextCommand): boolean;
  /** Whether the command would change the document at the selection now. */
  can(command: RichTextCommand): boolean;
  /** Whether the command's effect holds at the selection, for a toggle's pressed state. */
  isActive(command: RichTextCommand): boolean;
  /** Runs the command at the selection; returns whether it ran. */
  run(command: RichTextCommand): boolean;
  /** Moves focus into the document, keeping its selection. */
  focus(): void;
}

/**
 * The controller of the enclosing `RichTextEditor`, for chrome rendered inside it (its toolbar or
 * children). The component renders again whenever the editor's state changes.
 */
export function useRichTextController(): RichTextController {
  const { isEditable } = useRichTextEditorContext('useRichTextController');
  const state = useEditorState();
  const run = useEditorEventCallback((view, command: RichTextCommand) =>
    isEditable ? toEngineCommand(command)(view.state, view.dispatch, view) : false,
  );
  const focus = useEditorEventCallback((view) => view.focus());
  return useMemo(
    () => ({
      isEditable,
      isSelectionEmpty: state.selection.empty,
      link: getLinkAt(state),
      supports: (command) => isCommandSupported(command, state),
      can: (command) => isEditable && toEngineCommand(command)(state),
      isActive: (command) => isCommandActive(command, state),
      run,
      focus,
    }),
    [isEditable, state, run, focus],
  );
}

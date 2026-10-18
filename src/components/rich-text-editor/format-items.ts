// The formatting commands the toolbars, the insert menu and the block menu offer.

import type { GlyphName } from '../../core/glyphs.js';
import type { UiStrings } from '../../core/strings.js';
import type { RichTextCommand } from './rich-text-command.js';

/** A command with its label, glyph and shortcut. */
export interface FormatItem {
  id: string;
  label: string;
  icon: GlyphName;
  command: RichTextCommand;
  /** The chord that runs it, as `Shortcut` writes chords. */
  shortcut?: string | undefined;
}

export function getMarkItems(strings: UiStrings): FormatItem[] {
  const marks: Array<[mark: string, label: string, icon: GlyphName, shortcut: string]> = [
    ['bold', strings.bold, 'bold', 'Ctrl+B'],
    ['italic', strings.italic, 'italic', 'Ctrl+I'],
    ['underline', strings.underline, 'underline', 'Ctrl+U'],
    ['strike', strings.strikethrough, 'strikethrough', 'Ctrl+Shift+S'],
    ['code', strings.inlineCode, 'code', 'Ctrl+E'],
  ];
  return marks.map(([mark, label, icon, shortcut]) => ({
    id: mark,
    label,
    icon,
    shortcut,
    command: { type: 'toggle-mark', mark },
  }));
}

/** The text block types: paragraph, headings and code block. */
export function getBlockItems(strings: UiStrings): FormatItem[] {
  const heading = (level: 1 | 2 | 3): FormatItem => ({
    id: `heading-${level}`,
    label: strings.heading(level),
    icon: `heading-${level}`,
    shortcut: `Ctrl+Alt+${level}`,
    command: { type: 'set-block', node: 'heading', attrs: { level } },
  });
  return [
    {
      id: 'paragraph',
      label: strings.paragraph,
      icon: 'paragraph',
      shortcut: 'Ctrl+Alt+0',
      command: { type: 'set-block', node: 'paragraph' },
    },
    heading(1),
    heading(2),
    heading(3),
    {
      id: 'code-block',
      label: strings.codeBlock,
      icon: 'code-block',
      shortcut: 'Ctrl+Alt+C',
      command: { type: 'set-block', node: 'codeBlock' },
    },
  ];
}

/** The lists and the quote that wrap blocks. */
export function getWrapItems(strings: UiStrings): FormatItem[] {
  const wrappers: Array<[id: string, node: string, label: string, icon: GlyphName, keys: string]> =
    [
      ['bullet-list', 'bulletList', strings.bulletList, 'list-bullet', 'Ctrl+Shift+8'],
      ['numbered-list', 'orderedList', strings.numberedList, 'list-numbered', 'Ctrl+Shift+7'],
      ['task-list', 'taskList', strings.taskList, 'list-task', 'Ctrl+Shift+9'],
      ['quote', 'blockquote', strings.quote, 'quote', 'Ctrl+Shift+B'],
    ];
  return wrappers.map(([id, node, label, icon, shortcut]) => ({
    id,
    label,
    icon,
    shortcut,
    command: { type: 'toggle-wrap', node },
  }));
}

/** The commands that undo and redo. */
export function getHistoryItems(strings: UiStrings): FormatItem[] {
  return [
    {
      id: 'undo',
      label: strings.undo,
      icon: 'undo',
      shortcut: 'Ctrl+Z',
      command: { type: 'undo' },
    },
    {
      id: 'redo',
      label: strings.redo,
      icon: 'redo',
      shortcut: 'Ctrl+Shift+Z',
      command: { type: 'redo' },
    },
  ];
}

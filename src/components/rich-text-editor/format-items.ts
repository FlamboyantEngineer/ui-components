import {
  BoldGlyph,
  CodeBlockGlyph,
  CodeGlyph,
  Heading1Glyph,
  Heading2Glyph,
  Heading3Glyph,
  ItalicGlyph,
  ListBulletGlyph,
  ListNumberedGlyph,
  ListTaskGlyph,
  ParagraphGlyph,
  QuoteGlyph,
  RedoGlyph,
  StrikethroughGlyph,
  UnderlineGlyph,
  UndoGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';

// The formatting commands the toolbars, the insert menu and the block menu offer.

import type { UiStrings } from '../../core/strings.js';
import type { RichTextCommand } from './rich-text-command.js';

/** A command with its label, glyph and shortcut. */
export interface FormatItem {
  id: string;
  label: string;
  icon: GlyphComponent;
  command: RichTextCommand;
  /** The chord that runs it, as `Shortcut` writes chords. */
  shortcut?: string | undefined;
}

export function getMarkItems(strings: UiStrings): FormatItem[] {
  const marks: Array<[mark: string, label: string, icon: GlyphComponent, shortcut: string]> = [
    ['bold', strings.bold, BoldGlyph, 'Ctrl+B'],
    ['italic', strings.italic, ItalicGlyph, 'Ctrl+I'],
    ['underline', strings.underline, UnderlineGlyph, 'Ctrl+U'],
    ['strike', strings.strikethrough, StrikethroughGlyph, 'Ctrl+Shift+S'],
    ['code', strings.inlineCode, CodeGlyph, 'Ctrl+E'],
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
    icon: { 1: Heading1Glyph, 2: Heading2Glyph, 3: Heading3Glyph }[level],
    shortcut: `Ctrl+Alt+${level}`,
    command: { type: 'set-block', node: 'heading', attrs: { level } },
  });
  return [
    {
      id: 'paragraph',
      label: strings.paragraph,
      icon: ParagraphGlyph,
      shortcut: 'Ctrl+Alt+0',
      command: { type: 'set-block', node: 'paragraph' },
    },
    heading(1),
    heading(2),
    heading(3),
    {
      id: 'code-block',
      label: strings.codeBlock,
      icon: CodeBlockGlyph,
      shortcut: 'Ctrl+Alt+C',
      command: { type: 'set-block', node: 'codeBlock' },
    },
  ];
}

/** The lists and the quote that wrap blocks. */
export function getWrapItems(strings: UiStrings): FormatItem[] {
  const wrappers: Array<
    [id: string, node: string, label: string, icon: GlyphComponent, keys: string]
  > = [
    ['bullet-list', 'bulletList', strings.bulletList, ListBulletGlyph, 'Ctrl+Shift+8'],
    ['numbered-list', 'orderedList', strings.numberedList, ListNumberedGlyph, 'Ctrl+Shift+7'],
    ['task-list', 'taskList', strings.taskList, ListTaskGlyph, 'Ctrl+Shift+9'],
    ['quote', 'blockquote', strings.quote, QuoteGlyph, 'Ctrl+Shift+B'],
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
      icon: UndoGlyph,
      shortcut: 'Ctrl+Z',
      command: { type: 'undo' },
    },
    {
      id: 'redo',
      label: strings.redo,
      icon: RedoGlyph,
      shortcut: 'Ctrl+Shift+Z',
      command: { type: 'redo' },
    },
  ];
}

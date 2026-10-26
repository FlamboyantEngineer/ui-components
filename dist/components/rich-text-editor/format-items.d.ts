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
export declare function getMarkItems(strings: UiStrings): FormatItem[];
/** The text block types: paragraph, headings and code block. */
export declare function getBlockItems(strings: UiStrings): FormatItem[];
/** The lists and the quote that wrap blocks. */
export declare function getWrapItems(strings: UiStrings): FormatItem[];
/** The commands that undo and redo. */
export declare function getHistoryItems(strings: UiStrings): FormatItem[];
//# sourceMappingURL=format-items.d.ts.map
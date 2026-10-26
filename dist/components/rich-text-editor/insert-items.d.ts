import type { GlyphName } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import type { RichTextCommand } from './rich-text-command.js';
/** An entry of the insert menus: a command with a label, matched by its label and keywords. */
export interface InsertMenuItem {
    id: Key;
    label: string;
    /** A short explanation shown beside the label. */
    description?: string | undefined;
    /** A built-in glyph shown before the label in the insert button's menu. */
    icon?: GlyphName | undefined;
    /** Other words that find it, such as `title` for a heading. */
    keywords?: readonly string[] | undefined;
    /** What choosing it runs at the caret. */
    command: RichTextCommand;
}
/** The built-in entries: text blocks, lists, quote and divider, then the caller's own. */
export declare function getInsertItems(strings: UiStrings, extra?: readonly InsertMenuItem[]): InsertMenuItem[];
/** The entries matching a typed query by label or keyword, best match first. */
export declare function matchInsertItems(items: readonly InsertMenuItem[], query: string): InsertMenuItem[];
//# sourceMappingURL=insert-items.d.ts.map
import { type ReactNode, type Ref } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type EmojiEntry, type SkinTone } from './emoji-catalog.js';
export interface EmojiGridProps extends BaseProps {
    /** The visible label that names the grid. */
    label: string;
    entries: readonly EmojiEntry[];
    skinTone: SkinTone;
    onSelect: (entry: EmojiEntry) => void;
    /** Reports the entry under the pointer or keyboard focus. */
    onActiveChange: (entry: EmojiEntry) => void;
    renderEmoji?: ((unicode: string) => ReactNode) | undefined;
    gridRef?: Ref<HTMLDivElement> | undefined;
}
/** The grid props a picker shares between every grid it draws. */
export type EmojiGridOptions = Omit<EmojiGridProps, 'label' | 'entries' | keyof BaseProps>;
export declare function EmojiContent({ entry, skinTone, renderEmoji, }: Pick<EmojiGridProps, 'skinTone' | 'renderEmoji'> & {
    entry: EmojiEntry;
}): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
/** One labelled grid of emoji; arrow keys move through it in two dimensions. */
export declare function EmojiGrid({ label, entries, skinTone, onSelect, onActiveChange, renderEmoji, gridRef, className, ...rest }: EmojiGridProps): import("react").JSX.Element;
//# sourceMappingURL=emoji-grid.d.ts.map
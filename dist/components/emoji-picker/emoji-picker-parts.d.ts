import type { BaseProps } from '../../core/props.js';
/** The search field part: caller attributes and class go on the field. */
export type EmojiPickerSearchProps = BaseProps;
/** The preview part: caller attributes and class go on the preview. */
export type EmojiPickerPreviewProps = BaseProps;
/** The picker's search field: Down moves to the first emoji and Enter chooses it. */
export declare function EmojiPickerSearch({ className, ...rest }: EmojiPickerSearchProps): import("react").JSX.Element;
/** The decorative preview of the emoji last hovered or focused, with its label. */
export declare function EmojiPickerPreview({ className, ...rest }: EmojiPickerPreviewProps): import("react").JSX.Element;
//# sourceMappingURL=emoji-picker-parts.d.ts.map
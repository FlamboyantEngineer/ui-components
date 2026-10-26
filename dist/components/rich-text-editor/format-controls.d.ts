import { type FormatItem } from './format-items.js';
import type { RichTextController } from './rich-text-controller.js';
export interface FormatControlProps {
    controller: RichTextController;
}
interface OverlayControlProps extends FormatControlProps {
    /** The overlay's hook class. */
    className: string;
    /** Called after a command chosen in the overlay ran, to send focus back to the document. */
    onCommand: () => void;
}
/**
 * Buttons for the commands the schema supports; marks, lists and the quote are toggle buttons,
 * pressed while their effect holds. A pointer press keeps focus, and the selection, in the document.
 */
export declare function FormatButtons({ controller, items }: FormatControlProps & {
    items: FormatItem[];
}): import("react").JSX.Element[];
/** The select of text block types; choosing one turns the selected blocks into it. */
export declare function BlockTypeSelect({ controller, className, onCommand }: OverlayControlProps): import("react").JSX.Element;
/**
 * The link button, pressed on a link, and its popover: an address field that links the selection
 * (or inserts the address at a caret), and a button that removes the link.
 */
export declare function LinkButton({ controller, className, onCommand }: OverlayControlProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=format-controls.d.ts.map
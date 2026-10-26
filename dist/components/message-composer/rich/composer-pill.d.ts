import { type NodeViewComponentProps } from '@handlewithcare/react-prosemirror';
import { type RecordLabelResolver } from '../../record-label/record-label.js';
/** What the editor's pills draw with. */
export interface ComposerPillOptions {
    getReference: RecordLabelResolver | undefined;
    isEditable: boolean;
}
export declare const ComposerPillContext: import("react").Context<ComposerPillOptions>;
/** A pill drawn by the editor: atomic, its text or its chip. */
declare function ComposerPill({ nodeProps, ref, className, ...props }: NodeViewComponentProps): import("react").JSX.Element;
/** The editor's node views. */
export declare const composerNodeViews: {
    pill: typeof ComposerPill;
};
export {};
//# sourceMappingURL=composer-pill.d.ts.map
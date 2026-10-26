/** A dialog a view switcher opens: what it does, and the name it starts from. */
export type ViewDialog = {
    type: 'save-as' | 'rename';
    label: string;
    isOpen: boolean;
    onSubmit: NameSubmit;
} | {
    type: 'delete';
    label: string;
    isOpen: boolean;
    onSubmit: () => void | Promise<unknown>;
};
type NameSubmit = (label: string) => void | Promise<unknown>;
interface ViewDialogsProps {
    /** The open dialog, which stays set while it closes. */
    dialog: ViewDialog | null;
    onClose: () => void;
}
/** The view switcher's open dialog: naming a view, or confirming a view's deletion. */
export declare function ViewDialogs({ dialog, onClose }: ViewDialogsProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=view-dialogs.d.ts.map
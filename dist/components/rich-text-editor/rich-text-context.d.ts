import { type RefObject } from 'react';
/** What the editor shares with the chrome rendered inside it. */
export interface RichTextEditorContextValue {
    isEditable: boolean;
    /** The element the content and the floating chrome are positioned in. */
    surfaceRef: RefObject<HTMLDivElement | null>;
    /** Adds attributes to the content element, such as the active option of a list it controls. */
    setContentAttributes: (attributes: Readonly<Record<string, string | undefined>>) => void;
}
export declare const richTextEditorHooks: import("../../core/hooks.js").ComponentHooks<"toolbar" | "content" | "frame" | "surface" | "placeholder" | "task-item" | "task-checkbox" | "task-content">;
export declare const RichTextEditorContext: import("react").Context<RichTextEditorContextValue | null>;
/** The enclosing editor's shared state; chrome outside a `RichTextEditor` is an error. */
export declare function useRichTextEditorContext(component: string): RichTextEditorContextValue;
//# sourceMappingURL=rich-text-context.d.ts.map
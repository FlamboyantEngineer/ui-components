import type { Schema } from 'prosemirror-model';
import { type ReactNode } from 'react';
import type { FieldControlProps } from '../field/field.js';
import type { RichTextDocument } from './rich-text-document.js';
export interface EditorSurfaceProps {
    control: FieldControlProps;
    schema: Schema;
    value: RichTextDocument;
    onChange: (value: RichTextDocument) => void;
    placeholder: string | undefined;
    toolbar: ReactNode;
    children: ReactNode;
}
/** The editable document inside the field: its toolbar, the content and the floating chrome. */
export declare function EditorSurface(props: EditorSurfaceProps): import("react").JSX.Element;
//# sourceMappingURL=editor-surface.d.ts.map
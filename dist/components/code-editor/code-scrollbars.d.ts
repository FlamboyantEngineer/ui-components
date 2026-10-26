import { type RefObject } from 'react';
import { type CodeDiagnostic } from './code-layers.js';
interface CodeScrollbarsProps {
    input: RefObject<HTMLTextAreaElement | null>;
    gutter: RefObject<HTMLDivElement | null>;
    inputId: string;
    diagnostics: readonly CodeDiagnostic[];
    value: string;
    wrap: string;
}
/** The editor's custom scrollbars share the native viewport, with diagnostics painted inside the vertical track. */
export declare function CodeScrollbars(props: CodeScrollbarsProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=code-scrollbars.d.ts.map
import { jsx as _jsx } from "react/jsx-runtime";
import { CodeField } from './code-field.js';
import { CodeSurface } from './code-surface.js';
import { resolveCodeTokenizer } from './code-languages.js';
/** A code field, or an embedded surface, with preset or custom syntax and located diagnostics. */
export function CodeEditor(props) {
    if (props.variant !== 'surface')
        return _jsx(CodeField, { ...props });
    const { variant: _variant, syntax, language = 'text', ...surface } = props;
    return (_jsx(CodeSurface, { ...surface, language: language, tokenize: surface.tokenize ?? resolveCodeTokenizer({ language, syntax }) }));
}
//# sourceMappingURL=code-editor.js.map
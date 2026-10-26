import { jsx as _jsx } from "react/jsx-runtime";
import { FindBar } from '../find-bar/find-bar.js';
import { codeEditorHooks as hooks } from './code-layers.js';
/**
 * The find and replace row of a code editor, a Find Bar: the find box and its match count, previous
 * and next match, and in an editable editor the replacement with Replace and Replace all. Escape or
 * Close closes the row.
 */
export function CodeSearchPanel({ model, canReplace }) {
    return (_jsx(FindBar, { className: hooks.slotClass('search'), query: model.query, onQueryChange: model.setQuery, matchCount: model.query ? model.matches.length : undefined, currentIndex: model.current, onNext: () => model.step(1), onPrevious: () => model.step(-1), replacement: model.replacement, onReplacementChange: model.setReplacement, onReplace: canReplace ? model.replace : undefined, onReplaceAll: canReplace ? model.replaceAll : undefined, onClose: model.close, inputRef: model.findRef }));
}
//# sourceMappingURL=code-search.js.map
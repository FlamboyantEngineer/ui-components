import { jsx as _jsx } from "react/jsx-runtime";
// The rich composer's pills as the editor draws them: a mention or command as its text, a record
// reference as a record chip (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-4.3 and 4.9).
import { useEditorEventCallback, useStopEvent, } from '@handlewithcare/react-prosemirror';
import { createContext, useContext, useMemo, useRef } from 'react';
import { mergeClassNames } from '../../../core/hooks.js';
import { mergeRefs } from '../../../utils/merge-props.js';
import { RecordLabel } from '../../record-label/record-label.js';
import { composerHooks as hooks } from '../composer-hooks.js';
import { getPillText } from './composer-schema.js';
export const ComposerPillContext = createContext({
    getReference: undefined,
    isEditable: false,
});
/** A reference's chip, with a remove button while the composer is editable. */
function ReferenceChip({ nodeProps }) {
    const { getReference, isEditable } = useContext(ComposerPillContext);
    const { id, label, recordType } = nodeProps.node.attrs;
    const remove = useEditorEventCallback((view) => {
        const from = nodeProps.getPos();
        view.dispatch(view.state.tr.delete(from, from + nodeProps.node.nodeSize));
        view.focus();
    });
    return (_jsx(RecordLabel, { mode: "chip", ...getReference?.({ id, label, ...(recordType === undefined ? {} : { recordType }) }), identifier: label, onRemove: isEditable ? remove : undefined }));
}
/** A pill drawn by the editor: atomic, its text or its chip. */
function ComposerPill({ nodeProps, ref, className, ...props }) {
    const { kind } = nodeProps.node.attrs;
    const element = useRef(null);
    // The editor leaves events in a chip to it, so its link and remove button take presses and keys.
    useStopEvent((_view, event) => kind === 'reference' && (element.current?.contains(event.target) ?? false));
    const refs = useMemo(() => mergeRefs(element, ref), [ref]);
    const hookProps = hooks.slot('pill', { kind });
    return (_jsx("span", { ...props, ...hookProps, className: mergeClassNames(hookProps.className, className), ref: refs, contentEditable: false, children: kind === 'reference' ? _jsx(ReferenceChip, { nodeProps: nodeProps }) : getPillText(nodeProps.node) }));
}
/** The editor's node views. */
export const composerNodeViews = { pill: ComposerPill };
//# sourceMappingURL=composer-pill.js.map
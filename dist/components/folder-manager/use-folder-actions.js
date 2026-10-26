import { toErrorMessage } from '../../utils/to-error-message.js';
import { useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { findFolderPath } from './folder-model.js';
function isKey(value) {
    return typeof value === 'string' || typeof value === 'number';
}
/**
 * The folder manager's edits and deletes. Each runs the caller's callback, which may return a
 * promise: while it is pending the edit ignores further submits, and a refusal keeps the edit open
 * with the typed name and shows the error's message.
 */
export function useFolderActions({ folders, onCreate, onRename, onDelete, getDeleteBlockedReason, select, onSettle, }) {
    const strings = useUiStrings();
    const [edit, setEditState] = useState(null);
    const [isDeleting, setDeleting] = useState(false);
    const [message, setMessage] = useState(null);
    const latest = useRef(null);
    const setEdit = (next) => {
        latest.current = next;
        setEditState(next);
    };
    const start = (next) => {
        setMessage(null);
        setEdit({ ...next, isPending: false });
    };
    const finish = (current, key) => {
        setEdit(null);
        onSettle(current.kind === 'rename' ? current.key : key);
    };
    const run = async (current, name) => {
        if (current.kind === 'rename' && current.key !== null) {
            await onRename?.({ key: current.key, name });
            return current.key;
        }
        const created = await onCreate?.({ name, parentKey: current.key });
        return isKey(created) ? created : current.key;
    };
    const submit = async (text) => {
        const current = latest.current;
        if (!current || current.isPending)
            return;
        const name = text.trim();
        if (!name || name === current.original)
            return finish(current, current.key);
        setEdit({ ...current, name, isPending: true });
        try {
            const key = await run(current, name);
            setMessage(null);
            if (current.kind === 'create')
                select(key);
            finish(current, key);
        }
        catch (error) {
            setEdit({ ...current, name, isPending: false });
            setMessage(toErrorMessage(error, strings.actionFailed));
        }
    };
    const remove = async (targets) => {
        const reason = targets.map((folder) => getDeleteBlockedReason?.(folder)).find(Boolean);
        if (reason)
            return setMessage(reason);
        const parentKey = findFolderPath(folders, targets[0]?.id ?? null).at(-2)?.id ?? null;
        setDeleting(true);
        setMessage(null);
        try {
            for (const folder of targets)
                await onDelete?.(folder.id);
            select(parentKey);
            onSettle(parentKey);
        }
        catch (error) {
            setMessage(toErrorMessage(error, strings.actionFailed));
        }
        finally {
            setDeleting(false);
        }
    };
    return {
        edit,
        isDeleting,
        message,
        startCreate: (parentKey) => start({ kind: 'create', key: parentKey, name: '', original: '' }),
        startRename: (folder) => start({ kind: 'rename', key: folder.id, name: folder.name, original: folder.name }),
        submit,
        cancel: () => {
            if (latest.current && !latest.current.isPending)
                finish(latest.current, latest.current.key);
        },
        remove,
    };
}
//# sourceMappingURL=use-folder-actions.js.map
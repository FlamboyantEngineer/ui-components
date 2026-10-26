// Which offered files a file upload accepts: by type, size, count and the caller's own check.
function matchesType(file, entry) {
    const type = entry.trim().toLowerCase();
    if (!type)
        return false;
    if (type.startsWith('.'))
        return file.name?.toLowerCase().endsWith(type) ?? false;
    if (type.endsWith('/*'))
        return file.type.toLowerCase().startsWith(type.slice(0, -1));
    return file.type.toLowerCase() === type;
}
/** Whether a file's extension or MIME type is among the accepted types; any type without a list. */
function isFileTypeAccepted(file, acceptedFileTypes) {
    if (!acceptedFileTypes || acceptedFileTypes.length === 0)
        return true;
    return acceptedFileTypes.some((entry) => matchesType(file, entry));
}
function checkFileRules(file, rules) {
    const { acceptedFileTypes, maxSize, minSize } = rules;
    if (!isFileTypeAccepted(file, acceptedFileTypes))
        return 'type';
    if (maxSize !== undefined && maxSize > 0 && file.size > maxSize)
        return 'size';
    if (minSize !== undefined && file.size < minSize)
        return 'min-size';
    return null;
}
function isPromise(value) {
    return typeof value?.then === 'function';
}
/**
 * Sorts offered files into the accepted ones and the refusals, keeping their order: a file must
 * match the types, fit the size limits, pass `validate` and fit within `maxFiles`, where `held`
 * files are already listed. The result is immediate unless `validate` answers with a promise.
 */
export function partitionFiles(files, rules, held = 0) {
    const partition = { accepted: [], rejections: [] };
    const admit = (file, message) => {
        const isFull = rules.maxFiles !== undefined && held + partition.accepted.length >= rules.maxFiles;
        if (message)
            partition.rejections.push({ file, reason: 'invalid', message });
        else if (isFull)
            partition.rejections.push({ file, reason: 'count' });
        else
            partition.accepted.push(file);
    };
    const sortFrom = (index) => {
        for (let at = index; at < files.length; at += 1) {
            const file = files[at];
            const reason = checkFileRules(file, rules);
            if (reason)
                partition.rejections.push({ file, reason });
            const verdict = reason ? null : rules.validate?.(file, [...partition.accepted]);
            if (isPromise(verdict)) {
                return verdict.then((message) => {
                    admit(file, message);
                    return sortFrom(at + 1);
                });
            }
            if (!reason)
                admit(file, verdict);
        }
        return partition;
    };
    return sortFrom(0);
}
/**
 * Whether dragged items would pass the rules a drag can check: the count against `maxFiles`, and
 * each MIME type against the MIME rules. Extensions, sizes and `validate` wait for the drop, so a
 * file they could refuse counts as passing.
 */
export function canAcceptDrag(items, rules, held = 0) {
    const files = items.filter(({ kind }) => kind === 'file');
    if (rules.maxFiles !== undefined && held + files.length > rules.maxFiles)
        return false;
    const types = rules.acceptedFileTypes ?? [];
    if (types.length === 0 || types.some((entry) => entry.trim().startsWith('.')))
        return true;
    return files.every(({ type }) => !type || types.some((entry) => matchesType({ type }, entry)));
}
//# sourceMappingURL=file-rules.js.map
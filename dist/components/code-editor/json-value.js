function appendObjectPairs({ node, value }, pending) {
    if (node.kind !== 'object' || typeof value !== 'object' || value === null)
        return false;
    const properties = new Map(node.properties.map((property) => [property.key, property.value]));
    if (properties.size !== Object.keys(value).length)
        return false;
    for (const [key, child] of properties) {
        if (!Object.hasOwn(value, key))
            return false;
        pending.push({ node: child, value: value[key] });
    }
    return true;
}
/** JSON objects compare by their own keys and values, independently of key order. */
export function isJsonValueEqual(node, value) {
    const pending = [{ node, value }];
    while (pending.length > 0) {
        const pair = pending.pop();
        const { node: current, value: expected } = pair;
        if (current.kind === 'scalar') {
            if (current.value !== expected)
                return false;
        }
        else if (current.kind === 'array') {
            if (!Array.isArray(expected) || current.items.length !== expected.length)
                return false;
            current.items.forEach((item, index) => pending.push({ node: item, value: expected[index] }));
        }
        else if (Array.isArray(expected) || !appendObjectPairs(pair, pending))
            return false;
    }
    return true;
}
function createValueFrame(value) {
    const isArray = Array.isArray(value);
    const entries = isArray
        ? Array.from(value, (entry, index) => [String(index), entry])
        : Object.entries(value).filter(([, entry]) => entry !== undefined && typeof entry !== 'function' && typeof entry !== 'symbol');
    return { entries, index: 0, isArray };
}
/** Serializes plain JSON values without consuming a call frame for each container. */
export function stringifyJsonValue(value, indent = 0) {
    const gap = ' '.repeat(Math.min(10, Math.max(0, Math.trunc(indent) || 0)));
    const parts = [];
    const stack = [];
    let padding = '';
    const append = (entry) => {
        if (typeof entry !== 'object' || entry === null) {
            parts.push(JSON.stringify(entry) ?? 'null');
            return;
        }
        const frame = createValueFrame(entry);
        parts.push(frame.isArray ? '[' : '{');
        stack.push(frame);
        padding += gap;
    };
    append(value);
    while (stack.length > 0) {
        const frame = stack.at(-1);
        const entry = frame.entries[frame.index];
        if (!entry) {
            padding = padding.slice(0, Math.max(0, padding.length - gap.length));
            if (gap && frame.index > 0)
                parts.push('\n', padding);
            parts.push(frame.isArray ? ']' : '}');
            stack.pop();
            continue;
        }
        if (frame.index > 0)
            parts.push(',');
        if (gap)
            parts.push('\n', padding);
        if (!frame.isArray)
            parts.push(JSON.stringify(entry[0]), gap ? ': ' : ':');
        frame.index += 1;
        append(entry[1]);
    }
    return parts.join('');
}
//# sourceMappingURL=json-value.js.map
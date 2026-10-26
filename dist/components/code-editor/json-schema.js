// A documented subset of JSON Schema checked against a JSON tree: types, enumerations, constants,
// object properties, array items and the number, string and array limits.
import { isJsonValueEqual, stringifyJsonValue } from './json-value.js';
function typeOf(node) {
    if (node.kind !== 'scalar')
        return node.kind;
    if (node.value === null)
        return 'null';
    return typeof node.value;
}
function hasType(node, type) {
    const actual = typeOf(node);
    if (type === 'integer')
        return node.kind === 'scalar' && typeof node.value === 'number' && Number.isInteger(node.value);
    return actual === type;
}
/** The types a schema allows, or none for any. */
export function listSchemaTypes(schema) {
    if (schema.type === undefined)
        return [];
    return typeof schema.type === 'string' ? [schema.type] : schema.type;
}
function report(check, message, range = check.node) {
    check.issues.push({ message, start: range.start, end: range.end });
}
function checkValue(check) {
    const { node, schema, strings } = check;
    const types = listSchemaTypes(schema);
    if (types.length > 0 && !types.some((type) => hasType(node, type))) {
        report(check, strings.jsonTypeMismatch(types));
        return false;
    }
    const constraints = [schema.enum, 'const' in schema ? [schema.const] : undefined];
    for (const allowed of constraints) {
        if (allowed && !allowed.some((entry) => isJsonValueEqual(node, entry))) {
            report(check, strings.jsonValueMismatch(allowed.map((entry) => stringifyJsonValue(entry))));
            return false;
        }
    }
    return true;
}
/** Whether a string matches a pattern; a pattern that is not a valid expression matches all. */
function matchesPattern(pattern, value) {
    try {
        return new RegExp(pattern, 'u').test(value);
    }
    catch {
        return true;
    }
}
function checkScalar(check, value) {
    const { schema, strings } = check;
    if (typeof value === 'number') {
        if (schema.minimum !== undefined && value < schema.minimum)
            report(check, strings.rangeUnderflow(String(schema.minimum)));
        if (schema.maximum !== undefined && value > schema.maximum)
            report(check, strings.rangeOverflow(String(schema.maximum)));
    }
    if (typeof value !== 'string')
        return;
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength)
        report(check, strings.tooShort(schema.minLength));
    if (schema.maxLength !== undefined && length > schema.maxLength)
        report(check, strings.tooLong(schema.maxLength));
    if (schema.pattern !== undefined && !matchesPattern(schema.pattern, value)) {
        report(check, strings.patternMismatch);
    }
}
function checkArray(check, items, pending) {
    const { schema, strings } = check;
    if (schema.minItems !== undefined && items.length < schema.minItems)
        report(check, strings.jsonTooFewItems(schema.minItems));
    if (schema.maxItems !== undefined && items.length > schema.maxItems)
        report(check, strings.jsonTooManyItems(schema.maxItems));
    const itemSchema = schema.items;
    if (itemSchema) {
        for (let index = items.length - 1; index >= 0; index -= 1) {
            pending.push({ ...check, node: items[index], schema: itemSchema });
        }
    }
}
function checkObject(check, node, pending) {
    const { schema, strings } = check;
    const properties = new Map(node.properties.map((property) => [property.key, property]));
    for (const name of schema.required ?? []) {
        if (!properties.has(name))
            report(check, strings.jsonMissingProperty(name), { start: node.start, end: node.start + 1 });
    }
    const entries = [...properties.values()];
    for (let index = entries.length - 1; index >= 0; index -= 1) {
        const property = entries[index];
        const own = getPropertySchema(schema, property.key);
        const extra = schema.additionalProperties;
        if (own)
            pending.push({ ...check, node: property.value, schema: own });
        else if (extra === false)
            report(check, strings.jsonUnknownProperty(property.key), property);
        else if (extra && extra !== true)
            pending.push({ ...check, node: property.value, schema: extra });
    }
}
/** Only declared properties describe a JSON key; prototype members are ordinary extra keys. */
function getPropertySchema(schema, key) {
    return schema.properties && Object.hasOwn(schema.properties, key)
        ? schema.properties[key]
        : undefined;
}
/** The places a JSON tree breaks a schema, in document order. */
export function validateJsonSchema(node, schema, strings) {
    const issues = [];
    const pending = [{ node, schema, strings, issues }];
    while (pending.length > 0) {
        const check = pending.pop();
        if (!checkValue(check))
            continue;
        if (check.node.kind === 'scalar')
            checkScalar(check, check.node.value);
        else if (check.node.kind === 'array')
            checkArray(check, check.node.items, pending);
        else
            checkObject(check, check.node, pending);
    }
    return issues.sort((a, b) => a.start - b.start);
}
/** The schema of the value at `path`, through `properties`, `additionalProperties` and `items`. */
export function findSubschema(schema, path) {
    let current = schema;
    for (const step of path) {
        if (!current)
            return null;
        const extra = typeof current.additionalProperties === 'object' ? current.additionalProperties : null;
        current =
            typeof step === 'number'
                ? (current.items ?? null)
                : (getPropertySchema(current, step) ?? extra);
    }
    return current;
}
//# sourceMappingURL=json-schema.js.map
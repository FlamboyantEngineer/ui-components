// The problems of JSON text: where it stops parsing, or where it breaks its schema, as code editor
// diagnostics and as the field's message.
import { findLineStarts } from '../../utils/find-line-starts.js';
import { validateJsonSchema } from './json-schema.js';
import { findJsonError } from './json-text.js';
import { parseJsonTree } from './json-tree.js';
const noProblems = { diagnostics: [], issue: null };
/** The line and column, counted from 1, of an offset. */
function placeOf(starts, offset) {
    let low = 0;
    let high = starts.length;
    while (low + 1 < high) {
        const middle = Math.floor((low + high) / 2);
        if (starts[middle] <= offset)
            low = middle;
        else
            high = middle;
    }
    return { line: low + 1, column: offset - starts[low] + 1 };
}
function checkParse(source, strings) {
    const error = findJsonError(source);
    if (!error)
        return null;
    const { location } = error;
    const message = location
        ? strings.invalidJsonAt(location.line, location.column)
        : strings.invalidJson;
    return {
        diagnostics: location ? [{ message, line: location.line, column: location.column }] : [],
        issue: { severity: 'error', message },
    };
}
/**
 * Checks JSON text: text that does not parse has one problem where parsing stops; text that
 * parses is checked against `schema`, each problem marked where it is and the first one reported
 * with its line and column. Blank text has no problems.
 */
export function checkJsonText(source, schema, strings) {
    const tree = schema ? parseJsonTree(source) : null;
    const parse = tree ? null : checkParse(source, strings);
    if (parse)
        return parse;
    if (!tree || !schema)
        return noProblems;
    const starts = findLineStarts(source);
    const diagnostics = validateJsonSchema(tree, schema, strings).map(({ message, start, end }) => {
        const from = placeOf(starts, start);
        const to = placeOf(starts, end);
        return { message, ...from, endLine: to.line, endColumn: to.column };
    });
    const [first] = diagnostics;
    if (!first)
        return noProblems;
    const message = strings.jsonProblemAt(first.line, first.column, first.message);
    return { diagnostics, issue: { severity: 'error', message } };
}
/** Reuses the current result for the field check and the editor's diagnostic layer. */
export function createJsonChecker(schema, strings) {
    let previous;
    let result = noProblems;
    return (source) => {
        if (source !== previous) {
            result = checkJsonText(source, schema, strings);
            previous = source;
        }
        return result;
    };
}
//# sourceMappingURL=json-check.js.map
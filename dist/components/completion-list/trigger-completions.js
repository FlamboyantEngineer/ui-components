// A completion source opened by trigger characters, such as `@` for people and `#` for references.
const SPACE = /\s/;
function isQuery(query, trigger) {
    if (query.startsWith(' '))
        return false;
    return trigger.allowsSpaces ? !query.includes('\n') : !SPACE.test(query);
}
/** Whether a trigger character at `at` starts a query: at the start or after white space. */
function isTriggerStart(value, at) {
    return at === 0 || SPACE.test(value[at - 1] ?? '');
}
/**
 * The nearest trigger before the caret on its line whose query reaches the caret, if any. A white
 * space ends the search unless a trigger allows spaces.
 */
function findCompletionTrigger(value, caret, triggers) {
    const lineStart = value.lastIndexOf('\n', caret - 1) + 1;
    const spaces = triggers.some((trigger) => trigger.allowsSpaces);
    for (let at = caret - 1; at >= lineStart; at -= 1) {
        const character = value[at] ?? '';
        const trigger = triggers.find((candidate) => candidate.character === character);
        const query = value.slice(at + 1, caret);
        if (trigger && isTriggerStart(value, at) && isQuery(query, trigger)) {
            return { trigger, at, query };
        }
        if (SPACE.test(character) && !spaces)
            return null;
    }
    return null;
}
/**
 * A completion source for trigger characters: typing `@` (at the start or after white space) asks
 * that trigger's `getCompletions` for the query after it, and a chosen completion replaces the
 * trigger and its query with its `insertText` (or label). The answers show as given.
 */
export function createTriggerCompletions(triggers) {
    return ({ value, caret }) => {
        const match = findCompletionTrigger(value, caret, triggers);
        if (!match)
            return [];
        const answer = (options) => ({
            options,
            from: match.at,
            filter: false,
        });
        const found = match.trigger.getCompletions(match.query);
        return 'then' in found ? found.then(answer) : answer(found);
    };
}
//# sourceMappingURL=trigger-completions.js.map
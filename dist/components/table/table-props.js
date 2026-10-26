const ariaKeys = [
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'aria-details',
    'selectionMode',
    'selectionBehavior',
    'disabledKeys',
    'disallowEmptySelection',
];
/** The props of a `Table` that React Aria's table takes as they are, such as labelling. */
export function pickAriaProps(options) {
    const entries = ariaKeys.map((key) => [key, options[key]]);
    return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}
//# sourceMappingURL=table-props.js.map
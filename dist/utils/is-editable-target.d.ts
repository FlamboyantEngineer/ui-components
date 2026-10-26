/**
 * Whether a key press at `target` belongs to the element it happens in: a field or editable content
 * (`contenteditable` with any value but `false`, including `""` and `plaintext-only`), or an
 * element matching `extraSelector`, such as a widget the caller drew (`'[role="slider"]'`). A
 * surrounding widget leaves such a key alone.
 */
export declare function isEditableTarget(target: EventTarget | null, extraSelector?: string): boolean;
//# sourceMappingURL=is-editable-target.d.ts.map
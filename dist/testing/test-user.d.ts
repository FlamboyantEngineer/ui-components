/**
 * The part of a Testing Library `user` (from `userEvent.setup()` in `@testing-library/user-event`)
 * the helpers drive. Declared here so the helpers load without user-event and accept any version
 * whose methods match.
 */
export interface TestUser {
    click(element: Element): Promise<void>;
    clear(element: Element): Promise<void>;
    keyboard(text: string): Promise<void>;
    type(element: Element, text: string): Promise<void>;
}
/** An accessible name to match: the exact text, or a pattern. */
export type NameMatch = string | RegExp;
//# sourceMappingURL=test-user.d.ts.map
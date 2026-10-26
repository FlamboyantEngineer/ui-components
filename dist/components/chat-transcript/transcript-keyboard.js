import { findOwner, listTabbable, } from './transcript-tabbables.js';
/** Where Up, Down, Home and End go from `current`, and how the target comes into view. */
function resolveMove(key, current, keys) {
    const index = keys.indexOf(current);
    if (index === -1)
        return null;
    if (key === 'ArrowUp')
        return { target: keys[Math.max(0, index - 1)], align: 'nearest' };
    if (key === 'ArrowDown')
        return { target: keys[index + 1] ?? current, align: 'nearest' };
    if (key === 'Home')
        return { target: keys[0], align: 'start' };
    if (key === 'End')
        return { target: keys.at(-1), align: 'nearest' };
    return null;
}
/** Enter moves into the message's first control, which puts its controls in the tab order. */
function enterMessage(event, owner, nav) {
    nav.tabbables.enter(owner.key);
    const [first] = listTabbable(owner.element);
    if (!first) {
        nav.tabbables.enter(null);
        return;
    }
    event.preventDefault();
    first.focus();
}
/** Keys pressed on a message itself. */
function handleMessageKey(event, owner, nav) {
    const move = resolveMove(event.key, owner.key, nav.messageKeys());
    if (move) {
        event.preventDefault();
        if (move.target !== undefined && move.target !== owner.key) {
            nav.focusMessage(move.target, move.align);
        }
    }
    else if (event.key === 'Enter') {
        enterMessage(event, owner, nav);
    }
    else if (event.key === 'Escape' && nav.onEscape) {
        event.preventDefault();
        event.stopPropagation();
        nav.onEscape();
    }
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
        nav.onPage();
    }
}
/**
 * The feed's key handler: on a message, arrows, Home and End move between messages, Enter moves
 * into it and Escape leaves the transcript; inside a message, Escape returns to the message.
 * Keys from content portalled out of the feed, such as an open menu, are left alone.
 */
export function handleTranscriptKeyDown(event, nav) {
    const target = event.target;
    if (event.altKey || event.ctrlKey || event.metaKey || !event.currentTarget.contains(target)) {
        return;
    }
    const owner = findOwner(target, event.currentTarget, nav.registry);
    if (!owner)
        return;
    if (target === owner.element) {
        handleMessageKey(event, owner, nav);
    }
    else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        owner.element.focus();
    }
}
/** The control Tab moves to inside a message, wrapping at either end. */
function resolveTabTarget(target, controls, backwards) {
    const position = (control) => target.compareDocumentPosition(control);
    if (backwards) {
        const before = controls.filter((control) => position(control) & Node.DOCUMENT_POSITION_PRECEDING && !control.contains(target));
        return before.at(-1) ?? controls.at(-1);
    }
    const after = controls.filter((control) => position(control) & Node.DOCUMENT_POSITION_FOLLOWING && !target.contains(control));
    return after[0] ?? controls[0];
}
/**
 * Tab and Shift+Tab inside an entered message cycle through its controls. This runs before the
 * controls' own handlers, so a composite inside (a toolbar) counts as its one tab stop.
 */
export function handleTranscriptTab(event, nav) {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey)
        return;
    const target = event.target;
    const owner = findOwner(target, event.currentTarget, nav.registry);
    if (!owner || target === owner.element)
        return;
    const next = resolveTabTarget(target, listTabbable(owner.element), event.shiftKey);
    if (!next)
        return;
    event.preventDefault();
    event.stopPropagation();
    next.focus();
}
/** Focus on a message makes it the tab stop; focus on a control inside also enters it. */
export function handleTranscriptFocus(event, nav) {
    const owner = findOwner(event.target, event.currentTarget, nav.registry);
    if (!owner)
        return;
    nav.tabbables.enter(event.target === owner.element ? null : owner.key);
    nav.onActiveChange(owner.key);
}
/** Focus leaving the feed takes the entered message's controls out of the tab order again. */
export function handleTranscriptBlur(event, nav) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next))
        return;
    nav.tabbables.enter(null);
    nav.onActiveChange(null);
}
//# sourceMappingURL=transcript-keyboard.js.map
/** Elements that can join the tab order. */
const TABBABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'button',
    'input',
    'select',
    'textarea',
    'iframe',
    'summary',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable="false"])',
    '[tabindex]',
].join(', ');
/** The message an element sits in (or is), searching up to the feed. */
export function findOwner(node, feed, registry) {
    for (let current = node; current && current !== feed; current = current.parentElement) {
        const key = registry.keyOf(current);
        if (key !== undefined && current instanceof HTMLElement)
            return { key, element: current };
    }
    return null;
}
/** The controls inside a message that Tab reaches, in document order. */
export function listTabbable(root) {
    return [...root.querySelectorAll(TABBABLE_SELECTOR)].filter((element) => element.tabIndex >= 0 &&
        !element.hasAttribute('disabled') &&
        element.closest('[hidden], [inert]') === null);
}
/**
 * Creates the manager. Each control it takes out of the tab order keeps its own `tabindex`, which
 * comes back when the reader enters the message; a control that renders or changes its `tabindex`
 * later is taken out again, so the transcript stays one tab stop.
 */
export function createTabbablesManager(registry) {
    const saved = new WeakMap();
    let entered = null;
    const disableOne = (element) => {
        const value = element.getAttribute('tabindex');
        if (value === '-1')
            return;
        saved.set(element, value);
        element.setAttribute('tabindex', '-1');
    };
    const disable = (root) => {
        for (const element of root.querySelectorAll(TABBABLE_SELECTOR))
            disableOne(element);
    };
    const enable = (root) => {
        for (const element of root.querySelectorAll(TABBABLE_SELECTOR)) {
            if (!saved.has(element))
                continue;
            const value = saved.get(element) ?? null;
            saved.delete(element);
            if (value === null)
                element.removeAttribute('tabindex');
            else
                element.setAttribute('tabindex', value);
        }
    };
    const withMessage = (key, act) => {
        const element = key === null ? null : registry.element(key);
        if (element)
            act(element);
    };
    const onMutation = (feed, record) => {
        const nodes = record.type === 'attributes' ? [record.target] : [...record.addedNodes];
        for (const node of nodes) {
            if (!(node instanceof Element))
                continue;
            const owner = findOwner(node, feed, registry);
            if (!owner || owner.key === entered)
                continue;
            if (node !== owner.element && node.matches(TABBABLE_SELECTOR))
                disableOne(node);
            if (record.type === 'childList')
                disable(node);
        }
    };
    return {
        entered: () => entered,
        enter(key) {
            if (key === entered)
                return;
            withMessage(entered, disable);
            entered = key;
            withMessage(key, enable);
        },
        observe(feed) {
            for (const child of feed.children) {
                const owner = findOwner(child, feed, registry);
                if (owner && owner.key !== entered)
                    disable(owner.element);
            }
            const view = feed.ownerDocument.defaultView;
            if (!view)
                return () => undefined;
            const observer = new view.MutationObserver((records) => {
                for (const record of records)
                    onMutation(feed, record);
            });
            observer.observe(feed, { subtree: true, childList: true, attributeFilter: ['tabindex'] });
            return () => observer.disconnect();
        },
    };
}
//# sourceMappingURL=transcript-tabbables.js.map
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, } from 'react';
import { isEmptyNode } from '../../utils/is-empty-node.js';
// Two contexts: publishing re-renders the outlets, never the components that publish.
const ProjectionActionsContext = createContext(null);
const ProjectionStateContext = createContext(null);
/** The slots a provider shares with its parent: every slot but its own, while it has a parent. */
function useSlotOwnership(slots, parent) {
    const slotList = slots?.join('\n');
    return useMemo(() => {
        if (slotList === undefined || !parent)
            return null;
        return new Set(slotList.split('\n'));
    }, [slotList, parent]);
}
/** Owns the named slots that `ProjectionContent` publishes to and `ProjectionOutlet` renders. */
export function ProjectionProvider({ slots, children }) {
    const parentActions = useContext(ProjectionActionsContext);
    const parentState = useContext(ProjectionStateContext);
    const owned = useSlotOwnership(slots, parentActions);
    const [ownState, setState] = useState(() => new Map());
    const publish = useCallback((slot, owner, content) => {
        setState((current) => {
            const entries = current.get(slot) ?? [];
            const index = entries.findIndex((entry) => entry.owner === owner);
            if (index >= 0 && entries[index]?.content === content)
                return current;
            const nextEntries = [...entries];
            if (index >= 0)
                nextEntries[index] = { content, owner };
            else
                nextEntries.push({ content, owner });
            const next = new Map(current);
            next.set(slot, nextEntries);
            return next;
        });
    }, []);
    const withdraw = useCallback((slot, owner) => {
        setState((current) => {
            const entries = current.get(slot);
            if (!entries?.some((entry) => entry.owner === owner))
                return current;
            const remaining = entries.filter((entry) => entry.owner !== owner);
            const next = new Map(current);
            if (remaining.length > 0)
                next.set(slot, remaining);
            else
                next.delete(slot);
            return next;
        });
    }, []);
    const actions = useMemo(() => {
        if (!owned || !parentActions)
            return { publish, withdraw };
        return {
            publish: (slot, owner, content) => (owned.has(slot) ? publish : parentActions.publish)(slot, owner, content),
            withdraw: (slot, owner) => (owned.has(slot) ? withdraw : parentActions.withdraw)(slot, owner),
        };
    }, [owned, parentActions, publish, withdraw]);
    // Outlets of the slots this provider does not own render the parent's content.
    const state = useMemo(() => {
        if (!owned || !parentState)
            return ownState;
        const merged = new Map(parentState);
        for (const slot of owned) {
            const entries = ownState.get(slot);
            if (entries)
                merged.set(slot, entries);
            else
                merged.delete(slot);
        }
        return merged;
    }, [owned, parentState, ownState]);
    return (_jsx(ProjectionActionsContext.Provider, { value: actions, children: _jsx(ProjectionStateContext.Provider, { value: state, children: children }) }));
}
/**
 * Declares content for a named slot. It renders nothing in place: the slot's outlet renders it.
 * Without a provider above, it renders its children in place.
 */
export function ProjectionContent({ slot, children }) {
    const actions = useContext(ProjectionActionsContext);
    const [owner] = useState(() => ({}));
    // Leaving the slot (unmount or a new slot name) withdraws the content.
    useLayoutEffect(() => {
        if (!actions)
            return undefined;
        return () => actions.withdraw(slot, owner);
    }, [actions, owner, slot]);
    // The first publish joins the top of the stack; later ones update in place.
    useLayoutEffect(() => {
        actions?.publish(slot, owner, children);
    }, [actions, owner, slot, children]);
    return actions ? null : _jsx(_Fragment, { children: children });
}
/**
 * The content of the most recently mounted `ProjectionContent` for `slot`, or `undefined` while the
 * slot has none, so a component can leave out the element that would hold it.
 */
export function useProjectedContent(slot) {
    const content = useContext(ProjectionStateContext)?.get(slot)?.at(-1)?.content;
    return isEmptyNode(content) ? undefined : content;
}
/** Renders the content of the most recently mounted `ProjectionContent` for its slot. */
export function ProjectionOutlet({ slot, fallback = null }) {
    const content = useProjectedContent(slot);
    return _jsx(_Fragment, { children: content ?? fallback });
}
//# sourceMappingURL=projection.js.map
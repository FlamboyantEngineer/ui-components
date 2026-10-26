import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { usePersistentState } from '../../core/provider.js';
import { PopoverPanel } from '../popover/popover.js';
import { TourPanel } from './tour-panel.js';
import { TourSpotlight } from './tour-spotlight.js';
import { useTourTarget } from './use-tour-target.js';
const hooks = createHooks('tour', ['arrow']);
/** The open state: the caller's when controlled, else our own, closed once the tour is completed. */
function useTourOpenState({ isOpen, defaultOpen = false, onOpenChange, persistKey, }) {
    const [isCompleted, setCompleted] = usePersistentState(persistKey, false);
    const [ownOpen, setOwnOpen] = useState(defaultOpen);
    const complete = () => {
        if (persistKey !== undefined)
            setCompleted(true);
        setOwnOpen(false);
        onOpenChange?.(false);
    };
    return { isOpen: isOpen ?? (ownOpen && isCompleted !== true), complete };
}
/**
 * The shown step: the caller's when controlled, else our own, back at `defaultStep` whenever the
 * tour is closed, however it closed.
 */
function useTourStep({ step, defaultStep = 0, onStepChange, isOpen, }) {
    const [ownStep, setOwnStep] = useState(defaultStep);
    if (!isOpen && step === undefined && ownStep !== defaultStep)
        setOwnStep(defaultStep);
    return {
        step: step ?? ownStep,
        moveTo: (next) => {
            if (step === undefined)
                setOwnStep(next);
            onStepChange?.(next);
        },
    };
}
/**
 * A guided sequence of steps, each a dialog floating against an element of the page with a
 * spotlight over that element. Modal by default: the rest of the page is inert until the reader
 * finishes or skips; `isNonModal` leaves it usable. With `persistKey`, a completed tour stays closed.
 */
export function Tour({ steps, step: stepProp, defaultStep, onStepChange, isOpen: isOpenProp, defaultOpen, onOpenChange, isNonModal = false, persistKey, onFinish, onSkip, id, className, ...rest }) {
    const open = useTourOpenState({ isOpen: isOpenProp, defaultOpen, onOpenChange, persistKey });
    const position = useTourStep({
        step: stepProp,
        defaultStep,
        onStepChange,
        isOpen: open.isOpen,
    });
    const index = Math.min(Math.max(0, Math.trunc(position.step) || 0), steps.length - 1);
    const current = steps[index];
    const isOpen = open.isOpen && current !== undefined;
    const target = useTourTarget(current?.target, isOpen);
    const [spotlight, setSpotlight] = useState(null);
    const anchor = target.element ?? spotlight;
    const anchorRef = useMemo(() => ({ current: anchor }), [anchor]);
    if (!isOpen)
        return null;
    const close = (onClose) => {
        open.complete();
        onClose();
    };
    return (_jsxs(_Fragment, { children: [_jsx(TourSpotlight, { target: target.element, element: spotlight, spotlightRef: setSpotlight }), target.isResolved && anchor ? (_jsx(PopoverPanel, { ...rest, ...hooks.root({ className, props: rest, data: { nonModal: isNonModal } }), isOpen: true, triggerRef: anchorRef, placement: current.placement ?? 'bottom', isNonModal: isNonModal, isKeyboardDismissDisabled: true, shouldCloseOnInteractOutside: () => false, arrowClassName: target.element ? hooks.slotClass('arrow') : undefined, children: _jsx(TourPanel, { id: id, step: index, count: steps.length, title: current.title, content: current.content, onBack: () => position.moveTo(index - 1), onNext: () => index === steps.length - 1 ? close(() => onFinish?.()) : position.moveTo(index + 1), onSkip: () => close(() => onSkip?.(index)) }, index) })) : null] }));
}
//# sourceMappingURL=tour.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useRef } from 'react';
import { useLocale } from '../../primitives/index.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useActiveAfter } from '../../utils/use-delayed-flag.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { Portal } from '../portal/portal.js';
import { ProgressBar, resolveProgressRange, } from '../progress-bar/progress-bar.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
import { useBlockedFocus } from './use-blocked-focus.js';
const cardHooks = createHooks('loading-card', [
    'header',
    'label',
    'value',
    'progress',
    'description',
    'footer',
    'hint',
    'step',
]);
const overlayHooks = createHooks('loading-overlay');
const regionHooks = createHooks('loading-region', ['content']);
function isMeasured(progress) {
    return progress !== undefined && !progress.isIndeterminate;
}
function isValidStep(step) {
    return (step !== undefined &&
        Number.isInteger(step.current) &&
        Number.isInteger(step.total) &&
        step.current > 0 &&
        step.current <= step.total);
}
/** The bounded share of measured progress that is done, from 0 to 1. */
function toRatio(progress) {
    const { value, minValue, maxValue } = resolveProgressRange(progress);
    return maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0;
}
/** The whole, locale-formatted percentage, hidden from assistive technology (the bar has it). */
function LoadingCardValue({ progress }) {
    const { locale } = useLocale();
    const percent = useMemo(() => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }), [locale]);
    return (_jsx("span", { ...cardHooks.slot('value'), "aria-hidden": "true", children: percent.format(toRatio(progress)) }));
}
/** The one progress bar, quiet, named by the progress label or else by the card's label. */
function LoadingCardBar({ progress, labelId, }) {
    const { 'aria-label': progressLabel, ...measured } = progress ?? {};
    const range = isMeasured(progress) ? measured : {};
    return (_jsx("div", { ...cardHooks.slot('progress'), "aria-live": "off", children: _jsx(ProgressBar, { ...range, isIndeterminate: !isMeasured(progress), size: "md", showValueLabel: false, ...(progressLabel ? { 'aria-label': progressLabel } : { 'aria-labelledby': labelId }) }) }));
}
/** The quiet footer pairing the hint with the step counter; nothing when both are absent. */
function LoadingCardFooter({ hint, step }) {
    const strings = useUiStrings();
    const stepLabel = isValidStep(step) ? strings.stepOfTotal(step.current, step.total) : null;
    if (isEmptyNode(hint) && stepLabel === null)
        return null;
    return (_jsxs("div", { ...cardHooks.slot('footer'), "aria-live": "off", children: [isEmptyNode(hint) ? null : (_jsx(TruncationTooltip, { className: cardHooks.slotClass('hint'), children: hint })), stepLabel === null ? null : _jsx("span", { ...cardHooks.slot('step'), children: stepLabel })] }));
}
/**
 * The loading status card: label, optional percentage, one progress bar, an optional description
 * and a footer pairing the current-work hint with a step counter. Only the label and description
 * are announced; progress, hint and step changes stay quiet.
 */
export function LoadingCard({ label, description, hint, progress, step, className, ...rest }) {
    const strings = useUiStrings();
    const labelId = useId();
    const isDeterminate = isMeasured(progress);
    return (_jsxs("div", { ...rest, ...cardHooks.root({ className, data: { determinate: isDeterminate } }), role: "status", "aria-live": "polite", children: [_jsxs("div", { ...cardHooks.slot('header'), children: [_jsx("p", { ...cardHooks.slot('label'), id: labelId, children: label ?? strings.loading }), isDeterminate ? _jsx(LoadingCardValue, { progress: progress }) : null] }), _jsx(LoadingCardBar, { progress: progress, labelId: labelId }), isEmptyNode(description) ? null : _jsx("p", { ...cardHooks.slot('description'), children: description }), _jsx(LoadingCardFooter, { hint: hint, step: step })] }));
}
/**
 * A cover for a positioned surface that is loading, with the status card centred on it. The
 * stylesheet stretches it over its positioned parent, or over the viewport when `fullscreen`; mount
 * it only while the work runs. With `delay` it shows only once the work has lasted that long.
 */
export function LoadingOverlay({ presentation = 'card', delay = 0, fullscreen = false, isEntering = false, isExiting = false, className, id, ref, ...rest }) {
    const isShown = useActiveAfter(true, delay);
    const isScrim = presentation === 'scrim';
    const [data, cardProps] = splitDataAttributes(rest);
    if (!isShown)
        return null;
    const hookData = { presentation, fullscreen, entering: isEntering, exiting: isExiting };
    const cover = (_jsx("div", { ...data, ...overlayHooks.root({ className, data: hookData }), id: id, ref: ref, "aria-hidden": isScrim || undefined, children: isScrim ? null : _jsx(LoadingCard, { ...cardProps }) }));
    return fullscreen ? _jsx(Portal, { layer: "modal", children: cover }) : cover;
}
/**
 * A bounded region that blocks its own content while loading: it is marked busy, its content is
 * inert (no pointer, focus or assistive-technology access) and a `LoadingOverlay` covers it; focus
 * that was in the content waits on the region and returns once loading ends. With
 * `delay` all of it waits until the work has lasted that long; the overlay stays mounted through its
 * exit transition (`useEnterExit`).
 */
export function LoadingRegion({ isLoading = false, delay = 0, children, className, id, ...rest }) {
    const isBlocked = useActiveAfter(isLoading, delay);
    const overlayRef = useRef(null);
    const { isMounted, isEntering, isExiting } = useEnterExit(overlayRef, isBlocked);
    const rootRef = useRef(null);
    const contentRef = useRef(null);
    useBlockedFocus({ rootRef, contentRef, isBlocked });
    const [data, overlayProps] = splitDataAttributes(rest);
    return (_jsxs("div", { ...data, ...regionHooks.root({ className, data: { loading: isBlocked } }), id: id, ref: rootRef, "aria-busy": isBlocked || undefined, tabIndex: isBlocked ? -1 : undefined, children: [_jsx("div", { ...regionHooks.slot('content'), ref: contentRef, inert: isBlocked || undefined, children: children }), isMounted ? (_jsx(LoadingOverlay, { ...overlayProps, ref: overlayRef, isEntering: isEntering, isExiting: isExiting })) : null] }));
}
//# sourceMappingURL=loading-overlay.js.map
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext, useId, useRef } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { ProjectionContent, ProjectionProvider, useProjectedContent, } from '../projection/projection.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
const hooks = createHooks('app-frame', [
    'skip-link',
    'top-bar',
    'navigation',
    'start-panel',
    'main',
    'bottom-panel',
    'end-panel',
    'status-bar',
]);
const regions = [
    'top-bar',
    'navigation',
    'start-panel',
    'end-panel',
    'bottom-panel',
    'status-bar',
];
/** The projection slot of a frame region or of a band slot, private to the frame's provider. */
export function toAppFrameSlot(name) {
    return `ui-app-frame:${name}`;
}
/** The band slots `AppFrameBandContent` fills. */
const appFrameBandSlots = ['leading', 'status', 'tools', 'actions'];
/** Every slot a frame's projection provider owns; other slots reach the provider above the frame. */
const appFrameSlots = [...regions, ...appFrameBandSlots].map(toAppFrameSlot);
const InsideAppFrameContext = createContext(false);
const leadingRegions = [
    { region: 'top-bar', element: 'header' },
    { region: 'navigation', element: 'div' },
    { region: 'start-panel', element: 'aside', panel: 'start' },
];
const trailingRegions = [
    { region: 'bottom-panel', element: 'aside', panel: 'bottom' },
    { region: 'end-panel', element: 'aside', panel: 'end' },
    { region: 'status-bar', element: 'footer' },
];
/** Each region's content: what a descendant projects into it, else the frame's own prop. */
function useRegionContents(own) {
    return {
        'top-bar': useProjectedContent(toAppFrameSlot('top-bar')) ?? own['top-bar'],
        navigation: useProjectedContent(toAppFrameSlot('navigation')) ?? own.navigation,
        'start-panel': useProjectedContent(toAppFrameSlot('start-panel')) ?? own['start-panel'],
        'end-panel': useProjectedContent(toAppFrameSlot('end-panel')) ?? own['end-panel'],
        'bottom-panel': useProjectedContent(toAppFrameSlot('bottom-panel')) ?? own['bottom-panel'],
        'status-bar': useProjectedContent(toAppFrameSlot('status-bar')) ?? own['status-bar'],
    };
}
/** One region around the main content: a landmark element on a page, a plain `<div>` embedded. */
function FrameRegion({ spec, content, isEmbedded, labels }) {
    const strings = useUiStrings();
    if (isEmptyNode(content))
        return null;
    const Element = isEmbedded ? 'div' : spec.element;
    const label = spec.panel && !isEmbedded
        ? (labels?.[spec.region] ?? strings.appFramePanel(spec.panel))
        : undefined;
    return (_jsx(Element, { ...hooks.slot(spec.region), "aria-label": label, children: content }));
}
/** The frame's regions, inside its projection provider so they render what descendants project. */
function AppFrameLayout({ children, className, labels, isEmbedded = false, label, own, ...rest }) {
    const strings = useUiStrings();
    const contents = useRegionContents(own);
    const mainId = `${useId()}-main`;
    // Typed as the narrower of the two elements the main region may be, so it fits both.
    const mainRef = useRef(null);
    const Main = isEmbedded ? 'div' : 'main';
    // Focus moves without touching the address, which a hash router may own.
    const skipToMain = (event) => {
        event.preventDefault();
        mainRef.current?.focus();
    };
    const renderRegion = (spec) => (_jsx(FrameRegion, { spec: spec, content: contents[spec.region], isEmbedded: isEmbedded, labels: labels }, spec.region));
    return (_jsxs("div", { ...rest, ...hooks.root({ className, data: { embedded: isEmbedded } }), role: isEmbedded ? 'group' : undefined, "aria-label": isEmbedded ? label : undefined, children: [_jsx(VisuallyHidden, { elementType: "span", isFocusable: true, children: _jsx("a", { ...hooks.slot('skip-link'), href: `#${mainId}`, onClick: skipToMain, children: strings.skipToMainContent }) }), leadingRegions.map(renderRegion), _jsx(Main, { ...hooks.slot('main'), ref: mainRef, id: mainId, tabIndex: -1, "aria-label": isEmbedded ? undefined : labels?.main, children: children }), trailingRegions.map(renderRegion)] }));
}
/**
 * The frame of an application: a top bar, side navigation, panels around the main content and a
 * status bar, each a landmark, with a skip link to the main content. Descendants fill its regions
 * through `AppFrameContent` and its band through `AppFrameBandContent`.
 */
export function AppFrame({ topBar, navigation, startPanel, endPanel, bottomPanel, statusBar, ...rest }) {
    const own = {
        'top-bar': topBar,
        navigation,
        'start-panel': startPanel,
        'end-panel': endPanel,
        'bottom-panel': bottomPanel,
        'status-bar': statusBar,
    };
    return (_jsx(ProjectionProvider, { slots: appFrameSlots, children: _jsx(InsideAppFrameContext.Provider, { value: true, children: _jsx(AppFrameLayout, { ...rest, own: own }) }) }));
}
/**
 * Whether an `AppFrame` is above, so frame content projects into it. Without one, frame content
 * renders in place, even below a projection provider of the host's own.
 */
export function useIsInsideAppFrame() {
    return useContext(InsideAppFrameContext);
}
/**
 * Fills a region of the nearest `AppFrame` from anywhere below it, in place of the region's own.
 * Without a frame above, it renders its children in place.
 */
export function AppFrameContent({ region, children }) {
    const slot = toAppFrameSlot(region);
    if (!useIsInsideAppFrame())
        return _jsx(_Fragment, { children: children });
    return _jsx(ProjectionContent, { slot: slot, children: children });
}
//# sourceMappingURL=app-frame.js.map
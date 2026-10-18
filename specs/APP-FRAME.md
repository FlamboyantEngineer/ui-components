# App Frame

`AppFrame` is the frame of an application: a bar along the top, side navigation at the inline start, panels beside and below the main content, and a status bar along the bottom, each a landmark, with a skip link to the main content. `AppFrameBand` is the command band that usually fills the top bar: a leading title or breadcrumb, a transient status, tools in a toolbar that scrolls, and trailing actions. Components anywhere below a frame fill its regions with `AppFrameContent` and its band with `AppFrameBandContent`, through [Projection](PROJECTION.md). The frame places no region itself: the stylesheet lays the regions out, for example as grid areas, and any content fills the panels, such as a docked panel component.

## UIC-APP-FRAME-1 - Frame

### UIC-APP-FRAME-1.1 - Regions

`AppFrame` shall render a `ui-app-frame` `<div>` holding, in this order, the skip link, `topBar` in the `ui-app-frame__top-bar` slot, `navigation` in `ui-app-frame__navigation`, `startPanel` in `ui-app-frame__start-panel`, the children in `ui-app-frame__main`, `bottomPanel` in `ui-app-frame__bottom-panel`, `endPanel` in `ui-app-frame__end-panel` and `statusBar` in `ui-app-frame__status-bar`. A region with no content (`null`, `undefined`, a boolean or an empty string) renders no element; the main region always renders. The order is the reading and Tab order: bars and navigation before the main content, panels after it.

Implementation: `src/components/app-frame/app-frame.tsx`
Verification: `src/components/app-frame/app-frame.test.tsx`, `e2e/app-frame.spec.ts`

### UIC-APP-FRAME-1.2 - Landmarks

A frame that is the page shall draw its regions as landmarks: the top bar is a `<header>` (`banner`), the main region a `<main>` (`main`) named by `labels.main` when given, each panel an `<aside>` (`complementary`) named by its entry in `labels` (`start-panel`, `end-panel`, `bottom-panel`) or the provider's `appFramePanel` string (`Start panel`, `End panel`, `Bottom panel`), and the status bar a `<footer>` (`contentinfo`). The navigation region is a `<div>`: its content, such as a [Navigation Rail](NAVIGATION-RAIL.md), is the `navigation` landmark.

Implementation: `src/components/app-frame/app-frame.tsx`, `src/core/common-strings.ts`
Verification: `src/components/app-frame/app-frame.test.tsx`

### UIC-APP-FRAME-1.3 - Skip link

The frame's first element shall be a link in the `ui-app-frame__skip-link` slot, labelled by the provider's `skipToMainContent` string (`Skip to main content`), inside a focusable [Visually Hidden](VISUALLY-HIDDEN.md) that shows it while it has focus. Its `href` points at the main region's generated `id`; activating it moves focus to the main region (`tabIndex="-1"`) without changing the page address, which a hash router may own.

Implementation: `src/components/app-frame/app-frame.tsx`, `src/core/common-strings.ts`
Verification: `src/components/app-frame/app-frame.test.tsx`, `e2e/app-frame.spec.ts`

### UIC-APP-FRAME-1.4 - Embedded frames

With `isEmbedded`, a frame that sits inside a page or another frame shall draw every region as a plain `<div>` with no landmark role or name, so it adds no second `main` or `banner` to the page, and its root becomes a `group` named by `label`, publishing `data-embedded`. The skip link stays and moves focus to the embedded main region.

Implementation: `src/components/app-frame/app-frame.tsx`
Verification: `src/components/app-frame/app-frame.test.tsx`, `e2e/app-frame.spec.ts`

### UIC-APP-FRAME-1.5 - Filling regions from below

`AppFrameContent` shall render nothing in place and fill the `region` (`top-bar`, `navigation`, `start-panel`, `end-panel`, `bottom-panel`, `status-bar`) of the nearest `AppFrame` above it, replacing the region's own content while it is mounted and has content; a region with only projected content renders while it has some. The frame owns a [Projection](PROJECTION.md#uic-projection-17---scoped-providers) provider scoped to its region and band slots, so other projection slots below it still reach a provider above the frame, and a frame inside another fills only its own regions. Without a frame above, `AppFrameContent` renders its children in place.

Implementation: `src/components/app-frame/app-frame.tsx`, `src/components/projection/projection.tsx`
Verification: `src/components/app-frame/app-frame.test.tsx`, `e2e/app-frame.spec.ts`

### UIC-APP-FRAME-1.6 - Hooks and caller attributes

`AppFrame` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/app-frame/app-frame.tsx`
Verification: `src/components/app-frame/app-frame.test.tsx`

## UIC-APP-FRAME-2 - Band

### UIC-APP-FRAME-2.1 - Parts

`AppFrameBand` shall render a `ui-app-frame-band` `<div>` with `role="group"`, named by `aria-label` or `aria-labelledby`, holding in order `leading` in the `ui-app-frame-band__leading` slot, `status` in `ui-app-frame-band__status`, the children (the tools, usually `ToolbarRowGroup`s) in `ui-app-frame-band__tools`, and `actions` in `ui-app-frame-band__actions`, a `group` named by `actionsLabel` or the provider's `actions` string (`Actions`). A part with no content renders no element. A [Save Status](SAVE-STATUS.md) in `status` announces itself.

Implementation: `src/components/app-frame/app-frame-band.tsx`, `src/core/common-strings.ts`
Verification: `src/components/app-frame/app-frame-band.test.tsx`, `e2e/app-frame.spec.ts`

### UIC-APP-FRAME-2.2 - Scrolling tools

The tools part shall be a [Toolbar Row](LAYOUT.md#uic-layout-38---toolbar-overflow) with `overflow="scroll"` and `justify="start"`, also carrying `ui-app-frame-band__tools`: the tools stay on one row in a `toolbar` named by `toolsLabel` or the provider's `tools` string (`Tools`), which scrolls with edge buttons when the band is narrow instead of wrapping, and arrow keys move focus between its tools.

Implementation: `src/components/app-frame/app-frame-band.tsx`, `src/components/layout/layout.tsx`
Verification: `src/components/app-frame/app-frame-band.test.tsx`, `e2e/app-frame.spec.ts`

### UIC-APP-FRAME-2.3 - Filling the band from below

`AppFrameBandContent` shall render nothing in place and fill the `slot` (`leading`, `status`, `tools`, `actions`) of the band of the nearest `AppFrame` above it, replacing the band's own content for that part while it is mounted and has content, as `AppFrameContent` fills a region (UIC-APP-FRAME-1.5). The content keeps the state and callbacks of the component that declares it, so a page deep in the frame owns its tools and actions.

Implementation: `src/components/app-frame/app-frame-band.tsx`, `src/components/projection/projection.tsx`
Verification: `src/components/app-frame/app-frame-band.test.tsx`, `e2e/app-frame.spec.ts`

### UIC-APP-FRAME-2.4 - Band hooks and caller attributes

`AppFrameBand` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/app-frame/app-frame-band.tsx`
Verification: `src/components/app-frame/app-frame-band.test.tsx`

## UIC-APP-FRAME-3 - Accessibility

### UIC-APP-FRAME-3.1 - Landmarks and keyboard

A page frame shall expose one `banner`, one `main`, one `contentinfo` and a named `complementary` landmark per panel, so a screen reader can move between them; the skip link is the first tab stop and bypasses the bars and the navigation. The frame adds no tab stop of its own besides the skip link, and the main region takes focus only programmatically. Every lab state passes axe in the light and dark reference themes.

Implementation: `src/components/app-frame/app-frame.tsx`, `src/components/app-frame/app-frame-band.tsx`
Verification: `src/components/app-frame/app-frame.test.tsx`, `e2e/app-frame.spec.ts`

## Hooks

| Hook                         | Kind  | Values | Description                                                 |
| ---------------------------- | ----- | ------ | ----------------------------------------------------------- |
| `ui-app-frame`               | root  |        | The frame's `<div>`.                                        |
| `ui-app-frame__skip-link`    | slot  |        | The link to the main content, visible while focused.        |
| `ui-app-frame__top-bar`      | slot  |        | The top bar (`<header>`, or `<div>` embedded).              |
| `ui-app-frame__navigation`   | slot  |        | The side navigation at the inline start (`<div>`).          |
| `ui-app-frame__start-panel`  | slot  |        | The panel before the main content (`<aside>`, or `<div>`).  |
| `ui-app-frame__main`         | slot  |        | The main content (`<main>`, or `<div>` embedded).           |
| `ui-app-frame__bottom-panel` | slot  |        | The panel below the main content (`<aside>`, or `<div>`).   |
| `ui-app-frame__end-panel`    | slot  |        | The panel at the inline end (`<aside>`, or `<div>`).        |
| `ui-app-frame__status-bar`   | slot  |        | The status bar (`<footer>`, or `<div>` embedded).           |
| `data-embedded`              | state | `true` | On the frame: it sits inside a page and draws no landmarks. |
| `ui-app-frame-band`          | root  |        | The band's `<div>` (`role="group"`).                        |
| `ui-app-frame-band__leading` | slot  |        | The leading title, breadcrumb or fields.                    |
| `ui-app-frame-band__status`  | slot  |        | The transient status.                                       |
| `ui-app-frame-band__tools`   | slot  |        | The scrolling tools toolbar (also `ui-toolbar-row`).        |
| `ui-app-frame-band__actions` | slot  |        | The trailing actions (`role="group"`).                      |

# Composition

How a caller composes its own elements with library components: swapping the element a component renders, merging props onto a part the caller builds, and filling a component's named parts through slot props. The element and prop composition helpers live in `src/utils/` and are exported from the package root; collection identity adapters stay internal. Every library component that offers one of these follows the contract here, so a host learns it once.

## UIC-COMPOSITION-1 - Element swapping

### UIC-COMPOSITION-1.1 - Components on building blocks

A library component built on a building block from `src/primitives/` that lets the caller swap its element shall declare `render` itself, typed `ElementRender<E, State>` with a state interface the library declares, and hand it to the building block. The building block calls it with the element's props, which already carry the library's hook classes and data attributes beside the states, handlers and ref, and with the component's state.

Implementation: `src/utils/render-element.ts`
Verification: `src/utils/render-element.test.tsx`

### UIC-COMPOSITION-1.2 - Library-owned elements

A library-owned element that the caller may swap shall take `render(props, state)`, typed `ElementRender<E, State>`, and render through `renderElement(type, props, { render, state })`: without `render` it renders `type` with `props`; with it, the caller returns one element of the same type with `props` and their `ref` spread on it, merging its own with `mergeProps`. `state` holds the states the component publishes. [Overflow List](OVERFLOW-LIST.md) applies it to its root.

Implementation: `src/utils/render-element.ts`, `src/components/overflow-list/overflow-list.tsx`
Verification: `src/utils/render-element.test.tsx`, `src/components/overflow-list/overflow-list.test.tsx`, `e2e/overflow-list.spec.ts`

## UIC-COMPOSITION-2 - Merging props

### UIC-COMPOSITION-2.1 - Props

`mergeProps(...props)` shall merge props objects left to right: handlers named `on` followed by a capital letter run in order and the last one's return value is kept, `className`s are joined with a space, `style` objects are merged property by property, refs are combined, and every other prop comes from the last object that sets it to something other than `undefined`.

Implementation: `src/utils/merge-props.ts`
Verification: `src/utils/merge-props.test.ts`

### UIC-COMPOSITION-2.2 - Refs

`mergeRefs(...refs)` shall return one callback ref that hands the element to every ref object and callback given, skips `null` and `undefined` ones, and on detach clears the objects, calls the callbacks with `null`, or runs the cleanup a React 19 callback ref returned instead. Components that keep their own ref beside the caller's `ref` merge them the same way, so a caller's callback ref cleanup runs once for each attachment when the element detaches, including the extra attachment of Strict Mode; none keeps its own ref-merging code.

Implementation: `src/utils/merge-props.ts`, `src/utils/use-forwarded-ref.ts`, `src/components/code-editor/use-code-surface.ts`, `src/components/context-menu/context-menu-target.ts`
Verification: `src/utils/merge-props.test.ts`, `src/utils/use-forwarded-ref.test.tsx`, `src/components/code-editor/code-editor.test.tsx`, `src/components/context-menu/context-menu-target.test.tsx`

### UIC-COMPOSITION-2.3 - ID reference lists

`joinIds(...ids)` shall join element ids into an ARIA reference list (`aria-describedby`, `aria-labelledby`, `aria-controls`), leaving out absent ids (`undefined`, `null`, `false`, `""`), and return `undefined` when none is left, so the attribute is not rendered. Components join ids through it rather than their own copies.

Implementation: `src/utils/join-ids.ts`
Verification: `src/utils/join-ids.test.ts`

### UIC-COMPOSITION-2.4 - Native props of containers

A component shall declare the native props it takes. Most list them one by one (`Pick<NativeProps<E>, …>`). A container whose spec says it forwards its element's native props (the layout primitives, `ScrollRegion`, `SplitView`, `FocusScope`, `OverflowList`, `TruncationTooltip` and `List`) takes them through `ContainerProps<E>`: every attribute, ARIA attribute and handler of the element except `dangerouslySetInnerHTML`, which would replace the content the component renders. No props interface reaches for React's `HTMLAttributes` types.

Implementation: `src/core/props.ts`
Verification: `test/public-types.test.ts`

## UIC-COMPOSITION-3 - Slots

### UIC-COMPOSITION-3.1 - Slot props

A component that lets the caller replace one of its named parts with its own content shall export a library part for each such slot (for example `CardTitle`), which takes the props the slot needs (its `id`, its hook class and a `ref` that tells the component the part rendered) from the component through a React context the library owns, and renders the part's element with them, merging the caller's `className` and `data-*` attributes. Outside its component a part renders its element without those props. Callers never assemble slot contexts, `slot` props or a building block's providers. [Card](CARD.md#uic-card-14---slotted-title-in-a-custom-header) applies it to the title and the action of a custom header (`CardTitle`, `CardAction`).

Implementation: `src/components/card/card-parts.tsx`, `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

## UIC-COMPOSITION-4 - Collection identity

### UIC-COMPOSITION-4.1 - Library-owned keyed siblings

Where a library component renders repeated elements itself, the React keys shall preserve the type of a caller's `Key`: numeric `1` and text `"1"` identify different elements, whose local state stays with them when reordered or removed. Public IDs and callback values retain the caller's original type. Internal compound identities shall encode their parts without delimiter collisions. Self-iterating key iterators retain their values across renders; reusable arrays and Sets continue to reflect caller mutations.

Implementation: `src/utils/to-key-identity.ts`, `src/utils/to-collection-key.ts`, `src/utils/from-collection-key.ts`, `src/utils/collection-selection.ts`, `src/utils/materialize-iterator.ts`, `src/utils/key-collection-children.tsx`, `src/utils/create-key-index.ts`
Verification: `src/utils/to-key-identity.test.ts`, `src/utils/to-collection-key.test.ts`, `src/utils/from-collection-key.test.ts`, `src/utils/collection-selection.test.ts`, `src/utils/materialize-iterator.test.ts`, `src/utils/create-key-index.test.ts`, `src/components/menu/menu.test.tsx`, `src/components/list-row/list-view.test.tsx`

### UIC-COMPOSITION-4.2 - Collection items behind a host component

A library collection item (`Tab`, `TabPanel`, `Tag`, `ListViewItem`, `ListViewSection`, `MenuItem`, `MenuSection`) shall encode its own `id` into the collection key it hands its building block, so that an item rendered through a host component that forwards its props (React Aria's reuse pattern), written as a child or returned for each of `items` (where the item's `key` or `id` stands in for a missing `id`), is addressed by its `id` like a direct child: selection, default selection, disabled keys, tab panels and every callback (`onAction`, `onSelectionChange`, `onRemove`, renames and moves) use the caller's `id` with its type. A host component that does not pass `id` on to the item leaves it without one. The collection key is opaque: React Aria writes it as the item's `data-key`, which is not the caller's `id` and is not for styling.

Implementation: `src/utils/to-collection-key.ts`, `src/utils/key-collection-children.tsx`, `src/components/tabs/tab.tsx`, `src/components/tabs/tabs.tsx`, `src/components/tag-group/tag-group.tsx`, `src/components/list-row/list-view.tsx`, `src/components/menu/menu-item.tsx`
Verification: `src/utils/to-collection-key.test.ts`, `src/components/tabs/tab-keys.test.tsx`, `src/components/tag-group/tag-group.test.tsx`, `src/components/list-row/list-view.test.tsx`, `src/components/menu/menu.test.tsx`

## UIC-COMPOSITION-5 - Controlled state

### UIC-COMPOSITION-5.1 - Controllable values

A value a component lets the caller control (`value`/`defaultValue` with `onChange`, or `<thing>`/`default<Thing>` with `on<Thing>Change`) shall follow the caller's value while it is defined and otherwise keep the component's own copy, starting at the default. Setting it updates the own copy only when uncontrolled, and calls the change handler only when the new value differs from the current one (`Object.is`), as React Aria's controlled state does, so setting the current value again reports nothing.

Implementation: `src/core/controllable-state.ts`
Verification: `src/core/controllable-state.test.ts`

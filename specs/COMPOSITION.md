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

`mergeRefs(...refs)` shall return one callback ref that hands the element to every ref object and callback given, skips `null` and `undefined` ones, and on detach clears the objects, calls the callbacks with `null`, or runs the cleanup a React 19 callback ref returned instead. Components that keep their own ref beside the caller's `ref` merge them the same way, so a caller's callback ref cleanup runs when the element detaches.

Implementation: `src/utils/merge-props.ts`, `src/utils/use-forwarded-ref.ts`
Verification: `src/utils/merge-props.test.ts`, `src/utils/use-forwarded-ref.test.tsx`

## UIC-COMPOSITION-3 - Slots

### UIC-COMPOSITION-3.1 - Slot props

A component that lets the caller replace one of its named parts with its own content shall export a library part for each such slot (for example `CardTitle`), which takes the props the slot needs (its `id`, its hook class and a `ref` that tells the component the part rendered) from the component through a React context the library owns, and renders the part's element with them, merging the caller's `className` and `data-*` attributes. Outside its component a part renders its element without those props. Callers never assemble slot contexts, `slot` props or a building block's providers. [Card](CARD.md#uic-card-14---slotted-title-in-a-custom-header) applies it to the title and the action of a custom header (`CardTitle`, `CardAction`).

Implementation: `src/components/card/card-parts.tsx`, `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

## UIC-COMPOSITION-4 - Collection identity

### UIC-COMPOSITION-4.1 - Library-owned keyed siblings

Where a library component renders repeated elements itself, the React keys shall preserve the type of a caller's `Key`: numeric `1` and text `"1"` identify different elements, whose local state stays with them when reordered or removed. Public IDs and callback values retain the caller's original type. Internal compound identities shall encode their parts without delimiter collisions. Self-iterating key iterators retain their values across renders; reusable arrays and Sets continue to reflect caller mutations.

Implementation: `src/utils/to-key-identity.ts`, `src/utils/to-collection-key.ts`, `src/utils/from-collection-key.ts`, `src/utils/collection-selection.ts`, `src/utils/materialize-iterator.ts`, `src/utils/encode-collection-children.tsx`, `src/utils/create-key-index.ts`
Verification: `src/utils/to-key-identity.test.ts`, `src/utils/to-collection-key.test.ts`, `src/utils/from-collection-key.test.ts`, `src/utils/collection-selection.test.ts`, `src/utils/materialize-iterator.test.ts`, `src/utils/create-key-index.test.ts`, `src/components/menu/menu.test.tsx`, `src/components/list-row/list-view.test.tsx`

## UIC-COMPOSITION-5 - Controlled state

### UIC-COMPOSITION-5.1 - Controllable values

A value a component lets the caller control (`value`/`defaultValue` with `onChange`, or `<thing>`/`default<Thing>` with `on<Thing>Change`) shall follow the caller's value while it is defined and otherwise keep the component's own copy, starting at the default. Setting it updates the own copy only when uncontrolled, and calls the change handler only when the new value differs from the current one (`Object.is`), as React Aria's controlled state does, so setting the current value again reports nothing.

Implementation: `src/core/controllable-state.ts`
Verification: `src/core/controllable-state.test.ts`

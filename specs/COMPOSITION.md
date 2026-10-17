# Composition

How a caller composes its own elements with library components: swapping the element a component renders, merging props onto a part the caller builds, and filling a component's named parts through slot props. The helpers live in `src/utils/` and are exported from the package root. Every library component that offers one of these follows the contract here, so a host learns it once.

## UIC-COMPOSITION-1 - Element swapping

### UIC-COMPOSITION-1.1 - React Aria components

A library component that wraps a React Aria component and lets the caller swap its element shall pass React Aria's own `render` prop through unchanged, rather than declaring one of its own. React Aria calls it with the element's props, which already carry the library's hook classes and data attributes beside React Aria's states, handlers and ref, and the component's render props as `state`.

Implementation: `src/utils/render-element.ts`
Verification: `src/utils/render-element.test.tsx`

### UIC-COMPOSITION-1.2 - Library-owned elements

A library-owned element that the caller may swap shall take `render(props, state)` with React Aria's contract, typed `ElementRender<E, State>`, and render through `renderElement(type, props, { render, state })`: without `render` it renders `type` with `props`; with it, the caller returns one element of the same type with `props` and their `ref` spread on it, merging its own with `mergeProps`. `state` holds the states the component publishes. [Overflow List](OVERFLOW-LIST.md) applies it to its root.

Implementation: `src/utils/render-element.ts`, `src/components/overflow-list/overflow-list.tsx`
Verification: `src/utils/render-element.test.tsx`, `src/components/overflow-list/overflow-list.test.tsx`, `e2e/overflow-list.spec.ts`

## UIC-COMPOSITION-2 - Merging props

### UIC-COMPOSITION-2.1 - Props

`mergeProps(...props)` shall merge props objects left to right: handlers named `on` followed by a capital letter run in order and the last one's return value is kept, `className`s are joined with a space, `style` objects are merged property by property, refs are combined, and every other prop comes from the last object that sets it to something other than `undefined`.

Implementation: `src/utils/merge-props.ts`
Verification: `src/utils/merge-props.test.ts`

### UIC-COMPOSITION-2.2 - Refs

`mergeRefs(...refs)` shall return one callback ref that hands the element to every ref object and callback given, skips `null` and `undefined` ones, and on detach clears the objects, calls the callbacks with `null`, or runs the cleanup a React 19 callback ref returned instead.

Implementation: `src/utils/merge-props.ts`
Verification: `src/utils/merge-props.test.ts`

## UIC-COMPOSITION-3 - Slots

### UIC-COMPOSITION-3.1 - Slot props

A component that lets the caller replace one of its named parts with its own content shall publish that part's props (its `id`, its hook class and a `ref` that tells the component the part rendered) through React Aria's slot contexts (`HeadingContext`, `TextContext`, `ButtonContext` and the others), under the part's slot name, with React Aria's `Provider`, and with an empty default slot so unslotted elements get nothing. React Aria components given that `slot`, and library components that wrap them, receive the props; a host component reads them with React Aria's `useSlottedContext` and spreads them on its element. [Card](CARD.md#uic-card-14---slotted-title-in-a-custom-header) applies it to the title of a custom header.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

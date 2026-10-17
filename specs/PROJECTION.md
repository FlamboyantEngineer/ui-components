# Projection

`ProjectionProvider`, `ProjectionContent` and `ProjectionOutlet` render content declared in one place of the React tree at a named outlet elsewhere under the same provider, without a DOM portal: a page can put its own tools in a shared toolbar, or a panel its actions in a shared footer, while keeping the state and callbacks of the component that declares them. The three components render no element of their own, so they have no hooks; the projected content renders exactly as it would in place.

## UIC-PROJECTION-1 - Slots

### UIC-PROJECTION-1.1 - Projected rendering

`ProjectionContent` shall render nothing where it is declared and publish its children to the slot named by `slot` in the nearest `ProjectionProvider`. Every `ProjectionOutlet` with that `slot` under the same provider shall render the published children in its place, with no wrapper element.

Implementation: `src/components/projection/projection.tsx`
Verification: `src/components/projection/projection.test.tsx`, `e2e/projection.spec.ts`

### UIC-PROJECTION-1.2 - Declaring component keeps ownership

Projected content shall keep the state and callbacks of the component that declares it: when that component updates, the outlet renders the new content, and state inside the projected content survives the update. Publishing re-renders the outlets only, never the declaring component.

Implementation: `src/components/projection/projection.tsx`
Verification: `src/components/projection/projection.test.tsx`, `e2e/projection.spec.ts`

### UIC-PROJECTION-1.3 - Fallback

`ProjectionOutlet` shall render its `fallback` while its slot has no content: before any `ProjectionContent` for it mounts, after the last one unmounts, and while the current one has no children.

Implementation: `src/components/projection/projection.tsx`
Verification: `src/components/projection/projection.test.tsx`, `e2e/projection.spec.ts`

### UIC-PROJECTION-1.4 - Several declarations for one slot

When several `ProjectionContent` elements publish to one slot, the outlet shall render the most recently mounted one. An update to an earlier one does not bring it to the top; when the top one unmounts, the outlet renders the previous one again. Changing `slot` moves the content to the new slot.

Implementation: `src/components/projection/projection.tsx`
Verification: `src/components/projection/projection.test.tsx`, `e2e/projection.spec.ts`

### UIC-PROJECTION-1.5 - Context at the outlet

Projected content shall render in the outlet's place in the React tree, so it reads React context from the outlet's ancestors, not from the declaring component's.

Implementation: `src/components/projection/projection.tsx`
Verification: `src/components/projection/projection.test.tsx`

### UIC-PROJECTION-1.6 - Without a provider

Without a `ProjectionProvider` above, `ProjectionContent` shall render its children in place and `ProjectionOutlet` its fallback, so a component that projects its tools still works in isolation.

Implementation: `src/components/projection/projection.tsx`
Verification: `src/components/projection/projection.test.tsx`

# Slot Registry

`createSlotRegistry` keeps the elements a component renders for its named slots (a field's control, a number box's prefix and suffix, the thumbs of a range) so the component can read them back after they commit, instead of querying its own markup for slot classes.

## UIC-SLOT-REGISTRY-1 - Registry

### UIC-SLOT-REGISTRY-1.1 - Stable ref callbacks

`ref(slot)` shall return a ref callback that publishes the slot's element, and the same function on every call for that slot, so React never detaches and re-attaches it between renders. `refAt(slot, index)` does the same for one occurrence of a repeated slot.

Implementation: `src/utils/slot-registry.ts`
Verification: `src/utils/slot-registry.test.ts`

### UIC-SLOT-REGISTRY-1.2 - Reading a slot

`read(slot)` shall return the slot's element from its commit until it unmounts and `null` otherwise, typed as the element type the caller names.

Implementation: `src/utils/slot-registry.ts`
Verification: `src/utils/slot-registry.test.ts`, `src/components/field/field.test.tsx`

### UIC-SLOT-REGISTRY-1.3 - Repeated slots

`readAll(slot)` shall return the committed occurrences of a repeated slot in index order, leaving out unmounted ones and other slots.

Implementation: `src/utils/slot-registry.ts`
Verification: `src/utils/slot-registry.test.ts`

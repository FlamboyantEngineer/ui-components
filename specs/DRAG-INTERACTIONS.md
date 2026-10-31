# Drag interactions

Internal helpers share pointer ownership, capture cleanup, native drag arming, item drop validation and drop-side geometry across the library. Components keep their own movement calculations, thresholds and commit policies. Collection reordering continues to use React Aria through the primitives.

## UIC-DRAG-INTERACTIONS-1 - Captured gestures

### UIC-DRAG-INTERACTIONS-1.1 - Starting

`usePointerDrag` shall start from a primary pointer's primary-button press only when enabled and its start callback returns gesture data. A refused press shall produce no move or end callbacks.

Implementation: `src/utils/use-pointer-drag.ts`
Verification: `src/utils/use-pointer-drag.test.tsx`

### UIC-DRAG-INTERACTIONS-1.2 - Pointer ownership

Only one pointer may own a gesture. Another pointer's press, move, release or cancellation shall not replace or finish it.

Implementation: `src/utils/use-pointer-drag.ts`
Verification: `src/utils/use-pointer-drag.test.tsx`

### UIC-DRAG-INTERACTIONS-1.3 - Ending

Release shall finish a gesture once; cancellation and lost capture shall finish it once as cancelled. Ending shall clear ownership before releasing capture, so a subsequent lost-capture event has no effect. Unmount or changing `isDisabled` to true shall release capture and abandon the gesture without an end callback. Disabling shall call the latest `onCancel` with the starting data once, after clearing ownership and capture, so a component can clear its preview; unmount shall call no callback. Re-enabling shall require a new press rather than resuming that gesture.

Changing a gesture's `resetKey` shall abandon it through the same cancellation cleanup, while allowing new presses in the new mode. A shared selection and editing surface uses this to discard an edit when its mode changes while keeping viewing gestures available.

Implementation: `src/utils/use-pointer-drag.ts`, `src/utils/pointer-drag.ts`
Verification: `src/utils/use-pointer-drag.test.tsx`

### UIC-DRAG-INTERACTIONS-1.4 - Deferred capture

A gesture may defer capture until its own threshold is crossed. Deferred capture shall have the same release and unmount cleanup as immediate capture.

Implementation: `src/utils/use-pointer-drag.ts`, `src/utils/pointer-drag.ts`
Verification: `src/utils/use-pointer-drag.test.tsx`

### UIC-DRAG-INTERACTIONS-1.5 - Current callbacks

An active gesture shall keep its starting data while invoking the callbacks from the latest render.

Implementation: `src/utils/use-pointer-drag.ts`
Verification: `src/utils/use-pointer-drag.test.tsx`

## UIC-DRAG-INTERACTIONS-2 - Native drag and drop

### UIC-DRAG-INTERACTIONS-2.1 - Arming

`armElementDrag` shall make an element draggable until pointer release or native drag end, clean up an earlier arming of the same element, and ignore pointer cancellation because a native drag cancels its pointer stream when it starts.

Implementation: `src/utils/pointer-drag.ts`
Verification: `src/utils/pointer-drag.test.tsx`

### UIC-DRAG-INTERACTIONS-2.2 - Uncaptured release

An uncaptured gesture shall listen in its element's own document, ignore a different pointer when an ID is supplied, and remove its release and cancellation listeners when it ends or its cleanup is called. Cancellation shall remain distinct from release.

Implementation: `src/utils/pointer-drag.ts`
Verification: `src/utils/pointer-drag.test.tsx`

### UIC-DRAG-INTERACTIONS-2.3 - Item moves

Tabs, board columns, editor steps and table columns shall share one native item drag implementation. It shall advertise a move and its media type, record and clear the dragged key, validate each landing against the latest move resolver, publish the accepted move's position, clear it on exit or drop, and report only accepted drops. A disabled tab may remain a drop target. The before and after halves shall follow orientation and reading direction.

Implementation: `src/utils/use-item-drag.ts`, `src/utils/pointer-drag.ts`, `src/utils/use-drag-type.ts`
Verification: `src/components/tabs/tab-reorder.test.tsx`, `src/components/board/board.test.tsx`, `src/components/step-list-editor/step-list-editor.test.tsx`, `src/components/table/use-column-reorder.test.tsx`

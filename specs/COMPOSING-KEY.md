# Composing Key

`isComposingKey` tells whether a key event belongs to an input method composition, so a host's own key handler leaves it to the input method as the library's controls do.

## UIC-COMPOSING-KEY-1 - Composition keys

### UIC-COMPOSING-KEY-1.1 - Keys an input method owns

`isComposingKey(event)` shall return `true` for a key event pressed while an input method composes (`isComposing`), or reported with key code 229, as some browsers report the Enter that confirms a candidate right after the composition ends; otherwise `false`. It takes a DOM `KeyboardEvent`, or any object with its `isComposing` and `keyCode` (`CompositionKey`), such as a React event's `nativeEvent`. Both are exported from the `./core` entry, as well as from the package root. A handler that commits on Enter or cancels on Escape returns early for such a key.

Implementation: `src/utils/is-composing-key.ts`, `src/utils/index.ts`, `src/core/index.ts`
Verification: `src/utils/is-composing-key.test.ts`

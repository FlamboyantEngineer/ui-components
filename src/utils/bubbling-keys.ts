/** A key event React Aria's keyboard hook hands a handler, which can let the key go on. */
interface PropagationControl {
  continuePropagation?: () => void;
}

type KeyHandler<E> = ((event: E) => void) | undefined;

/**
 * A caller's key handlers for a control built on React Aria's keyboard hook, which stops every key
 * a handler sees unless the handler lets it go on: wrapped, a key the handler does not stop goes on
 * to the page, as it would from a DOM handler, so Escape still closes the overlay around it.
 */
export function toBubblingKeyHandlers<E>(props: {
  onKeyDown?: KeyHandler<E>;
  onKeyUp?: KeyHandler<E>;
}): { onKeyDown: KeyHandler<E>; onKeyUp: KeyHandler<E> } {
  return { onKeyDown: bubble(props.onKeyDown), onKeyUp: bubble(props.onKeyUp) };
}

function bubble<E>(handler: KeyHandler<E>): KeyHandler<E> {
  if (!handler) return undefined;
  return (event) => {
    (event as PropagationControl).continuePropagation?.();
    handler(event);
  };
}

import { fireEvent } from '@testing-library/react';

/**
 * Presses the keys an input method sends while it composes in `input`: Enter and Escape during the
 * composition, then, after it ends, the Enter some browsers report with key code 229.
 */
export function pressComposingKeys(input: HTMLElement): void {
  // user-event cannot set isComposing or keyCode on a keydown.
  /* eslint-disable testing-library/prefer-user-event */
  fireEvent.compositionStart(input);
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
  fireEvent.keyDown(input, { key: 'Escape', isComposing: true });
  fireEvent.compositionEnd(input);
  fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
  /* eslint-enable testing-library/prefer-user-event */
}

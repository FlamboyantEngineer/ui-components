'use client';

// Focus containment, restoration and programmatic focus movement.

export { Focusable } from 'react-aria-components';
export {
  FocusScope,
  useFocusManager,
  useFocusRing,
  useFocusVisible,
  useFocusWithin,
} from 'react-aria';
// The props a trigger such as `PreviewTrigger` hands the focusable it wraps. The barrel does not
// export it. Initial pointer entry also needs the current input modality before it reaches a trigger.
export { FocusableContext } from 'react-aria/private/interactions/useFocusable';
export { getInteractionModality } from 'react-aria/private/interactions/useFocusVisible';

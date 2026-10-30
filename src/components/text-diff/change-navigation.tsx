// The Previous and Next buttons that move between the changes of a compare view: the text diff,
// the merge view and the redline compare.

import type { ComponentHooks } from '../../core/hooks.js';
import { Button } from '../button/button.js';

/** One of the two buttons: its name, whether there is a change to move to, and the move. */
interface ChangeNavigationMove {
  label: string;
  isDisabled: boolean;
  onPress: () => void;
}

interface ChangeNavigationProps {
  /** The compare view's hooks, which name the `navigation`, `previous` and `next` slots. */
  hooks: ComponentHooks<'navigation' | 'previous' | 'next'>;
  previous: ChangeNavigationMove;
  next: ChangeNavigationMove;
}

/** Previous and Next, as small icon buttons in the view's `navigation` slot. */
export function ChangeNavigation({ hooks, previous, next }: ChangeNavigationProps) {
  return (
    <span {...hooks.slot('navigation')}>
      <Button
        icon="chevron-up"
        size="sm"
        label={previous.label}
        className={hooks.slotClass('previous')}
        isDisabled={previous.isDisabled}
        onPress={previous.onPress}
      />
      <Button
        icon="chevron-down"
        size="sm"
        label={next.label}
        className={hooks.slotClass('next')}
        isDisabled={next.isDisabled}
        onPress={next.onPress}
      />
    </span>
  );
}

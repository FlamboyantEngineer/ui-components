import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton, type IconButtonProps } from '../icon-button/icon-button.js';

export interface FieldRestoreButtonProps extends Omit<
  IconButtonProps,
  'icon' | 'label' | 'preventFocusOnPress'
> {
  /** What the button restores, a field or a value; it is named `Restore <label>`. */
  label: string;
}

const hooks = createHooks('field-restore-button');

/**
 * The icon button that puts a committed value back. Pressing it with a pointer leaves focus on the
 * control being edited.
 */
export function FieldRestoreButton({ label, className, ...rest }: FieldRestoreButtonProps) {
  const strings = useUiStrings();
  return (
    <IconButton
      {...rest}
      {...hooks.root({ className, props: rest })}
      icon="restore"
      label={strings.restoreValue(label)}
      preventFocusOnPress
    />
  );
}

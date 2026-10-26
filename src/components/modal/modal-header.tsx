import { Heading } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import type { ModalProps } from './modal.js';

interface ModalHeaderProps extends Pick<
  ModalProps,
  'title' | 'description' | 'headerActions' | 'showCloseButton'
> {
  /** The description's id, which the dialog's `aria-describedby` names. */
  descriptionId: string;
  /** Disables the close button. */
  isDismissDisabled: boolean;
  onClose: () => void;
}

const hooks = createHooks('modal', [
  'header',
  'heading',
  'title',
  'description',
  'header-actions',
  'close',
]);

/** The header row: the title and description, caller content, then an optional close button. */
export function ModalHeader({
  title,
  description,
  descriptionId,
  headerActions,
  showCloseButton,
  isDismissDisabled,
  onClose,
}: ModalHeaderProps) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('header')}>
      <div {...hooks.slot('heading')}>
        <Heading slot="title" className={hooks.slotClass('title')}>
          {title}
        </Heading>
        {isEmptyNode(description) ? null : (
          <p {...hooks.slot('description')} id={descriptionId}>
            {description}
          </p>
        )}
      </div>
      {isEmptyNode(headerActions) ? null : (
        <div {...hooks.slot('header-actions')}>{headerActions}</div>
      )}
      {showCloseButton ? (
        <Button
          icon="close"
          label={strings.close}
          className={hooks.slotClass('close')}
          isDisabled={isDismissDisabled}
          onPress={onClose}
        />
      ) : null}
    </div>
  );
}

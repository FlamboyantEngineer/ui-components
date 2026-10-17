import { VisuallyHidden } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useClipboard, type CopyStatus } from '../../utils/use-clipboard.js';
import { IconButton, type IconButtonProps } from '../icon-button/icon-button.js';

export interface CopyButtonProps
  extends Pick<IconButtonProps, 'variant' | 'size' | 'isDisabled'>, BaseProps {
  /** The text to copy, exactly as given. */
  value: string;
  /** Names the button. Defaults to the provider's `copy` string. */
  label?: string | undefined;
  /** How long the copied or failed state lasts, in milliseconds. Defaults to 2000. */
  timeout?: number | undefined;
  /** Called after each copy with whether the text reached the clipboard. */
  onCopy?: ((copied: boolean) => void) | undefined;
}

const hooks = createHooks('copy-button', ['button', 'status']);

const statusGlyphs = { idle: 'copy', copied: 'check', failed: 'error' } as const;

/**
 * An icon button that copies `value` to the clipboard, shows a check mark (or an error glyph)
 * while the outcome lasts, and announces it in a polite live region.
 */
export function CopyButton({
  value,
  label,
  timeout,
  onCopy,
  variant,
  size,
  isDisabled,
  className,
  id,
  ...rest
}: CopyButtonProps) {
  const strings = useUiStrings();
  const { copy, status } = useClipboard({ timeout });
  const announcements: Record<CopyStatus, string> = {
    idle: '',
    copied: strings.copied,
    failed: strings.copyFailed,
  };

  return (
    <span
      {...hooks.root({ className, props: rest })}
      // Absent states stay absent: a caller attribute of the same name never shows through.
      data-copied={status === 'copied' ? 'true' : undefined}
      data-failed={status === 'failed' ? 'true' : undefined}
      id={id}
    >
      <IconButton
        className={hooks.slotClass('button')}
        icon={statusGlyphs[status]}
        label={label ?? strings.copy}
        variant={variant}
        size={size}
        isDisabled={isDisabled}
        onPress={async () => {
          const copied = await copy(value);
          onCopy?.(copied);
        }}
      />
      <VisuallyHidden elementType="span" className={hooks.slotClass('status')} role="status">
        {announcements[status]}
      </VisuallyHidden>
    </span>
  );
}

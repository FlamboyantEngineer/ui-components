'use client';

import { CheckGlyph, CopyGlyph, ErrorGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { REANNOUNCE_MARK } from '../../utils/reannounce.js';
import { type CopyStatus, useClipboard } from '../../utils/use-clipboard.js';
import { useLatestSettledCount } from '../../utils/use-latest-settled-count.js';
import {
  Button,
  buttonDefaults,
  type ButtonProps,
  useInheritedDisabled,
} from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

export interface CopyButtonProps
  extends
    Pick<ButtonProps, 'variant' | 'size' | 'isDisabled'>,
    BaseProps,
    RefProps<HTMLSpanElement> {
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

const statusGlyphs = { idle: CopyGlyph, copied: CheckGlyph, failed: ErrorGlyph } as const;

/**
 * An icon button that copies `value` to the clipboard, shows a check mark (or an error glyph)
 * while the outcome lasts, and announces it in a polite live region. The root publishes the
 * button's resolved variant, size and disabled state, as the button does.
 */
export function CopyButton({
  value,
  label,
  timeout,
  onCopy,
  variant = buttonDefaults.iconVariant,
  size = buttonDefaults.size,
  isDisabled: isDisabledProp,
  className,
  id,
  ref,
  ...rest
}: CopyButtonProps) {
  const strings = useUiStrings();
  const isDisabled = useInheritedDisabled({ isDisabled: isDisabledProp });
  const { copy, status } = useClipboard({ timeout });
  // Counts the latest press's settled copies: a repeated outcome still changes the live region, so
  // it is announced, and an earlier copy that settles later announces nothing.
  const [settled, startCopy] = useLatestSettledCount();
  const announcements: Record<CopyStatus, string> = {
    idle: '',
    copied: strings.copied,
    failed: strings.copyFailed,
  };

  return (
    <span
      {...hooks.root({
        className,
        props: rest,
        data: {
          variant,
          size,
          disabled: isDisabled,
          copied: status === 'copied',
          failed: status === 'failed',
        },
      })}
      id={id}
      ref={ref}
    >
      <Button
        className={hooks.slotClass('button')}
        icon={statusGlyphs[status]}
        label={label ?? strings.copy}
        variant={variant}
        size={size}
        isDisabled={isDisabled}
        onPress={(event) => {
          // Each press starts a write, in the button's own window; the clipboard hook owns which
          // result stays visible.
          const settle = startCopy();
          void copy(value, event.target).then((copied) => {
            settle();
            onCopy?.(copied);
          });
        }}
      />
      <VisuallyHidden as="span" className={hooks.slotClass('status')} role="status">
        {announcements[status]}
        {status !== 'idle' && settled % 2 === 0 ? REANNOUNCE_MARK : null}
      </VisuallyHidden>
    </span>
  );
}

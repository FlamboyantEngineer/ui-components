'use client';

import { CheckGlyph, CopyGlyph, ErrorGlyph } from '../../core/glyphs.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useClipboard, type CopyStatus } from '../../utils/use-clipboard.js';
import { useLatestSettledCount } from '../../utils/use-latest-settled-count.js';
import { Button, type ButtonProps } from '../button/button.js';

export interface CopyButtonProps
  extends Pick<ButtonProps, 'variant' | 'size' | 'isDisabled'>, BaseProps {
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
        data: { copied: status === 'copied', failed: status === 'failed' },
      })}
      id={id}
    >
      <Button
        className={hooks.slotClass('button')}
        icon={statusGlyphs[status]}
        label={label ?? strings.copy}
        variant={variant}
        size={size}
        isDisabled={isDisabled}
        onPress={() => {
          // Each press starts a write; the clipboard hook owns which result stays visible.
          const settle = startCopy();
          void copy(value).then((copied) => {
            settle();
            onCopy?.(copied);
          });
        }}
      />
      <VisuallyHidden elementType="span" className={hooks.slotClass('status')} role="status">
        {announcements[status]}
        {status !== 'idle' && settled % 2 === 0 ? '\u200b' : null}
      </VisuallyHidden>
    </span>
  );
}

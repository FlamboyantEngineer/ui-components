import { ChevronDownGlyph } from '../../core/glyphs.js';
// The button every compact composer control draws: its icon and label, or its icon alone while the
// composer is compact (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-6.4).

import type { ReactNode } from 'react';
import { Button, type ButtonProps } from '../button/button.js';
import type { IconSource } from '../icon/icon.js';
import { useMessageComposerControls } from './composer-controls.js';

interface ComposerControlButtonProps extends Omit<
  ButtonProps,
  'variant' | 'size' | 'icon' | 'startIcon' | 'endIcon' | 'label' | 'tooltip' | 'children'
> {
  /** Drawn before the label. */
  icon: IconSource | undefined;
  /** Drawn alone while the composer is compact. Defaults to `icon`. */
  compactIcon?: IconSource;
  /** The accessible name, and the tooltip while the composer is compact. */
  name: string;
  /** Ends the button with a chevron, for a control that opens a menu. */
  hasMenu?: boolean | undefined;
  /** The label shown while the composer is not compact. */
  children: ReactNode;
}

/**
 * A small ghost button among the composer's controls, disabled with the composer: its icon and label,
 * or, while the composer is compact, its icon alone, named and hinted by `name`.
 */
export function ComposerControlButton({
  icon,
  compactIcon = icon,
  name,
  hasMenu = false,
  isDisabled = false,
  children,
  ...props
}: ComposerControlButtonProps) {
  const composer = useMessageComposerControls();
  const button = {
    ...props,
    variant: 'ghost',
    size: 'sm',
    isDisabled: isDisabled || composer.isDisabled,
  } as const;
  if (composer.isCompact)
    return <Button {...button} icon={compactIcon} label={name} tooltip={name} />;
  return (
    <Button
      {...button}
      startIcon={icon}
      endIcon={hasMenu ? ChevronDownGlyph : undefined}
      aria-label={name}
    >
      {children}
    </Button>
  );
}

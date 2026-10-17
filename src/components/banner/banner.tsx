import { isValidElement, type ReactNode } from 'react';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import { Icon } from '../icon/icon.js';

export type BannerTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BannerProps {
  /** The message's tone; it also chooses the announcement. Defaults to `neutral`. */
  tone?: BannerTone | undefined;
  /** A short summary before the description. */
  title?: ReactNode;
  /** The message itself: text or rich content. */
  description?: ReactNode;
  /** Controls for the reader's next step, after the message. */
  actions?: ReactNode;
  /** A built-in glyph name or icon node. Omit for the tone's glyph; `null` draws none. */
  icon?: GlyphName | ReactNode;
  /** Draws a dismiss button that calls this once per activation. */
  onDismiss?: (() => void) | undefined;
  /** Names the dismiss button. Defaults to the provider's `dismiss` string. */
  dismissLabel?: string | undefined;
  /** Work is in progress: a decorative spinner replaces the glyph and the region is busy. */
  isPending?: boolean | undefined;
  /** The banner is on its way out; publishes `data-exiting` for an exit transition. */
  isExiting?: boolean | undefined;
  /** Render as phrasing content (`<span>`s) for a message set inside running text. */
  inline?: boolean | undefined;
  id?: string | undefined;
  hidden?: boolean | undefined;
  className?: string | undefined;
  'aria-label'?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('banner', [
  'icon',
  'spinner',
  'content',
  'title',
  'description',
  'actions',
  'dismiss',
]);

const toneGlyphs: Record<BannerTone, GlyphName | null> = {
  neutral: null,
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

function isGlyphName(icon: unknown): icon is GlyphName {
  return typeof icon === 'string' && !isValidElement(icon);
}

function present(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

/**
 * An inline message about the state of a surface, with optional actions and dismissal.
 * Danger banners are assertive alerts; every other tone is a polite status.
 */
export function Banner({
  tone = 'neutral',
  title,
  description,
  actions,
  icon,
  onDismiss,
  dismissLabel,
  isPending = false,
  isExiting = false,
  inline = false,
  id,
  hidden,
  className,
  'aria-label': ariaLabel,
  ...rest
}: BannerProps) {
  const strings = useUiStrings();
  const Part = inline ? 'span' : 'div';
  const urgent = tone === 'danger';
  const glyph = icon === undefined ? toneGlyphs[tone] : icon;

  return (
    <Part
      {...hooks.root({
        className,
        props: rest,
        data: { tone, inline, pending: isPending, exiting: isExiting },
      })}
      id={id}
      hidden={hidden}
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
      aria-atomic="true"
      aria-busy={isPending || undefined}
      aria-label={ariaLabel}
    >
      {isPending ? (
        <span {...hooks.slot('spinner')} aria-hidden="true" />
      ) : isGlyphName(glyph) ? (
        <Icon glyph={glyph} className={hooks.slotClass('icon')} />
      ) : present(glyph) ? (
        <Icon className={hooks.slotClass('icon')}>{glyph}</Icon>
      ) : null}
      <Part {...hooks.slot('content')}>
        {present(title) ? <Part {...hooks.slot('title')}>{title}</Part> : null}
        {present(description) ? <Part {...hooks.slot('description')}>{description}</Part> : null}
      </Part>
      {present(actions) ? <Part {...hooks.slot('actions')}>{actions}</Part> : null}
      {onDismiss ? (
        <IconButton
          icon="close"
          label={dismissLabel ?? strings.dismiss}
          size="sm"
          className={hooks.slotClass('dismiss')}
          onPress={() => onDismiss()}
        />
      ) : null}
    </Part>
  );
}

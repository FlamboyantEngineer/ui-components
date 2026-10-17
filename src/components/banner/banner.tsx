import type { ReactNode } from 'react';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { IconButton } from '../icon-button/icon-button.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';

export type BannerTone = Tone;

export interface BannerProps extends BaseProps, Pick<NativeProps<'div'>, 'hidden' | 'aria-label'> {
  /** The message's tone; it also chooses the announcement. Defaults to `neutral`. */
  tone?: BannerTone | undefined;
  /** A short summary before the description. */
  title?: ReactNode;
  /** The message itself: text or rich content. */
  description?: ReactNode;
  /** Controls for the reader's next step, after the message. */
  actions?: ReactNode;
  /** A built-in glyph name or icon node. Omit for the tone's glyph; `null` draws none. */
  icon?: IconSource;
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

const toneGlyphs: Readonly<Record<Tone, GlyphName | null>> = {
  neutral: null,
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

type BannerSlot = Parameters<typeof hooks.slot>[0];

/** A slot that renders only when its content renders something. */
function BannerPart({
  as: Element,
  slot,
  children,
}: {
  as: 'div' | 'span';
  slot: BannerSlot;
  children: ReactNode;
}) {
  return isEmptyNode(children) ? null : <Element {...hooks.slot(slot)}>{children}</Element>;
}

/** The decorative lead: a spinner while pending, else the icon, if any. */
function BannerLead({ icon, isPending }: { icon: IconSource; isPending: boolean }) {
  if (isPending) return <span {...hooks.slot('spinner')} aria-hidden="true" />;
  if (isEmptyNode(icon)) return null;
  return <Icon {...toIconProps(icon)} className={hooks.slotClass('icon')} />;
}

function BannerDismiss({
  label,
  onDismiss,
}: {
  label?: string | undefined;
  onDismiss: () => void;
}) {
  const strings = useUiStrings();
  return (
    <IconButton
      icon="close"
      label={label ?? strings.dismiss}
      size="sm"
      className={hooks.slotClass('dismiss')}
      onPress={() => onDismiss()}
    />
  );
}

/** The built-in glyph that introduces a message of `tone`; none for `neutral`. */
export function getToneGlyph(tone: Tone): GlyphName | null {
  return toneGlyphs[tone];
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
  className,
  ...rest
}: BannerProps) {
  const Element = inline ? 'span' : 'div';
  const isUrgent = tone === 'danger';
  const data = { tone, inline, pending: isPending, exiting: isExiting };

  return (
    <Element
      {...rest}
      {...hooks.root({ className, data })}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
      aria-atomic="true"
      aria-busy={isPending || undefined}
    >
      <BannerLead icon={icon === undefined ? getToneGlyph(tone) : icon} isPending={isPending} />
      <Element {...hooks.slot('content')}>
        <BannerPart as={Element} slot="title">
          {title}
        </BannerPart>
        <BannerPart as={Element} slot="description">
          {description}
        </BannerPart>
      </Element>
      <BannerPart as={Element} slot="actions">
        {actions}
      </BannerPart>
      {onDismiss ? <BannerDismiss label={dismissLabel} onDismiss={onDismiss} /> : null}
    </Element>
  );
}

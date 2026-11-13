'use client';

import { type ReactNode, type Ref, useEffect, useRef } from 'react';
import { CloseGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, RefProps, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getToneGlyph } from '../../core/tone-glyphs.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { Button } from '../button/button.js';
import { Icon, type IconSource, toIconProps } from '../icon/icon.js';

export interface BannerProps
  extends BaseProps, Pick<NativeProps<'div'>, 'hidden' | 'aria-label'>, RefProps<HTMLElement> {
  /** The message's tone; it also chooses the announcement. Defaults to `neutral`. */
  tone?: Tone | undefined;
  /** A short summary before the description. */
  title?: ReactNode;
  /** The message itself: text or rich content. */
  description?: ReactNode;
  /** Controls for the reader's next step, after the message. */
  actions?: ReactNode;
  /** An imported icon component or rendered element. Omit for the tone's glyph; `null` draws none. */
  icon?: IconSource;
  /** Draws a dismiss button that calls this once per activation. */
  onDismiss?: (() => void) | undefined;
  /** Names the dismiss button. Defaults to the provider's `dismiss` string. */
  dismissLabel?: string | undefined;
  /** Work is in progress: a decorative spinner replaces the glyph and the region is busy. */
  isPending?: boolean | undefined;
  /** The banner has just appeared; publishes `data-entering` for an enter animation. */
  isEntering?: boolean | undefined;
  /** The banner is on its way out; publishes `data-exiting` for an exit transition. */
  isExiting?: boolean | undefined;
  /** Render as phrasing content (`<span>`s) for a message set inside running text. */
  inline?: boolean | undefined;
  /** Move focus to the banner when it first renders, so keyboard users land on a critical message. */
  autoFocus?: boolean | undefined;
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
  if (!icon) return null;
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
    <Button
      icon={CloseGlyph}
      label={label ?? strings.dismiss}
      size="sm"
      className={hooks.slotClass('dismiss')}
      onPress={() => onDismiss()}
    />
  );
}

/** Focuses the element once, when it first renders with `autoFocus`. */
function useFocusOnMount(ref: { current: HTMLElement | null }, autoFocus: boolean) {
  const shouldFocus = useRef(autoFocus);
  useEffect(() => {
    if (shouldFocus.current) ref.current?.focus();
  }, [ref]);
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
  isEntering = false,
  isExiting = false,
  inline = false,
  autoFocus = false,
  className,
  ref,
  'aria-label': ariaLabel,
  ...rest
}: BannerProps) {
  const [own, setRef] = useForwardedRef<HTMLElement>(ref);
  useFocusOnMount(own, autoFocus);
  const Element = inline ? 'span' : 'div';
  const isUrgent = tone === 'danger';
  const data = { tone, inline, pending: isPending, entering: isEntering, exiting: isExiting };

  return (
    <Element
      {...rest}
      // The root is a `<div>` or a `<span>`; either is the `HTMLElement` the caller's ref expects.
      ref={setRef as Ref<HTMLDivElement>}
      {...hooks.root({ className, data })}
      tabIndex={autoFocus ? -1 : undefined}
      aria-busy={isPending || undefined}
    >
      <BannerLead icon={icon === undefined ? getToneGlyph(tone) : icon} isPending={isPending} />
      {/* Only the title and description are the live region: the actions and dismiss are not read. */}
      <Element
        {...hooks.slot('content')}
        role={isUrgent ? 'alert' : 'status'}
        aria-live={isUrgent ? 'assertive' : 'polite'}
        aria-atomic="true"
        aria-label={ariaLabel}
      >
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

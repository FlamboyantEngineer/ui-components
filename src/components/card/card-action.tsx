// The whole-card action: the card's title is a link or a button, and a click anywhere on the card
// that is not meant for an inner control or a text selection activates it.

import {
  useMemo,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefCallback,
} from 'react';
import {
  Button as AriaButton,
  ButtonContext,
  DEFAULT_SLOT,
  LinkContext,
  Provider,
} from '../../primitives/index.js';
import { UiLink } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';

/** What the whole card does when it is pressed: follow `href`, or run `onAction`. */
export interface CardActionOptions {
  /** Makes the card a link to this address; its title is the link. */
  href?: string | undefined;
  /** The link's target. `_blank` adds `rel="noopener noreferrer"` unless `rel` is given. */
  target?: string | undefined;
  /** The link's relationship to the current page. */
  rel?: string | undefined;
  /** Makes the card a press target; its title is the button. With `href`, runs when the link is followed. */
  onAction?: (() => void) | undefined;
}

export interface CardAction {
  /** Whether the card has an action. */
  isActionable: boolean;
  /** Receives the action element, whether the card drew it or a custom header slotted it. */
  actionRef: RefCallback<HTMLElement>;
  /** The card root's click handler that forwards stray clicks to the action. */
  onClick: (event: ReactMouseEvent<HTMLElement>) => void;
}

/** Elements that own their clicks: a click inside one never reaches the card's action. */
const controlSelector = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'label',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function hasCardAction({ href, onAction }: CardActionOptions): boolean {
  return href !== undefined || onAction !== undefined;
}

function toLinkRel({ target, rel }: CardActionOptions): string | undefined {
  return rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);
}

/** Whether a click on `target` was meant for the card: not for an inner control or a text selection. */
function isCardClick(target: Element, card: Element): boolean {
  const control = target.closest(controlSelector);
  if (control && card.contains(control)) return false;
  const selection = card.ownerDocument.getSelection();
  return !selection || selection.isCollapsed || !card.contains(selection.anchorNode);
}

/** Repeats a click on the action element, with the same button and modifier keys. */
function repeatClick(action: HTMLElement, event: ReactMouseEvent<HTMLElement>) {
  const View = action.ownerDocument.defaultView?.MouseEvent ?? MouseEvent;
  const { button, ctrlKey, metaKey, shiftKey, altKey } = event;
  action.dispatchEvent(
    new View('click', {
      bubbles: true,
      cancelable: true,
      button,
      ctrlKey,
      metaKey,
      shiftKey,
      altKey,
    }),
  );
}

/** The action element the card registers, and the root click handler that forwards to it. */
export function useCardAction(options: CardActionOptions): CardAction {
  const action = useRef<HTMLElement | null>(null);
  const isActionable = hasCardAction(options);
  const actionRef = useMemo(() => mergeRefs<HTMLElement>(action), []);
  const onClick = (event: ReactMouseEvent<HTMLElement>) => {
    const element = action.current;
    if (!isActionable || !element || event.defaultPrevented) return;
    if (!(event.target instanceof Element) || element.contains(event.target)) return;
    if (isCardClick(event.target, event.currentTarget)) repeatClick(element, event);
  };
  return { isActionable, actionRef, onClick };
}

/** The title drawn as the card's action: a link through the provider's renderer, or a button. */
export function CardActionTitle({
  options,
  actionRef,
  className,
  children,
}: {
  options: CardActionOptions;
  actionRef: RefCallback<HTMLElement>;
  className: string;
  children: ReactNode;
}) {
  const { href, target, onAction } = options;
  if (href !== undefined) {
    return (
      <UiLink
        ref={actionRef}
        href={href}
        target={target}
        rel={toLinkRel(options)}
        className={className}
        onClick={() => onAction?.()}
      >
        {children}
      </UiLink>
    );
  }
  return (
    <AriaButton ref={actionRef} className={className} onPress={() => onAction?.()}>
      {children}
    </AriaButton>
  );
}

/**
 * Hands a custom header's `slot="action"` React Aria `Link` (for `href`) or `Button` (for
 * `onAction`) the action's props, its hook class and the card's ref.
 */
export function CardActionSlots({
  options,
  actionRef,
  className,
  children,
}: {
  options: CardActionOptions;
  actionRef: RefCallback<HTMLElement>;
  className: string;
  children: ReactNode;
}) {
  const { href, target, onAction } = options;
  const shared = { className, ref: actionRef };
  const link =
    href === undefined
      ? {}
      : { ...shared, href, target, rel: toLinkRel(options), onPress: onAction };
  const button = href === undefined && onAction ? { ...shared, onPress: onAction } : {};
  return (
    <Provider
      values={[
        [LinkContext, { slots: { [DEFAULT_SLOT]: {}, action: link } }],
        [ButtonContext, { slots: { [DEFAULT_SLOT]: {}, action: button } }],
      ]}
    >
      {children}
    </Provider>
  );
}

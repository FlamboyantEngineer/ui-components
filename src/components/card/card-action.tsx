'use client';

// The whole-card action: the card's title is a link or a button, and a click anywhere on the card
// that is not meant for an inner control or a text selection activates it.

import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefCallback,
} from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { UiLink } from '../../core/provider.js';
import { isElement, isHTMLElement } from '../../utils/is-element.js';
import { mergeSafeRel } from '../../utils/merge-safe-rel.js';

/** What the whole card does when it is pressed: follow `href`, or run `onAction`. */
export interface CardActionOptions {
  /** Makes the card a link to this address; its title is the link. */
  href?: string | undefined;
  /** The link's target. `_blank` adds `noopener` and `noreferrer` to `rel`. */
  target?: string | undefined;
  /** The link's relationship to the current page. */
  rel?: string | undefined;
  /** Makes the card a press target; its title is the button. With `href`, runs when the link is followed. */
  onAction?: (() => void) | undefined;
}

interface CardAction {
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
  // Widgets own their clicks even as a roving item that is not a tab stop.
  ...[
    'button',
    'link',
    'checkbox',
    'switch',
    'radio',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'tab',
    'treeitem',
    'gridcell',
    'slider',
    'spinbutton',
    'scrollbar',
    'textbox',
    'searchbox',
    'combobox',
  ].map((role) => `[role="${role}"]`),
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Clicks an actionable card has claimed, so the cards around it leave them alone. */
const claimedClicks = new WeakSet<Event>();

function hasCardAction({ href, onAction }: CardActionOptions): boolean {
  return href !== undefined || onAction !== undefined;
}

/**
 * Whether `target` is inside an editor: an element whose `contenteditable` is anything but
 * `false` (empty, `true`, `plaintext-only`), including the non-editable islands an editor holds.
 */
function isInEditor(target: Element): boolean {
  if (isHTMLElement(target) && target.isContentEditable) return true;
  return target.closest('[contenteditable]:not([contenteditable="false"])') !== null;
}

/**
 * Whether a click on `target` was meant for the card: not for an inner control, an editor or a
 * text selection.
 */
function isCardClick(target: Element, card: Element): boolean {
  const control = target.closest(controlSelector);
  if (control && card.contains(control)) return false;
  if (isInEditor(target)) return false;
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
  // Every element registered, in order: the first one still mounted is the action.
  const registered = useRef<HTMLElement[]>([]);
  const isActionable = hasCardAction(options);
  const actionRef = useCallback((node: HTMLElement | null) => {
    if (!node) return undefined;
    registered.current.push(node);
    return () => {
      registered.current = registered.current.filter((entry) => entry !== node);
    };
  }, []);
  const onClick = (event: ReactMouseEvent<HTMLElement>) => {
    const element = registered.current.find((entry) => entry.isConnected);
    if (!isActionable || !element || event.defaultPrevented) return;
    // React bubbles clicks out of portals; content portalled out of the card is not the card.
    if (!isElement(event.target) || !event.currentTarget.contains(event.target)) return;
    // The innermost actionable card owns a click; the cards around it leave it alone.
    if (claimedClicks.has(event.nativeEvent)) return;
    claimedClicks.add(event.nativeEvent);
    if (element.contains(event.target)) return;
    if (isCardClick(event.target, event.currentTarget)) repeatClick(element, event);
  };
  return { isActionable, actionRef, onClick };
}

/** What draws the card's action element. */
interface CardActionTitleProps extends AriaLabellingProps, Omit<BaseProps, 'id' | 'className'> {
  options: CardActionOptions;
  actionRef: RefCallback<HTMLElement>;
  className: string;
  children: ReactNode;
}

/**
 * The card's action element: a link through the provider's renderer, or a button. The card's title
 * draws it, and so does a `CardAction` in a custom header.
 */
export function CardActionTitle({
  options,
  actionRef,
  className,
  children,
  ...rest
}: CardActionTitleProps) {
  const { href, target, onAction } = options;
  if (href !== undefined) {
    return (
      <UiLink
        {...rest}
        ref={actionRef}
        href={href}
        target={target}
        rel={mergeSafeRel(options.target, options.rel)}
        className={className}
        onClick={() => onAction?.()}
      >
        {children}
      </UiLink>
    );
  }
  return (
    <AriaButton {...rest} ref={actionRef} className={className} onPress={() => onAction?.()}>
      {children}
    </AriaButton>
  );
}

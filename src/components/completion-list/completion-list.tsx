import { useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Popover, useLocale, type Placement } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { triggerWidthProperty, useLayerZIndex } from '../portal/portal.js';
import type { Completion } from './completion-match.js';
import { getCompletionOptionId } from './completion-option-id.js';
import type { CompletionsModel } from './use-completions.js';

/** A completion with the key the editor moves and acts on. */
export interface CompletionListItem extends Completion {
  id: Key;
}

/** What an item's renderer knows about it. */
export interface CompletionListItemState {
  /** The item is the active option, which Enter or Tab would insert. */
  isActive: boolean;
}

export interface CompletionListProps extends BaseProps, AriaLabellingProps {
  /** Shows the list. It opens only with items or an empty state to show. */
  isOpen: boolean;
  /** Called when the popover asks to close. */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** The element the list opens against, such as the editor's frame or a caret marker it places. */
  anchorRef: RefObject<Element | null>;
  items: readonly CompletionListItem[];
  /** The active option, which the editor names in `aria-activedescendant`. */
  activeKey: Key | null;
  /** Called when the pointer moves over an option. */
  onActiveKeyChange?: ((key: Key) => void) | undefined;
  /** Called when an option is pressed. */
  onAction: (key: Key) => void;
  /** Draws an option's content instead of its label and description. */
  renderItem?:
    | ((item: CompletionListItem, state: CompletionListItemState) => ReactNode)
    | undefined;
  /** Shown instead of the options while there are none, such as `No people found`. */
  renderEmptyState?: (() => ReactNode) | undefined;
  /** A line after the options, such as a match count and key hints. */
  footer?: ReactNode;
}

/** Draws a completion's content instead of its label and description. */
export type CompletionRenderer = (
  completion: Completion,
  state: CompletionListItemState,
) => ReactNode;

export interface ControlCompletionListProps {
  model: CompletionsModel;
  listId: string;
  anchorRef: RefObject<Element | null>;
  renderCompletion?: CompletionRenderer | undefined;
  /** The owning component's slot class for the list's popover. */
  className: string;
}

const hooks = createHooks('completion-list', [
  'listbox',
  'option',
  'label',
  'description',
  'documentation',
  'empty',
  'footer',
]);

/**
 * Alternates between the logical and physical spelling of the same placement whenever the anchor
 * moved, measured each time the editor passes new items (as it does when the caret moves), because
 * React Aria repositions an open popover only when its placement changes.
 */
function useFollowedPlacement(
  anchorRef: RefObject<Element | null>,
  isOpen: boolean,
  items: readonly CompletionListItem[],
): Placement {
  const { direction } = useLocale();
  const [turn, setTurn] = useState(0);
  const lastRect = useRef('');
  useLayoutEffect(() => {
    const rect = isOpen ? anchorRef.current?.getBoundingClientRect() : undefined;
    const next = rect ? `${rect.x} ${rect.y} ${rect.width} ${rect.height}` : '';
    if (next === lastRect.current) return;
    lastRect.current = next;
    if (next) setTurn((current) => current + 1);
  }, [anchorRef, isOpen, items]);
  if (turn % 2 === 0) return 'bottom start';
  return direction === 'rtl' ? 'bottom right' : 'bottom left';
}

/** Keeps the active option in view as the editor moves it through a list that scrolls. */
function useActiveInView(listId: string, activeKey: Key | null, isOpen: boolean) {
  useLayoutEffect(() => {
    if (!isOpen || activeKey === null) return;
    const option = document.getElementById(getCompletionOptionId(listId, activeKey));
    option?.scrollIntoView?.({ block: 'nearest' });
  }, [listId, activeKey, isOpen]);
}

function CompletionOption({
  item,
  listId,
  props,
  documentationId,
}: {
  item: CompletionListItem;
  listId: string;
  props: CompletionListProps;
  documentationId: string | undefined;
}) {
  const isActive = item.id === props.activeKey;
  return (
    <div
      {...hooks.slot('option', { focused: isActive, kind: item.kind })}
      id={getCompletionOptionId(listId, item.id)}
      role="option"
      aria-selected={isActive}
      aria-describedby={isActive ? documentationId : undefined}
      // A press inserts the option without taking focus from the editor.
      onPointerDown={(event) => event.preventDefault()}
      onPointerMove={() => {
        if (!isActive) props.onActiveKeyChange?.(item.id);
      }}
      onClick={() => props.onAction(item.id)}
    >
      {props.renderItem ? (
        props.renderItem(item, { isActive })
      ) : (
        <>
          <span {...hooks.slot('label')}>{item.label}</span>
          {item.description ? <span {...hooks.slot('description')}>{item.description}</span> : null}
        </>
      )}
    </div>
  );
}

/**
 * A list of completions for an editor that keeps focus and owns the caret: a listbox in a
 * non-modal popover against an anchor, with the active option's documentation and a footer. It
 * draws options only: the editor moves `activeKey`, names the active option in
 * `aria-activedescendant` and calls `onAction`.
 */
export function CompletionList(props: CompletionListProps) {
  const { isOpen, onOpenChange, anchorRef, items, activeKey, renderEmptyState, footer } = props;
  const strings = useUiStrings();
  const zIndex = useLayerZIndex('dropdown');
  const generatedId = useId();
  const listId = props.id ?? generatedId;
  const isShown = isOpen && (items.length > 0 || Boolean(renderEmptyState));
  const placement = useFollowedPlacement(anchorRef, isShown, items);
  useActiveInView(listId, activeKey, isShown);
  const documentation = items.find((item) => item.id === activeKey)?.documentation;
  const documentationId = documentation ? `${listId}-documentation` : undefined;
  const { className, ...rest } = props;
  const label = props['aria-labelledby'] ? undefined : (props['aria-label'] ?? strings.suggestions);
  return (
    <Popover
      {...hooks.root({ className, props: rest })}
      isOpen={isShown}
      onOpenChange={(open) => onOpenChange?.(open)}
      isNonModal
      triggerRef={anchorRef}
      placement={placement}
      offset={2}
      style={{ ...triggerWidthProperty, zIndex }}
    >
      {items.length > 0 ? (
        <div
          {...hooks.slot('listbox')}
          id={listId}
          role="listbox"
          aria-label={label}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={props['aria-describedby']}
          aria-details={props['aria-details']}
        >
          {items.map((item) => (
            <CompletionOption
              key={item.id}
              item={item}
              listId={listId}
              props={props}
              documentationId={documentationId}
            />
          ))}
        </div>
      ) : (
        <div {...hooks.slot('empty')} id={listId} role="status">
          {renderEmptyState?.()}
        </div>
      )}
      {documentation ? (
        <div
          {...hooks.slot('documentation')}
          id={documentationId}
          onPointerDown={(event) => event.preventDefault()}
        >
          {documentation}
        </div>
      ) : null}
      {footer ? (
        <div {...hooks.slot('footer')} onPointerDown={(event) => event.preventDefault()}>
          {footer}
        </div>
      ) : null}
    </Popover>
  );
}

/** The list of a text control's completions, drawn from its completions model. */
export function ControlCompletionList({
  model,
  listId,
  anchorRef,
  renderCompletion,
  className,
}: ControlCompletionListProps) {
  return (
    <CompletionList
      id={listId}
      className={className}
      isOpen={model.isOpen}
      onOpenChange={(open) => (open ? undefined : model.close())}
      anchorRef={anchorRef}
      items={model.options.map((option, index) => ({ ...option, id: index }))}
      activeKey={model.activeIndex}
      onActiveKeyChange={(key) => model.setActiveIndex(Number(key))}
      onAction={(key) => {
        const option = model.options[Number(key)];
        if (option) model.apply(option);
      }}
      renderItem={renderCompletion}
    />
  );
}

export { getCompletionOptionId } from './completion-option-id.js';
export { matchCompletions, scoreCompletion } from './completion-match.js';
export type { Completion } from './completion-match.js';
export { createTriggerCompletions } from './trigger-completions.js';
export type { CompletionTrigger } from './trigger-completions.js';
export { useCompletions } from './use-completions.js';
export type {
  CompletionAnswer,
  CompletionContext,
  CompletionRange,
  CompletionReason,
  CompletionResult,
  Completions,
  CompletionSource,
  CompletionsModel,
} from './use-completions.js';
export { toCompletionInputAttributes, useTextCompletions } from './text-completions.js';
export type { CompletionInputAttributes, TextCompletions } from './text-completions.js';

'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { Tag as AriaTag, TagGroup as AriaTagGroup, TagList } from '../../primitives/index.js';
import type { AriaLabellingProps, SelectionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, Size, Tone } from '../../core/props.js';
import {
  fromCollectionSelection,
  toCollectionSelectionProps,
} from '../../utils/collection-selection.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { toCollectionItemKey } from '../../utils/to-collection-key.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';

export type TagGroupSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export type TagTone = Tone;

export interface TagGroupProps<T extends object>
  extends BaseProps, AriaLabellingProps, SelectionProps {
  /** The data to render a tag for each of, with `children` as a function. */
  items?: Iterable<T> | undefined;
  /** The tags: `Tag` elements, or a function that renders the `Tag` of each of `items`. */
  children: ReactNode | ((item: T) => ReactElement);
  /** Lets the tags be removed; called with the keys to remove. */
  onRemove?: ((keys: Set<Key>) => void) | undefined;
  /** Scale. Defaults to `md`. */
  size?: TagGroupSize | undefined;
  /** The tone of every tag that sets none. Defaults to `neutral`. */
  tone?: TagTone | undefined;
  /** Shown in the list while it holds no tag. */
  renderEmptyState?: (() => ReactNode) | undefined;
}

// A tag's `id` is its collection key, which may also be a number.
export interface TagProps extends Omit<BaseProps, 'id'> {
  /** The tag's key in the group. */
  id?: Key | undefined;
  /** The tag's content. Give `textValue` when it is not plain text. */
  children: ReactNode;
  /** The tag's name, when its content is not plain text. */
  textValue?: string | undefined;
  /** Leaves the tag out of the keyboard path and of removal. */
  isDisabled?: boolean | undefined;
  /** The tag's tone. Defaults to the group's. */
  tone?: TagTone | undefined;
}

const hooks = createHooks('tag-group', ['list', 'tag', 'label', 'remove', 'empty']);

const ToneContext = createContext<TagTone>('neutral');

/**
 * A focusable collection of tags (React Aria `TagGroup`): the arrow keys move between tags, and with
 * `onRemove` each tag offers a remove button and Delete and Backspace remove the focused tag.
 * Without `onRemove` the tags stay focusable and offer no removal.
 */
export function TagGroup<T extends object>({
  children,
  items,
  size = 'md',
  tone = 'neutral',
  renderEmptyState,
  className,
  selectedKeys,
  defaultSelectedKeys,
  disabledKeys,
  onSelectionChange,
  onRemove,
  ...rest
}: TagGroupProps<T>) {
  return (
    <AriaTagGroup
      {...rest}
      {...hooks.root({ className, props: rest, data: { size } })}
      {...toCollectionSelectionProps({
        selectedKeys,
        defaultSelectedKeys,
        disabledKeys,
        onSelectionChange,
      })}
      onRemove={onRemove && ((keys) => onRemove(fromCollectionSelection(keys) as Set<Key>))}
    >
      <ToneContext value={tone}>
        <TagList
          className={hooks.slotClass('list')}
          items={items}
          renderEmptyState={
            renderEmptyState
              ? () => <span {...hooks.slot('empty')}>{renderEmptyState()}</span>
              : undefined
          }
        >
          {keyCollectionChildren(children)}
        </TagList>
      </ToneContext>
    </AriaTagGroup>
  );
}

/**
 * One tag of a `TagGroup`. In a group with `onRemove` an enabled tag ends with a remove button,
 * named by the provider's `remove` string read with the tag's name.
 */
export function Tag({ id, children, tone, textValue, className, ...rest }: TagProps) {
  const strings = useUiStrings();
  const groupTone = useContext(ToneContext);
  return (
    <AriaTag
      {...rest}
      id={toCollectionItemKey(id)}
      {...hooks.slot('tag', { tone: tone ?? groupTone }, className)}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
    >
      {({ allowsRemoving, isDisabled }) => (
        <>
          <span {...hooks.slot('label')}>{children}</span>
          {allowsRemoving && !isDisabled ? (
            <Button
              slot="remove"
              icon={CloseGlyph}
              label={strings.remove}
              variant="bare"
              size="xs"
              className={hooks.slotClass('remove')}
            />
          ) : null}
        </>
      )}
    </AriaTag>
  );
}

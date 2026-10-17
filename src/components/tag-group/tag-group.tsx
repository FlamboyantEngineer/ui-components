import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import {
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList,
  type TagGroupProps as AriaTagGroupProps,
  type TagListProps,
  type TagProps as AriaTagProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';

export type TagGroupSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export type TagTone = Tone;

export interface TagGroupProps<T extends object>
  extends
    Omit<AriaTagGroupProps, 'className' | 'style' | 'children' | 'render'>,
    Pick<TagListProps<T>, 'items'>,
    BaseProps {
  /** The tags: `Tag` elements, or a function that renders the `Tag` of each of `items`. */
  children: ReactNode | ((item: T) => ReactElement);
  /** Scale. Defaults to `md`. */
  size?: TagGroupSize | undefined;
  /** The tone of every tag that sets none. Defaults to `neutral`. */
  tone?: TagTone | undefined;
  /** Shown in the list while it holds no tag. */
  renderEmptyState?: (() => ReactNode) | undefined;
}

// A tag's `id` is React Aria's collection key, which may also be a number.
export interface TagProps
  extends Omit<AriaTagProps, 'className' | 'style' | 'children' | 'render'>, Omit<BaseProps, 'id'> {
  /** The tag's content. Give `textValue` when it is not plain text. */
  children: ReactNode;
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
  ...rest
}: TagGroupProps<T>) {
  return (
    <AriaTagGroup {...rest} {...hooks.root({ className, props: rest, data: { size } })}>
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
          {children}
        </TagList>
      </ToneContext>
    </AriaTagGroup>
  );
}

/**
 * One tag of a `TagGroup`. In a group with `onRemove` an enabled tag ends with a remove button,
 * named by the provider's `remove` string read with the tag's name.
 */
export function Tag({ children, tone, textValue, className, ...rest }: TagProps) {
  const strings = useUiStrings();
  const groupTone = useContext(ToneContext);
  return (
    <AriaTag
      {...rest}
      {...hooks.slot('tag', { tone: tone ?? groupTone }, className)}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
    >
      {({ allowsRemoving, isDisabled }) => (
        <>
          <span {...hooks.slot('label')}>{children}</span>
          {allowsRemoving && !isDisabled ? (
            <IconButton
              slot="remove"
              icon="close"
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

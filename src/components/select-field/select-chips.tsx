'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import { Tag, TagGroup, TagList } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { FieldPreviousValue } from '../field/field.js';
import { Button } from '../button/button.js';
import { Icon, toIconProps } from '../icon/icon.js';
import type { ChosenSelectOption } from './select-options.js';

interface SelectChipsProps {
  /** The field's label, which names the group of chips. */
  label: string;
  /** The chosen options, one chip each. */
  chosen: readonly ChosenSelectOption[];
  /** Keys the edit added to the committed value; their chips publish `data-change="added"`. */
  added: ReadonlySet<Key>;
  /** Committed options the edit removed, each shown as a previous value with a restore button. */
  removed: readonly ChosenSelectOption[];
  /** Chips offer a remove button and answer Delete and Backspace. */
  isEditable: boolean;
  /** The select holds its `maxValues`: removed values cannot be put back. */
  isFull: boolean;
  onRemove: (keys: Set<Key>) => void;
  onRestore: (key: Key) => void;
}

const hooks = createHooks('select-field', [
  'chips',
  'chip-list',
  'chip',
  'chip-icon',
  'chip-label',
  'chip-remove',
  'removed',
]);

function ChipIcon({ option }: { option: ChosenSelectOption }) {
  return option.icon ? (
    <Icon {...toIconProps(option.icon)} className={hooks.slotClass('chip-icon')} />
  ) : null;
}

/**
 * A multiple select's choices as removable chips in a React Aria tag group (arrow keys move between
 * chips, Delete and Backspace remove one), followed by the committed values the edit removed, each
 * with a button that puts it back.
 */
export function SelectChips({
  label,
  chosen,
  added,
  removed,
  isEditable,
  isFull,
  onRemove,
  onRestore,
}: SelectChipsProps) {
  const strings = useUiStrings();
  return (
    <>
      {chosen.length > 0 ? (
        <TagGroup
          className={hooks.slotClass('chips')}
          aria-label={strings.selectedValues(label)}
          onRemove={
            isEditable ? (keys) => onRemove(new Set([...keys].map(fromCollectionKey))) : undefined
          }
        >
          <TagList className={hooks.slotClass('chip-list')} items={chosen}>
            {(option) => (
              <Tag
                {...hooks.slot('chip', {
                  change: added.has(option.id) ? 'added' : null,
                  missing: option.isMissing,
                })}
                id={toCollectionKey(option.id)}
                textValue={option.label}
              >
                {({ allowsRemoving }) => (
                  <>
                    <ChipIcon option={option} />
                    <span {...hooks.slot('chip-label')}>{option.label}</span>
                    {allowsRemoving ? (
                      <Button
                        slot="remove"
                        icon={CloseGlyph}
                        label={strings.remove}
                        variant="bare"
                        size="xs"
                        className={hooks.slotClass('chip-remove')}
                      />
                    ) : null}
                  </>
                )}
              </Tag>
            )}
          </TagList>
        </TagGroup>
      ) : null}
      {removed.map((option) => (
        <FieldPreviousValue
          key={toKeyIdentity(option.id)}
          className={hooks.slotClass('removed')}
          restoreLabel={option.label}
          onRestore={() => onRestore(option.id)}
          isDisabled={isFull}
        >
          <ChipIcon option={option} />
          {option.label}
        </FieldPreviousValue>
      ))}
    </>
  );
}

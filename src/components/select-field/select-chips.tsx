'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import { Tag, TagGroup, TagList } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { FieldPreviousValue } from '../field/field.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';
import type { ChosenSelectOption } from './select-options.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';

interface SelectChipsProps {
  /** The field's label, which names the group of chips. */
  label: string;
  /** The chosen options, one chip each. */
  chosen: readonly ChosenSelectOption[];
  /** Keys the edit added to the committed value; their chips publish `data-change="added"`. */
  added: ReadonlySet<Key>;
  /** Chips offer a remove button and answer Delete and Backspace. */
  isEditable: boolean;
  onRemove: (keys: Set<Key>) => void;
}

interface SelectRemovedValuesProps {
  /** Committed options the edit removed, each shown as a previous value with a restore button. */
  removed: readonly ChosenSelectOption[];
  /** The select holds its `maxValues`: removed values cannot be put back. */
  isFull: boolean;
  onRestore: (key: Key) => void;
}

function ChipIcon({ option }: { option: ChosenSelectOption }) {
  return option.icon ? (
    <Icon {...toIconProps(option.icon)} className={hooks.slotClass('chip-icon')} />
  ) : null;
}

/**
 * A multiple select's choices as removable chips in a React Aria tag group: arrow keys move between
 * chips, Delete and Backspace remove one.
 */
export function SelectChips({ label, chosen, added, isEditable, onRemove }: SelectChipsProps) {
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
    </>
  );
}

/** The committed values a multiple select's edit removed, each with a button that puts it back. */
export function SelectRemovedValues({ removed, isFull, onRestore }: SelectRemovedValuesProps) {
  return (
    <>
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

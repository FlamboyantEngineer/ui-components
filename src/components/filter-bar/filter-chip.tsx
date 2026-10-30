import { CloseGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { filterBarHooks as hooks } from './filter-bar-hooks.js';
import { FilterConditionFields } from './filter-editor.js';
import { joinFilterConditionText, useFilterConditionText } from './filter-format.js';
import {
  isFilterConditionComplete,
  type FilterCondition,
  type FilterField,
} from './filter-model.js';

interface FilterChipProps {
  field: FilterField;
  condition: FilterCondition;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
}

/**
 * One active filter: a button reading the field, operator and value that opens the condition's
 * editor in a popover, and a button that removes the filter.
 */
export function FilterChip({
  field,
  condition,
  isOpen,
  onOpenChange,
  ...actions
}: FilterChipProps) {
  const strings = useUiStrings();
  const text = useFilterConditionText()(condition, field);
  const isIncomplete = !isFilterConditionComplete(condition, field);
  return (
    <li {...hooks.slot('chip', { field: field.id, incomplete: isIncomplete, open: isOpen })}>
      <PopoverTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
        <Button variant="secondary" size="sm" className={hooks.slotClass('chip-button')}>
          <span {...hooks.slot('chip-field')}>{text.field}</span>{' '}
          <span {...hooks.slot('chip-operator')}>{text.operator}</span>
          {text.value ? (
            <>
              {' '}
              <span {...hooks.slot('chip-value')}>{text.value}</span>
            </>
          ) : null}
        </Button>
        <Popover title={field.label} placement="bottom start" className={hooks.slotClass('editor')}>
          <FilterConditionFields
            field={field}
            condition={condition}
            onChange={actions.onChange}
            labelLayout="label-control"
            slotClass={hooks.slotClass}
          />
        </Popover>
      </PopoverTrigger>
      <Button
        icon={CloseGlyph}
        size="sm"
        label={strings.removeFilter(joinFilterConditionText(text))}
        className={hooks.slotClass('chip-remove')}
        onPress={actions.onRemove}
      />
    </li>
  );
}

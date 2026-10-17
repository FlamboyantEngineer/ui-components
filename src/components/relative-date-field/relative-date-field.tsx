import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValueContext,
  useLocale,
  useSlottedContext,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import {
  Field,
  useFieldControl,
  type FieldControlProps,
  type FieldInputProps,
  type FieldState,
} from '../field/field.js';
import { useLayerZIndex } from '../portal/portal.js';
import {
  describeRelativeDate,
  formatRelativePreset,
  resolveRelativePreset,
  type RelativeDateKind,
  type RelativeDatePreset,
  type RelativeDateText,
} from './relative-date.js';

export interface RelativeDateFieldProps
  extends
    FieldInputProps<string | null>,
    Pick<AriaSelectProps<object>, 'isOpen' | 'defaultOpen' | 'onOpenChange'> {
  /** What a preset commits: a `YYYY-MM-DD` date (the default) or a UTC ISO instant. */
  valueKind?: RelativeDateKind | undefined;
  /** The choices, in order. Defaults to today, tomorrow, yesterday, next week and last week. */
  presets?: readonly RelativeDatePreset[] | undefined;
  /** The clock presets and relative text count from. Defaults to the current time. */
  getNow?: (() => Date) | undefined;
  /** The trigger's text while there is no value. Defaults to the provider string. */
  placeholder?: string | undefined;
  /** Values this many days away or more read as absolute dates. Defaults to 7. */
  fallbackAfterDays?: number | undefined;
}

const DEFAULT_PRESETS: readonly RelativeDatePreset[] = [
  { amount: 0, unit: 'day' },
  { amount: 1, unit: 'day' },
  { amount: -1, unit: 'day' },
  { amount: 1, unit: 'week' },
  { amount: -1, unit: 'week' },
];

const hooks = createHooks('relative-date-field', [
  'select',
  'trigger',
  'value',
  'chevron',
  'popover',
  'listbox',
  'option',
  'preview',
]);

const currentTime = () => new Date();

function RelativeTrigger({
  control,
  text,
  placeholder,
}: {
  control: FieldControlProps;
  text: RelativeDateText | null;
  placeholder: string;
}) {
  const valueProps = useSlottedContext(SelectValueContext);
  return (
    <AriaButton ref={control.ref} className={hooks.slotClass('trigger')}>
      <span {...hooks.slot('value', { placeholder: !text })} id={valueProps?.id}>
        {text ? text.relative : placeholder}
      </span>
      <Glyph name="chevron-down" className={hooks.slotClass('chevron')} />
    </AriaButton>
  );
}

interface PresetItem {
  id: string;
  label: string;
  preset: RelativeDatePreset;
}

interface PresetSelectProps extends Pick<
  RelativeDateFieldProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange'
> {
  control: FieldControlProps;
  state: FieldState<string | null>;
  items: readonly PresetItem[];
  text: RelativeDateText | null;
  placeholder: string;
  onPick: (preset: RelativeDatePreset) => void;
}

/** The preset list: a select that never holds a choice, so picking the same preset again commits. */
function PresetSelect({
  control,
  state,
  items,
  text,
  placeholder,
  onPick,
  ...open
}: PresetSelectProps) {
  const zIndex = useLayerZIndex('dropdown');
  return (
    <AriaSelect
      {...open}
      className={hooks.slotClass('select')}
      id={control.id}
      aria-label={control['aria-label']}
      aria-labelledby={control['aria-labelledby']}
      aria-describedby={control['aria-describedby']}
      value={null}
      onChange={(key) => {
        const item = items.find((entry) => entry.id === key);
        if (item) onPick(item.preset);
      }}
      isOpen={state.isReadOnly ? false : open.isOpen}
      isDisabled={state.isDisabled}
      isRequired={state.isRequired}
      isInvalid={state.validation.status === 'invalid'}
      validationBehavior="aria"
    >
      <RelativeTrigger control={control} text={text} placeholder={placeholder} />
      <Popover {...hooks.slot('popover', { layer: 'dropdown' })} offset={4} style={{ zIndex }}>
        <ListBox className={hooks.slotClass('listbox')} items={items}>
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.label} className={hooks.slotClass('option')}>
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

/**
 * A field that sets a date from relative presets (React Aria `Select`): the trigger reads the
 * value relative to now, such as `Tomorrow` or `3 days ago`, and a `<time>` element after it gives
 * the absolute date. Picking a preset commits the date it stands for.
 */
export function RelativeDateField(props: RelativeDateFieldProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const { state, field, rest } = useFieldControl<string | null, RelativeDateFieldProps>(props, {
    initialValue: null,
    emptyValue: null,
  });
  const {
    valueKind = 'date',
    presets = DEFAULT_PRESETS,
    getNow = currentTime,
    placeholder = strings.selectPlaceholder,
    fallbackAfterDays = 7,
    ...open
  } = rest;
  const value = state.value ?? null;
  const text = value
    ? describeRelativeDate(value, { now: getNow(), locale, fallbackAfterDays })
    : null;
  const items = presets.map((preset, index) => ({
    id: String(index),
    label: formatRelativePreset(preset, locale),
    preset,
  }));
  const pick = (preset: RelativeDatePreset) => {
    state.setValue(resolveRelativePreset(preset, { now: getNow(), kind: valueKind }));
    state.commit();
  };
  const data = { valueKind, relation: text?.relation };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, props: field, data })}
      state={state}
    >
      {(control) => (
        <>
          <PresetSelect
            {...open}
            control={control}
            state={state}
            items={items}
            text={text}
            placeholder={placeholder}
            onPick={pick}
          />
          {text && value ? (
            <time {...hooks.slot('preview')} dateTime={value}>
              {text.absolute}
            </time>
          ) : null}
        </>
      )}
    </Field>
  );
}

export type { RelativeDateKind, RelativeDatePreset, RelativeDateUnit } from './relative-date.js';

import { expectTypeOf, it } from 'vitest';
import type * as Api from '../src/index.js';
import type {
  ChoiceGroup,
  ChoiceGroupProps,
  CodeEditorFieldProps,
  CodeEditorProps,
  CodeEditorSurfaceProps,
  Combobox,
  ComboboxLoader,
  Key,
  PeoplePicker,
  PeoplePickerLoader,
  SegmentedChoice,
  SelectField,
  SelectFieldLoader,
  SelectFieldProps,
} from '../src/index.js';

type PublicApi = typeof Api;
it('UIC-CHOICE-GROUP-1.1 UIC-CHOICE-GROUP-4.1 UIC-SELECT-FIELD-9.1 UIC-CODE-EDITOR-12.2 exposes unified field types', () => {
  expectTypeOf<ChoiceGroupProps<'single'>['value']>().toEqualTypeOf<string | null | undefined>();
  expectTypeOf<ChoiceGroupProps<'multiple'>['value']>().toEqualTypeOf<string[] | undefined>();
  expectTypeOf<Extract<SelectFieldProps, { mode: 'tree' }>['mode']>().toEqualTypeOf<'tree'>();
  expectTypeOf<CodeEditorProps>().toEqualTypeOf<CodeEditorFieldProps | CodeEditorSurfaceProps>();
  expectTypeOf<CodeEditorSurfaceProps['variant']>().toEqualTypeOf<'surface'>();
  expectTypeOf<PublicApi>().not.toHaveProperty('CheckboxGroup');
  expectTypeOf<PublicApi>().toHaveProperty('RadioGroup');
  expectTypeOf<PublicApi>().toHaveProperty('RadioGroupItem');
  expectTypeOf<PublicApi>().not.toHaveProperty('Radio');
  expectTypeOf<PublicApi>().not.toHaveProperty('IconSelectField');
  expectTypeOf<PublicApi>().not.toHaveProperty('TreeSelectField');
  expectTypeOf<PublicApi>().not.toHaveProperty('JsonEditor');
});

it('UIC-COMBOBOX-3.1 UIC-PEOPLE-PICKER-1.2 UIC-CHOICE-GROUP-4.1 UIC-SEGMENTED-CHOICE-2.4 requires multiple mode for array values and handlers', () => {
  type ManyKeys = { defaultValue: Key[]; onChange: (value: Key[]) => void };
  type ManyStrings = { defaultValue: string[]; onChange: (value: string[]) => void };
  type Multiple = { selectionMode: 'multiple' };
  type People = ManyKeys & { loadItems: PeoplePickerLoader };
  type Radio = ManyStrings & { label: string; children: null };
  type Segments = ManyStrings & { options: [] };

  expectTypeOf<ManyKeys>().not.toExtend<Parameters<typeof Combobox<'multiple'>>[0]>();
  expectTypeOf<People>().not.toExtend<Parameters<typeof PeoplePicker<'multiple'>>[0]>();
  expectTypeOf<Radio>().not.toExtend<Parameters<typeof ChoiceGroup<'multiple'>>[0]>();
  expectTypeOf<Segments>().not.toExtend<Parameters<typeof SegmentedChoice<'multiple'>>[0]>();

  expectTypeOf<ManyKeys & Multiple>().toExtend<Parameters<typeof Combobox<'multiple'>>[0]>();
  expectTypeOf<People & Multiple>().toExtend<Parameters<typeof PeoplePicker<'multiple'>>[0]>();
  expectTypeOf<Radio & Multiple>().toExtend<Parameters<typeof ChoiceGroup<'multiple'>>[0]>();
  expectTypeOf<Segments & Multiple>().toExtend<Parameters<typeof SegmentedChoice<'multiple'>>[0]>();
  expectTypeOf<{ defaultValue: Key | null; onChange: (value: Key | null) => void }>().toExtend<
    Parameters<typeof Combobox<'single'>>[0]
  >();
});

it('UIC-SELECT-FIELD-1.2 UIC-SELECT-FIELD-9.1 UIC-SELECT-FIELD-14.2 couples field state and callbacks to selection mode', () => {
  type Many = { defaultValue: Key[]; committedValue: Key[]; onCommit: (value: Key[]) => void };
  type List = Many & { label: string; options: [] };
  type Tree = Many & { mode: 'tree'; label: string; items: []; getTextValue: () => string };
  type Multiple = { selectionMode: 'multiple' };

  expectTypeOf<List>().not.toExtend<Parameters<typeof SelectField<'multiple'>>[0]>();
  expectTypeOf<Tree>().not.toExtend<Parameters<typeof SelectField<'multiple'>>[0]>();
  expectTypeOf<List & Multiple>().toExtend<Parameters<typeof SelectField<'multiple'>>[0]>();
  expectTypeOf<Tree & Multiple>().toExtend<Parameters<typeof SelectField<'multiple'>>[0]>();
  expectTypeOf<List & { selectionMode: 'single' }>().not.toExtend<
    SelectFieldProps<'single' | 'multiple'>
  >();
  expectTypeOf<{ mode: 'native'; label: string; options: []; defaultValue: Key | null }>().toExtend<
    SelectFieldProps<'single'>
  >();
  expectTypeOf<{ mode: 'native'; label: string; options: [] }>().not.toExtend<
    SelectFieldProps<'multiple'>
  >();
});

it('UIC-COMBOBOX-5.3 UIC-SELECT-FIELD-5.1 gives remote loaders ownership of their paging', () => {
  type Managed = { loadItems: ComboboxLoader };
  type Caller = { onLoadMore: () => void; isLoading: boolean };

  expectTypeOf<Managed>().toExtend<Parameters<typeof Combobox<'single'>>[0]>();
  expectTypeOf<Caller>().toExtend<Parameters<typeof Combobox<'single'>>[0]>();
  expectTypeOf<Managed & { onLoadMore: () => void }>().not.toExtend<
    Parameters<typeof Combobox<'single'>>[0]
  >();
  expectTypeOf<Managed & { isLoading: boolean }>().not.toExtend<
    Parameters<typeof Combobox<'single'>>[0]
  >();
  expectTypeOf<Extract<SelectFieldProps, { mode?: 'list' }>>()
    .toHaveProperty('loadItems')
    .toEqualTypeOf<SelectFieldLoader | undefined>();
});

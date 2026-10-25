import { expectTypeOf, it } from 'vitest';
import type * as Api from '../src/index.js';
import type {
  ChoiceGroupProps,
  SelectFieldProps,
  CodeEditorProps,
  CodeEditorFieldProps,
  CodeEditorSurfaceProps,
} from '../src/index.js';

type PublicApi = typeof Api;
it('UIC-CHOICE-GROUP-1.1 UIC-CHOICE-GROUP-4.1 UIC-SELECT-FIELD-9.1 UIC-CODE-EDITOR-12.2 exposes unified field types', () => {
  expectTypeOf<ChoiceGroupProps<'single'>['value']>().toEqualTypeOf<string | null | undefined>();
  expectTypeOf<ChoiceGroupProps<'multiple'>['value']>().toEqualTypeOf<string[] | undefined>();
  expectTypeOf<Extract<SelectFieldProps, { mode: 'tree' }>['mode']>().toEqualTypeOf<'tree'>();
  expectTypeOf<CodeEditorProps>().toEqualTypeOf<CodeEditorFieldProps | CodeEditorSurfaceProps>();
  expectTypeOf<CodeEditorSurfaceProps['variant']>().toEqualTypeOf<'surface'>();
  expectTypeOf<PublicApi>().not.toHaveProperty('CheckboxGroup');
  expectTypeOf<PublicApi>().not.toHaveProperty('RadioGroup');
  expectTypeOf<PublicApi>().not.toHaveProperty('Radio');
  expectTypeOf<PublicApi>().not.toHaveProperty('IconSelectField');
  expectTypeOf<PublicApi>().not.toHaveProperty('TreeSelectField');
  expectTypeOf<PublicApi>().not.toHaveProperty('JsonEditor');
});

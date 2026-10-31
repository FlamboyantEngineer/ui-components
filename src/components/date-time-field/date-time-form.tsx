import { FieldFormValue } from '../field/field.js';
import type { DateFieldValue } from './date-values.js';

interface DateFormNames {
  /** The form name of a single value. */
  name?: string | undefined;
  /** The form names of a range's ends. */
  startName?: string | undefined;
  endName?: string | undefined;
}

/**
 * The field's value in its form: hidden inputs holding the canonical text of a single value, or of a
 * range's start and end, empty while there is none. A disabled field submits nothing.
 */
export function DateFormInputs({
  value,
  names,
  isDisabled,
}: {
  value: DateFieldValue;
  names: DateFormNames;
  isDisabled: boolean;
}) {
  const range = typeof value === 'object' ? value : null;
  return (
    <>
      <FieldFormValue
        name={names.name}
        value={typeof value === 'string' ? value : ''}
        isDisabled={isDisabled}
      />
      <FieldFormValue name={names.startName} value={range?.start ?? ''} isDisabled={isDisabled} />
      <FieldFormValue name={names.endName} value={range?.end ?? ''} isDisabled={isDisabled} />
    </>
  );
}

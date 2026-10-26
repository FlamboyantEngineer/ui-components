import type { DateFieldValue } from './date-values.js';

interface DateFormNames {
  /** The form name of a single value. */
  name?: string | undefined;
  /** The form names of a range's ends. */
  startName?: string | undefined;
  endName?: string | undefined;
}

function HiddenValue({
  name,
  value,
  isDisabled,
}: {
  name: string | undefined;
  value: string;
  isDisabled: boolean;
}) {
  return name ? <input type="hidden" name={name} value={value} disabled={isDisabled} /> : null;
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
      <HiddenValue
        name={names.name}
        value={typeof value === 'string' ? value : ''}
        isDisabled={isDisabled}
      />
      <HiddenValue name={names.startName} value={range?.start ?? ''} isDisabled={isDisabled} />
      <HiddenValue name={names.endName} value={range?.end ?? ''} isDisabled={isDisabled} />
    </>
  );
}

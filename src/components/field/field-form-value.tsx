/**
 * What a field control submits with its form under `name`, through hidden inputs: one value (`null`
 * or `undefined` submits an empty string) or one input per value of a list (an empty list submits
 * nothing). Without a `name` it renders nothing; a disabled field submits nothing.
 */
export function FieldFormValue({
  name,
  value,
  isDisabled = false,
  className,
}: {
  name: string | undefined;
  value: string | readonly string[] | null | undefined;
  isDisabled?: boolean | undefined;
  /** A slot class for the inputs, for a control that names them in its hooks. */
  className?: string | undefined;
}) {
  if (!name) return null;
  const values = typeof value === 'string' || value == null ? [value ?? ''] : value;
  return values.map((entry, index) => (
    <input
      // Several entries may repeat a value, so their place keys them.
      key={index}
      className={className}
      type="hidden"
      name={name}
      value={entry}
      disabled={isDisabled}
    />
  ));
}

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FieldFormValue } from './field-form-value.js';

/** The entries a form around the value submits under `name`. */
function submitted(value: Parameters<typeof FieldFormValue>[0]) {
  const { container, unmount } = render(
    <form>
      <FieldFormValue {...value} />
    </form>,
  );
  const entries = new FormData(container.querySelector('form') as HTMLFormElement).getAll('pick');
  unmount();
  return entries;
}

describe('FieldFormValue', () => {
  it('UIC-FIELD-8.4 submits one value, empty values as an empty string, and every value of a list', () => {
    expect(submitted({ name: 'pick', value: 'pear' })).toEqual(['pear']);
    expect(submitted({ name: 'pick', value: null })).toEqual(['']);
    expect(submitted({ name: 'pick', value: undefined })).toEqual(['']);
    expect(submitted({ name: 'pick', value: ['pear', 'fig', 'pear'] })).toEqual([
      'pear',
      'fig',
      'pear',
    ]);
    expect(submitted({ name: 'pick', value: [] })).toEqual([]);
  });

  it('UIC-FIELD-8.4 submits nothing while disabled and renders nothing without a name', () => {
    expect(submitted({ name: 'pick', value: ['pear'], isDisabled: true })).toEqual([]);
    const { container } = render(<FieldFormValue name={undefined} value="pear" />);
    expect(container).toBeEmptyDOMElement();
    const view = render(<FieldFormValue name="pick" value="pear" className="ui-probe__value" />);
    expect(view.container.querySelector('input')).toHaveClass('ui-probe__value');
    expect(view.container.querySelector('input')).toHaveAttribute('type', 'hidden');
  });
});

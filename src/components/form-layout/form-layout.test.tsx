import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Form } from '../form/form.js';
import { TextField } from '../text-field/text-field.js';
import { FormLayout } from './form-layout.js';
import type { FormLayoutValue } from './form-layout-tree.js';
import type { FormLayoutTypes } from './form-layout-types.js';

interface FieldData {
  name: string;
  isRequired?: boolean;
}

const sampleTypes: FormLayoutTypes<FieldData> = {
  section: { label: 'Section', arrangement: 'stack' },
  row: { label: 'Row', arrangement: 'row', accepts: (type) => type === 'text' },
  grid: { label: 'Grid', arrangement: 'grid' },
  text: {
    label: 'Text',
    render: (node, { mode }) => (
      <TextField
        label={node.label ?? 'Text'}
        name={node.data?.name}
        isRequired={node.data?.isRequired}
        isReadOnly={mode === 'design'}
      />
    ),
  },
};

const sampleLayout: FormLayoutValue<FieldData> = [
  {
    id: 'contact',
    type: 'section',
    label: 'Contact',
    children: [
      { id: 'name', type: 'text', label: 'Name', data: { name: 'name', isRequired: true } },
      {
        id: 'place',
        type: 'row',
        children: [
          { id: 'city', type: 'text', label: 'City', data: { name: 'city' } },
          { id: 'zip', type: 'text', label: 'Postcode', data: { name: 'zip' } },
        ],
      },
    ],
  },
  { id: 'extra', type: 'grid', label: 'Extras', columns: 2, children: [] },
];

const prevent = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

describe('FormLayout', () => {
  it('UIC-FORM-LAYOUT-2.1 draws containers, arrangements and grid columns', () => {
    const { container } = render(
      <FormLayout layout={sampleLayout} types={sampleTypes} className="host" data-kind="sample" />,
    );
    const root = container.querySelector('.ui-form-layout');
    expect(root).toHaveClass('host');
    expect(root).toHaveAttribute('data-kind', 'sample');
    expect(screen.getByRole('group', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Extras' })).toBeInTheDocument();
    const grid = container.querySelector('[data-key="extra"] .ui-form-layout__children');
    expect(grid).toHaveAttribute('data-arrangement', 'grid');
    expect((grid as HTMLElement).style.getPropertyValue('--ui-form-layout-columns')).toBe('2');
    expect(container.querySelector('[data-key="place"] .ui-form-layout__children')).toHaveAttribute(
      'data-arrangement',
      'row',
    );
    expectHooksMatchSpec(container, 'FORM-LAYOUT', {
      slots: ['node', 'title', 'children'],
      callerAttributes: ['data-kind'],
    });
  });

  it('UIC-FORM-LAYOUT-1.4 UIC-FORM-LAYOUT-2.2 keeps Form registration, validation and submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(prevent);
    render(
      <Form aria-label="Sample" validationBehavior="aria" onSubmit={onSubmit}>
        <FormLayout layout={sampleLayout} types={sampleTypes} />
        <button type="submit">Send</button>
      </Form>,
    );
    const name = screen.getByRole('textbox', { name: 'Name' });
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    await user.type(name, 'Ada');
    await user.type(screen.getByRole('textbox', { name: 'City' }), 'Lyon');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const form = screen.getByRole('form', { name: 'Sample' }) as HTMLFormElement;
    expect(Object.fromEntries(new FormData(form))).toEqual({ name: 'Ada', city: 'Lyon', zip: '' });
  });
});

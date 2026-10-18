import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { BooleanField } from '../boolean-field/boolean-field.js';
import { Fieldset } from '../field/field.js';
import { NumberField } from '../number-field/number-field.js';
import { TextField } from '../text-field/text-field.js';
import { Form, type FormProps } from './form.js';

function field(name: string) {
  return screen.getByRole('textbox', { name }).closest('.ui-field');
}

/** An order form whose fields are all required. */
function OrderForm(props: Omit<FormProps, 'children'>) {
  return (
    <Form aria-label="Order" {...props}>
      <TextField label="Name" name="name" isRequired />
      <NumberField label="Quantity" name="quantity" isRequired minValue={1} />
      <BooleanField label="Gift wrap" name="wrap" isRequired variant="segmented" />
      <button type="submit">Send</button>
    </Form>
  );
}

const prevent = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

describe('Form', () => {
  it('UIC-FORM-1.1 renders a form with its hooks and props', () => {
    const { container } = render(
      <Form
        aria-label="Order"
        id="order"
        className="checkout"
        data-test="form"
        action="/orders"
        method="post"
      >
        <TextField label="Name" />
      </Form>,
    );
    const form = screen.getByRole('form', { name: 'Order' });
    expect(form.tagName).toBe('FORM');
    expect(form).toHaveClass('ui-form', 'checkout');
    expect(form).toHaveAttribute('id', 'order');
    expect(form).toHaveAttribute('data-test', 'form');
    expect(form).toHaveAttribute('action', '/orders');
    expect(form).toHaveAttribute('method', 'post');
    expectHooksMatchSpec(container, 'FORM', { callerAttributes: ['data-test'] });
  });

  it('UIC-FORM-1.2 UIC-FORM-1.4 shows every field validation on submit and focuses the first invalid one', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(prevent);
    render(<OrderForm validationBehavior="aria" onSubmit={onSubmit} />);
    const name = screen.getByRole('textbox', { name: 'Name' });
    expect(name).not.toHaveAttribute('aria-invalid');
    expect(field('Name')).toHaveAttribute('data-validation', 'valid');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(field('Quantity')).toHaveAttribute('data-validation', 'invalid');
    await user.type(name, 'Ada');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByRole('textbox', { name: 'Quantity' })).toHaveFocus();
    await user.keyboard('2');
    await user.click(screen.getByRole('radio', { name: 'True' }));
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('UIC-FORM-1.2 blocks a submit while a field is being checked and lets disabled fields pass', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(prevent);
    const { rerender } = render(
      <Form aria-label="Order" validationBehavior="aria" onSubmit={onSubmit}>
        <TextField label="Code" defaultValue="A1" isPending />
        <Fieldset legend="Extras" isDisabled>
          <TextField label="Note" isRequired />
        </Fieldset>
        <button type="submit">Send</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Code' })).toHaveFocus();
    expect(field('Code')).toHaveAttribute('data-validation', 'pending');
    rerender(
      <Form aria-label="Order" validationBehavior="aria" onSubmit={onSubmit}>
        <TextField label="Code" defaultValue="A1" />
        <Fieldset legend="Extras" isDisabled>
          <TextField label="Note" isRequired />
        </Fieldset>
        <button type="submit">Send</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('UIC-FORM-1.3 shows external errors on the fields they name until the value changes', async () => {
    const user = userEvent.setup();
    function ServerForm() {
      const [errors, setErrors] = useState<Record<string, string>>({});
      return (
        <Form
          aria-label="Sign up"
          validationBehavior="aria"
          validationErrors={errors}
          onSubmit={(event) => {
            event.preventDefault();
            setErrors({ email: 'This address is taken.', newsletter: 'Not available here.' });
          }}
        >
          <TextField label="Email" name="email" defaultValue="ada@example.com" />
          <TextField label="City" name="city" defaultValue="Oslo" />
          <BooleanField
            label="Newsletter"
            name="newsletter"
            variant="switch"
            defaultValue={false}
          />
          <button type="submit">Send</button>
        </Form>
      );
    }
    render(<ServerForm />);
    await user.click(screen.getByRole('button', { name: 'Send' }));
    const email = screen.getByRole('textbox', { name: 'Email' });
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('This address is taken.');
    expect(field('City')).toHaveAttribute('data-validation', 'valid');
    expect(screen.getByRole('switch', { name: 'Newsletter' })).toHaveAccessibleDescription(
      'Not available here.',
    );
    await user.type(email, 'x');
    expect(email).not.toHaveAttribute('aria-invalid');
    // An external error the user has not addressed blocks the next submit.
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByRole('switch', { name: 'Newsletter' })).toHaveFocus();
    await user.keyboard(' ');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  it('UIC-FORM-1.4 lets the form and each field choose when validation shows', () => {
    render(
      <Form aria-label="Order" validationMode="immediate">
        <TextField label="Name" isRequired />
        <TextField label="City" isRequired validationMode="submit" />
      </Form>,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'City' })).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-FORM-1.5 blocks a native submit through the fields custom validity', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(prevent);
    render(<OrderForm onSubmit={onSubmit} />);
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Order' });
    const name = screen.getByRole<HTMLInputElement>('textbox', { name: 'Name' });
    expect(form).not.toHaveAttribute('novalidate');
    expect(name.validationMessage).toBe('A value is required.');
    expect(field('Name')).toHaveAttribute('data-validation', 'valid');
    let prevented = false;
    name.addEventListener('invalid', (event) => (prevented = event.defaultPrevented));
    act(() => {
      form.checkValidity();
    });
    expect(prevented).toBe(true);
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(field('Quantity')).toHaveAttribute('data-validation', 'invalid');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

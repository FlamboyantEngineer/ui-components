import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, type FormEvent, useEffect, useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField as PlainField } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { BooleanField } from '../boolean-field/boolean-field.js';
import { Button } from '../button/button.js';
import { Fieldset } from '../field/field.js';
import { useFieldScope } from '../field/field-scope.js';
import { Modal, ModalTrigger } from '../modal/modal.js';
import { NumberField } from '../number-field/number-field.js';
import { PeriodField } from '../period-field/period-field.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { ProblemList } from '../problem-list/problem-list.js';
import { Table } from '../table/table.js';
import { TextField } from '../text-field/text-field.js';
import { Form, type FormBlocker, type FormProps, useFormValidity } from './form.js';

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

  it('UIC-FORM-1.5 focuses the first blocking field of a native submit, whatever its control', () => {
    render(
      <Form aria-label="Trip">
        <PeriodField label="Month" isRequired />
        <TextField label="Note" isRequired />
      </Form>,
    );
    act(() => {
      screen.getByRole<HTMLFormElement>('form', { name: 'Trip' }).checkValidity();
    });
    expect(screen.getByRole('button', { name: /^Month/ })).toHaveFocus();
  });

  it('UIC-FORM-1.5 UIC-FORM-1.7 reveals each field once for one native validation pass', async () => {
    const reveal = vi.fn();
    function Probe({ index }: { index: number }) {
      const { register } = useFieldScope();
      const input = useRef<HTMLInputElement>(null);
      useEffect(
        () =>
          register?.({
            getElement: () => input.current,
            isBlocking: () => true,
            revealValidation: reveal,
            focus: () => input.current?.focus(),
            getLabel: () => `Item ${index}`,
            getIssues: () => [],
            getRealtimeValidation: () => ({ status: 'invalid' }),
          }),
        [index, register],
      );
      return <input ref={input} aria-label={`Item ${index}`} required />;
    }
    function Probes({ count }: { count: number }) {
      return (
        <Form aria-label="Items">
          {Array.from({ length: count }, (_, index) => (
            <Probe key={index} index={index} />
          ))}
        </Form>
      );
    }
    const { rerender } = render(<Probes count={100} />);
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Items' });
    await act(async () => {
      form.checkValidity();
      await Promise.resolve();
    });
    expect(reveal).toHaveBeenCalledTimes(100);
    expect(screen.getByRole('textbox', { name: 'Item 0' })).toHaveFocus();
    reveal.mockClear();
    rerender(<Probes count={101} />);
    act(() => screen.getByRole('textbox', { name: 'Item 0' }).blur());
    // A later pass, after the first one's microtasks, reveals the fields again, the new one too.
    await act(async () => {
      form.checkValidity();
      await Promise.resolve();
    });
    expect(reveal).toHaveBeenCalledTimes(101);
    expect(screen.getByRole('textbox', { name: 'Item 0' })).toHaveFocus();
  });

  it('UIC-FORM-1.6 hands its form element to a ref, which submits it with the same validation', () => {
    const ref = createRef<HTMLFormElement>();
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    render(
      <Form aria-label="Order" ref={ref} validationBehavior="aria" onSubmit={onSubmit}>
        <TextField label="Name" name="name" isRequired />
      </Form>,
    );
    expect(ref.current).toBe(screen.getByRole('form', { name: 'Order' }));
    act(() => ref.current?.requestSubmit());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
    expect(field('Name')).toHaveAttribute('data-validation', 'invalid');
  });

  it('UIC-FORM-1.7 reads its fields once per commit, however many mount or change at once', async () => {
    const user = userEvent.setup();
    const compare = vi.spyOn(Node.prototype, 'compareDocumentPosition');
    const count = 100;
    // A sort of the fields in document order, a few times over, and never once per field.
    const bound = count * Math.log2(count) * 4;
    render(
      <Form aria-label="Survey" validationBehavior="aria">
        <ProblemList />
        {Array.from({ length: count }, (_, index) => (
          <PlainField key={index} label={`Answer ${index + 1}`} options={{ isRequired: true }} />
        ))}
        <button type="submit">Send</button>
      </Form>,
    );
    expect(compare.mock.calls.length).toBeLessThan(bound);
    compare.mockClear();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByRole('status')).toHaveTextContent(`${count} errors`);
    expect(compare.mock.calls.length).toBeLessThan(bound);
  });

  describe('UIC-FORM-1.8 where its fields end', () => {
    /** A page form whose one required field stays empty, around `children`. */
    function PageForm({
      children,
      ...props
    }: Omit<FormProps, 'children'> & { children: React.ReactNode }) {
      return (
        <Form aria-label="Page" validationBehavior="aria" {...props}>
          <TextField label="Title" isRequired />
          {children}
          <button type="submit">Save</button>
        </Form>
      );
    }

    it('ignores the submit of a form in a dialog it opened', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(prevent);
      const onInnerSubmit = vi.fn(prevent);
      render(
        <PageForm onSubmit={onSubmit}>
          <ModalTrigger>
            <Button>Rename</Button>
            <Modal title="Rename">
              <Form aria-label="Rename" onSubmit={onInnerSubmit}>
                <TextField label="New name" />
                <button type="submit">Apply</button>
              </Form>
            </Modal>
          </ModalTrigger>
        </PageForm>,
      );
      await user.click(screen.getByRole('button', { name: 'Rename' }));
      await user.type(screen.getByRole('textbox', { name: 'New name' }), 'Notes{Enter}');
      expect(onInnerSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: 'Title', hidden: true })).not.toHaveAttribute(
        'aria-invalid',
      );
      expect(screen.getByRole('textbox', { name: 'New name' })).toHaveFocus();
    });

    it('ignores the submit of a table bulk edit inside it', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(prevent);
      const onCellsChange = vi.fn();
      const rows = [
        { id: 'a', name: 'Apple', origin: 'Oslo' },
        { id: 'b', name: 'Pear', origin: 'Lima' },
      ];
      render(
        <PageForm onSubmit={onSubmit}>
          <Table
            aria-label="Items"
            rows={rows}
            columns={[
              { id: 'name', header: 'Name' },
              { id: 'origin', header: 'Origin', bulkEdit: { type: 'text' } },
            ]}
            selectionMode="multiple"
            onCellsChange={onCellsChange}
          />
        </PageForm>,
      );
      const check = (name: string) =>
        screen.getByRole('row', { name }).querySelector('.ui-table__checkbox') as HTMLElement;
      await user.click(check('Apple'));
      await user.click(screen.getByRole('button', { name: 'Edit selected' }));
      // Enter submits the dialog's own form.
      await user.type(screen.getByRole('textbox', { name: 'Origin' }), 'Rome{Enter}');
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: 'Title', hidden: true })).not.toHaveAttribute(
        'aria-invalid',
      );
      expect(screen.getByRole('textbox', { name: 'Origin' })).toHaveFocus();
      await user.click(screen.getByRole('button', { name: 'Apply' }));
      expect(onCellsChange).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('leaves out the fields of a popover it opened', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(prevent);
      const onValidityChange = vi.fn<(blockers: readonly FormBlocker[]) => void>();
      const readVerdict = vi.fn<(validity: ReturnType<typeof useFormValidity>) => void>();
      function Verdict() {
        readVerdict(useFormValidity());
        return null;
      }
      render(
        <PageForm onSubmit={onSubmit} onValidityChange={onValidityChange}>
          <Verdict />
          <ProblemList />
          <PopoverTrigger>
            <Button>Note</Button>
            <Popover aria-label="Note">
              <TextField label="Note text" isRequired validationMode="immediate" />
            </Popover>
          </PopoverTrigger>
        </PageForm>,
      );
      await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Plan');
      await user.click(screen.getByRole('button', { name: 'Note' }));
      expect(screen.getByRole('textbox', { name: 'Note text' })).toBeInTheDocument();
      expect(readVerdict.mock.lastCall?.[0]?.isBlocked()).toBe(false);
      expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('No problems');
      expect(onValidityChange).not.toHaveBeenLastCalledWith(
        expect.arrayContaining([expect.objectContaining({ label: 'Note text' })]),
      );
      await user.keyboard('{Escape}');
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});

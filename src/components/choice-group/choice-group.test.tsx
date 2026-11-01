import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type JSX } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Fieldset } from '../field/field.js';
import { Form } from '../form/form.js';
import {
  Choice,
  ChoiceGroup,
  type ChoiceGroupProps,
  type ChoiceRenderState,
} from './choice-group.js';
import { chooseFieldMenuItem } from '../../../test/field-fixtures.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function radio(name: string) {
  return screen.getByRole<HTMLInputElement>('radio', { name });
}

function Sizes(props: Omit<ChoiceGroupProps, 'label' | 'children'>) {
  return (
    <ChoiceGroup label="Size" {...props}>
      <Choice value="small">Small</Choice>
      <Choice value="medium" description="Serves two.">
        Medium
      </Choice>
      <Choice value="large">Large</Choice>
      <Choice value="family" isDisabled>
        Family
      </Choice>
    </ChoiceGroup>
  );
}

describe('ChoiceGroup', () => {
  it('UIC-CHOICE-GROUP-1.1 is a field around a radio group that starts with none selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(<Sizes onChange={onChange} onCommit={onCommit} />);
    expect(root(container)).toHaveClass('ui-field', 'ui-choice-group');
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    expect(group).toHaveClass('ui-choice-group__box');
    expect(within(group).getAllByRole('radio')).toHaveLength(4);
    expect(within(group).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    await user.click(screen.getByText('Large'));
    expect(onChange).toHaveBeenLastCalledWith('large');
    expect(onCommit).toHaveBeenLastCalledWith('large');
    expect(radio('Large')).toBeChecked();
    expectHooksMatchSpec(container, 'CHOICE-GROUP', { slots: ['box'] });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control', 'message'] });
  });

  it('UIC-CHOICE-GROUP-1.2 draws each radio as a label around a hidden input, an indicator and rich content', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ChoiceGroup label="Plan" defaultValue="basic">
        <Choice value="basic" id="plan-basic" className="plan" data-test="basic">
          Basic <strong>free</strong>
        </Choice>
        <Choice value="team" aria-label="Team plan" />
      </ChoiceGroup>,
    );
    const basic = radio('Basic free');
    expect(basic).toHaveAttribute('id', 'plan-basic');
    const field = basic.closest('.ui-choice');
    expect(field).toHaveClass('plan');
    expect(field).toHaveAttribute('data-test', 'basic');
    expect(field).toHaveAttribute('data-selected', 'true');
    const button = basic.closest('label');
    expect(button).toHaveClass('ui-choice__button');
    expect(button?.querySelector('.ui-choice__indicator')).toHaveAttribute('aria-hidden', 'true');
    expect(button?.querySelector('.ui-choice__label strong')).toHaveTextContent('free');
    await user.click(container.querySelectorAll('.ui-choice__indicator')[1] as HTMLElement);
    expect(radio('Team plan')).toBeChecked();
    expectHooksMatchSpec(container, 'CHOICE-GROUP', {
      slots: ['button', 'indicator', 'label'],
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-CHOICE-GROUP-1.2 swaps a radio element through render with its state', () => {
    const swap = (props: JSX.IntrinsicElements['div'], state: ChoiceRenderState) => (
      <div {...props} data-swapped={state.isSelected ? 'selected' : 'idle'} />
    );
    render(
      <ChoiceGroup label="Plan" defaultValue="basic">
        <Choice value="basic" render={swap}>
          Basic
        </Choice>
        <Choice value="team" render={swap}>
          Team
        </Choice>
      </ChoiceGroup>,
    );
    expect(radio('Basic').closest('.ui-choice')).toHaveAttribute('data-swapped', 'selected');
    expect(radio('Team').closest('.ui-choice')).toHaveAttribute('data-swapped', 'idle');
  });

  it('UIC-CHOICE-GROUP-1.3 describes a radio with its description', () => {
    const { container } = render(<Sizes />);
    expect(radio('Medium')).toHaveAccessibleDescription('Serves two.');
    expect(radio('Small')).not.toHaveAccessibleDescription();
    const description = container.querySelector('.ui-choice__description');
    expect(description?.previousElementSibling).toHaveClass('ui-choice__button');
    expectHooksMatchSpec(container, 'CHOICE-GROUP', { slots: ['description'] });
  });

  it('UIC-CHOICE-GROUP-1.2 UIC-CHOICE-GROUP-1.3 draws a zero label and description and skips empty ones', () => {
    for (const selectionMode of ['single', 'multiple'] as const) {
      const { container, unmount } = render(
        <ChoiceGroup label="Count" selectionMode={selectionMode}>
          <Choice value="0" description={0}>
            {0}
          </Choice>
          <Choice value="none" aria-label="None" description={false}>
            {null}
          </Choice>
        </ChoiceGroup>,
      );
      const role = selectionMode === 'single' ? 'radio' : 'checkbox';
      expect(screen.getByRole(role, { name: '0' })).toHaveAccessibleDescription('0');
      expect(screen.getByRole(role, { name: 'None' })).not.toHaveAccessibleDescription();
      expect(container.querySelectorAll('.ui-choice__label')).toHaveLength(1);
      expect(container.querySelectorAll('.ui-choice__description')).toHaveLength(1);
      unmount();
    }
  });

  it('UIC-CHOICE-GROUP-1.4 lays radios out in a row or a column and publishes its size', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Sizes />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(group).toHaveAttribute('aria-orientation', 'vertical');
    expect(root(container)).toHaveAttribute('data-size', 'md');
    rerender(<Sizes orientation="horizontal" size="sm" />);
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(root(container)).toHaveAttribute('data-size', 'sm');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(radio('Medium')).toBeChecked();
    expectHooksMatchSpec(container, 'CHOICE-GROUP');
  });

  it('UIC-CHOICE-GROUP-1.5 submits the selected value under its name', async () => {
    const user = userEvent.setup();
    let submitted: Array<FormDataEntryValue | null> = [];
    render(
      <Form
        aria-label="Order"
        onSubmit={(event) => {
          event.preventDefault();
          submitted = [...submitted, new FormData(event.currentTarget).get('size')];
        }}
      >
        <Sizes name="size" />
        <button type="submit">Order</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Order' }));
    await user.click(screen.getByText('Small'));
    await user.click(screen.getByRole('button', { name: 'Order' }));
    expect(submitted).toEqual([null, 'small']);
    expect(radio('Large')).toHaveAttribute('name', 'size');
  });

  it('UIC-CHOICE-GROUP-1.6 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(<Sizes id="size" className="wide" data-test="group" />);
    expect(root(container)).toHaveClass('ui-choice-group', 'wide');
    expect(root(container)).toHaveAttribute('id', 'size');
    expect(root(container)).toHaveAttribute('data-test', 'group');
    expect(screen.getByRole('radiogroup')).toHaveAttribute('id', 'size-control');
    expectHooksMatchSpec(container, 'CHOICE-GROUP', { callerAttributes: ['data-test'] });
  });

  it('UIC-CHOICE-GROUP-2.1 names, describes and reports a required group left empty', async () => {
    const user = userEvent.setup();
    const { container } = render(<Sizes description="Pick one." isRequired />);
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    expect(group).toBeRequired();
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('data-invalid', 'true');
    expect(group).toHaveAccessibleDescription('Pick one. A value is required.');
    expect(group).toHaveAccessibleErrorMessage('A value is required.');
    expect(radio('Small').closest('.ui-choice')).toHaveAttribute('data-invalid', 'true');
    await user.tab();
    const button = radio('Small').closest('label');
    expect(button).toHaveAttribute('data-focus-visible', 'true');
    await user.keyboard(' ');
    expect(button).toHaveAttribute('data-selected', 'true');
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    expect(group).not.toHaveAttribute('aria-invalid');
    expectHooksMatchSpec(container, 'CHOICE-GROUP');
  });

  it('UIC-CHOICE-GROUP-2.2 enters on the selected radio, moves and selects with the arrows and skips disabled radios', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Sizes defaultValue="medium" />
        <button type="button">After</button>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Before' }));
    await user.tab();
    expect(radio('Medium')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(radio('Large')).toHaveFocus();
    expect(radio('Large')).toBeChecked();
    await user.keyboard('{ArrowDown}');
    expect(radio('Small')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(radio('Large')).toBeChecked();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(radio('Large')).toHaveFocus();
  });

  it('UIC-CHOICE-GROUP-2.2 enters on the first enabled radio while none is selected', async () => {
    const user = userEvent.setup();
    render(
      <ChoiceGroup label="Size">
        <Choice value="small" isDisabled>
          Small
        </Choice>
        <Choice value="medium">Medium</Choice>
      </ChoiceGroup>,
    );
    await user.tab();
    expect(radio('Medium')).toHaveFocus();
    expect(radio('Medium')).not.toBeChecked();
  });

  it('UIC-CHOICE-GROUP-2.3 disables radios and refuses picks while read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <Sizes defaultValue="small" isReadOnly onChange={onChange} />,
    );
    expect(radio('Family')).toBeDisabled();
    expect(radio('Small')).toBeEnabled();
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-readonly', 'true');
    await user.click(screen.getByText('Large'));
    expect(radio('Small')).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
    rerender(<Sizes defaultValue="small" isDisabled />);
    expect(radio('Small')).toBeDisabled();
    expect(group).toHaveAttribute('data-disabled', 'true');
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
    rerender(
      <Fieldset legend="Order" isDisabled>
        <Sizes defaultValue="small" />
      </Fieldset>,
    );
    expect(radio('Medium')).toBeDisabled();
  });

  it('UIC-CHOICE-GROUP-3.1 shows dirty state, restores, undoes and clears from the menu', async () => {
    const user = userEvent.setup();
    function Saved() {
      const [value, setValue] = useState<string | null>('small');
      return <Sizes value={value} onChange={setValue} committedValue="small" />;
    }
    const { container } = render(<Saved />);
    await user.click(screen.getByText('Large'));
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Size' }));
    expect(radio('Small')).toBeChecked();
    expect(radio('Small')).toHaveFocus();
    await user.keyboard('{Control>}z{/Control}');
    expect(radio('Large')).toBeChecked();
    expect(radio('Large')).toHaveFocus();
    await chooseFieldMenuItem(user, radio('Large'), 'Clear');
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
  });

  it('UIC-CHOICE-GROUP-3.2 focuses the radio Tab reaches when a form blocks its submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form aria-label="Order" validationBehavior="aria" onSubmit={onSubmit}>
        <ChoiceGroup label="Size" isRequired>
          <Choice value="small" isDisabled>
            Small
          </Choice>
          <Choice value="medium">Medium</Choice>
        </ChoiceGroup>
        <button type="submit">Order</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Order' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(radio('Medium')).toHaveFocus();
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
  });

  it('UIC-CHOICE-GROUP-3.2 gives the selected radio the custom validity of the native behavior', async () => {
    const user = userEvent.setup();
    render(
      <Form aria-label="Order">
        <Sizes
          defaultValue="large"
          validate={(value) =>
            value === 'large' ? { severity: 'error', message: 'Out of stock.' } : null
          }
        />
      </Form>,
    );
    expect(radio('Large').validationMessage).toBe('Out of stock.');
    expect(radio('Small').validationMessage).toBe('');
    await user.click(screen.getByText('Small'));
    expect(radio('Large').validationMessage).toBe('');
  });

  it('UIC-CHOICE-GROUP-3.3 counts an empty-string choice and submits nothing for a removed one', async () => {
    const user = userEvent.setup();
    const submitted: Array<FormDataEntryValue | null> = [];
    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitted.push(new FormData(event.currentTarget).get('size'));
    };
    const order = (choices: JSX.Element) => (
      <Form aria-label="Order" onSubmit={onSubmit}>
        <ChoiceGroup label="Size" name="size" defaultValue="" isRequired>
          {choices}
        </ChoiceGroup>
        <button type="submit">Order</button>
      </Form>
    );
    const { container, rerender } = render(
      order(
        <>
          <Choice value="">None</Choice>
          <Choice value="small">Small</Choice>
        </>,
      ),
    );
    expect(radio('None')).toBeChecked();
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    expect(root(container)).toHaveAttribute('data-filled', 'true');
    await user.click(screen.getByRole('button', { name: 'Order' }));
    expect(submitted).toEqual(['']);
    rerender(order(<Choice value="small">Small</Choice>));
    await waitFor(() => expect(root(container)).toHaveAttribute('data-validation', 'invalid'));
    expect(root(container)).not.toHaveAttribute('data-filled');
    await user.click(screen.getByRole('button', { name: 'Order' }));
    expect(submitted).toEqual(['']);
  });

  it('UIC-CHOICE-GROUP-3.3 submits a selected disabled choice through a hidden input', async () => {
    const user = userEvent.setup();
    const submitted: Array<FormDataEntryValue | null> = [];
    const { container } = render(
      <Form
        aria-label="Order"
        onSubmit={(event) => {
          event.preventDefault();
          submitted.push(new FormData(event.currentTarget).get('size'));
        }}
      >
        <ChoiceGroup label="Size" name="size" defaultValue="large" isRequired>
          <Choice value="small">Small</Choice>
          <Choice value="large" isDisabled>
            Large
          </Choice>
        </ChoiceGroup>
        <button type="submit">Order</button>
      </Form>,
    );
    expect(radio('Large')).toBeChecked();
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    await user.click(screen.getByRole('button', { name: 'Order' }));
    expect(submitted).toEqual(['large']);
    await user.click(screen.getByText('Small'));
    await user.click(screen.getByRole('button', { name: 'Order' }));
    expect(submitted).toEqual(['large', 'small']);
  });
});

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Form } from '../form/form.js';
import { NumberField } from './number-field.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

describe('NumberField range inputs', () => {
  it('UIC-NUMBER-FIELD-8.5 types a range into a start and an end input, kept in order and apart', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <NumberField
        range
        label="Price"
        description="In euros."
        maxValue={200}
        step={10}
        minStepsBetweenThumbs={1}
        defaultValue={[20, 60]}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    expect(root(container)).toHaveClass('ui-field', 'ui-number-field');
    expect(root(container)).toHaveAttribute('data-range');
    expect(root(container)).not.toHaveAttribute('data-display');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    const start = screen.getByRole('textbox', { name: 'Minimum Price' });
    const end = screen.getByRole('textbox', { name: 'Maximum Price' });
    expect(start).toHaveValue('20');
    expect(end).toHaveValue('60');
    expect(start).toHaveAccessibleDescription('In euros.');
    expect(screen.getByText('Price')).toHaveAttribute('for', start.id);
    await user.clear(start);
    await user.type(start, '90{Enter}');
    expect(onChange).toHaveBeenLastCalledWith([50, 60]);
    expect(onCommit).toHaveBeenLastCalledWith([50, 60]);
    expect(start).toHaveValue('50');
    end.focus();
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith([50, 70]);
    expectHooksMatchSpec(container, 'NUMBER-FIELD', {
      slots: ['endpoints', 'endpoint', 'separator', 'input'],
    });
  });

  it('UIC-NUMBER-FIELD-8.5 submits each end under its name and refuses edits while read-only', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      return [...new FormData(event.currentTarget).entries()];
    });
    const onChange = vi.fn();
    const { rerender } = render(
      <Form aria-label="Hours" onSubmit={onSubmit}>
        <NumberField
          range
          label="Hours"
          startName="from"
          endName="to"
          maxValue={24}
          defaultValue={[9, 17]}
        />
        <button type="submit">Send</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit.mock.results[0]?.value).toEqual([
      ['from', '9'],
      ['to', '17'],
    ]);
    rerender(
      <NumberField
        range
        label="Hours"
        isReadOnly
        maxValue={24}
        defaultValue={[9, 17]}
        onChange={onChange}
      />,
    );
    const start = screen.getByRole('textbox', { name: 'Minimum Hours' });
    start.focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).not.toHaveBeenCalled();
    expect(start).toHaveValue('9');
  });

  it('UIC-NUMBER-FIELD-5.4 edits a slider value in an input before the track', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <NumberField
        display="slider"
        label="Volume"
        name="volume"
        valueLabel="input"
        defaultValue={40}
        onCommit={onCommit}
      />,
    );
    expect(root(container)).toHaveAttribute('data-value-label', 'input');
    const typed = screen.getByRole('textbox', { name: 'Volume' });
    expect(typed).not.toHaveAttribute('name');
    expect(container.querySelector('output')).toBeNull();
    await user.clear(typed);
    await user.type(typed, '75{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith(75);
    const thumb = screen.getByRole('slider', { name: 'Volume' });
    expect(thumb).toHaveValue('75');
    expect(thumb).toHaveAttribute('name', 'volume');
    expect(typed.compareDocumentPosition(thumb) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expectHooksMatchSpec(container, 'NUMBER-FIELD', { slots: ['endpoints', 'endpoint'] });
  });
});

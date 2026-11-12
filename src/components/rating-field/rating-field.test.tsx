import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { chooseFieldMenuItem } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ThumbsDownGlyph, ThumbsUpGlyph } from '../../core/glyphs.js';
import { UiProvider } from '../../core/provider.js';
import { Form } from '../form/form.js';
import { RatingField, type RatingFieldProps } from './rating-field.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function radio(name: string) {
  return screen.getByRole<HTMLInputElement>('radio', { name });
}

function fills(container: HTMLElement) {
  return [...container.querySelectorAll('.ui-rating-field__item')].map((item) =>
    item.getAttribute('data-fill'),
  );
}

function Quality(props: Partial<RatingFieldProps>) {
  return <RatingField label="Quality" {...props} />;
}

describe('RatingField', () => {
  it('UIC-RATING-FIELD-1.1 is a field around a radio group of five ratings, none picked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(<Quality onChange={onChange} onCommit={onCommit} />);
    expect(root(container)).toHaveClass('ui-field', 'ui-rating-field');
    expect(root(container)).toHaveAttribute('data-step', 'whole');
    const group = screen.getByRole('radiogroup', { name: 'Quality' });
    expect(group).toHaveClass('ui-rating-field__group');
    expect(
      within(group)
        .getAllByRole('radio')
        .map((input) => input.getAttribute('value')),
    ).toEqual(['1', '2', '3', '4', '5']);
    expect(within(group).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    expect(fills(container)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
    await user.click(radio('4 out of 5'));
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect(onCommit).toHaveBeenLastCalledWith(4);
    expect(radio('4 out of 5')).toBeChecked();
    expect(fills(container)).toEqual(['full', 'full', 'full', 'full', 'empty']);
    expectHooksMatchSpec(container, 'RATING-FIELD', {
      slots: ['group', 'item', 'glyph', 'fill', 'radio'],
    });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control'] });
  });

  it('UIC-RATING-FIELD-1.2 takes a maximum and half steps', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Quality maxValue={3} step={0.5} onChange={onChange} />);
    expect(root(container)).toHaveAttribute('data-step', 'half');
    const values = screen.getAllByRole('radio').map((input) => input.getAttribute('value'));
    expect(values).toEqual(['0.5', '1', '1.5', '2', '2.5', '3']);
    expect(radio('1.5 out of 3').closest('label')).toHaveAttribute('data-half', 'true');
    await user.click(radio('2.5 out of 3'));
    expect(onChange).toHaveBeenLastCalledWith(2.5);
    expect(fills(container)).toEqual(['full', 'full', 'partial']);
    const partial = container.querySelectorAll<HTMLElement>('.ui-rating-field__item')[2];
    expect(partial?.style.getPropertyValue('--ui-rating-fill')).toBe('50%');
    expectHooksMatchSpec(container, 'RATING-FIELD');
  });

  it('UIC-RATING-FIELD-1.3 rounds a given value to a pick and reads zero or less as none', () => {
    const { container, rerender } = render(<Quality value={3.4} />);
    expect(radio('3 out of 5')).toBeChecked();
    rerender(<Quality value={3.4} step={0.5} />);
    expect(radio('3.5 out of 5')).toBeChecked();
    rerender(<Quality value={9} />);
    expect(radio('5 out of 5')).toBeChecked();
    rerender(<Quality value={0} />);
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    expect(fills(container)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
    rerender(<Quality value={Number.NaN} maxValue={0} />);
    expect(screen.getAllByRole('radio')).toHaveLength(1);
  });

  it('UIC-RATING-FIELD-1.4 submits the picked rating under its name', async () => {
    const user = userEvent.setup();
    const submitted: Array<FormDataEntryValue | null> = [];
    render(
      <Form
        aria-label="Review"
        onSubmit={(event) => {
          event.preventDefault();
          submitted.push(new FormData(event.currentTarget).get('quality'));
        }}
      >
        <Quality name="quality" />
        <button type="submit">Send</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await user.click(radio('2 out of 5'));
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(submitted).toEqual([null, '2']);
  });

  it('UIC-RATING-FIELD-1.5 draws custom glyphs, filled and empty', () => {
    const { container, rerender } = render(<Quality icon={ThumbsUpGlyph} defaultValue={2} />);
    const item = container.querySelector('.ui-rating-field__item');
    expect(item?.querySelector('.ui-rating-field__glyph')).toHaveAttribute('aria-hidden', 'true');
    expect(item?.querySelector('.ui-rating-field__fill')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('svg[data-glyph="thumbs-up"]')).toHaveLength(10);
    rerender(<Quality icon={ThumbsUpGlyph} emptyIcon={ThumbsDownGlyph} defaultValue={2} />);
    expect(item?.querySelector('.ui-rating-field__glyph')).toHaveAttribute(
      'data-glyph',
      'thumbs-down',
    );
    expect(item?.querySelector('.ui-rating-field__fill')).toHaveAttribute(
      'data-glyph',
      'thumbs-up',
    );
    expect(container.querySelector('[data-glyph="star"]')).toBeNull();
  });

  it('UIC-RATING-FIELD-1.6 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(<Quality id="quality" className="wide" data-test="rating" />);
    expect(root(container)).toHaveClass('ui-rating-field', 'wide');
    expect(root(container)).toHaveAttribute('id', 'quality');
    expect(root(container)).toHaveAttribute('data-test', 'rating');
    expectHooksMatchSpec(container, 'RATING-FIELD', { callerAttributes: ['data-test'] });
  });

  it('UIC-RATING-FIELD-2.1 previews a hovered rating and restores the picked one on leaving', async () => {
    const user = userEvent.setup();
    const { container } = render(<Quality defaultValue={2} />);
    const group = screen.getByRole('radiogroup');
    await user.hover(radio('4 out of 5').closest('label') as HTMLElement);
    expect(fills(container)).toEqual(['full', 'full', 'full', 'full', 'empty']);
    expect(group).toHaveAttribute('data-previewing', 'true');
    expect(radio('2 out of 5')).toBeChecked();
    await user.unhover(radio('4 out of 5').closest('label') as HTMLElement);
    expect(fills(container)).toEqual(['full', 'full', 'empty', 'empty', 'empty']);
    expect(group).not.toHaveAttribute('data-previewing');
  });

  it('UIC-RATING-FIELD-2.1 previews nothing while read-only', async () => {
    const user = userEvent.setup();
    const { container } = render(<Quality defaultValue={2} isReadOnly />);
    await user.hover(radio('4 out of 5').closest('label') as HTMLElement);
    expect(fills(container)).toEqual(['full', 'full', 'empty', 'empty', 'empty']);
  });

  it('UIC-RATING-FIELD-2.2 enters on the picked rating and steps with the arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <Quality defaultValue={3} onChange={onChange} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(radio('3 out of 5')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(radio('4 out of 5')).toBeChecked();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(2);
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-RATING-FIELD-2.2 enters on the first rating while none is picked and mirrors right to left', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <UiProvider locale="ar-EG">
        <div dir="rtl">
          <Quality onChange={onChange} />
        </div>
      </UiProvider>,
    );
    await user.tab();
    const first = screen.getAllByRole('radio')[0];
    expect(first).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('UIC-RATING-FIELD-2.3 disables every rating and refuses picks while read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(<Quality isDisabled onChange={onChange} />);
    for (const input of screen.getAllByRole('radio')) expect(input).toBeDisabled();
    unmount();
    render(<Quality isReadOnly defaultValue={1} onChange={onChange} />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true');
    await user.click(radio('5 out of 5'));
    expect(onChange).not.toHaveBeenCalled();
    expect(radio('1 out of 5')).toBeChecked();
  });

  it('UIC-RATING-FIELD-3.1 validates a required rating, restores, undoes and clears from the menu', async () => {
    const user = userEvent.setup();
    function Saved() {
      const [value, setValue] = useState<number | null>(3);
      return <Quality showRestoreButton value={value} onChange={setValue} committedValue={3} />;
    }
    const { container } = render(<Saved />);
    await user.click(radio('5 out of 5'));
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Quality' }));
    expect(radio('3 out of 5')).toBeChecked();
    expect(radio('3 out of 5')).toHaveFocus();
    await user.keyboard('{Control>}z{/Control}');
    expect(radio('5 out of 5')).toBeChecked();
    await chooseFieldMenuItem(user, radio('5 out of 5'), 'Clear');
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
  });

  it('UIC-RATING-FIELD-3.1 reports a required field without a rating', async () => {
    const user = userEvent.setup();
    const { container } = render(<Quality isRequired />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAccessibleErrorMessage('A value is required.');
    await user.click(radio('1 out of 5'));
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    expect(group).not.toHaveAttribute('aria-invalid');
  });
});

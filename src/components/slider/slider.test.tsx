import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Fieldset } from '../field/field.js';
import { Form } from '../form/form.js';
import { RangeSlider, Slider, keepThumbsApart, type RangeValue } from './slider.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function thumbs() {
  return screen.getAllByRole<HTMLInputElement>('slider');
}

function thumbOf(input: HTMLElement) {
  return input.closest<HTMLElement>('.ui-slider__thumb');
}

describe('Slider', () => {
  it('UIC-SLIDER-1.1 is a field around a slider that starts at the minimum and commits each move', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const onChangeEnd = vi.fn();
    const { container } = render(
      <Slider
        label="Volume"
        minValue={10}
        onChange={onChange}
        onCommit={onCommit}
        onChangeEnd={onChangeEnd}
      />,
    );
    expect(root(container)).toHaveClass('ui-field', 'ui-slider');
    const group = screen.getByRole('group', { name: 'Volume' });
    expect(group).toHaveClass('ui-slider__box');
    const [thumb] = thumbs();
    expect(thumb).toHaveValue('10');
    await user.tab();
    expect(thumb).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(11);
    expect(onCommit).toHaveBeenLastCalledWith(11);
    expect(onChangeEnd).toHaveBeenLastCalledWith(11);
    expect(thumb).toHaveValue('11');
    expectHooksMatchSpec(container, 'SLIDER', {
      slots: ['box', 'output', 'track', 'fill', 'thumb'],
    });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control', 'message'] });
  });

  it('UIC-SLIDER-1.2 keeps the value within its range and step and formats it', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        label="Opacity"
        minValue={0}
        maxValue={1}
        step={0.25}
        defaultValue={0.5}
        formatOptions={{ style: 'percent' }}
      />,
    );
    const [thumb] = thumbs();
    expect(thumb).toHaveAttribute('min', '0');
    expect(thumb).toHaveAttribute('max', '1');
    expect(thumb).toHaveAttribute('step', '0.25');
    expect(thumb).toHaveAttribute('aria-valuetext', '50%');
    expect(document.querySelector('output')).toHaveTextContent('50%');
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(thumb).toHaveAttribute('aria-valuetext', '100%');
  });

  it('UIC-SLIDER-1.2 validates and submits the value it shows, snapped, clamped and in order', () => {
    const seen: unknown[] = [];
    const validate = (value: unknown) => {
      seen.push(value);
      return null;
    };
    const { rerender } = render(<Slider label="Level" value={200} validate={validate} />);
    expect(seen.at(-1)).toBe(100);
    expect(thumbs()[0]).toHaveValue('100');
    rerender(<Slider label="Level" value={33} step={10} validate={validate} />);
    expect(seen.at(-1)).toBe(30);
    expect(thumbs()[0]).toHaveValue('30');
    rerender(<RangeSlider label="Level" value={[80, 20]} validate={validate} />);
    expect(seen.at(-1)).toEqual([20, 80]);
    expect(thumbs().map((thumb) => thumb.value)).toEqual(['20', '80']);
  });

  it('UIC-SLIDER-1.2 moves a held value onto a narrowed range as a change', () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container, rerender } = render(
      <Slider label="Level" defaultValue={80} onChange={onChange} onCommit={onCommit} />,
    );
    rerender(
      <Slider
        label="Level"
        defaultValue={80}
        maxValue={50}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    expect(onChange).toHaveBeenLastCalledWith(50);
    expect(onCommit).not.toHaveBeenCalled();
    expect(thumbs()[0]).toHaveValue('50');
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
  });

  it('UIC-SLIDER-1.2 moves a non-finite value onto the grid as a change', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Slider label="Level" minValue={10} value={Number.NaN} onChange={onChange} />,
    );
    expect(onChange).toHaveBeenLastCalledWith(10);
    expect(thumbs()[0]).toHaveValue('10');
    rerender(<RangeSlider label="Level" value={[20, Infinity]} onChange={onChange} />);
    expect(onChange).toHaveBeenLastCalledWith([20, 100]);
    expect(thumbs().map((thumb) => thumb.value)).toEqual(['20', '100']);
  });

  it('UIC-SLIDER-1.3 sizes the fill from the minimum or the fill offset and positions the thumb', () => {
    const { container, rerender } = render(<Slider label="Volume" defaultValue={30} />);
    const fill = container.querySelector<HTMLElement>('.ui-slider__fill');
    expect(fill?.style.insetInlineStart).toBe('0%');
    expect(fill?.style.width).toBe('30%');
    expect(thumbOf(thumbs()[0] as HTMLElement)?.style.left).toBe('30%');
    rerender(
      <Slider
        key="balance"
        label="Balance"
        minValue={-50}
        maxValue={50}
        fillOffset={0}
        defaultValue={-20}
      />,
    );
    const offset = container.querySelector<HTMLElement>('.ui-slider__fill');
    expect(offset?.style.insetInlineStart).toBe('30%');
    expect(offset?.style.width).toBe('20%');
  });

  it('UIC-SLIDER-1.4 shows the value in an output, on each thumb or nowhere', () => {
    const { container, rerender } = render(<Slider label="Volume" defaultValue={40} />);
    expect(root(container)).toHaveAttribute('data-value-label', 'output');
    const output = container.querySelector('output');
    expect(output).toHaveClass('ui-slider__output');
    expect(output).toHaveTextContent('40');
    expect(output).toHaveAttribute('for', thumbs()[0]?.id);
    rerender(<Slider label="Volume" defaultValue={40} valueLabel="thumb" />);
    expect(root(container)).toHaveAttribute('data-value-label', 'thumb');
    expect(container.querySelector('output')).toBeNull();
    const label = container.querySelector('.ui-slider__thumb-label');
    expect(label).toHaveTextContent('40');
    expect(label).toHaveAttribute('aria-hidden', 'true');
    expect(thumbs()[0]).toHaveAccessibleName('Volume');
    expectHooksMatchSpec(container, 'SLIDER', { slots: ['thumb-label'] });
    rerender(<Slider label="Volume" defaultValue={40} valueLabel="none" />);
    expect(container.querySelector('output, .ui-slider__thumb-label')).toBeNull();
  });

  it('UIC-SLIDER-1.5 draws marks with labels at their values, in range up to the value', () => {
    const marks = [{ value: 0, label: 'Quiet' }, { value: 50 }, { value: 100, label: 'Loud' }];
    const { container, rerender } = render(
      <Slider label="Volume" defaultValue={50} marks={marks} />,
    );
    const drawn = [...container.querySelectorAll<HTMLElement>('.ui-slider__mark')];
    expect(drawn.map((mark) => mark.style.insetInlineStart)).toEqual(['0%', '50%', '100%']);
    expect(drawn.map((mark) => mark.hasAttribute('data-in-range'))).toEqual([true, true, false]);
    expect(drawn.map((mark) => mark.textContent)).toEqual(['Quiet', '', 'Loud']);
    expect(drawn[0]).toHaveAttribute('aria-hidden', 'true');
    expect(drawn[0]?.parentElement).toHaveClass('ui-slider__track');
    expectHooksMatchSpec(container, 'SLIDER', { slots: ['mark', 'mark-label'] });
    rerender(<Slider label="Volume" defaultValue={50} marks={marks} orientation="vertical" />);
    const vertical = container.querySelectorAll<HTMLElement>('.ui-slider__mark');
    expect([...vertical].map((mark) => mark.style.bottom)).toEqual(['0%', '50%', '100%']);
  });

  it('UIC-SLIDER-1.6 lays out vertically, steps on the vertical axis and publishes its size', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Slider label="Level" orientation="vertical" size="lg" defaultValue={5} />,
    );
    expect(root(container)).toHaveAttribute('data-size', 'lg');
    for (const part of ['box', 'track', 'fill', 'output']) {
      expect(container.querySelector(`.ui-slider__${part}`)).toHaveAttribute(
        'data-orientation',
        'vertical',
      );
    }
    const [thumb] = thumbs();
    expect(thumb).toHaveAttribute('aria-orientation', 'vertical');
    await user.tab();
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}');
    expect(thumb).toHaveValue('6');
    expectHooksMatchSpec(container, 'SLIDER');
  });

  it('UIC-SLIDER-1.7 forwards the class name, data attributes and id', () => {
    const { container } = render(
      <Slider
        id="volume"
        label="Volume"
        className="wide"
        data-test="slider"
        aria-details="volume-help"
      />,
    );
    expect(root(container)).toHaveClass('ui-slider', 'wide');
    expect(root(container)).toHaveAttribute('id', 'volume');
    expect(root(container)).toHaveAttribute('data-test', 'slider');
    expect(screen.getByRole('group')).toHaveAttribute('id', 'volume-control');
    expect(thumbs()[0]).toHaveAttribute('id', 'volume-control-0');
    expect(thumbs()[0]).toHaveAttribute('aria-details', 'volume-help');
    expectHooksMatchSpec(container, 'SLIDER', { callerAttributes: ['data-test'] });
  });

  it('UIC-SLIDER-2.1 names and describes each thumb and reports an invalid value', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        label="Volume"
        description="Loudness of alerts."
        defaultValue={90}
        validate={(value) =>
          value > 80 ? { severity: 'error', message: 'Too loud for alerts.' } : null
        }
      />,
    );
    const [thumb] = thumbs();
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Volume');
    expect(thumb).toHaveAccessibleName('Volume');
    expect(thumb).toHaveAccessibleDescription('Loudness of alerts. Too loud for alerts.');
    expect(thumb).toHaveAttribute('aria-invalid', 'true');
    expect(thumb).toHaveAccessibleErrorMessage('Too loud for alerts.');
    expect(thumb).toHaveAttribute('aria-valuetext', '90');
    await user.tab();
    await user.keyboard('{Home}');
    expect(thumb).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-SLIDER-2.2 steps with the arrows, Page keys, Shift and Home and End, and shows keyboard focus', async () => {
    const user = userEvent.setup();
    render(<Slider label="Volume" defaultValue={50} />);
    const [thumb] = thumbs();
    await user.tab();
    expect(thumbOf(thumb as HTMLElement)).toHaveAttribute('data-focus-visible', 'true');
    expect(thumbOf(thumb as HTMLElement)).toHaveAttribute('data-focused', 'true');
    await user.keyboard('{ArrowRight}{ArrowUp}');
    expect(thumb).toHaveValue('52');
    await user.keyboard('{ArrowLeft}');
    expect(thumb).toHaveValue('51');
    await user.keyboard('{PageUp}');
    expect(thumb).toHaveValue('61');
    await user.keyboard('{PageDown}{PageDown}');
    expect(thumb).toHaveValue('41');
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(thumb).toHaveValue('51');
    await user.keyboard('{End}');
    expect(thumb).toHaveValue('100');
    await user.keyboard('{Home}');
    expect(thumb).toHaveValue('0');
  });

  it('UIC-SLIDER-2.3 disables its thumbs and refuses changes while read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    const { container, rerender } = render(<Slider label="Volume" defaultValue={50} isDisabled />);
    expect(thumbs()[0]).toBeDisabled();
    for (const part of ['box', 'track', 'fill', 'output', 'thumb']) {
      expect(container.querySelector(`.ui-slider__${part}`)).toHaveAttribute(
        'data-disabled',
        'true',
      );
    }
    rerender(
      <Slider
        label="Volume"
        defaultValue={50}
        isReadOnly
        onChange={onChange}
        onChangeEnd={onChangeEnd}
      />,
    );
    const [thumb] = thumbs();
    expect(thumb).toBeEnabled();
    await user.tab();
    expect(thumb).toHaveFocus();
    await user.keyboard('{ArrowRight}{End}');
    expect(thumb).toHaveValue('50');
    expect(onChange).not.toHaveBeenCalled();
    expect(onChangeEnd).not.toHaveBeenCalled();
    expect(root(container)).toHaveAttribute('data-readonly', 'true');
  });

  it('UIC-SLIDER-3.1 shows validation, restores, undoes and sets the default from the menu', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Slider
        label="Volume"
        committedValue={20}
        defaultValue={50}
        menu={['set-default']}
        validate={(value) =>
          value > 20 ? { severity: 'warning', message: 'Louder than usual.' } : null
        }
      />,
    );
    const [thumb] = thumbs();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    expect(root(container)).toHaveAttribute('data-validation', 'warning');
    await user.click(screen.getByRole('button', { name: 'Restore Volume' }));
    expect(thumb).toHaveValue('20');
    expect(thumb).toHaveFocus();
    await user.keyboard('{Control>}z{/Control}');
    expect(thumb).toHaveValue('21');
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(thumb).toHaveValue('20');
    await user.click(screen.getByRole('button', { name: 'Volume actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Set to default' }));
    expect(thumb).toHaveValue('50');
  });

  it('UIC-SLIDER-3.2 submits under its names, blocks an invalid submit and follows a disabled fieldset', async () => {
    const user = userEvent.setup();
    let submitted: string[][] = [];
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      submitted = ['volume', 'price-from', 'price-to'].map((name) => data.getAll(name) as string[]);
    });
    const { rerender } = render(
      <Form aria-label="Filter" validationBehavior="aria" onSubmit={onSubmit}>
        <Slider label="Volume" name="volume" defaultValue={30} />
        <RangeSlider
          label="Price"
          startName="price-from"
          endName="price-to"
          defaultValue={[20, 80]}
          validate={([start]) => (start < 30 ? { severity: 'error', message: 'Too low.' } : null)}
        />
        <button type="submit">Apply</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onSubmit).not.toHaveBeenCalled();
    const start = screen.getByRole('slider', { name: 'Minimum Price' });
    expect(start).toHaveFocus();
    await user.keyboard('{PageUp}');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(submitted).toEqual([['30'], ['30'], ['80']]);
    rerender(
      <Form aria-label="Filter">
        <Fieldset legend="Sound" isDisabled>
          <Slider label="Volume" name="volume" defaultValue={30} />
        </Fieldset>
      </Form>,
    );
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeDisabled();
  });

  it('UIC-SLIDER-3.2 shows the errors a form gives under either end name until that end moves', async () => {
    const user = userEvent.setup();
    render(
      <Form
        aria-label="Filter"
        validationErrors={{ 'price-from': 'Too low.', 'price-to': 'Too high.' }}
      >
        <RangeSlider
          label="Price"
          startName="price-from"
          endName="price-to"
          defaultValue={[20, 80]}
        />
      </Form>,
    );
    expect(screen.getByText('Too low.')).toBeInTheDocument();
    await user.click(screen.getByRole('slider', { name: 'Minimum Price' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.queryByText('Too low.')).not.toBeInTheDocument();
    expect(screen.getByText('Too high.')).toBeInTheDocument();
  });

  it('UIC-SLIDER-3.2 gives the first thumb the custom validity of the native behavior', () => {
    render(
      <Form aria-label="Sound">
        <Slider
          label="Volume"
          defaultValue={90}
          validate={(value) => (value > 80 ? { severity: 'error', message: 'Too loud.' } : null)}
        />
      </Form>,
    );
    const [thumb] = thumbs();
    expect((thumb as HTMLInputElement).validationMessage).toBe('Too loud.');
  });
});

describe('RangeSlider', () => {
  it('UIC-SLIDER-4.1 UIC-SLIDER-4.4 draws two named thumbs over the whole range by default', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(<RangeSlider label="Price" maxValue={200} onCommit={onCommit} />);
    expect(root(container)).toHaveClass('ui-field', 'ui-slider', 'ui-range-slider');
    const [start, end] = thumbs();
    expect(start).toHaveAccessibleName('Minimum Price');
    expect(end).toHaveAccessibleName('Maximum Price');
    expect(start).toHaveValue('0');
    expect(end).toHaveValue('200');
    expect(container.querySelector('output')).toHaveTextContent('0–200');
    await user.tab();
    await user.keyboard('{PageUp}');
    expect(onCommit).toHaveBeenLastCalledWith([20, 200]);
    const fill = container.querySelector<HTMLElement>('.ui-slider__fill');
    expect(fill?.style.insetInlineStart).toBe('10%');
    expect(fill?.style.width).toBe('90%');
    expectHooksMatchSpec(container, 'SLIDER', {
      slots: ['box', 'output', 'track', 'fill', 'thumb'],
    });
  });

  it('UIC-SLIDER-4.1 marks the range between the thumbs', () => {
    const { container } = render(
      <RangeSlider
        label="Price"
        defaultValue={[20, 60]}
        marks={[{ value: 0 }, { value: 40 }, { value: 80 }]}
      />,
    );
    const marks = [...container.querySelectorAll('.ui-slider__mark')];
    expect(marks.map((mark) => mark.hasAttribute('data-in-range'))).toEqual([false, true, false]);
  });

  it('UIC-SLIDER-4.2 stops each thumb at the other', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<RangeValue>([40, 45]);
      return <RangeSlider label="Price" value={value} onChange={setValue} />;
    }
    render(<Controlled />);
    const [start, end] = thumbs();
    expect(start).toHaveAttribute('max', '45');
    expect(end).toHaveAttribute('min', '40');
    await user.tab();
    await user.keyboard('{End}');
    expect(start).toHaveValue('45');
    await user.keyboard('{PageUp}');
    expect(start).toHaveValue('45');
    await user.tab();
    await user.keyboard('{Home}');
    expect(end).toHaveValue('45');
  });

  it('UIC-SLIDER-4.3 keeps the thumbs a number of steps apart', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RangeSlider
        label="Price"
        step={5}
        minStepsBetweenThumbs={2}
        defaultValue={[20, 60]}
        onChange={onChange}
      />,
    );
    const [start, end] = thumbs();
    await user.tab();
    await user.keyboard('{End}');
    expect(start).toHaveValue('50');
    expect(onChange).toHaveBeenLastCalledWith([50, 60]);
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(end).toHaveValue('60');
    await user.keyboard('{End}{Home}');
    expect(end).toHaveValue('60');
  });

  it('UIC-SLIDER-4.3 keeps a spaced fractional range on the step grid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    render(
      <RangeSlider
        label="Share"
        minValue={0}
        maxValue={1}
        step={0.1}
        minStepsBetweenThumbs={1}
        defaultValue={[0.1, 0.3]}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
      />,
    );
    await user.tab();
    await user.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith([0.2, 0.3]);
    expect(onChangeEnd).toHaveBeenLastCalledWith([0.2, 0.3]);
    expect(thumbs().map((thumb) => thumb.value)).toEqual(['0.2', '0.3']);
  });

  it('UIC-SLIDER-4.3 holds back the thumb that moved', () => {
    const bounds = { distance: 10, minValue: 0, maxValue: 100 };
    expect(keepThumbsApart([55, 60], [40, 60], bounds)).toEqual([50, 60]);
    expect(keepThumbsApart([40, 45], [40, 60], bounds)).toEqual([40, 50]);
    expect(keepThumbsApart([30, 60], [40, 60], bounds)).toEqual([30, 60]);
    expect(keepThumbsApart([5, 8], [0, 5], { ...bounds, minValue: 0 })).toEqual([5, 8]);
    expect(keepThumbsApart([3, 5], [0, 5], bounds)).toEqual([0, 5]);
    expect(keepThumbsApart([95, 99], [95, 100], bounds)).toEqual([95, 100]);
  });

  it('UIC-SLIDER-4.3 moves thumbs already too close one step at a time, never closer', () => {
    const bounds = { distance: 20, minValue: 0, maxValue: 100 };
    expect(keepThumbsApart([45, 51], [45, 50], bounds)).toEqual([45, 51]);
    expect(keepThumbsApart([44, 50], [45, 50], bounds)).toEqual([44, 50]);
    expect(keepThumbsApart([45, 49], [45, 50], bounds)).toEqual([45, 50]);
    expect(keepThumbsApart([46, 50], [45, 50], bounds)).toEqual([45, 50]);
    expect(keepThumbsApart([81, 100], [80, 100], { ...bounds, distance: 30 })).toEqual([80, 100]);
  });
});

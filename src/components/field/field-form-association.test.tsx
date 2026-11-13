import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { BooleanField } from '../boolean-field/boolean-field.js';
import { CascaderField } from '../cascader-field/cascader-field.js';
import { Choice, ChoiceGroup } from '../choice-group/choice-group.js';
import { CodeEditor } from '../code-editor/code-editor.js';
import { ColorField } from '../color-field/color-field.js';
import { Combobox } from '../combobox/combobox.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { DecimalField } from '../decimal-field/decimal-field.js';
import { ExpressionField } from '../expression-field/expression-field.js';
import { FileUpload } from '../file-upload/file-upload.js';
import { Form } from '../form/form.js';
import { MaskedTextField } from '../masked-text-field/masked-text-field.js';
import { MultiDateField } from '../multi-date-field/multi-date-field.js';
import { NumberField } from '../number-field/number-field.js';
import { PinInput } from '../pin-input/pin-input.js';
import { RatingField } from '../rating-field/rating-field.js';
import { RichTextEditor } from '../rich-text-editor/rich-text-editor.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { SelectField } from '../select-field/select-field.js';
import { SignaturePad } from '../signature-pad/signature-pad.js';
import { Switch } from '../switch/switch.js';
import { TagsInput } from '../tags-input/tags-input.js';
import { TextField } from '../text-field/text-field.js';

const owner = () => document.getElementById('owner') as HTMLFormElement;
const entries = () =>
  [...new FormData(owner()).entries()].map(([name, value]) => [name, String(value)]);

/** Fields rendered after the form, outside it, each naming it. */
const controls: Array<[string, ReactNode, string[][]]> = [
  [
    'TextField',
    <TextField key="a" label="A" name="a" form="owner" defaultValue="x" />,
    [['a', 'x']],
  ],
  [
    'NumberField',
    <NumberField key="n" label="N" name="n" form="owner" defaultValue={5} />,
    [['n', '5']],
  ],
  [
    'NumberField with step values',
    <NumberField
      key="s"
      label="S"
      name="s"
      form="owner"
      stepValues={[8, 10, 12]}
      defaultValue={10}
    />,
    [['s', '10']],
  ],
  [
    'NumberField range',
    <NumberField
      key="b"
      range
      label="B"
      startName="from"
      endName="to"
      form="owner"
      defaultValue={[1, 2]}
    />,
    [
      ['from', '1'],
      ['to', '2'],
    ],
  ],
  [
    'NumberField slider range',
    <NumberField
      key="c"
      range
      display="slider"
      label="C"
      startName="low"
      endName="high"
      form="owner"
      defaultValue={[3, 4]}
    />,
    [
      ['low', '3'],
      ['high', '4'],
    ],
  ],
  [
    'DecimalField',
    <DecimalField key="d" label="D" name="d" form="owner" defaultValue="1.5" />,
    [['d', '1.5']],
  ],
  [
    'TagsInput',
    <TagsInput
      key="e"
      label="E"
      name="e"
      form="owner"
      defaultValue={['p', 'p']}
      allowsDuplicates
    />,
    [
      ['e', 'p'],
      ['e', 'p'],
    ],
  ],
  [
    'SelectField',
    <SelectField
      key="f"
      label="F"
      name="f"
      form="owner"
      options={[{ id: 'pear', label: 'Pear' }]}
      defaultValue="pear"
    />,
    [['f', 'pear']],
  ],
  [
    'BooleanField',
    <BooleanField key="g" label="G" name="g" form="owner" variant="checkbox" value />,
    [['g', 'true']],
  ],
  [
    'DateTimeField range',
    <DateTimeField
      key="h"
      label="H"
      mode="date-range"
      startName="start"
      endName="end"
      form="owner"
      defaultValue={{ start: '2028-02-28', end: '2028-02-29' }}
    />,
    [
      ['start', '2028-02-28'],
      ['end', '2028-02-29'],
    ],
  ],
  [
    'MaskedTextField raw',
    <MaskedTextField key="i" label="I" mask="99-99" name="i" form="owner" defaultValue="1234" />,
    [['i', '1234']],
  ],
  [
    'RatingField',
    <RatingField key="j" label="J" name="j" form="owner" defaultValue={3} />,
    [['j', '3']],
  ],
  [
    'PinInput',
    <PinInput key="k" label="K" length={2} name="k" form="owner" defaultValue="12" />,
    [['k', '12']],
  ],
  [
    'ColorField',
    <ColorField key="l" label="L" name="l" form="owner" defaultValue="#336699" />,
    [['l', '#336699']],
  ],
  [
    'MultiDateField',
    <MultiDateField key="m" label="M" name="m" form="owner" defaultValue={['2028-01-01']} />,
    [['m', '2028-01-01']],
  ],
  [
    'CascaderField',
    <CascaderField
      key="n"
      label="N"
      name="n"
      form="owner"
      options={[{ id: 'top', label: 'Top', children: [{ id: 'leaf', label: 'Leaf' }] }]}
      defaultValue={['top', 'leaf']}
    />,
    [['n', 'leaf']],
  ],
  [
    'ChoiceGroup',
    <ChoiceGroup key="o" label="O" name="o" form="owner" defaultValue="small">
      <Choice value="small">Small</Choice>
    </ChoiceGroup>,
    [['o', 'small']],
  ],
  [
    'Combobox',
    <Combobox
      key="p"
      label="P"
      name="p"
      form="owner"
      defaultItems={[{ id: 'kiwi', label: 'Kiwi' }]}
      defaultValue="kiwi"
    />,
    [['p', 'kiwi']],
  ],
];

describe('Field form association', () => {
  it.each(controls)(
    'UIC-FIELD-8.5 %s submits every input with the form it names, from outside it',
    (_name, control, expected) => {
      render(
        <>
          <form id="owner" aria-label="Owner" />
          <form aria-label="Around">{control}</form>
        </>,
      );
      expect(entries()).toEqual(expected);
      const around = screen.getByRole<HTMLFormElement>('form', { name: 'Around' });
      expect([...new FormData(around).keys()]).toEqual([]);
    },
  );

  it('UIC-FIELD-8.5 names the form on the inputs of editors, uploads and standalone controls', () => {
    render(
      <>
        <form id="owner" aria-label="Owner" />
        <SegmentedChoice
          aria-label="View"
          name="view"
          form="owner"
          options={[{ value: 'day', label: 'Day' }]}
          defaultValue="day"
        />
        <ExpressionField label="Ratio" name="ratio" form="owner" defaultValue="1" />
        <Switch name="alerts" form="owner" defaultSelected>
          Alerts
        </Switch>
        <SignaturePad label="Signature" name="signature" form="owner" />
        <RichTextEditor label="Notes" name="notes" form="owner" />
        <CodeEditor label="Source" name="source" form="owner" defaultValue="1" />
        <FileUpload label="Files" name="files" form="owner" onSelect={() => {}} />
      </>,
    );
    const named = [...document.querySelectorAll('[name]')];
    expect(named.map((element) => element.getAttribute('name'))).toEqual([
      'view',
      'ratio',
      'alerts',
      'signature',
      'notes',
      'source',
      'files',
    ]);
    for (const element of named) expect(element).toHaveAttribute('form', 'owner');
  });

  it('UIC-FIELD-8.5 follows the form id as it changes and belongs to no form for a missing id', () => {
    function Moving({ form }: { form: string }) {
      return (
        <>
          <form id="owner" aria-label="Owner" />
          <form id="other" aria-label="Other" />
          <form aria-label="Around">
            <TagsInput label="Fruit" name="fruit" form={form} defaultValue={['Fig']} />
          </form>
        </>
      );
    }
    const { rerender } = render(<Moving form="owner" />);
    const data = (name: string) => [
      ...new FormData(screen.getByRole<HTMLFormElement>('form', { name })).keys(),
    ];
    expect(data('Owner')).toEqual(['fruit']);
    rerender(<Moving form="other" />);
    expect(data('Owner')).toEqual([]);
    expect(data('Other')).toEqual(['fruit']);
    rerender(<Moving form="nowhere" />);
    expect([data('Owner'), data('Other'), data('Around')]).toEqual([[], [], []]);
  });

  it('UIC-FIELD-8.5 resets with the form it names and blocks its native validity', async () => {
    const user = userEvent.setup();
    render(
      <>
        <form id="owner" aria-label="Owner" />
        <Form aria-label="Around">
          <TextField label="Code" name="code" form="owner" defaultValue="ab" isRequired />
          <TagsInput label="Fruit" name="fruit" form="owner" defaultValue={['Fig']} />
        </Form>
      </>,
    );
    await user.clear(screen.getByRole('textbox', { name: 'Code' }));
    await user.click(screen.getByRole('button', { name: /Remove Fig/ }));
    expect(owner().checkValidity()).toBe(false);
    await act(async () => {
      owner().reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByRole('textbox', { name: 'Code' })).toHaveValue('ab');
    expect(entries()).toEqual([
      ['code', 'ab'],
      ['fruit', 'Fig'],
    ]);
    expect(owner().checkValidity()).toBe(true);
  });

  it('UIC-FIELD-8.5 leaves a disabled field out of the form it names', () => {
    function Toggle() {
      const [isDisabled, setDisabled] = useState(true);
      return (
        <>
          <form id="owner" aria-label="Owner" />
          <TagsInput
            label="Fruit"
            name="fruit"
            form="owner"
            defaultValue={['Fig']}
            isDisabled={isDisabled}
          />
          <button type="button" onClick={() => setDisabled(false)}>
            Enable
          </button>
        </>
      );
    }
    render(<Toggle />);
    expect(entries()).toEqual([]);
    act(() => screen.getByRole('button', { name: 'Enable' }).click());
    expect(entries()).toEqual([['fruit', 'Fig']]);
  });
});

import { useState, type JSX, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
import {
  Radio,
  RadioGroup,
  type RadioGroupSize,
  type RadioRenderState,
} from '../../src/components/radio-group/radio-group.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly RadioGroupSize[];
const orientations = ['vertical', 'horizontal'] as const;

function Output({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

function Fruit() {
  return (
    <>
      <Radio value="apple">Apple</Radio>
      <Radio value="pear">Pear</Radio>
      <Radio value="plum">Plum</Radio>
    </>
  );
}

function Sample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState<string | null>(state, {
    value: 'apple',
    edited: 'pear',
    invalid: 'plum',
    warning: 'pear',
    empty: null,
  });
  return (
    <RadioGroup label="Fruit" labelLayout={layout} {...props}>
      <Fruit />
    </RadioGroup>
  );
}

/** Rich labels with a price, a description under each plan and one plan that cannot be picked. */
function Plans() {
  const [value, setValue] = useState<string | null>('team');
  return (
    <>
      <RadioGroup
        label="Plan"
        value={value}
        onChange={setValue}
        description="Every plan includes the starter recipes."
        data-lab-field="plans"
      >
        <Radio value="solo" description="One cook, unlimited recipes.">
          Solo <strong>€4 a month</strong>
        </Radio>
        <Radio value="family" description="Sold out this month." isDisabled>
          Family <strong>€9 a month</strong>
        </Radio>
        <Radio value="team" description="Up to ten cooks with shared shopping lists.">
          Team <strong>€19 a month</strong>
        </Radio>
        <Radio value="kitchen" description="Unlimited cooks and a printed menu each week.">
          Kitchen <strong>€49 a month</strong>
        </Radio>
      </RadioGroup>
      <Output name="Plan">{value ?? 'none'}</Output>
    </>
  );
}

/** A required group in a form: submitting with none picked shows the message and focuses it. */
function Required() {
  const [submitted, setSubmitted] = useState('none');
  return (
    <Form
      aria-label="Delivery"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('delivery')));
      }}
    >
      <RadioGroup label="Delivery" name="delivery" isRequired data-lab-field="required">
        <Radio value="pickup">Pick up in store</Radio>
        <Radio value="courier" description="Within two hours.">
          Courier
        </Radio>
        <Radio value="post" description="Two to four days.">
          Post
        </Radio>
      </RadioGroup>
      <Button type="submit">Order</Button>
      <Output name="Delivery">{submitted}</Output>
    </Form>
  );
}

/** The committed value is the caller's: the field stays dirty until Save. */
function SavedGroup() {
  const [saved, setSaved] = useState<string | null>('pear');
  const [value, setValue] = useState<string | null>('pear');
  return (
    <>
      <RadioGroup
        label="Snack"
        orientation="horizontal"
        value={value}
        onChange={setValue}
        committedValue={saved}
        menu={['clear']}
        data-lab-field="saved"
      >
        <Fruit />
      </RadioGroup>
      <Button onPress={() => setSaved(value)}>Save</Button>
      <Output name="Snack">{value ?? 'none'}</Output>
    </>
  );
}

/** A radio element of the caller's own, given the radio's state. */
function swapRadio(props: JSX.IntrinsicElements['div'], state: RadioRenderState) {
  return <div {...props} data-lab-picked={state.isSelected ? 'yes' : 'no'} />;
}

function Swapped() {
  return (
    <RadioGroup label="Crate" defaultValue="small" data-lab-field="swapped">
      <Radio value="small" render={swapRadio}>
        Small crate
      </Radio>
      <Radio value="large" render={swapRadio}>
        Large crate
      </Radio>
    </RadioGroup>
  );
}

mountLab(
  <>
    <LabSection title="Layouts and states" description="Every label layout against every state.">
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <Sample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection title="Sizes and orientations" description="Each size in a column and in a row.">
      <StateMatrix
        axes={{ size: sizes, orientation: orientations }}
        render={({ size, orientation }) => (
          <RadioGroup label="Fruit" size={size} orientation={orientation} defaultValue="pear">
            <Fruit />
          </RadioGroup>
        )}
      />
    </LabSection>
    <LabSection
      title="Swapped elements"
      description="Each radio renders its own element, marked with the state render receives."
    >
      <Swapped />
    </LabSection>
    <LabSection
      title="Descriptions and rich content"
      description="Each plan has a description; the sold-out plan is skipped by the arrow keys."
    >
      <Plans />
    </LabSection>
    <LabSection title="Required in a form" description="Submitting with none picked is blocked.">
      <Required />
    </LabSection>
    <LabSection
      title="Dirty state and the field menu"
      description="Restore, undo with Ctrl+Z and Clear from the menu."
    >
      <SavedGroup />
    </LabSection>
  </>,
);

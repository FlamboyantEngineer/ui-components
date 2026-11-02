import { multipleChoices } from './choice-group-multiple.js';
import { useRef, useState, type JSX } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
import {
  Choice,
  ChoiceGroup,
  type ChoiceRenderState,
} from '../../src/components/choice-group/choice-group.js';
import type { ControlSize } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
} from './field-states.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly ControlSize[];
const orientations = ['vertical', 'horizontal'] as const;

function Fruit() {
  return (
    <>
      <Choice value="apple">Apple</Choice>
      <Choice value="pear">Pear</Choice>
      <Choice value="plum">Plum</Choice>
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
    <ChoiceGroup label="Fruit" labelLayout={layout} {...props}>
      <Fruit />
    </ChoiceGroup>
  );
}

/** Rich labels with a price, a description under each plan and one plan that cannot be picked. */
function Plans() {
  const [value, setValue] = useState<string | null>('team');
  return (
    <>
      <ChoiceGroup
        label="Plan"
        value={value}
        onChange={setValue}
        description="Every plan includes the starter recipes."
        data-lab-field="plans"
      >
        <Choice value="solo" description="One cook, unlimited recipes.">
          Solo <strong>€4 a month</strong>
        </Choice>
        <Choice value="family" description="Sold out this month." isDisabled>
          Family <strong>€9 a month</strong>
        </Choice>
        <Choice value="team" description="Up to ten cooks with shared shopping lists.">
          Team <strong>€19 a month</strong>
        </Choice>
        <Choice value="kitchen" description="Unlimited cooks and a printed menu each week.">
          Kitchen <strong>€49 a month</strong>
        </Choice>
      </ChoiceGroup>
      <LabOutput name="Plan">{value ?? 'none'}</LabOutput>
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
      <ChoiceGroup label="Delivery" name="delivery" isRequired data-lab-field="required">
        <Choice value="pickup">Pick up in store</Choice>
        <Choice value="courier" description="Within two hours.">
          Courier
        </Choice>
        <Choice value="post" description="Two to four days.">
          Post
        </Choice>
      </ChoiceGroup>
      <Button type="submit">Order</Button>
      <LabOutput name="Delivery">{submitted}</LabOutput>
    </Form>
  );
}

/** The committed value is the caller's: the field stays dirty until Save. */
function SavedGroup() {
  const [saved, setSaved] = useState<string | null>('pear');
  const [value, setValue] = useState<string | null>('pear');
  return (
    <>
      <ChoiceGroup
        label="Snack"
        orientation="horizontal"
        value={value}
        onChange={setValue}
        committedValue={saved}
        data-lab-field="saved"
      >
        <Fruit />
      </ChoiceGroup>
      <Button onPress={() => setSaved(value)}>Save</Button>
      <LabOutput name="Snack">{value ?? 'none'}</LabOutput>
    </>
  );
}

/** A radio element of the caller's own, given the radio's state. */
function swapRadio(props: JSX.IntrinsicElements['div'], state: ChoiceRenderState) {
  return <div {...props} data-lab-picked={state.isSelected ? 'yes' : 'no'} />;
}

function Swapped() {
  return (
    <ChoiceGroup label="Crate" defaultValue="small" data-lab-field="swapped">
      <Choice value="small" render={swapRadio}>
        Small crate
      </Choice>
      <Choice value="large" render={swapRadio}>
        Large crate
      </Choice>
    </ChoiceGroup>
  );
}

/**
 * `inputRef` reaches each choice's native input (a radio, or a checkbox in multiple mode), while
 * the element `render` swaps is the choice's root. A caller focuses the input; Space then picks it.
 */
function InputRefs() {
  const radio = useRef<HTMLInputElement>(null);
  const checkbox = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState('nothing yet');
  const focus = (input: HTMLInputElement | null) => {
    input?.focus();
    setFocused(input ? `${input.type} input "${input.value}"` : 'nothing');
  };
  return (
    <>
      <ChoiceGroup label="Shipping" defaultValue="post" data-lab-field="input-ref-single">
        <Choice value="post">Standard post</Choice>
        <Choice value="courier" inputRef={radio}>
          Express courier
        </Choice>
      </ChoiceGroup>
      <ChoiceGroup selectionMode="multiple" label="Extras" data-lab-field="input-ref-multiple">
        <Choice value="wrap">Paper wrap</Choice>
        <Choice value="note" inputRef={checkbox}>
          Handwritten note
        </Choice>
      </ChoiceGroup>
      <Button onPress={() => focus(radio.current)}>Focus Express courier</Button>
      <Button onPress={() => focus(checkbox.current)}>Focus Handwritten note</Button>
      <LabOutput name="Focused input">{focused}</LabOutput>
    </>
  );
}

mountLab(
  <>
    {multipleChoices}
    <div data-lab-family="single">
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
            <ChoiceGroup label="Fruit" size={size} orientation={orientation} defaultValue="pear">
              <Fruit />
            </ChoiceGroup>
          )}
        />
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
      <LabSection
        title="Swapped elements"
        description="Each radio renders its own element, marked with the state render receives."
      >
        <Swapped />
      </LabSection>
      <LabSection
        title="Native input references"
        description="inputRef receives the choice's native radio or checkbox, not its root: a caller focuses Express courier or Handwritten note, and Space then picks it."
      >
        <InputRefs />
      </LabSection>
      <LabSection
        title="Zero content"
        description="A zero label, description and decoration draw like any other content."
      >
        <ChoiceGroup label="Spare seats" description={0} decoration={0}>
          <Choice value="0" description={0}>
            {0}
          </Choice>
          <Choice value="1">{1}</Choice>
        </ChoiceGroup>
      </LabSection>
    </div>
  </>,
);

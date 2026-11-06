import { type FormEvent, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
import { TagsInput } from '../../src/components/tags-input/tags-input.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  fieldLayouts,
  type FieldStateName,
  fieldStates,
  type SampleValues,
  useLabFieldState,
} from './field-states.js';
import { LabOutput } from './lab-output.js';

const samples: SampleValues<string[]> = {
  value: ['Apple', 'Pear'],
  edited: ['Apple', 'Pear', 'Fig'],
  invalid: ['Stone'],
  warning: ['Lime'],
  empty: [],
};

function formatTags(tags: readonly string[]): string {
  return tags.length > 0 ? tags.join(' | ') : 'none';
}

function Sample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState(state, samples);
  return <TagsInput label="Fruit" labelLayout={layout} placeholder="Add a fruit" {...props} />;
}

/** Enter, a comma or a semicolon adds a tag; a pasted list splits into tags. */
function Entry() {
  const [tags, setTags] = useState<string[]>(['Flour']);
  return (
    <>
      <TagsInput
        label="Ingredients"
        description="Enter, a comma or a semicolon adds a tag; paste a list to add several. Duplicate entries are refused without losing later accepted tags. Text an input method composes stays whole until it is committed."
        delimiters={[',', ';']}
        value={tags}
        onChange={setTags}
        data-lab-field="entry"
      />
      <LabOutput name="Ingredients">{formatTags(tags)}</LabOutput>
    </>
  );
}

/** At most three cities, no repeats; the labels field takes repeats. */
function Limits() {
  const [labels, setLabels] = useState<string[]>(['Urgent']);
  return (
    <>
      <TagsInput
        label="Cities"
        description="Up to 3 cities, each once."
        defaultValue={['Oslo', 'Lima']}
        maxValues={3}
        data-lab-field="max"
      />
      <TagsInput
        label="Labels"
        description="Repeats are allowed."
        value={labels}
        onChange={setLabels}
        allowsDuplicates
        data-lab-field="duplicates"
      />
      <LabOutput name="Labels">{formatTags(labels)}</LabOutput>
    </>
  );
}

/** Tags edit in place; the output shows the accepted list. */
function Editing() {
  const [tags, setTags] = useState<string[]>(['Oslo', 'Lima', 'Lima', 'Quito']);
  return (
    <>
      <TagsInput
        label="Stops"
        description="Repeats are allowed; each stop must start with a capital letter."
        value={tags}
        onChange={setTags}
        allowsEditing
        allowsDuplicates
        validateTag={(tag) => (/^\p{Lu}/u.test(tag) ? null : 'Start with a capital letter.')}
        data-lab-field="editing"
      />
      <LabOutput name="Stops">{formatTags(tags)}</LabOutput>
    </>
  );
}

/** The typed text is the caller's: it shows below as it changes. */
function Draft() {
  const [text, setText] = useState('');
  return (
    <>
      <TagsInput
        label="Keywords"
        placeholder="Type a keyword"
        enterKeyHint="enter"
        spellCheck={false}
        inputValue={text}
        onInputChange={setText}
        data-lab-field="draft"
      />
      <LabOutput name="Draft">{text === '' ? 'empty' : text}</LabOutput>
    </>
  );
}

/** The committed list is the caller's: the field stays dirty until Save. */
function DirtyAndRestore() {
  const [saved, setSaved] = useState(['Apple', 'Pear']);
  const [value, setValue] = useState(['Apple', 'Pear']);
  return (
    <>
      <TagsInput
        label="Basket"
        value={value}
        onChange={setValue}
        committedValue={saved}
        defaultValue={['Plum']}
        menu={['clear', 'reset', 'set-default']}
        data-lab-field="dirty"
      />
      <Button onPress={() => setSaved(value)}>Save</Button>
      <LabOutput name="Saved">{formatTags(saved)}</LabOutput>
    </>
  );
}

/** The form submits each tag under the field's name; an empty list blocks the submit. */
function InForm() {
  const [submitted, setSubmitted] = useState('none');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = new FormData(event.currentTarget).getAll('stops');
    setSubmitted(entries.length > 0 ? entries.join(', ') : 'nothing');
  };
  return (
    <Form aria-label="Trip" validationBehavior="aria" onSubmit={submit} data-lab-form="trip">
      <TagsInput label="Stops" name="stops" isRequired data-lab-field="form" />
      <Button type="submit" variant="primary">
        Plan
      </Button>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </Form>
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
    <LabSection
      title="Entering tags"
      description="Enter and the delimiters add the typed text; Backspace in the empty input moves to the last tag, and again removes it."
    >
      <Entry />
    </LabSection>
    <LabSection
      title="Maximum and duplicates"
      description="A refused tag stays in the input and the field says why."
    >
      <Limits />
    </LabSection>
    <LabSection
      title="Given values"
      description="A given list of blank tags is empty, so a required field asks for a tag; a given list that repeats a tag says which one."
    >
      <StateMatrix
        axes={{ given: ['blank tags', 'repeated tag'] }}
        render={({ given }) => (
          <TagsInput
            label="Fruit"
            isRequired
            validationMode="immediate"
            defaultValue={given === 'blank tags' ? ['', ' '] : ['Fig', 'Kiwi', 'Fig']}
          />
        )}
      />
    </LabSection>
    <LabSection title="Tag validation" description="Each guest must be an email address.">
      <TagsInput
        label="Guests"
        validateTag={(tag) => (tag.includes('@') ? null : 'Enter an address like ada@example.com.')}
        data-lab-field="validate"
      />
    </LabSection>
    <LabSection
      title="Adding on blur"
      description="Leaving the input adds what it holds, as Enter would."
    >
      <TagsInput label="Toppings" addOnBlur data-lab-field="blur" />
    </LabSection>
    <LabSection
      title="Editing tags"
      description="Press Enter or F2 on a focused tag, or double-click it, to edit it in place. Enter accepts, Escape restores, leaving accepts; an empty edit removes the tag and a refused edit stays open."
    >
      <Editing />
    </LabSection>
    <LabSection title="Typed text" description="The input's text, controlled by the caller.">
      <Draft />
    </LabSection>
    <LabSection
      title="Dirty, restore, undo and the field menu"
      description="Add or remove a tag, then restore, undo with Ctrl+Z, or open the field's menu (right-click it, or Shift+F10 in it)."
    >
      <DirtyAndRestore />
    </LabSection>
    <LabSection title="In a form" description="Plan with no stop to see the required message.">
      <InForm />
    </LabSection>
  </>,
);

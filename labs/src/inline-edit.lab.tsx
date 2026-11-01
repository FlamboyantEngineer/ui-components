import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { DateTimeField } from '../../src/components/date-time-field/date-time-field.js';
import { InlineEdit } from '../../src/components/inline-edit/inline-edit.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

type MatrixState = 'value' | 'empty' | 'editing' | 'disabled';

const cuisines = [
  { id: 'nordic', label: 'Nordic' },
  { id: 'italian', label: 'Italian' },
  { id: 'japanese', label: 'Japanese' },
];

/** Waits a moment, as a server would, then saves or refuses the value. */
function saveLater<T>(apply: (value: T) => void, check?: (value: T) => string | null) {
  return (value: T) =>
    new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        const problem = check?.(value) ?? null;
        if (problem) {
          reject(new Error(problem));
          return;
        }
        apply(value);
        resolve();
      }, 500);
    });
}

function MatrixCell({ state, actions }: { state: MatrixState; actions: boolean }) {
  const [value, setValue] = useState(state === 'empty' ? '' : 'Seeded rye loaf');
  return (
    <InlineEdit
      label={`Title, ${state}${actions ? ', with buttons' : ''}`}
      value={value}
      onSave={setValue}
      placeholder="Add a title"
      defaultEditing={state === 'editing'}
      isDisabled={state === 'disabled'}
      showActions={actions}
    />
  );
}

/** A recipe whose properties each edit in place, saving after a delay. */
function RecipeDetails() {
  const [title, setTitle] = useState('Seeded rye loaf');
  const [servings, setServings] = useState(8);
  const [cuisine, setCuisine] = useState<string | null>('nordic');
  const [bakeOn, setBakeOn] = useState<string | null>('2026-05-02');
  const [notes, setNotes] = useState('Rest the dough overnight.');
  return (
    <dl data-lab-demo="recipe">
      <dt>Title</dt>
      <dd>
        <InlineEdit
          label="Title"
          value={title}
          onSave={saveLater<string>(setTitle, (next) =>
            next.trim() ? null : 'A title is required.',
          )}
          data-lab-field="title"
        />
      </dd>
      <dt>Servings</dt>
      <dd>
        <InlineEdit<number>
          label="Servings"
          value={servings}
          onSave={saveLater<number>(setServings)}
          renderValue={(count) => `${count} servings`}
          renderEditor={({ value, onChange, label }) => (
            <NumberField
              label={label}
              labelLayout="control-only"
              value={value}
              committedValue={value}
              minValue={1}
              onChange={(next) => onChange(next ?? 1)}
            />
          )}
          data-lab-field="servings"
        />
      </dd>
      <dt>Cuisine</dt>
      <dd>
        <InlineEdit<string | null>
          label="Cuisine"
          value={cuisine}
          onSave={saveLater<string | null>(setCuisine)}
          placeholder="No cuisine"
          renderValue={(id) => cuisines.find((option) => option.id === id)?.label ?? ''}
          renderEditor={({ value, commit, label }) => (
            <>
              <SelectField
                label={label}
                labelLayout="control-only"
                options={cuisines}
                value={value}
                committedValue={value}
                onChange={(next) => commit(next === null ? value : String(next))}
              />
              <Button size="sm" variant="ghost" onPress={() => commit(null)}>
                Clear cuisine
              </Button>
            </>
          )}
          data-lab-field="cuisine"
        />
      </dd>
      <dt>Bake on</dt>
      <dd>
        <InlineEdit<string | null>
          label="Bake on"
          value={bakeOn}
          onSave={saveLater<string | null>(setBakeOn)}
          placeholder="Not planned"
          renderValue={(date) =>
            date
              ? new Date(`${date}T00:00`).toLocaleDateString('en-US', { dateStyle: 'medium' })
              : ''
          }
          renderEditor={({ value, onChange, label }) => (
            <DateTimeField
              label={label}
              labelLayout="control-only"
              value={value}
              committedValue={value}
              onChange={onChange}
            />
          )}
          showActions
          data-lab-field="bake-on"
        />
      </dd>
      <dt>Notes</dt>
      <dd>
        <InlineEdit
          label="Notes"
          value={notes}
          onSave={saveLater<string>(setNotes)}
          renderEditor={({ value, onChange, label }) => (
            <TextField
              label={label}
              labelLayout="control-only"
              multiline
              value={value}
              committedValue={value}
              onChange={onChange}
            />
          )}
          showActions
          data-lab-field="notes"
        />
      </dd>
    </dl>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="A value, an empty value with its placeholder, the editor open, and a read-only value; with and without the save and cancel buttons."
    >
      <StateMatrix
        axes={{
          state: ['value', 'empty', 'editing', 'disabled'],
          buttons: ['without', 'with'],
        }}
        render={({ state, buttons }) => <MatrixCell state={state} actions={buttons === 'with'} />}
      />
    </LabSection>
    <LabSection
      title="A recipe's details"
      description="Text, number, select, date and multiline editors. Each save waits half a second; an empty title is refused. Typing while a save runs keeps the newer text, and Enter meanwhile saves it once the first save ends. A select saves on a choice, and clearing the cuisine saves no cuisine, even while a choice is still saving; Enter saves the others, after the number field takes in typed text, and Control+Enter the notes."
    >
      <RecipeDetails />
    </LabSection>
  </>,
);

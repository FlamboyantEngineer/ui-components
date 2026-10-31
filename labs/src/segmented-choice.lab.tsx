import {
  CheckGlyph,
  EditGlyph,
  ExpandGlyph,
  FilterGlyph,
  FitPageGlyph,
  FitWidthGlyph,
  SortAscendingGlyph,
  SortDescendingGlyph,
} from '../../src/core/glyphs.js';
import { useId, useState } from 'react';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { InlineError } from '../../src/components/inline-error/inline-error.js';
import {
  SegmentedChoice,
  type SegmentedChoiceOption,
} from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const views: SegmentedChoiceOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];
const sizes = ['sm', 'md', 'lg'] as const;
const states = [
  'default',
  'inherited',
  'empty',
  'item disabled',
  'disabled',
  'read-only',
  'invalid',
] as const;

const square = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);
const circle = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="7" />
  </svg>
);

/** The checkbox switches icon-only presentation, as a narrow layout would: focus stays on the segment. */
function CompactToggle() {
  const [isCompact, setCompact] = useState(false);
  return (
    <div data-lab-case="compact-toggle">
      <SegmentedChoice
        aria-label="Fit"
        iconOnly={isCompact}
        sizing="content"
        defaultValue="width"
        options={[
          { value: 'width', label: 'Fit width', icon: FitWidthGlyph },
          { value: 'page', label: 'Fit page', icon: FitPageGlyph },
          { value: 'actual', label: 'Actual size' },
        ]}
      />
      <Checkbox isSelected={isCompact} onChange={setCompact}>
        Icons only
      </Checkbox>
    </div>
  );
}

function InheritedSetting() {
  const inherited = 'week';
  const [explicit, setExplicit] = useState<string | null>(null);
  const hintId = useId();
  const value = explicit ?? inherited;
  const label = views.find((view) => view.value === value)?.label;
  return (
    <div data-lab-demo="inherited">
      <SegmentedChoice
        aria-label="Calendar view"
        aria-describedby={hintId}
        options={views}
        value={value}
        isInherited={explicit === null}
        isClearable
        sizing="content"
        onChange={setExplicit}
      />
      <p id={hintId} data-lab-output="">
        {explicit === null
          ? `${label}, inherited from the calendar default`
          : `${label}, set here (pick it again to inherit)`}
      </p>
    </div>
  );
}

const styles: SegmentedChoiceOption[] = [
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
  { value: 'underline', label: 'Underline' },
];

function SubmittedChoices() {
  const [submitted, setSubmitted] = useState('nothing yet');
  return (
    <form
      data-lab-demo="form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(
          `view=${data.getAll('view').join(',')} style=${data.getAll('style').join(',')}`,
        );
      }}
    >
      <SegmentedChoice aria-label="View" name="view" options={views} defaultValue="week" />{' '}
      <SegmentedChoice
        aria-label="Text style"
        name="style"
        selectionMode="multiple"
        options={styles}
        defaultValue={['bold']}
        sizing="content"
      />{' '}
      <button type="submit">Submit</button> <button type="reset">Reset</button>
      <p data-lab-output="submitted">Submitted: {submitted}</p>
    </form>
  );
}

const notes: SegmentedChoiceOption[] = [
  { value: 'open', label: 'Open', count: 3 },
  { value: 'resolved', label: 'Resolved', count: 128 },
  { value: 'all', label: 'All', count: 131 },
];

/** Saving the filter takes 800ms; with "Fail the next save" checked, the save fails and the choice goes back. */
function SavedFilter() {
  const [value, setValue] = useState<string | null>('open');
  const [failsNext, setFailsNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = (next: string | null) =>
    new Promise<void>((resolve, reject) => {
      setError(null);
      window.setTimeout(() => {
        if (failsNext) {
          setFailsNext(false);
          setError('The filter could not be saved. Try again.');
          reject(new Error('Save failed'));
          return;
        }
        setValue(next);
        resolve();
      }, 800);
    });
  return (
    <div data-lab-demo="saved">
      <SegmentedChoice
        aria-label="Notes to show"
        options={notes}
        value={value}
        sizing="content"
        onChange={save}
      />{' '}
      <Checkbox isSelected={failsNext} onChange={setFailsNext}>
        Fail the next save
      </Checkbox>
      {error ? <InlineError>{error}</InlineError> : null}
      <p data-lab-output="saved">Saved: {value}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Sizes and sizing"
      description="Each in a 280px column. Equal segments share the width; content segments hug their labels."
    >
      <StateMatrix
        axes={{ sizing: ['equal', 'content'], size: sizes }}
        render={({ sizing, size }) => (
          <div style={{ width: 280 }}>
            <SegmentedChoice
              aria-label={`View, ${sizing}, ${size}`}
              options={views}
              defaultValue="week"
              size={size}
              sizing={sizing}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="States"
      description="Hover, press and keyboard focus show on interaction. Tab into a group and use the arrow keys."
    >
      <StateMatrix
        axes={{ orientation: ['horizontal', 'vertical'], state: states }}
        render={({ orientation, state }) => (
          <SegmentedChoice
            aria-label={`View, ${orientation}, ${state}`}
            options={
              state === 'item disabled'
                ? views.map((view) =>
                    view.value === 'month' ? { ...view, isDisabled: true } : view,
                  )
                : views
            }
            defaultValue={state === 'empty' ? null : 'week'}
            isInherited={state === 'inherited'}
            isDisabled={state === 'disabled'}
            isReadOnly={state === 'read-only'}
            isInvalid={state === 'invalid'}
            orientation={orientation}
            sizing="content"
          />
        )}
      />
    </LabSection>
    <LabSection title="Icons" description="Decorative icons before each label.">
      <StateMatrix
        axes={{ icons: ['glyphs', 'custom nodes'], size: sizes }}
        render={({ icons, size }) => (
          <SegmentedChoice
            aria-label={`Order, ${icons}, ${size}`}
            size={size}
            sizing="content"
            defaultValue="up"
            options={
              icons === 'glyphs'
                ? [
                    { value: 'up', label: 'Ascending', icon: SortAscendingGlyph },
                    { value: 'down', label: 'Descending', icon: SortDescendingGlyph },
                    { value: 'none', label: 'Unsorted' },
                  ]
                : [
                    { value: 'up', label: 'Square', icon: square },
                    { value: 'down', label: 'Round', icon: circle },
                  ]
            }
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Inherited and explicit values"
      description="The value starts inherited. Picking a segment sets it here; picking that segment again returns to the inherited value."
    >
      <InheritedSetting />
    </LabSection>
    <LabSection
      title="Icon-only segments"
      description="Each segment shows its icon, is named by its label and shows the label in a tooltip on hover and keyboard focus."
    >
      <StateMatrix
        axes={{ size: sizes }}
        render={({ size }) => (
          <SegmentedChoice
            aria-label={`Zoom, ${size}`}
            iconOnly
            size={size}
            sizing="content"
            defaultValue="width"
            options={[
              { value: 'width', label: 'Fit width', icon: FitWidthGlyph },
              { value: 'page', label: 'Fit page', icon: FitPageGlyph },
              { value: 'full', label: 'Full screen', icon: ExpandGlyph },
            ]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Switching to icons only"
      description="Focus a segment, then switch icons only on or off: the segment keeps its focus. Actual size has no icon and keeps its label."
    >
      <CompactToggle />
    </LabSection>
    <LabSection
      title="Multiple selection"
      description="With selectionMode multiple the segments press independently, as a toolbar of toggles."
    >
      <StateMatrix
        axes={{ state: ['default', 'disabled', 'read-only'] }}
        render={({ state }) => (
          <SegmentedChoice
            aria-label={`Text style, ${state}`}
            selectionMode="multiple"
            options={styles}
            defaultValue={['bold', 'underline']}
            isDisabled={state === 'disabled'}
            isReadOnly={state === 'read-only'}
            sizing="content"
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Form submission"
      description="With a name, the selected values submit with the form as hidden inputs. Reset puts back the default choices, which then submit."
    >
      <SubmittedChoices />
    </LabSection>
    <LabSection
      title="Counts"
      description="Counts follow the labels, capped at 99; each segment reads as its label and count, such as Open, 3."
    >
      <StateMatrix
        axes={{ display: ['labels', 'icons'], size: sizes }}
        render={({ display, size }) => (
          <SegmentedChoice
            aria-label={`Notes, ${display}, ${size}`}
            size={size}
            sizing="content"
            iconOnly={display === 'icons'}
            defaultValue="open"
            options={notes.map((option, index) => ({
              ...option,
              icon: [EditGlyph, CheckGlyph, FilterGlyph][index],
            }))}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Asynchronous change"
      description="The pick shows at once and stays pending while it saves; a failed save puts the previous choice back."
    >
      <SavedFilter />
    </LabSection>
  </>,
);

import { useId, useState } from 'react';
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
                    { value: 'up', label: 'Ascending', icon: 'sort-ascending' },
                    { value: 'down', label: 'Descending', icon: 'sort-descending' },
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
  </>,
);

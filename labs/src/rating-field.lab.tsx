import { useState } from 'react';
import { Rating, RatingField } from '../../src/components/rating-field/index.js';
import { ThumbsDownGlyph, ThumbsUpGlyph } from '../../src/core/glyphs.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { FieldBehaviours } from './field-behaviours.js';
import { LabForm } from './lab-form.js';
import { LabOutput } from './lab-output.js';

const states = {
  empty: {},
  rated: { defaultValue: 3 },
  'read-only': { defaultValue: 4, isReadOnly: true },
  disabled: { defaultValue: 2, isDisabled: true },
  required: { isRequired: true },
} as const;

/** A half-step rating whose value the lab reads back as it changes and previews. */
function HalfSteps() {
  const [value, setValue] = useState<number | null>(3.5);
  return (
    <div data-lab-demo="half">
      <RatingField
        label="Comfort"
        description="Hover to preview; pick a half or a whole glyph."
        step={0.5}
        value={value}
        onChange={setValue}
      />
      <LabOutput name="value">{value === null ? 'none' : String(value)}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States and sizes"
      description="No rating yet, a rating, read-only, disabled and required without a rating, in every field size."
    >
      <StateMatrix
        axes={{
          state: Object.keys(states) as Array<keyof typeof states>,
          size: ['xs', 'sm', 'md', 'lg'],
        }}
        render={({ state, size }) => <RatingField label="Quality" size={size} {...states[state]} />}
      />
    </LabSection>
    <LabSection
      title="Half steps and the hover preview"
      description="With step 0.5 each glyph holds two radios. Hovering previews a rating on the glyphs; leaving restores the picked one. The arrow keys step by halves."
    >
      <HalfSteps />
    </LabSection>
    <LabSection
      title="Custom glyphs and range"
      description="Ten positions drawn with a thumbs-up for the filled part and a thumbs-down for the empty part."
    >
      <div data-lab-demo="glyphs">
        <RatingField
          label="Usefulness"
          maxValue={10}
          defaultValue={7}
          icon={ThumbsUpGlyph}
          emptyIcon={ThumbsDownGlyph}
        />
      </div>
    </LabSection>
    <LabSection
      title="In a form"
      description="The picked rating submits under the field's name; Reset puts the default back."
    >
      <LabForm label="Review">
        <RatingField label="Service" name="service" defaultValue={4} />
      </LabForm>
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page the glyphs fill from the right and the arrow keys follow the reading."
    >
      <UiProvider locale="he-IL">
        <div dir="rtl" data-lab-demo="rtl">
          <RatingField label="Quality" step={0.5} defaultValue={2.5} />
        </div>
      </UiProvider>
    </LabSection>
    <LabSection
      title="Rating: aggregate scores"
      description="A read-only Rating for scores such as averages: fractions fill part of a glyph, and the whole rating is one image named by its score."
    >
      <StateMatrix
        axes={{ score: ['none', '0', '2.5', '4.3', '5'], size: ['sm', 'md', 'lg'] }}
        render={({ score, size }) => (
          <Rating value={score === 'none' ? null : Number(score)} size={size} />
        )}
      />
      <p data-lab-demo="reviews">
        Average <Rating value={4.3} valueLabel="4.3 out of 5, 128 reviews" /> from 128 reviews
      </p>
    </LabSection>
    <FieldBehaviours<number | null>
      committed={3}
      changed={4}
      empty={null}
      refused={1}
      isRefused={(value) => value === 1}
      refusedText="A rating of 1"
      render={(props) => <RatingField {...props} />}
    />
  </>,
);

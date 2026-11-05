import { useState } from 'react';
import {
  DisplayOptions,
  type DisplayOptionsValue,
} from '../../src/components/display-options/display-options.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { DisplayOptionsSeededCases } from './display-options-seeded-cases.js';
import { recipeProperties, recipes, RecipeTable } from './recipe-samples.js';

const startingValue: DisplayOptionsValue = {
  groupBy: null,
  sort: { column: 'minutes', direction: 'ascending' },
  properties: ['title', 'cuisine', 'minutes'],
  density: 'default',
};

/** A recipe table shown as the display options ask. */
function RecipeDisplay() {
  const [value, setValue] = useState(startingValue);
  return (
    <div data-lab-demo="recipes">
      <DisplayOptions
        properties={recipeProperties}
        value={value}
        onChange={setValue}
        densities={['compact', 'default', 'comfortable']}
      />
      <pre data-lab-output="value">{JSON.stringify(value)}</pre>
      <RecipeTable rows={recipes} value={value} caption="Recipes" />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="The button with its default and a custom label, and disabled; it opens the grouping, sorting, properties and density sections."
    >
      <StateMatrix
        axes={{ state: ['default', 'disabled'], label: ['default', 'custom'] }}
        render={({ state, label }) => (
          <DisplayOptions
            properties={recipeProperties}
            label={label === 'custom' ? 'View options' : undefined}
            isDisabled={state === 'disabled'}
            densities={['compact', 'default']}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="A recipe table"
      description="Group by cuisine or author, sort by any column in either direction, tick and drag the shown properties, and change the row spacing."
    >
      <RecipeDisplay />
    </LabSection>
    <DisplayOptionsSeededCases />
  </>,
);

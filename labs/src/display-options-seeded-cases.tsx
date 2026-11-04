import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  DisplayOptions,
  type DisplayOptionsValue,
} from '../../src/components/display-options/display-options.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { recipeProperties, recipes, RecipeTable } from './recipe-samples.js';

/** Grouped by author, sorted by title descending, author first, compact. */
const seed: DisplayOptionsValue = {
  groupBy: 'author',
  sort: { column: 'title', direction: 'descending' },
  properties: ['author', 'title', 'minutes'],
  density: 'compact',
};

/** Display options that own their value from a seed; the page only listens. */
function SeededDisplay() {
  const [mount, setMount] = useState(0);
  const [reported, setReported] = useState<DisplayOptionsValue | null>(null);
  return (
    <div data-lab-demo="seeded-display">
      <DisplayOptions
        key={mount}
        label="Seeded display"
        properties={recipeProperties}
        defaultValue={seed}
        onChange={setReported}
        densities={['compact', 'default', 'comfortable']}
      />{' '}
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setMount((count) => count + 1);
          setReported(null);
        }}
      >
        Mount again
      </Button>
      <LabOutput name="reported">{reported ? JSON.stringify(reported) : 'nothing yet'}</LabOutput>
      <RecipeTable rows={recipes} value={reported ?? seed} caption="Seeded recipes" />
    </div>
  );
}

export function DisplayOptionsSeededCases() {
  return (
    <LabSection
      title="Seeded options"
      description="defaultValue starts the options grouped by author, sorted by title descending, with Author first and compact rows. The options then own their value and report each change, which the table follows; Mount again starts from the seed, since a default only sets the first value."
    >
      <SeededDisplay />
    </LabSection>
  );
}

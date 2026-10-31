import { useState } from 'react';
import {
  ProjectionContent,
  ProjectionOutlet,
  ProjectionProvider,
} from '../../src/components/projection/projection.js';

/** Two publishers of one slot, each with a draft of its own. */
export function DraftTakeover() {
  const [reviewing, setReviewing] = useState(false);
  return (
    <ProjectionProvider>
      <div data-lab-notes="">
        <strong>Note:</strong> <ProjectionOutlet slot="note" />
      </div>
      <ProjectionContent slot="note">
        <input aria-label="Draft note" defaultValue="Draft" />
      </ProjectionContent>
      {reviewing ? (
        <ProjectionContent slot="note">
          <input aria-label="Review note" defaultValue="Review" />
        </ProjectionContent>
      ) : null}
      <label>
        <input
          type="checkbox"
          checked={reviewing}
          onChange={(event) => setReviewing(event.target.checked)}
        />{' '}
        Review note takes over
      </label>
    </ProjectionProvider>
  );
}

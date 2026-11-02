import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import { RecordHeader } from '../../src/components/record-header/record-header.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** A new record with no title yet: the editable title shows a prompt until one is saved. */
function UntitledRecord() {
  const [title, setTitle] = useState('');
  return (
    <div data-lab-demo="untitled">
      <RecordHeader
        identifier="DRAFT-7"
        title={title}
        onTitleChange={setTitle}
        titlePlaceholder="Name this recipe"
        headingLevel={3}
        status={<Badge tone="neutral">Draft</Badge>}
      />
      <Button size="sm" variant="secondary" onPress={() => setTitle('')}>
        Clear the title
      </Button>
      <LabOutput name="title">{JSON.stringify(title)}</LabOutput>
    </div>
  );
}

export function RecordHeaderEmptyCases() {
  return (
    <LabSection
      title="Untitled record"
      description="An editable title that starts empty shows titlePlaceholder in its place. Save a title, then clear it from the page to bring the prompt back. With a title the heading is named by it alone; while empty it reads the edit button and the prompt."
    >
      <UntitledRecord />
    </LabSection>
  );
}

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Outline, type OutlineHeading } from '../../src/components/outline/outline.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const menu: readonly OutlineHeading[] = [
  { id: 'menu-starters', label: 'Starters', level: 2 },
  { id: 'menu-soups', label: 'Soups', level: 3 },
  { id: 'menu-salads', label: 'Salads', level: 3 },
  { id: 'menu-mains', label: 'Mains', level: 2 },
  { id: 'menu-fish', label: 'Fish', level: 3 },
  { id: 'menu-vegetables', label: 'Vegetables', level: 3 },
  { id: 'menu-desserts', label: 'Desserts', level: 2 },
  { id: 'menu-tarts', label: 'Tarts', level: 3 },
];

/** Starters and Desserts start open and Mains closed; the outline owns every toggle after that. */
function SeededSections() {
  const [mount, setMount] = useState(0);
  const [reported, setReported] = useState('nothing yet');
  return (
    <div data-lab-demo="seeded">
      <Button
        size="sm"
        onPress={() => {
          setMount((count) => count + 1);
          setReported('nothing yet');
        }}
      >
        Mount again
      </Button>
      <div style={{ width: 260 }}>
        <Outline
          key={mount}
          aria-label="Menu sections"
          headings={menu}
          defaultExpandedKeys={['menu-starters', 'menu-desserts']}
          onExpandedChange={(keys) => setReported([...keys].join(', ') || 'none')}
        />
      </div>
      <LabOutput name="expanded">{reported}</LabOutput>
      <LabOutput name="mounts">{String(mount + 1)}</LabOutput>
    </div>
  );
}

export function OutlineSeededCases() {
  return (
    <LabSection
      title="Seeded sections"
      description="defaultExpandedKeys opens Starters and Desserts and leaves Mains closed. Toggle sections freely: the outline keeps them and reports each change. Mount again starts from the seed."
    >
      <SeededSections />
    </LabSection>
  );
}

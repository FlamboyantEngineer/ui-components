import { Button } from '../../src/components/button/button.js';
import { Path } from '../../src/components/path/path.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { formatFolderPath } from '../../src/utils/index.js';
import { LabHelperCalls } from './lab-helper-calls.js';

const paths: Record<string, string | string[]> = {
  short: '/Garden',
  long: '/Garden/Vegetable beds/North side/Raised bed four/Tomatoes/Seed saving/Final notes',
  labels: ['Recipes', 'https://example.test/lemon-tart', 'Step 3'],
};

const folders = [
  { id: 'garden', parentId: null, name: 'Garden' },
  { id: 'beds', parentId: 'garden', name: 'Vegetable beds' },
  { id: 'tomatoes', parentId: 'beds', name: 'Tomatoes' },
];

mountLab(
  <>
    <LabSection
      title="Content and width"
      description="Long paths clip at the start and keep the final label visible. The full path appears in a tooltip without an expansion control."
    >
      <StateMatrix
        axes={{ content: Object.keys(paths), width: ['auto', '200px'] }}
        render={({ content, width }) => (
          <div style={{ width: width === 'auto' ? undefined : 200 }}>
            <Path path={paths[content] ?? ''} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Full path in a tooltip"
      description="Rest the pointer on a cut path, or tab to the link that holds one, to read it whole. A path that fits shows no tooltip."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 200 }}>
        <Path path={paths['long'] ?? ''} data-lab-path="cut" />
        <Path path={paths['short'] ?? ''} data-lab-path="whole" />
        <a href="#final-notes" data-lab-path="link">
          <Path path={paths['long'] ?? ''} />
        </a>
      </div>
    </LabSection>
    <LabSection
      title="Beside an action"
      description="A 280px row: the path shrinks and the action stays whole."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 280 }}>
        {['long', 'short'].map((content) => (
          <div
            key={content}
            data-lab-row={content}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>Location:</span>
            <Path path={paths[content] ?? ''} />
            <Button size="sm">Manage</Button>
          </div>
        ))}
      </div>
    </LabSection>
    <LabSection
      title="Host helpers"
      description="formatFolderPath builds a path from a flat folder catalog, ready for Path."
    >
      <LabHelperCalls
        calls={[
          ["formatFolderPath(folders, 'tomatoes')", formatFolderPath(folders, 'tomatoes')],
          ["formatFolderPath(folders, null, 'Home')", formatFolderPath(folders, null, 'Home')],
        ]}
      />
      <Path path={formatFolderPath(folders, 'tomatoes')} />
    </LabSection>
  </>,
);

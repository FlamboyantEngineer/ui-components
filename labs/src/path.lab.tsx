import { Button } from '../../src/components/button/button.js';
import { Path } from '../../src/components/path/path.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const paths: Record<string, string | string[]> = {
  short: '/Garden',
  long: '/Garden/Vegetable beds/North side/Raised bed four/Tomatoes/Seed saving/Final notes',
  labels: ['Recipes', 'https://example.test/lemon-tart', 'Step 3'],
};

mountLab(
  <>
    <LabSection
      title="Content and width"
      description="Long paths clip at the start and keep the final label visible."
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
  </>,
);

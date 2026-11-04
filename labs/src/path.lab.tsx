import { Button } from '../../src/components/button/button.js';
import { Path } from '../../src/components/path/path.js';
import { formatFolderPath, formatPath } from '../../src/utils/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
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
  { id: 'herbs', parentId: 'garden', name: 'Herbs', path: '/Kitchen garden//Herbs ' },
  { id: 'orphan', parentId: 'shed', name: 'Seed trays' },
  { id: 'blank', parentId: 'garden', name: '  ' },
];

/** Inputs for Path, each beside the text it draws. */
const pathInputs: [string, string | readonly string[]][] = [
  ["''", ''],
  ["'/'", '/'],
  ["'Garden//Beds/ /'", 'Garden//Beds/ /'],
  ["'  /Garden/ Beds '", '  /Garden/ Beds '],
  ['[]', []],
  ["['', 'Garden', ' ']", ['', 'Garden', ' ']],
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
      title="Empty, root and untidy paths"
      description="Each input beside the Path it draws: an empty relative path draws nothing, a root-only path draws the separator, and blank or repeated segments are dropped."
    >
      <table data-lab-case="inputs">
        <thead>
          <tr>
            <th scope="col">path</th>
            <th scope="col">Drawn</th>
          </tr>
        </thead>
        <tbody>
          {pathInputs.map(([label, input]) => (
            <tr key={label} data-lab-input={label}>
              <td>
                <code>{label}</code>
              </td>
              <td>
                <Path path={input} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </LabSection>
    <LabSection
      title="Host helpers"
      description="formatFolderPath builds a path from a flat folder catalog, ready for Path: a folder's own path wins, a missing ancestor keeps the known part, a blank name reads as the id and a missing folder reads the root label. formatPath trims and drops blank labels, and rooted and emptyLabel decide the root and the empty text."
    >
      <LabHelperCalls
        calls={[
          ["formatFolderPath(folders, 'tomatoes')", formatFolderPath(folders, 'tomatoes')],
          ["formatFolderPath(folders, null, 'Home')", formatFolderPath(folders, null, 'Home')],
          ["formatFolderPath(folders, 'herbs')", formatFolderPath(folders, 'herbs')],
          ["formatFolderPath(folders, 'orphan')", formatFolderPath(folders, 'orphan')],
          ["formatFolderPath(folders, 'blank')", formatFolderPath(folders, 'blank')],
          [
            "formatFolderPath(folders, 'missing', 'Home')",
            formatFolderPath(folders, 'missing', 'Home'),
          ],
          ["formatPath('Garden//Beds/ /')", formatPath('Garden//Beds/ /')],
          [
            "formatPath('Garden/Beds', { rooted: true })",
            formatPath('Garden/Beds', { rooted: true }),
          ],
          ["formatPath('', { rooted: true })", formatPath('', { rooted: true })],
          [
            "formatPath([], { emptyLabel: 'No folder' })",
            formatPath([], { emptyLabel: 'No folder' }),
          ],
          [
            "formatPath(' / ', { rooted: true, emptyLabel: 'Home' })",
            formatPath(' / ', { rooted: true, emptyLabel: 'Home' }),
          ],
        ]}
      />
      <Path path={formatFolderPath(folders, 'tomatoes')} />
    </LabSection>
  </>,
);

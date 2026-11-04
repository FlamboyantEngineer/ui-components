import { Markdown } from '../../src/components/markdown/index.js';
import { LabSection } from './chrome/index.js';
import { LargeInputDemo } from './large-input-demo.js';

export function MarkdownWideTableDemo() {
  return (
    <LabSection
      title="Wide table"
      description="128 columns with aligned text, escaped pipes and inline code. A short row fills the remaining columns with empty cells."
    >
      <LargeInputDemo
        name="wide-table"
        label="128-column table"
        build={() => {
          const header = Array.from({ length: 128 }, (_, column) => `Column ${column + 1}`);
          const row = Array.from({ length: 128 }, (_, column) => `Value ${column + 1}`);
          row[0] = 'A\\|B';
          row[127] = '`c\\|d`';
          return [
            `|${header.join('|')}|`,
            '|' + ':---|'.repeat(127) + '---:|',
            `|${row.join('|')}|`,
            '| Short |',
          ].join('\n');
        }}
      >
        {(source) => <Markdown source={source} />}
      </LargeInputDemo>
    </LabSection>
  );
}

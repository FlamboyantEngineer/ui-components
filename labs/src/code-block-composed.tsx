import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from '../../src/components/code-block/index.js';
import { StateMatrix } from './chrome/index.js';

const lines = [
  { text: 'const nights = 3;', variant: 'default' },
  { text: 'const rate = 80;', variant: 'removed' },
  { text: 'const rate = 90;', variant: 'added' },
  { text: 'const total = nights * rate;', variant: 'highlighted' },
] as const;

const value = lines
  .filter((line) => line.variant !== 'removed')
  .map((line) => line.text)
  .join('\n');

/** A block composed from parts, with changed and highlighted lines, numbered or not. */
export function ComposedCodeBlocks() {
  return (
    <StateMatrix
      axes={{ numbers: ['plain', 'numbered'] }}
      render={({ numbers }) => (
        <div style={{ inlineSize: '24rem' }}>
          <CodeBlock aria-label={`${numbers} composed block`}>
            <CodeBlockHeader>
              <CodeBlockTitle>stay-total.ts</CodeBlockTitle>
              <CodeBlockActions>
                <CodeBlockCopyButton value={value} />
              </CodeBlockActions>
            </CodeBlockHeader>
            <CodeBlockContent lineNumbers={numbers === 'numbered'} firstLineNumber={12}>
              {lines.map((line) => (
                <CodeBlockLine key={line.text} variant={line.variant}>
                  {line.text}
                </CodeBlockLine>
              ))}
            </CodeBlockContent>
            <CodeBlockFooter>One line changed</CodeBlockFooter>
          </CodeBlock>
        </div>
      )}
    />
  );
}

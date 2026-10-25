import { useState } from 'react';
import { CodeEditor, type CodeLanguage } from '../../src/components/code-editor/code-editor.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection } from './chrome/index.js';

const samples: Record<CodeLanguage, string> = {
  text: 'A plain text note.\nNo syntax is applied.',
  json: '{\n  "fruit": "Pear",\n  "count": 12\n}',
  javascript: '// A fruit label\nconst label = (fruit) => `Fresh ${fruit}`;\nexport default label;',
  typescript:
    'interface Fruit { name: string; count: number; }\nconst basket: Fruit = { name: "Pear", count: 12 };',
  html: '<!-- A fruit card -->\n<article class="fruit">\n  <h2>Pear</h2>\n</article>',
  css: '.fruit {\n  color: #228844;\n  padding: 12px;\n}',
  sql: 'SELECT name, count\nFROM fruit\nWHERE count > 10\nORDER BY name;',
  python: '# A fruit label\ndef label(fruit):\n    return f"Fresh {fruit}"',
  markdown:
    '# Fruit basket\n\nA **fresh** pear and `12` plums.\n\n[Recipe](https://example.com/recipe)',
};
function LanguageSample({ language }: { language: CodeLanguage }) {
  const [value, setValue] = useState(samples[language]);
  return (
    <CodeEditor label={language} language={language} value={value} onChange={setValue} size="sm" />
  );
}
function Diagnostics() {
  const [wrap, setWrap] = useState(false);
  const [value, setValue] = useState(
    Array.from({ length: 90 }, (_, i) => `const fruit${i + 1} = "Pear";`).join('\n'),
  );
  return (
    <CodeEditor
      label="Located diagnostics"
      language="javascript"
      value={value}
      onChange={setValue}
      diagnostics={[
        { line: 61, message: 'Choose a unique name.' },
        { line: 87, endLine: 89, severity: 'warning', message: 'These values are unused.' },
        { line: 125, message: 'This fruit is unavailable.' },
      ]}
      data-lab-editor="overview"
      firstLineNumber={50}
      toolbar={
        <Button size="xs" isSelected={wrap} onPress={() => setWrap((value) => !value)}>
          Wrap diagnostics
        </Button>
      }
      wrap={wrap ? 'soft' : 'off'}
    />
  );
}
export const languageExamples = (
  <>
    <LabSection
      title="Language presets"
      description="Basic highlighting for eight languages and plain text. Only JSON is validated automatically; supply diagnostics for other languages."
    >
      {Object.keys(samples).map((language) => (
        <LanguageSample key={language} language={language as CodeLanguage} />
      ))}
    </LabSection>
    <LabSection
      title="Custom syntax"
      description="Ordered regular-expression rules describe another language; a custom tokenizer can provide more detailed parsing."
    >
      <CodeEditor
        label="Custom notes"
        defaultValue={'TODO: Slice the pears\nDONE: Wash the fruit\n# A note'}
        syntax={[
          { type: 'keyword', pattern: /\b(?:TODO|DONE)\b/ },
          { type: 'comment', pattern: /#[^\n]*/ },
        ]}
        size="sm"
      />
    </LabSection>
    <LabSection
      title="Diagnostics in the scrollbar"
      description="Red error and amber warning marks show their positions inside the vertical track. Drag the thumb, press the track, use its arrow/Page keys, or navigate problems with F8."
    >
      <Diagnostics />
    </LabSection>
  </>
);

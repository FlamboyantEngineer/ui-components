// SVG Markup's exported parser called by a host: the sanitized tree, or null, beside the drawing,
// and whether a repeated parse of the same source came from the cache.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SvgMarkup, parseSvgMarkup, type SvgNode } from '../../src/components/svg-markup/index.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';

const sources = {
  drawing:
    '<svg viewBox="0 0 48 48"><title>A plum</title><circle cx="24" cy="26" r="16" fill="#6a4c93"/><text x="24" y="30" text-anchor="middle" fill="#fff">plum</text></svg>',
  unsafe:
    '<svg viewBox="0 0 48 48" onload="steal()"><script>steal()</script><a href="https://example.com"><rect width="48" height="48" fill="#f4a261"/></a><image href="https://example.com/track.png"/></svg>',
  'not svg': '<p>No drawing here</p>',
} as const;
type SourceName = keyof typeof sources;

/** One line per node: the tag with its attributes, or the text, indented by depth. */
function describeNodes(nodes: readonly SvgNode[], depth = 0): string[] {
  return nodes.flatMap((node) => {
    const indent = '  '.repeat(depth);
    if (node.type === 'text') return node.text.trim() ? [`${indent}"${node.text}"`] : [];
    const attributes = Object.entries(node.attributes)
      .map(([name, value]) => ` ${name}="${value}"`)
      .join('');
    return [`${indent}<${node.tag}${attributes}>`, ...describeNodes(node.children, depth + 1)];
  });
}

function ParseInspector() {
  const [markup, setMarkup] = useState<string>(sources.drawing);
  const tree = parseSvgMarkup(markup);
  // A second parse of the same string returns the cached tree itself.
  const isCached = parseSvgMarkup(markup) === tree;
  return (
    <div data-lab-demo="parse">
      <div role="group" aria-label="Sample sources">
        {(Object.keys(sources) as SourceName[]).map((name) => (
          <Button
            key={name}
            size="sm"
            variant="secondary"
            isSelected={markup === sources[name]}
            onPress={() => setMarkup(sources[name])}
          >
            {name}
          </Button>
        ))}
      </div>
      <TextField label="SVG source" multiline value={markup} onChange={setMarkup} />
      <div style={{ width: 48, height: 48 }}>
        <SvgMarkup markup={markup} label="Parsed drawing" />
      </div>
      <pre data-lab-output="svg-tree">
        {tree ? describeNodes([tree]).join('\n') : 'null: no <svg> root'}
      </pre>
      <p data-lab-output="svg-cache">Repeated parse returns the same tree: {String(isCached)}</p>
    </div>
  );
}

export function SvgParseSection() {
  return (
    <LabSection
      title="Parser output"
      description="parseSvgMarkup returns the sanitized element tree SvgMarkup draws, or null without an <svg> root. The unsafe sample loses its handler, script, outside link and the remote image's source; the tree is shown as text, never inserted as markup. Parses are cached by source, so parsing the same string again returns the same frozen tree."
    >
      <ParseInspector />
    </LabSection>
  );
}

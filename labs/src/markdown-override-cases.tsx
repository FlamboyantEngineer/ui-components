// Markdown overrides that read their place: a fruit token is a button in text and plain text
// inside a link or a task label; a chain hides quotes while a switch is on and falls through on
// `undefined`.

import { Fragment, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Markdown, type MarkdownRenderNode } from '../../src/components/markdown/index.js';
import { LabSection } from './chrome/index.js';

const source = [
  'Add a {pear} to the basket.',
  '',
  'Read the [{pear} guide](/guides/pear).',
  '',
  '- [ ] Pack the {pear}',
  '',
  '> Internal: weigh the crates before noon.',
].join('\n');

const tokenPattern = /\{(pear)\}/;

/** Draws `{pear}` as a button that counts presses, or as plain text where a control can't nest. */
function createTokenOverride(onPress: () => void): MarkdownRenderNode {
  return (node, _children, place) => {
    if (node.type !== 'text' || !tokenPattern.test(node.text)) return undefined;
    return node.text.split(tokenPattern).map((part, index) => {
      if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
      return place.isInteractive ? (
        <strong key={index} data-lab-token="plain">
          {part}
        </strong>
      ) : (
        <Button key={index} size="xs" variant="secondary" onPress={onPress} data-lab-token="button">
          {part}
        </Button>
      );
    });
  };
}

/** Hides block quotes while `hides` is set; leaves every other node to the next override. */
function createHidingOverride(hides: boolean): MarkdownRenderNode {
  return (node) => (hides && node.type === 'blockquote' ? null : undefined);
}

/** Tries each override in turn and moves on only while one returns `undefined`. */
function chainOverrides(...overrides: MarkdownRenderNode[]): MarkdownRenderNode {
  return (node, children, place) => {
    for (const override of overrides) {
      const drawn = override(node, children, place);
      if (drawn !== undefined) return drawn;
    }
    return undefined;
  };
}

function PlacedOverrides() {
  const [presses, setPresses] = useState(0);
  const [hidesQuotes, setHidesQuotes] = useState(true);
  const renderNode = chainOverrides(
    createHidingOverride(hidesQuotes),
    createTokenOverride(() => setPresses((count) => count + 1)),
  );
  return (
    <div data-lab-demo="placed-overrides">
      <Button size="sm" isSelected={hidesQuotes} onPress={() => setHidesQuotes((hides) => !hides)}>
        Hide quotes
      </Button>
      <Markdown source={source} renderNode={renderNode} />
      <p data-lab-output="token-presses">Pear presses: {presses}</p>
    </div>
  );
}

export function MarkdownOverrideSections() {
  return (
    <LabSection
      title="Overrides by place"
      description="One override draws {pear} as a button in ordinary text (press it to count) and as plain bold text inside the link and the task label, where place.isInteractive says a control must not nest. A second override, tried first, returns null to hide the quote while the switch is on and undefined otherwise, so the chain moves on to the next override and then to the default rendering."
    >
      <PlacedOverrides />
    </LabSection>
  );
}

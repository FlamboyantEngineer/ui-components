// HTML Markup cases for the exported sanitizer's node tree, an element override that hides
// content, and a trusted policy that keeps image loading and referrer attributes.

import { useEffect, useRef, useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import {
  HtmlMarkup,
  defaultHtmlPolicy,
  sanitizeHtml,
  type HtmlNode,
  type HtmlPolicy,
} from '../../src/components/html-markup/index.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';

const startMarkup =
  '<p class="note" onclick="steal()">Ripe <a href="javascript:steal()">pears</a> and <a href="/plums" target="_blank">plums</a>.</p><script>steal()</script>';

const textOnly: HtmlPolicy = { elements: ['p', 'br'], attributes: [], schemes: [] };
const policies = { default: defaultHtmlPolicy, 'text only': textOnly } as const;
type PolicyName = keyof typeof policies;

/** One line per node: the tag with its kept attributes, or the text, indented by depth. */
function describeNodes(nodes: readonly HtmlNode[], depth = 0): string[] {
  return nodes.flatMap((node) => {
    const indent = '  '.repeat(depth);
    if (node.type === 'text') return [`${indent}"${node.text}"`];
    const attributes = Object.entries(node.attributes)
      .map(([name, value]) => ` ${name}="${value}"`)
      .join('');
    return [`${indent}<${node.tag}${attributes}>`, ...describeNodes(node.children, depth + 1)];
  });
}

/** Calls `sanitizeHtml` on editable markup and shows its node tree beside the rendered result. */
function SanitizerOutput() {
  const [markup, setMarkup] = useState(startMarkup);
  const [policyName, setPolicyName] = useState<PolicyName>('default');
  const policy = policies[policyName];
  return (
    <div data-lab-demo="sanitizer">
      <TextField label="Markup to sanitize" multiline value={markup} onChange={setMarkup} />
      <div role="group" aria-label="Sanitizer policy">
        {(Object.keys(policies) as PolicyName[]).map((name) => (
          <Button
            key={name}
            size="sm"
            variant="secondary"
            isSelected={policyName === name}
            onPress={() => setPolicyName(name)}
          >
            {name}
          </Button>
        ))}
      </div>
      <HtmlMarkup markup={markup} policy={policy} data-lab-output="sanitized-render" />
      <pre data-lab-output="sanitized-tree">
        {describeNodes(sanitizeHtml(markup, policy)).join('\n')}
      </pre>
    </div>
  );
}

const notes =
  '<p>Crates for <span data-person="ana">@Ana</span>.</p><p data-internal="true">Internal: recount on Friday.</p><p>Pickup at <span data-place="dock">the dock</span>.</p>';

/** renderElement's three answers: a replacement, `undefined` for the default, `null` to hide. */
function HidingOverrides() {
  const [hidesInternal, setHidesInternal] = useState(true);
  return (
    <div data-lab-demo="hiding">
      <Button
        size="sm"
        isSelected={hidesInternal}
        onPress={() => setHidesInternal((hides) => !hides)}
      >
        Hide internal notes
      </Button>
      <HtmlMarkup
        markup={notes}
        renderElement={(element, children) => {
          if (element.attributes['data-person']) return <Badge tone="info">{children}</Badge>;
          if (element.attributes['data-internal'] && hidesInternal) return null;
          return undefined;
        }}
      />
    </div>
  );
}

const pearDrawing =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="28" r="14" fill="#9bbb59"/></svg>',
  );

/** A trusted source's policy: it keeps `loading` and `referrerpolicy`, which then win. */
const trustedImages: HtmlPolicy = {
  ...defaultHtmlPolicy,
  attributes: [...defaultHtmlPolicy.attributes, 'loading', 'referrerpolicy'],
  schemes: [...defaultHtmlPolicy.schemes, 'data'],
};
const imageMarkup = `<img src="${pearDrawing}" alt="A round pear" width="48" height="48" loading="eager" referrerpolicy="origin">`;
const untrustedImages: HtmlPolicy = {
  ...defaultHtmlPolicy,
  schemes: [...defaultHtmlPolicy.schemes, 'data'],
};

/** Draws the image under a policy and reads back the attributes it rendered with. */
function ImageAttributes({ policy, name }: { policy: HtmlPolicy; name: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState('');
  useEffect(() => {
    const image = frame.current?.querySelector('img');
    setShown(
      `loading=${image?.getAttribute('loading') ?? ''} referrerpolicy=${image?.getAttribute('referrerpolicy') ?? ''}`,
    );
  }, []);
  return (
    <div ref={frame} data-lab-image-policy={name}>
      <HtmlMarkup markup={imageMarkup} policy={policy} />
      <p data-lab-output="image-attributes">
        {name}: {shown}
      </p>
    </div>
  );
}

export function HtmlMarkupCoverageSections() {
  return (
    <>
      <LabSection
        title="Sanitizer output"
        description="sanitizeHtml returns the node tree HtmlMarkup draws: elements with their kept attributes, and text. Edit the markup or switch the policy: handlers, script links and scripts go, a new-tab link gains a safe rel, and the text-only policy unwraps links."
      >
        <SanitizerOutput />
      </LabSection>
      <LabSection
        title="Hiding elements"
        description="renderElement draws mention spans as badges, returns undefined for the default rendering elsewhere, and returns null to hide the internal note while the switch is on."
      >
        <HidingOverrides />
      </LabSection>
      <LabSection
        title="Trusted image attributes"
        description="By default an image loads lazily and sends no referrer, whatever the content says. A trusted policy that keeps loading and referrerpolicy lets the content's own values win."
      >
        <ImageAttributes name="default" policy={untrustedImages} />
        <ImageAttributes name="trusted" policy={trustedImages} />
      </LabSection>
    </>
  );
}

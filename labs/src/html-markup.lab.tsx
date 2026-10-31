import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { HtmlMarkup, type HtmlPolicy } from '../../src/components/html-markup/index.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { TextMatchProvider } from '../../src/components/text-match/text-match.js';
import { LargeInputDemo } from './large-input-demo.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const samples = {
  'rich text': [
    '<h3>Harvest update</h3>',
    '<p>The <strong>north</strong> orchard is <em>ahead</em> of plan; the <mark>south</mark> one waits on rain.',
    'Pick with <kbd>care</kbd>, store at 4&nbsp;&deg;C &mdash; see <a href="/guides/storage">the storage guide</a>.</p>',
    '<blockquote><p>Apples keep for months.</p></blockquote>',
  ].join(''),
  table: [
    '<table><caption>Crates this week</caption>',
    '<thead><tr><th scope="col">Fruit</th><th scope="col">Crates</th></tr></thead>',
    '<tbody><tr><td>Apple</td><td>1,240</td></tr><tr><td>Pear</td><td>86</td></tr></tbody></table>',
  ].join(''),
  'table shorthand':
    '<table><caption>Crates by hand</caption><col><col class="count"><tr><th scope="col">Fruit<th scope="col">Crates<tr><td>Quince<td>12</table>',
  lists: [
    '<ul><li>Apples<ul><li>Bramley</li><li>Cox</li></ul></li><li>Pears</ul>',
    '<ol start="3"><li>Wash<li>Core</ol>',
    '<details><summary>Storage notes</summary><p>Keep pears apart from apples.</p></details>',
  ].join(''),
  code: '<p>Run <code>press --batch 4</code>:</p><pre><code>press --batch 4 --cool</code></pre>',
} as const;

const unsafe = [
  '<p onclick="window.unsafe = true" style="color: red">Handlers and styles are dropped.</p>',
  '<script>window.unsafe = true</script><style>p { display: none }</style>',
  '<iframe src="https://example.com"></iframe><form><input value="secret"><button>Send</button></form>',
  '<p><a href="javascript:window.unsafe = true">A script link</a>, ',
  '<a href="https://example.com" target="_blank">a new tab</a> and ',
  '<img src="data:image/png;base64,AA" alt="a data image">.</p>',
  '<section class="ui-button">Unknown elements and hook classes are unwrapped.</section>',
].join('');

const reply =
  '<p>Thanks <span data-person="ana">@Ana</span> and <span data-person="ben">@Ben</span>, the crates are ready.</p>';

const textOnly: HtmlPolicy = { elements: ['p', 'br'], attributes: [], schemes: [] };

const policies = { default: undefined, 'text only': textOnly } as const;

function FindDemo() {
  const [query, setQuery] = useState('orchard');
  return (
    <>
      <SearchField label="Find in update" value={query} onChange={setQuery} />
      <TextMatchProvider query={query}>
        <HtmlMarkup markup={samples['rich text']} data-lab-find />
      </TextMatchProvider>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Content"
      description="Rich text, a table, a table written in shorthand (columns without a column group, rows without a body), lists with a disclosure and code, at body size and at a small size."
    >
      <StateMatrix
        axes={{ content: Object.keys(samples), text: ['body', 'small'] }}
        render={({ content, text }) => (
          <div style={text === 'small' ? { fontSize: 12, maxWidth: 360 } : { maxWidth: 420 }}>
            <HtmlMarkup markup={samples[content as keyof typeof samples]} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Sanitizing"
      description="Scripts, styles, frames and form fields are dropped; script URLs, handlers and hook classes go; a new-tab link gets a safe rel. Excluded wrappers keep their content in order, including nested wrappers."
    >
      <HtmlMarkup markup={unsafe} data-lab-unsafe />
    </LabSection>
    <LabSection
      title="Policy"
      description="The default policy against a text-only policy that keeps paragraphs and line breaks."
    >
      <StateMatrix
        axes={{ policy: Object.keys(policies) }}
        render={({ policy }) => (
          <HtmlMarkup
            markup={samples['rich text']}
            policy={policies[policy as keyof typeof policies]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Element overrides"
      description="renderElement draws each mention span as a Badge."
    >
      <HtmlMarkup
        markup={reply}
        data-lab-overrides
        renderElement={(element, children) =>
          element.attributes['data-person'] ? <Badge tone="info">{children}</Badge> : undefined
        }
      />
    </LabSection>
    <LabSection
      title="Find"
      description="Text renders through TextMatch, so a TextMatchProvider marks the query."
    >
      <FindDemo />
    </LabSection>
    <LabSection
      title="Unknown names"
      description="Elements outside the policy are unwrapped whatever their name, including names an ordinary object inherits."
    >
      <HtmlMarkup
        data-lab-unknown
        markup="<div><constructor>Kept</constructor> <__proto__>in</__proto__> <toString>place</toString></div>"
      />
    </LabSection>
    <LabSection
      title="Large unbalanced input"
      description="A tag that never ends, nesting and stray closing tags read in time proportional to their length."
    >
      <LargeInputDemo
        label="96 KB of unbalanced tags"
        build={() => '<div>'.repeat(300) + '</span>'.repeat(7_000) + '<' + 'a'.repeat(45_000)}
      >
        {(markup) => <HtmlMarkup markup={markup} />}
      </LargeInputDemo>
    </LabSection>
  </>,
);

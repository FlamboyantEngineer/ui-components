import { defaultHtmlPolicy, type HtmlPolicy } from '../src/components/html-markup/sanitize-html.js';

function excludeElements(...excluded: string[]): HtmlPolicy {
  return {
    ...defaultHtmlPolicy,
    elements: defaultHtmlPolicy.elements.filter((tag) => !excluded.includes(tag)),
  };
}

interface ScopeCase {
  name: string;
  markup: string;
  html: string;
  text: string;
  policy?: HtmlPolicy;
}

const partialTable = '<div>Before<table><tr><td><em>Inside</em></td></tr></table>After</div>';

export const htmlScopeCases: readonly ScopeCase[] = [
  {
    name: 'default button removal',
    markup: '<p>Before<button><div>Inside<strong>kept</strong></div></button>After</p>',
    html: '<p>BeforeInside<strong>kept</strong>After</p>',
    text: 'BeforeInsidekeptAfter',
  },
  {
    name: 'retained button boundary',
    markup: '<p>Before<button><div>Inside</div></button>After</p>',
    policy: { ...defaultHtmlPolicy, elements: [...defaultHtmlPolicy.elements, 'button'] },
    html: '<p>Before<button><div>Inside</div></button>After</p>',
    text: 'BeforeInsideAfter',
  },
  ...['ul', 'ol'].map((tag) => ({
    name: `removed ${tag} boundary`,
    markup: `<li>Before<${tag}><li><em>Inside</em></li></${tag}>After</li>`,
    policy: excludeElements(tag),
    html: '<li>Before<em>Inside</em>After</li>',
    text: 'BeforeInsideAfter',
  })),
  {
    name: 'removed description list boundary',
    markup: '<dt>Before<dl><dd>Inside</dd></dl>After</dt>',
    policy: excludeElements('dl'),
    html: '<dt>BeforeInsideAfter</dt>',
    text: 'BeforeInsideAfter',
  },
  ...['table', 'td'].map((tag) => ({
    name: `removed ${tag} exposing a list item`,
    markup: '<ul><li>Before<table><tr><td><li>Inside</li></td></tr></table>After</li></ul>',
    policy: excludeElements(tag),
    html: '<ul><li>BeforeInsideAfter</li></ul>',
    text: 'BeforeInsideAfter',
  })),
  ...['table', 'tbody', 'tr', 'td'].map((tag) => ({
    name: `partial table without ${tag}`,
    markup: partialTable,
    policy: excludeElements(tag),
    html: '<div>Before<em>Inside</em>After</div>',
    text: 'BeforeInsideAfter',
  })),
  {
    name: 'partial column group',
    markup: '<table><caption>Title</caption><col><tr><td>Inside</td></tr></table>',
    policy: excludeElements('colgroup'),
    html: 'TitleInside',
    text: 'TitleInside',
  },
  {
    name: 'table removed by paragraph repair',
    markup: '<p>Before<button><table><tr><td>Inside</td></tr></table></button>After</p>',
    html: '<p>BeforeInsideAfter</p>',
    text: 'BeforeInsideAfter',
  },
  {
    name: 'block exposed by table and paragraph repair',
    markup: '<p>Before<button><table><tr><td><div>Inside</div></td></tr></table></button>After</p>',
    html: '<p>BeforeInsideAfter</p>',
    text: 'BeforeInsideAfter',
  },
  {
    name: 'valid nested table in a removed scaffold',
    markup:
      '<table><tr><td>Outer<table><thead><tr><th>Inner</th></tr></thead></table>End</td></tr></table>',
    policy: excludeElements('tbody'),
    html: 'Outer<table><thead><tr><th>Inner</th></tr></thead></table>End',
    text: 'OuterInnerEnd',
  },
  {
    name: 'link exposed by table removal',
    markup:
      '<a href="/outer">Before<table><tr><td><a href="/inner">Inside</a></td></tr></table>After</a>',
    policy: excludeElements('table'),
    html: '<a href="/outer">BeforeInsideAfter</a>',
    text: 'BeforeInsideAfter',
  },
  {
    name: 'heading with a retained inline parent',
    markup: '<h1><span>Before<table><tr><td><h2>Inside</h2></td></tr></table>After</span></h1>',
    policy: excludeElements('table'),
    html: '<h1><span>Before<h2>Inside</h2>After</span></h1>',
    text: 'BeforeInsideAfter',
  },
  {
    name: 'heading with a removed inline parent',
    markup: '<h1><span>Before<table><tr><td><h2>Inside</h2></td></tr></table>After</span></h1>',
    policy: excludeElements('table', 'span'),
    html: '<h1>BeforeInsideAfter</h1>',
    text: 'BeforeInsideAfter',
  },
];

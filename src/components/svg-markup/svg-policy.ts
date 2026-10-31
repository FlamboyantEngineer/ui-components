// The allowlist that decides which SVG elements, attributes and values survive parsing
// (specs/SVG-MARKUP.md, UIC-SVG-MARKUP-1.2). Markup is untrusted: anything not listed is dropped.

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';

function byLowerCase(names: string): ReadonlyMap<string, string> {
  return new Map(
    names
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => [name.toLowerCase(), name]),
  );
}

/** Drawing elements kept, keyed by lower-case name, valued by their SVG spelling. */
const drawingElements = byLowerCase(`
  svg g defs symbol use view switch title desc
  path rect circle ellipse line polyline polygon image
  text tspan textPath
  linearGradient radialGradient stop pattern clipPath mask marker
  filter feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix
  feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB
  feFuncG feFuncR feGaussianBlur feMerge feMergeNode feMorphology feOffset fePointLight
  feSpecularLighting feSpotLight feTile feTurbulence
`);

/** SMIL animation elements kept when they animate a kept, non-link attribute. */
const animationElements = byLowerCase('animate animateMotion animateTransform set mpath');

/** Elements unwrapped: the element goes, its content stays in its place. */
const unwrappedElements: ReadonlySet<string> = new Set(['a']);

/** Elements whose content is text only; any element inside them is dropped with its content. */
const textOnlyElements: ReadonlySet<string> = new Set(['title', 'desc']);

/** Presentation properties, kept as attributes and as `style` declarations. */
const presentationNames = `
  alignment-baseline baseline-shift clip-path clip-rule color color-interpolation
  color-interpolation-filters direction display dominant-baseline fill fill-opacity fill-rule
  filter flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style
  font-variant font-weight image-rendering isolation letter-spacing lighting-color marker-end
  marker-mid marker-start mask mask-type mix-blend-mode opacity overflow paint-order
  shape-rendering stop-color stop-opacity stroke stroke-dasharray stroke-dashoffset
  stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor
  text-decoration text-rendering transform transform-box transform-origin unicode-bidi
  vector-effect visibility word-spacing writing-mode
`;

/** Attributes kept on kept elements, keyed by lower-case name, valued by their SVG spelling. */
const drawingAttributes = byLowerCase(`
  ${presentationNames}
  id class lang role style xml:lang xml:space xmlns xmlns:xlink version
  x y x1 y1 x2 y2 cx cy r rx ry fx fy fr dx dy width height d points pathLength viewBox
  preserveAspectRatio gradientUnits gradientTransform spreadMethod offset patternUnits
  patternContentUnits patternTransform clipPathUnits maskUnits maskContentUnits markerUnits
  markerWidth markerHeight refX refY orient rotate textLength lengthAdjust startOffset method
  spacing side href xlink:href
  in in2 result stdDeviation mode type values tableValues slope intercept amplitude exponent
  offset k1 k2 k3 k4 operator radius baseFrequency numOctaves seed stitchTiles scale
  xChannelSelector yChannelSelector filterUnits primitiveUnits order kernelMatrix divisor bias
  targetX targetY edgeMode kernelUnitLength preserveAlpha surfaceScale specularConstant
  specularExponent diffuseConstant azimuth elevation z pointsAtX pointsAtY pointsAtZ
  limitingConeAngle
  attributeName attributeType begin dur end min max restart repeatCount repeatDur calcMode
  keyTimes keySplines keyPoints from to by additive accumulate path
`);

/** Attributes no animation may target: links, styles, and the animation's own wiring. */
const unanimatableAttributes: ReadonlySet<string> = new Set([
  'href',
  'xlink:href',
  'style',
  'class',
  'id',
  'xmlns',
  'xmlns:xlink',
  'attributename',
]);

/** Attributes holding names or prose rather than drawing values, exempt from the value check. */
const freeTextAttribute = /^(?:id|class|lang|role|xml:lang|aria-.+|data-.+)$/;

/** CSS functions a value may use; `url()` only for a fragment in the same drawing. */
const allowedFunctions: ReadonlySet<string> = new Set(
  `url rgb rgba hsl hsla hwb lab lch oklab oklch color color-mix var calc min max clamp
   translate translatex translatey translate3d rotate scale scalex scaley skew skewx skewy matrix
   cubic-bezier steps`.split(/\s+/),
);

const presentationProperties: ReadonlySet<string> = new Set(presentationNames.split(/\s+/));
const functionPattern = /([a-z-][\w-]*)\s*\(/gi;
const urlStart = /url\s*\(\s*/iy;
const rasterDataUrl = /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[\w+/=\s]*$/i;

/** The end of a `url()` argument starting at `start`, with its target, or null when malformed. */
function readUrl(value: string, start: number): { end: number; target: string } | null {
  const quote = value[start];
  if (quote === '"' || quote === "'") {
    const close = value.indexOf(quote, start + 1);
    if (close === -1) return null;
    const paren = /\s*\)/y;
    paren.lastIndex = close + 1;
    if (!paren.test(value)) return null;
    return { end: paren.lastIndex, target: value.slice(start + 1, close) };
  }
  const close = value.indexOf(')', start);
  if (close === -1) return null;
  const target = value.slice(start, close).trimEnd();
  if (/[\s"'(]/.test(target)) return null;
  return { end: close + 1, target };
}

/**
 * Every `url()` target in a value, or null when the value cannot be read unambiguously: an
 * unterminated string or `url()`, unbalanced brackets, or a malformed `url()` argument. Browsers
 * recover a value cut short at its end, so an unclosed `url(` would still load.
 */
function readUrlTargets(value: string): string[] | null {
  const targets: string[] = [];
  let depth = 0;
  let index = 0;
  while (index < value.length) {
    urlStart.lastIndex = index;
    if (urlStart.test(value)) {
      const url = readUrl(value, urlStart.lastIndex);
      if (url === null) return null;
      targets.push(url.target);
      index = url.end;
      continue;
    }
    const char = value[index];
    if (char === '"' || char === "'") {
      const close = value.indexOf(char, index + 1);
      if (close === -1) return null;
      index = close + 1;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth < 0) return null;
    index += 1;
  }
  return depth === 0 ? targets : null;
}

/** A value that loads nothing and runs nothing: known functions, and `url()` of a fragment only. */
function isSafeValue(value: string): boolean {
  if (/[\\<>]|\/\*|@|javascript:|expression/i.test(value)) return false;
  for (const [, name = ''] of value.matchAll(functionPattern)) {
    if (!allowedFunctions.has(name.toLowerCase())) return false;
  }
  const targets = readUrlTargets(value);
  return targets !== null && targets.every((target) => target.startsWith('#'));
}

/** A link to a fragment of the same drawing; `<image>` may also embed a raster data URL. */
function isSafeLink(tag: string, value: string): boolean {
  const link = value.trim();
  if (link.startsWith('#')) return isSafeValue(link);
  return tag === 'image' && rasterDataUrl.test(link);
}

/**
 * A `style` attribute keeping only presentation and custom-property declarations. Property names
 * are lower-cased, but a custom property's name is case-sensitive, so it keeps its spelling.
 */
function filterStyle(css: string): string {
  const kept: string[] = [];
  for (const declaration of css.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon === -1) continue;
    const name = declaration.slice(0, colon).trim();
    const isCustom = name.startsWith('--');
    const property = isCustom ? name : name.toLowerCase();
    const value = declaration.slice(colon + 1).trim();
    const unprefixed = property.replace(/^-(?:webkit|moz|ms|o)-/, '');
    const isKnown = isCustom || presentationProperties.has(unprefixed);
    if (isKnown && value && isSafeValue(value)) kept.push(`${property}: ${value}`);
  }
  return kept.join('; ');
}

/** Library hook classes (`ui-…`) are not the drawing's to claim. */
function filterClassName(value: string): string {
  return value
    .split(/\s+/)
    .filter((token) => token && !token.startsWith('ui-'))
    .join(' ');
}

function isSafeNamespace(name: string, value: string): boolean {
  if (name === 'xmlns') return value === SVG_NAMESPACE;
  return name !== 'xmlns:xlink' || value === XLINK_NAMESPACE;
}

/** The kept spelling of an attribute, or null when the policy drops it. */
function toKeptName(name: string): string | null {
  const lower = name.toLowerCase();
  if (/^(?:aria|data)-[\w.-]+$/.test(lower)) return lower;
  return drawingAttributes.get(lower) ?? null;
}

/** The SVG spelling of a kept drawing or animation element, or null when it is dropped. */
export function toSvgTag(tag: string): string | null {
  const lower = tag.toLowerCase();
  return drawingElements.get(lower) ?? animationElements.get(lower) ?? null;
}

/** Whether an element is removed while its content stays (`<a>`). */
export function isUnwrappedSvgTag(tag: string): boolean {
  return unwrappedElements.has(tag.toLowerCase());
}

/** Whether an element holds text only (`<title>`, `<desc>`). */
export function isTextOnlySvgTag(tag: string): boolean {
  return textOnlyElements.has(tag.toLowerCase());
}

/**
 * Whether a kept element is an animation the policy refuses: it targets a link, a style or an
 * attribute the policy drops.
 */
export function isRefusedAnimation(tag: string, attributes: Readonly<Record<string, string>>) {
  if (!animationElements.has(tag.toLowerCase())) return false;
  const target = Object.entries(attributes).find(
    ([name]) => name.toLowerCase() === 'attributename',
  )?.[1];
  if (target === undefined) return false;
  const name = target.trim().toLowerCase();
  return unanimatableAttributes.has(name) || toKeptName(name) === null;
}

/** The attributes the policy keeps, in their SVG spelling, with unsafe values dropped. */
export function filterSvgAttributes(
  tag: string,
  attributes: Readonly<Record<string, string>>,
): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const [written, value] of Object.entries(attributes)) {
    const name = toKeptName(written);
    if (name === null || Object.hasOwn(kept, name)) continue;
    if (!isSafeNamespace(name, value)) continue;
    if (name === 'href' || name === 'xlink:href') {
      if (isSafeLink(tag.toLowerCase(), value)) kept[name] = value;
    } else if (name === 'class') {
      const className = filterClassName(value);
      if (className) kept[name] = className;
    } else if (name === 'style') {
      const style = filterStyle(value);
      if (style) kept[name] = style;
    } else if (freeTextAttribute.test(name) || isSafeValue(value)) {
      kept[name] = value;
    }
  }
  return kept;
}

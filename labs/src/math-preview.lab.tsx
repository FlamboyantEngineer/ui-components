import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  copyMath,
  copyMathImage,
  MathField,
  MathPreview,
  type MathRenderer,
  renderKatexMath,
  renderMathElement,
} from '../../src/components/math-preview/index.js';
import { VisuallyHidden } from '../../src/components/visually-hidden/visually-hidden.js';
import { copyText } from '../../src/utils/clipboard.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { MathFieldCorners, MathFieldSizes, MathPreviewCorners } from './math-preview-cases.js';

const column: CSSProperties = { width: 460 };

const sources = {
  valid: String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`,
  invalid: String.raw`\frac{1}{`,
  empty: '',
  'too long': String.raw`\sum_{k=1}^{n} k^2`,
};

const untrusted = [
  String.raw`\href{javascript:alert(1)}{\text{click}}`,
  String.raw`\url{https://example.com}`,
  String.raw`\htmlStyle{color: red}{x}`,
  String.raw`\color{red}{x^2} + \textcolor{#0a7}{y}`,
];

/** The default renderer, answering after a delay so the pending and stale states show. */
const slowRenderer: MathRenderer = (source, options) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(renderKatexMath(source, options)), 800);
  });

function FieldDemo() {
  const [value, setValue] = useState(String.raw`\int_0^1 x^2 \, dx = \frac{1}{3}`);
  const [committed, setCommitted] = useState(value);
  return (
    <div data-lab-demo="field" style={column}>
      <MathField
        label="Equation"
        description="Type LaTeX; leave the field to commit, Escape restores."
        value={value}
        onChange={setValue}
        onCommit={setCommitted}
        placeholder="e^{i\pi} + 1 = 0"
      />
      <LabOutput name="Committed source">{committed}</LabOutput>
    </div>
  );
}

/**
 * Inline math edited where it stands, as a document editor would: pressing the formula opens the
 * field in its place, Enter puts the new math back and Escape leaves it as it was.
 */
function InPlaceDemo() {
  const [source, setSource] = useState(String.raw`\pi r^2`);
  const [isEditing, setEditing] = useState(false);
  const editRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setEditing(false);
    requestAnimationFrame(() => editRef.current?.focus());
  };
  return (
    <p data-lab-demo="in-place" style={column}>
      The area of a circle is{' '}
      {isEditing ? (
        <MathField
          label="Formula"
          labelLayout="control-only"
          display="inline"
          defaultValue={source}
          autoFocus
          onSubmit={(next) => {
            setSource(next);
            close();
          }}
          onCancel={close}
        />
      ) : (
        <button ref={editRef} type="button" onClick={() => setEditing(true)}>
          <VisuallyHidden as="span">Edit formula </VisuallyHidden>
          <MathPreview source={source} display="inline" />
        </button>
      )}
      .
    </p>
  );
}

function SlowDemo() {
  const [source, setSource] = useState('a^2 + b^2');
  return (
    <div data-lab-demo="slow" style={column}>
      <MathField
        label="Slow renderer"
        description="This renderer answers after 800 ms: the last math stays shown, marked stale."
        value={source}
        onChange={setSource}
        renderer={slowRenderer}
      />
    </div>
  );
}

/** Math a host draws itself: `renderMathElement` appends a sanitized element, or shows why not. */
function ElementDemo({ source }: { source: string }) {
  const slot = useRef<HTMLSpanElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    const target = slot.current;
    if (!target) return undefined;
    let isCurrent = true;
    void renderMathElement(source, {
      displayMode: false,
      ownerDocument: target.ownerDocument,
    }).then((result) => {
      if (!isCurrent) return;
      if (result.ok) target.replaceChildren(result.element);
      else setMessage(result.message);
    });
    return () => {
      isCurrent = false;
    };
  }, [source]);
  return (
    <li data-lab-element={source}>
      <code>{source}</code>: <span ref={slot} />
      {message}
    </li>
  );
}

const copied = String.raw`\frac{a}{b}`;

/**
 * Copying math as a document editor's menu would: the typeset MathML as an equation, the source as
 * text, and a drawing of it, standing in for a layouter's SVG, as a PNG.
 */
function CopyDemo() {
  const preview = useRef<HTMLSpanElement>(null);
  const drawing = useRef<SVGSVGElement>(null);
  const [result, setResult] = useState('');
  const math = () => preview.current?.querySelector('math') ?? null;
  return (
    <div data-lab-demo="copy" style={column}>
      <p>
        <span ref={preview}>
          <MathPreview source={copied} />
        </span>{' '}
        drawn as{' '}
        <svg
          ref={drawing}
          width="24"
          height="32"
          viewBox="0 0 24 32"
          role="img"
          aria-label="a over b"
        >
          <text x="12" y="12" textAnchor="middle" fontSize="12" fill="currentColor">
            a
          </text>
          <rect x="3" y="15" width="18" height="1.5" fill="currentColor" />
          <text x="12" y="29" textAnchor="middle" fontSize="12" fill="currentColor">
            b
          </text>
        </svg>
      </p>
      <Button
        onPress={() => {
          const element = math();
          if (element)
            void copyMath(element, { source: copied }).then((how) => setResult(`equation: ${how}`));
        }}
      >
        Copy equation
      </Button>{' '}
      <Button
        onPress={() => void copyText(copied).then((done) => setResult(`source: ${String(done)}`))}
      >
        Copy LaTeX
      </Button>{' '}
      <Button
        onPress={() => {
          if (drawing.current)
            void copyMathImage(drawing.current, { source: copied }).then((done) =>
              setResult(`image: ${String(done)}`),
            );
        }}
      >
        Copy as image
      </Button>
      <LabOutput name="Copy result">{result}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Inline and display math for valid, invalid, empty and too-long source (the last with a maxLength of 10)."
    >
      <StateMatrix
        axes={{
          display: ['inline', 'display'],
          source: ['valid', 'invalid', 'empty', 'too long'],
        }}
        render={({ display, source }) => (
          <MathPreview
            source={sources[source]}
            display={display}
            maxLength={source === 'too long' ? 10 : undefined}
          />
        )}
      />
    </LabSection>
    <MathPreviewCorners />
    <LabSection title="Inline in text" description="Inline math sits in its line of text.">
      <p data-lab-demo="inline" style={column}>
        The area of a circle is <MathPreview source="\pi r^2" />, and its circumference is{' '}
        <MathPreview source="2 \pi r" />.
      </p>
    </LabSection>
    <LabSection
      title="Math field"
      description="A source editor with a live display preview below it."
    >
      <FieldDemo />
    </LabSection>
    <LabSection
      title="Editing in place"
      description="Press the formula to edit it inline: Enter puts the new math back, Escape cancels, and the field takes focus only because it opens on request."
    >
      <InPlaceDemo />
    </LabSection>
    <MathFieldSizes />
    <MathFieldCorners />
    <LabSection title="Latest source wins" description="A slow renderer shows the stale state.">
      <SlowDemo />
    </LabSection>
    <LabSection
      title="Untrusted source"
      description="Links, styles and HTML commands render nothing active; colors keep only names and hex values."
    >
      <ul data-lab-demo="untrusted" style={column}>
        {untrusted.map((source) => (
          <li key={source}>
            <code>{source}</code>: <MathPreview source={source} />
          </li>
        ))}
      </ul>
    </LabSection>
    <LabSection
      title="Without React"
      description="renderMathElement typesets to a sanitized MathML element that the host inserts itself; invalid source answers a message."
    >
      <ul data-lab-demo="element" style={column}>
        <ElementDemo source={String.raw`e^{i\pi} + 1 = 0`} />
        <ElementDemo source={String.raw`\frac{1}{`} />
      </ul>
    </LabSection>
    <LabSection
      title="Copying math"
      description="copyMath copies the MathML as an equation, copyText the source, and copyMathImage a drawing as a PNG with black ink."
    >
      <CopyDemo />
    </LabSection>
  </>,
);

import type { CSSProperties } from 'react';
import { MathField, MathPreview } from '../../src/components/math-preview/index.js';
import type { ControlSize } from '../../src/core/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly ControlSize[];
const column: CSSProperties = { width: 360 };
const narrow: CSSProperties = { width: 200 };

/** Each field size: the label, the source's type and the preview follow it. */
export function MathFieldSizes() {
  return (
    <LabSection
      title="Sizes"
      description="The math field at each control size: the label, the source's type and the preview follow the field's size."
    >
      <StateMatrix
        axes={{ size: sizes }}
        render={({ size }) => (
          <div style={column}>
            <MathField
              label={`Equation, ${size}`}
              size={size}
              defaultValue={String.raw`\sum_{k=1}^{n} k = \frac{n(n+1)}{2}`}
            />
          </div>
        )}
      />
    </LabSection>
  );
}

const sources = {
  'nested fractions': String.raw`\cfrac{1}{1 + \cfrac{1}{1 + \cfrac{1}{1 + x}}}`,
  matrix: String.raw`\begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}`,
  'aligned lines': String.raw`\begin{aligned} f(x) &= (x + 1)^2 \\ &= x^2 + 2x + 1 \end{aligned}`,
  cases: String.raw`|x| = \begin{cases} x & x \ge 0 \\ -x & x < 0 \end{cases}`,
  'tall operators': String.raw`\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}`,
  'accents and text': String.raw`\hat{\theta} = \text{arg max}_{\theta} \; \mathcal{L}(\theta \mid x)`,
  'unicode letters': String.raw`\text{Größe} = \text{サイズ} \times α`,
  'long, narrow': String.raw`a_1 + a_2 + a_3 + a_4 + a_5 + a_6 + a_7 + a_8 + a_9 + a_{10} + a_{11} + a_{12} = S`,
  'only spaces': '   ',
  'unknown command': String.raw`\frob{x}`,
  'unbalanced brace': String.raw`\frac{a}{b`,
} as const;

type SourceName = keyof typeof sources;

/** Corner cases: structures that grow tall or wide, scripts and text, and sources that fail. */
export function MathPreviewCorners() {
  return (
    <LabSection
      title="Corner cases"
      description="Nested fractions, matrices, aligned lines and cases, tall operators, accents and text, letters outside ASCII, a long sum in a narrow column, blank source, an unknown command and an unbalanced brace, each inline and as display math."
    >
      <StateMatrix
        axes={{ source: Object.keys(sources) as SourceName[], display: ['inline', 'display'] }}
        render={({ source, display }) => (
          <div style={source === 'long, narrow' ? narrow : column}>
            <MathPreview source={sources[source]} display={display as 'inline' | 'display'} />
          </div>
        )}
      />
    </LabSection>
  );
}

/** Field corner cases: label layouts, read-only, required and a source that does not typeset. */
export function MathFieldCorners() {
  return (
    <LabSection
      title="Field states"
      description="Read-only, disabled, required and empty, inline display, a source that does not typeset, and the label beside the editor."
    >
      <StateMatrix
        axes={{
          state: ['read-only', 'disabled', 'required', 'inline', 'invalid source', 'label beside'],
        }}
        render={({ state }) => (
          <div style={column}>
            <MathField
              label={`Equation, ${state}`}
              defaultValue={
                state === 'required'
                  ? ''
                  : state === 'invalid source'
                    ? String.raw`\frac{1}{`
                    : String.raw`e^{i\pi} + 1 = 0`
              }
              display={state === 'inline' ? 'inline' : 'display'}
              isReadOnly={state === 'read-only'}
              isDisabled={state === 'disabled'}
              isRequired={state === 'required'}
              validationMode={state === 'required' ? 'immediate' : undefined}
              labelLayout={state === 'label beside' ? 'label-colon-control' : undefined}
            />
          </div>
        )}
      />
    </LabSection>
  );
}

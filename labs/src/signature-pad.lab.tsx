import { useState, type FormEvent } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
import {
  SignaturePad,
  type DrawnSignature,
  type SignatureValue,
} from '../../src/components/signature-pad/signature-pad.js';
import {
  formatSignatureDataUrl,
  formatSignatureSvg,
} from '../../src/components/signature-pad/signature-path.js';
import { SvgMarkup } from '../../src/components/svg-markup/svg-markup.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
  type SampleValues,
} from './field-states.js';

const loop = 'M40 140 Q70 40 100 120 Q130 190 160 100 Q190 30 220 110 Q250 170 290 90 L330 120';
const tail = 'M360 150 Q400 60 440 130 Q470 180 520 70';
const underline = 'M60 175 L540 165';

const signature: DrawnSignature = { kind: 'drawn', width: 600, height: 200, paths: [loop, tail] };

const samples: SampleValues<SignatureValue | null> = {
  value: signature,
  edited: { ...signature, paths: [loop, tail, underline] },
  invalid: { kind: 'drawn', width: 600, height: 200, paths: [underline] },
  warning: { kind: 'typed', text: 'A. L.' },
  empty: null,
};

const modes = ['draw', 'type', 'draw only'] as const;
const modeSamples: Record<(typeof modes)[number], SignatureValue> = {
  draw: signature,
  type: { kind: 'typed', text: 'Ada Lovelace' },
  'draw only': signature,
};

function Sample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState(state, samples);
  return <SignaturePad label="Signature" labelLayout={layout} {...props} />;
}

/** Each committed drawing as a data URL image and as inline SVG markup. */
function LiveSignature() {
  const [value, setValue] = useState<SignatureValue | null>(null);
  const [commits, setCommits] = useState(0);
  const [isReadOnly, setReadOnly] = useState(false);
  const drawing = value?.kind === 'drawn' ? value : null;
  return (
    <>
      <SignaturePad
        label="Your signature"
        description="Draw with a mouse, a pen or a finger, or choose Type to type your name; Enter commits, except the Enter that confirms an input method candidate."
        value={value}
        isReadOnly={isReadOnly}
        onChange={setValue}
        onCommit={() => setCommits((count) => count + 1)}
        data-lab-field="live"
      />
      <Button onPress={() => setReadOnly((current) => !current)}>
        {isReadOnly ? 'Unlock drawing' : 'Lock drawing'}
      </Button>
      <LabOutput name="Kind">{value?.kind ?? 'empty'}</LabOutput>
      <LabOutput name="Strokes">{drawing ? drawing.paths.length : 0}</LabOutput>
      <LabOutput name="Typed">{value?.kind === 'typed' ? value.text : 'none'}</LabOutput>
      <LabOutput name="Commits">{commits}</LabOutput>
      {drawing ? (
        <div data-lab-previews>
          <img src={formatSignatureDataUrl(drawing)} alt="Signature as an image" width={300} />
          <SvgMarkup markup={formatSignatureSvg(drawing)} label="Signature as inline SVG" />
        </div>
      ) : null}
    </>
  );
}

/** A required signature blocks the submit; the form receives the value as JSON. */
function InForm() {
  const [submitted, setSubmitted] = useState('none');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get('signature'));
    setSubmitted(text === '' ? 'empty' : (JSON.parse(text) as SignatureValue).kind);
  };
  return (
    <Form
      aria-label="Delivery"
      validationBehavior="aria"
      onSubmit={submit}
      data-lab-form="delivery"
    >
      <SignaturePad
        label="Received by"
        name="signature"
        isRequired
        allowsTyping={false}
        data-lab-field="form"
      />
      <Button type="submit" variant="primary">
        Confirm delivery
      </Button>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </Form>
  );
}

mountLab(
  <>
    <LabSection title="Layouts and states" description="Every label layout against every state.">
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <Sample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Modes"
      description="A drawn signature, a typed one, and a pad that offers drawing only."
    >
      <StateMatrix
        axes={{ mode: modes }}
        render={({ mode }) => (
          <SignaturePad
            label="Signature"
            allowsTyping={mode !== 'draw only'}
            defaultValue={modeSamples[mode]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Drawing and output"
      description="Draw strokes, undo or clear them, or type a name; the drawing shows as an image and as SVG markup. Cancelling or locking the drawing discards its unfinished stroke."
    >
      <LiveSignature />
    </LabSection>
    <LabSection title="In a form" description="Confirm without signing to see the message.">
      <InForm />
    </LabSection>
  </>,
);

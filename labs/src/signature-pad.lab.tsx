import { useState, type FormEvent } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
import {
  SignaturePad,
  type DrawnSignature,
  type ImageSignature,
  type SignaturePadMode,
  type SignatureValue,
} from '../../src/components/signature-pad/signature-pad.js';
import {
  formatSignatureDataUrl,
  formatSignatureSvg,
} from '../../src/components/signature-pad/index.js';
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

/** A small transparent PNG of a wavy signature, as an image signature holds it. */
const imageSignature: ImageSignature = {
  kind: 'image',
  src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAAgCAYAAADtwH1UAAAA1ElEQVR42u2Y2w3EIAwEKeNKSFnpv4m7CqJg3+IHzEr5isDWDrIxYyCEEEIIIbSXPtf9ffpwJ9H8lRAAbgCgNCYLeBvzZ/6thq2GUBL4TCLqZC0AOgN3JeeFpAKuNsYKOxSCJbgi0dk9VMbM7JMKwRpUbYjqcKQfMM8iT7B/kvSszY5XDkBXI73xtiglinIS3asGtdXXlFs01KjrZMT19W1gLHeljBioqkzQ5YaqXQwpa/5JhpR+wOORq8HTcpXJ+kgIA6HjSxDf4j6JeQA4GwBC2+oHOV2NzjMN4EUAAAAASUVORK5CYII=',
  type: 'image/png',
  width: 96,
  height: 32,
};

const samples: SampleValues<SignatureValue | null> = {
  value: signature,
  edited: { ...signature, paths: [loop, tail, underline] },
  invalid: imageSignature,
  warning: { kind: 'typed', text: 'A. L.' },
  empty: null,
};

const modes = ['draw', 'type', 'image', 'draw only'] as const;
const modeSamples: Record<(typeof modes)[number], SignatureValue> = {
  draw: signature,
  type: { kind: 'typed', text: 'Ada Lovelace' },
  image: imageSignature,
  'draw only': signature,
};
const drawOnly: readonly SignaturePadMode[] = ['draw'];
const withoutTyping: readonly SignaturePadMode[] = ['draw', 'image'];

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
        description="Draw with a mouse, a pen or a finger, choose Type to type your name, or choose Image to upload or paste a PNG, JPEG, WebP or GIF of 2 MB at most; Enter commits, except the Enter that confirms an input method candidate."
        value={value}
        isReadOnly={isReadOnly}
        onChange={setValue}
        onCommit={() => setCommits((count) => count + 1)}
        data-lab-field="live"
      />
      <Button onPress={() => setReadOnly((current) => !current)}>
        {isReadOnly ? 'Unlock drawing' : 'Lock drawing'}
      </Button>
      <Button onPress={() => window.setTimeout(() => setValue(signature), 2000)}>
        Replace in 2 seconds
      </Button>
      <LabOutput name="Kind">{value?.kind ?? 'empty'}</LabOutput>
      <LabOutput name="Strokes">{drawing ? drawing.paths.length : 0}</LabOutput>
      <LabOutput name="Typed">{value?.kind === 'typed' ? value.text : 'none'}</LabOutput>
      <LabOutput name="Image">
        {value?.kind === 'image' ? `${value.type} ${value.width}×${value.height}` : 'none'}
      </LabOutput>
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
        modes={withoutTyping}
        data-lab-field="form"
      />
      <Button type="submit" variant="primary">
        Confirm delivery
      </Button>
      <LabOutput name="Submitted">{submitted}</LabOutput>
    </Form>
  );
}

/**
 * A required pad counts typed spaces as unsigned, and turning typing off returns an empty pad to
 * drawing.
 */
function BlankValue() {
  const [allowsTyping, setAllowsTyping] = useState(true);
  const [submitted, setSubmitted] = useState('none');
  return (
    <Form
      aria-label="Blank value"
      validationBehavior="aria"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted('sent');
      }}
    >
      <SignaturePad
        label="Witness"
        name="witness"
        isRequired
        modes={allowsTyping ? undefined : drawOnly}
        data-lab-field="blank"
      />
      <Button onPress={() => setAllowsTyping((current) => !current)}>
        {allowsTyping ? 'Turn typing off' : 'Turn typing on'}
      </Button>
      <Button type="submit" variant="primary">
        Witness it
      </Button>
      <LabOutput name="Witnessed">{submitted}</LabOutput>
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
      description="A drawn signature, a typed one, an image one, and a pad that offers drawing only."
    >
      <StateMatrix
        axes={{ mode: modes }}
        render={({ mode }) => (
          <SignaturePad
            label="Signature"
            modes={mode === 'draw only' ? drawOnly : undefined}
            defaultValue={modeSamples[mode]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Drawing, typing, images and output"
      description="Draw strokes, undo or clear them, type a name, or upload or paste an image (copy an image, focus the image area or a button and press Ctrl+V or Cmd+V, or use Paste image); a file of another type, too large or unreadable is refused with a message. Changing the mode clears a signature given another way. The drawing shows as an image and as SVG markup. Cancelling or locking the drawing, or a replacement arriving mid-stroke (start drawing after Replace in 2 seconds), discards its unfinished stroke."
    >
      <LiveSignature />
    </LabSection>
    <LabSection
      title="In a form"
      description="Confirm without signing to see the message; a drawn or image signature is submitted as JSON."
    >
      <InForm />
    </LabSection>
    <LabSection
      title="Blank values"
      description="Choose Type and type only spaces: Witness it still shows the message. Clear the name and turn typing off to return to drawing."
    >
      <BlankValue />
    </LabSection>
  </>,
);

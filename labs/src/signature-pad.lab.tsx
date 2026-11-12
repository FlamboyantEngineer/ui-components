import { type FormEvent, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
import {
  formatSignatureDataUrl,
  formatSignatureSvg,
} from '../../src/components/signature-pad/index.js';
import {
  type DrawnSignature,
  SignaturePad,
  type SignaturePadMenuIcons,
  type SignaturePadMode,
  type SignatureValue,
} from '../../src/components/signature-pad/signature-pad.js';
import { SvgMarkup } from '../../src/components/svg-markup/svg-markup.js';
import { StarGlyph } from '../../src/core/glyphs.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  fieldLayouts,
  type FieldStateName,
  fieldStates,
  type SampleValues,
  useLabFieldState,
} from './field-states.js';
import { LabOutput } from './lab-output.js';
import { SignaturePadLimitCases } from './signature-pad-limit-cases.js';
import { imageSignature } from './signature-samples.js';

const loop = 'M40 140 Q70 40 100 120 Q130 190 160 100 Q190 30 220 110 Q250 170 290 90 L330 120';
const tail = 'M360 150 Q400 60 440 130 Q470 180 520 70';
const underline = 'M60 175 L540 165';

const signature: DrawnSignature = { kind: 'drawn', width: 600, height: 200, paths: [loop, tail] };

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
  return <SignaturePad label="Signature" labelLayout={layout} showRestoreButton {...props} />;
}

const menuValues = ['empty draw', 'drawn', 'empty type', 'typed', 'empty image', 'image'] as const;
const menuLocks = ['editable', 'read-only', 'disabled'] as const;
const menuSamples: Record<(typeof menuValues)[number], SignatureValue | null> = {
  'empty draw': null,
  'empty type': null,
  'empty image': null,
  image: imageSignature,
  drawn: signature,
  typed: { kind: 'typed', text: 'Ada Lovelace' },
};

/** Each empty pad starts in its own mode, the first offered. */
const menuModes: Partial<Record<(typeof menuValues)[number], readonly SignaturePadMode[]>> = {
  'empty type': ['type', 'draw', 'image'],
  'empty image': ['image', 'draw', 'type'],
};

/** A pad whose field menu offers its own actions, with what it last committed. */
const padIcons: Record<'default' | 'host' | 'none', SignaturePadMenuIcons | undefined> = {
  default: undefined,
  host: { 'undo-stroke': StarGlyph, clear: null, reset: null },
  none: { 'undo-stroke': null, clear: null, reset: null },
};

function MenuSample({
  value,
  lock,
}: {
  value: (typeof menuValues)[number];
  lock: (typeof menuLocks)[number];
}) {
  const [committed, setCommitted] = useState<string>('nothing yet');
  return (
    <>
      <SignaturePad
        label="Signature"
        defaultValue={menuSamples[value]}
        modes={menuModes[value]}
        isReadOnly={lock === 'read-only'}
        isDisabled={lock === 'disabled'}
        onCommit={(next) =>
          setCommitted(
            next?.kind === 'drawn' ? `drawn, ${next.paths.length}` : (next?.kind ?? 'none'),
          )
        }
        data-lab-field={`menu-${value.replace(' ', '-')}-${lock}`}
      />
      {lock === 'editable' ? (
        <LabOutput name={`menu-${value.replace(' ', '-')}`}>{committed}</LabOutput>
      ) : null}
    </>
  );
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
        showRestoreButton
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
      description="A drawn signature, a typed one, an image one, and a pad that offers drawing only. The modes and actions are icon buttons; hover or focus one for its name."
    >
      <StateMatrix
        axes={{ mode: modes }}
        render={({ mode }) => (
          <SignaturePad
            label="Signature"
            modes={mode === 'draw only' ? drawOnly : undefined}
            defaultValue={modeSamples[mode]}
            showRestoreButton
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Drawing, typing, images and output"
      description="Draw strokes, undo or clear them, type a name, or upload or paste an image (copy an image, focus the image area or a button and press Ctrl+V or Cmd+V, or use Paste image); a file of another type, too large or unreadable is refused with a message. Changing the mode clears a signature given another way, and a Paste image still waiting on the clipboard (the browser may ask for permission) is dropped if you change the mode, clear or replace the value before it arrives. The drawing shows as an image and as SVG markup. Cancelling or locking the drawing, or a replacement arriving mid-stroke (start drawing after Replace in 2 seconds), discards its unfinished stroke."
    >
      <LiveSignature />
    </LabSection>
    <LabSection
      title="Field menu"
      description="Right-click anywhere in a pad, long-press it, or press Shift+F10 or the Context Menu key inside it. The pad's actions follow the mode chosen and the value: the image mode offers Upload image and Paste image, even when empty, and Delete image in place of Clear while it holds one; the draw mode offers Undo stroke while it has a stroke; the type mode adds none. Switch the mode to see the menu change. Read-only pads show them disabled; disabled pads open no menu."
    >
      <StateMatrix
        axes={{ value: menuValues, lock: menuLocks }}
        render={({ value, lock }) => <MenuSample value={value} lock={lock} />}
      />
    </LabSection>
    <LabSection
      title="Menu icons"
      description="Right-click each pad. The first keeps the default glyphs; the second swaps Undo stroke's icon and drops Clear's and Reset's; the third draws every action without an icon. Undo stroke still removes the last stroke."
    >
      <StateMatrix
        axes={{ icons: ['default', 'host', 'none'] as const }}
        render={({ icons }) => (
          <SignaturePad
            label="Signature"
            defaultValue={menuSamples.drawn}
            modes={['draw']}
            menuIcons={padIcons[icons]}
            data-lab-field={`menu-icons-${icons}`}
          />
        )}
      />
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
    <SignaturePadLimitCases />
  </>,
);

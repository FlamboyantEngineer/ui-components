import { useState } from 'react';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  SignaturePad,
  type SignatureValue,
} from '../../src/components/signature-pad/signature-pad.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { imageSignature } from './signature-samples.js';

const limits = { '1 KB': 1024, '64 KB': 64 * 1024, '2 MB (default)': undefined } as const;
type LimitLabel = keyof typeof limits;
const limitLabels = Object.keys(limits) as LimitLabel[];
const isLimitLabel = (value: unknown): value is LimitLabel =>
  typeof value === 'string' && Object.hasOwn(limits, value);

/** The byte length of a base64 data URL's content. */
function dataUrlBytes(url: string): number {
  return atob(url.slice(url.indexOf(',') + 1)).length;
}

/** A PNG of coloured noise, which barely compresses: tens of kilobytes from a small canvas. */
function drawNoisyPng(): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 60;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const pixels = context.createImageData(canvas.width, canvas.height);
  // A fixed linear congruential sequence, so the sample is the same file on every load.
  let seed = 7;
  for (let index = 0; index < pixels.data.length; index += 1) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    pixels.data[index] = index % 4 === 3 ? 255 : seed % 256;
  }
  context.putImageData(pixels, 0, 0);
  return canvas.toDataURL('image/png');
}

function describe(value: SignatureValue | null): string {
  if (!value) return 'empty';
  if (value.kind !== 'image') return value.kind;
  return `${value.type} ${String(value.width)}×${String(value.height)}, ${String(dataUrlBytes(value.src))} bytes`;
}

/** A pad with the reader's image limit, two sample files either side of it, and its value. */
function LimitedPad() {
  const [limit, setLimit] = useState<LimitLabel>('1 KB');
  const [value, setValue] = useState<SignatureValue | null>(imageSignature);
  const [large] = useState(drawNoisyPng);
  return (
    <div data-lab-demo="image-limit">
      <SegmentedChoice
        aria-label="Largest image"
        size="sm"
        sizing="content"
        options={limitLabels.map((label) => ({ value: label, label }))}
        value={limit}
        onChange={(next) => {
          if (isLimitLabel(next)) setLimit(next);
        }}
      />
      <p>
        Samples:{' '}
        <a href={imageSignature.src} download="small-signature.png" data-lab-sample="small">
          small signature ({dataUrlBytes(imageSignature.src)} bytes)
        </a>
        {large ? (
          <>
            ,{' '}
            <a href={large} download="large-signature.png" data-lab-sample="large">
              large signature ({dataUrlBytes(large)} bytes)
            </a>
          </>
        ) : null}
      </p>
      <SignaturePad
        label="Signature on file"
        modes={['image', 'draw']}
        maxImageSize={limits[limit]}
        value={value}
        onChange={setValue}
      />
      <LabOutput name="limit">
        {limits[limit] === undefined ? '2097152 bytes' : `${String(limits[limit])} bytes`}
      </LabOutput>
      <LabOutput name="committed">{describe(value)}</LabOutput>
    </div>
  );
}

export function SignaturePadLimitCases() {
  return (
    <LabSection
      title="Image size limit"
      description="maxImageSize caps the image mode's files. Download both samples, then upload or paste the large one under the 1 KB limit: it is refused with the limit in the message, and the signature already on file stays. The small one replaces it; raise the limit and the large one is taken too."
    >
      <LimitedPad />
    </LabSection>
  );
}

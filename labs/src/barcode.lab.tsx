import { useState } from 'react';
import { Barcode, type BarcodeFormat, encodeBarcode } from '../../src/components/barcode/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const formats = ['code128', 'ean13', 'upca', 'ean8'] as const;

/** A value each format holds; the digit formats add their check digit. */
const samples: Record<BarcodeFormat, string> = {
  code128: 'CRATE-42',
  ean13: '400638133393',
  upca: '03600029145',
  ean8: '9638507',
};

const formatLabels: Record<BarcodeFormat, string> = {
  code128: 'Code 128',
  ean13: 'EAN-13',
  upca: 'UPC-A',
  ean8: 'EAN-8',
};

const isFormat = (value: string): value is BarcodeFormat =>
  (formats as readonly string[]).includes(value);

function LiveValue() {
  const [format, setFormat] = useState<BarcodeFormat>('code128');
  const [value, setValue] = useState('Shelf B, crate 7');
  const result = encodeBarcode(value, format);
  return (
    <div data-lab-demo="live" style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <SegmentedChoice
        aria-label="Format"
        sizing="content"
        options={formats.map((id) => ({ value: id, label: formatLabels[id] }))}
        value={format}
        onChange={(next) => {
          if (next !== null && isFormat(next)) setFormat(next);
        }}
      />
      <TextField label="Value to encode" value={value} onChange={setValue} />
      <Barcode value={value} format={format} showValue data-lab-code="live" />
      <p>
        Encoder:{' '}
        <output data-lab-output="symbol">
          {result.symbol
            ? `${result.symbol.text}, ${result.symbol.modules.length} modules, quiet zones ${result.symbol.quietZone.join(' and ')}`
            : `invalid: ${result.invalid}`}
        </output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Formats"
      description="Code 128 for short text, and EAN-13, UPC-A and EAN-8 for digits, whose check digit the encoder adds. The human-readable value is optional."
    >
      <StateMatrix
        axes={{ format: formats, value: ['hidden', 'shown'] }}
        render={({ format, value }) => (
          <Barcode value={samples[format]} format={format} showValue={value === 'shown'} />
        )}
      />
    </LabSection>
    <LabSection
      title="Module width, height and quiet zone"
      description="Every module is a whole number of pixels wide, so bars keep their proportions. The quiet zone can grow but never shrinks below what the format requires (10 modules for Code 128)."
    >
      <StateMatrix
        axes={{ moduleWidth: ['1', '2', '3'], quietZone: ['format minimum', '0', '15'] }}
        render={({ moduleWidth, quietZone }) => (
          <Barcode
            value="C7"
            moduleWidth={Number(moduleWidth)}
            height={Number(moduleWidth) * 24}
            quietZone={quietZone === 'format minimum' ? undefined : Number(quietZone)}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Names and invalid values"
      description="A caller label, a label from a caption, and values a format cannot hold: a wrong check digit, a character it does not take, and a wrong length. An invalid value draws no bars and says why in data-invalid."
    >
      <StateMatrix
        axes={{
          case: ['caller label', 'caption', 'checksum', 'characters', 'length'],
        }}
        render={(cell) => {
          if (cell.case === 'caller label') {
            return <Barcode value="96385074" format="ean8" aria-label="Pears, 1 kg" showValue />;
          }
          if (cell.case === 'caption') {
            return (
              <figure style={{ margin: 0 }}>
                <Barcode value="CRATE-7" aria-labelledby="lab-crate-caption" />
                <figcaption id="lab-crate-caption">Crate 7 label</figcaption>
              </figure>
            );
          }
          if (cell.case === 'checksum') return <Barcode value="4006381333932" format="ean13" />;
          if (cell.case === 'characters') return <Barcode value="Café" />;
          return <Barcode value="12345" format="upca" />;
        }}
      />
    </LabSection>
    <LabSection
      title="Live value"
      description="Type a value and choose a format: the encoder reports the human-readable value and the modules, or why the format cannot hold the value."
    >
      <LiveValue />
    </LabSection>
  </>,
);

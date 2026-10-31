import { useState } from 'react';
import { QrCode } from '../../src/components/qr-code/qr-code.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { encodeQr } from '../../src/components/qr-code/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const levels = ['low', 'medium', 'quartile', 'high'] as const;
const texts = {
  short: 'https://example.com',
  sentence: 'Fold the egg whites into the batter and bake for 25 minutes.',
  unicode: 'Café crème — 東京 🍋',
} as const;

function Editable() {
  const [value, setValue] = useState('https://example.com/menu');
  const symbol = encodeQr(value);
  return (
    <div>
      <TextField label="Text to encode" value={value} onChange={setValue} data-lab-field="qr" />
      <p>
        <QrCode value={value} data-lab-code="editable" />
      </p>
      <p>
        Symbol:{' '}
        <output data-lab-output="symbol">
          {symbol
            ? `version ${symbol.version}, mask ${symbol.mask}, ${symbol.size} × ${symbol.size}`
            : 'too long'}
        </output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Error correction levels"
      description="The same texts at each level: more correction needs a denser symbol (a higher version)."
    >
      <StateMatrix
        axes={{ text: Object.keys(texts) as Array<keyof typeof texts>, level: levels }}
        render={({ text, level }) => (
          <QrCode value={texts[text]} errorCorrection={level} moduleSize={3} />
        )}
      />
    </LabSection>
    <LabSection
      title="Quiet zone and module size"
      description="The light margin, in modules, and the drawn size of a module, in pixels."
    >
      <StateMatrix
        axes={{ quietZone: ['0', '2', '4'], moduleSize: ['2', '4'] }}
        render={({ quietZone, moduleSize }) => (
          <QrCode
            value="https://example.com"
            quietZone={Number(quietZone)}
            moduleSize={Number(moduleSize)}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Names and limits"
      description="A caller label, a long text near the limit, and a text too long for any symbol."
    >
      <StateMatrix
        axes={{ case: ['caller label', 'version 40', 'too long'] }}
        render={(cell) =>
          cell.case === 'caller label' ? (
            <QrCode value="WIFI:T:WPA;S:Guest;P:lemon-tree;;" aria-label="Guest Wi-Fi" />
          ) : cell.case === 'version 40' ? (
            <QrCode value={'k'.repeat(2331)} moduleSize={1} />
          ) : (
            <QrCode value={'k'.repeat(2400)} />
          )
        }
      />
    </LabSection>
    <LabSection
      title="Live text"
      description="Type to change the text; the symbol grows a version when the text no longer fits."
    >
      <Editable />
    </LabSection>
  </>,
);

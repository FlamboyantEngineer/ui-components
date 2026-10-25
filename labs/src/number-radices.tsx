import { useState } from 'react';
import {
  NumberField,
  type NumberFieldRadix,
} from '../../src/components/number-field/number-field.js';
import { StateMatrix } from './chrome/index.js';

export function Radices() {
  const [value, setValue] = useState<number | null>(42);
  return (
    <>
      <StateMatrix
        axes={{ radix: ['10', '2', '8', '16'] as const, unit: ['none', 'bytes'] as const }}
        render={({ radix, unit }) => (
          <NumberField
            label={`${radix === '10' ? 'Decimal' : radix === '2' ? 'Binary' : radix === '8' ? 'Octal' : 'Hexadecimal'}${unit === 'bytes' ? ' bytes' : ''}`}
            radix={Number(radix) as NumberFieldRadix}
            value={value}
            onChange={setValue}
            endAdornment={unit === 'bytes' ? 'B' : undefined}
            smallStep={1}
            largeStep={16}
            showScrubber
            data-lab-radix={`${radix}-${unit}`}
          />
        )}
      />
      <p>
        Numeric value: <output data-lab-output="Radix value">{value ?? 'empty'}</output>
      </p>
      <NumberField
        label="Decimal distance"
        defaultValue={12.5}
        step={0.1}
        formatOptions={{ style: 'unit', unit: 'kilometer', maximumFractionDigits: 2 }}
      />
    </>
  );
}

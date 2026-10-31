'use client';

import { ColorField as AriaColorField, Input } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { describeFormatInputs, type ColorFieldFormat } from './color-values.js';
import { colorFieldHooks as hooks } from './color-field-hooks.js';

interface ColorFormatChoiceProps {
  format: ColorFieldFormat;
  /** The formats offered; fewer than two draw nothing. */
  formats: readonly ColorFieldFormat[];
  onFormatChange: (format: ColorFieldFormat) => void;
}

/** The format choice of the picker: one segment per offered format. */
export function ColorFormatChoice({ format, formats, onFormatChange }: ColorFormatChoiceProps) {
  const strings = useUiStrings();
  if (formats.length < 2) return null;
  return (
    <SegmentedChoice
      className={hooks.slotClass('format')}
      aria-label={strings.colorFormat}
      size="sm"
      sizing="content"
      options={formats.map((value) => ({ value, label: value.toUpperCase() }))}
      value={format}
      onChange={(value) => {
        if (value) onFormatChange(value as ColorFieldFormat);
      }}
    />
  );
}

/**
 * The picker's inputs for its format: a hex input, or a number input per channel of the format's
 * colour space (React Aria `ColorField` with `channel`), then alpha for a format that has it. Each
 * channel input is named by React Aria from its channel.
 */
export function ColorChannelInputs({ format }: { format: ColorFieldFormat }) {
  const strings = useUiStrings();
  const { hasHex, space, channels } = describeFormatInputs(format);
  return (
    <div {...hooks.slot('channels')}>
      {hasHex ? (
        <AriaColorField {...hooks.slot('hex')} aria-label={strings.hexColor}>
          <Input {...hooks.slot('input')} />
        </AriaColorField>
      ) : null}
      {channels.map((channel) => (
        <AriaColorField
          key={channel}
          {...hooks.slot('channel')}
          channel={channel}
          colorSpace={space}
        >
          <Input {...hooks.slot('input')} />
        </AriaColorField>
      ))}
    </div>
  );
}

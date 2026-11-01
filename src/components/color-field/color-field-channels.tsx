'use client';

import { useContext, useRef } from 'react';
import {
  ColorField as AriaColorField,
  ColorPickerStateContext,
  Input,
  Label,
  useLocale,
} from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { useWheelSteps } from '../../utils/use-wheel-steps.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  describeFormatInputs,
  type ColorFieldFormat,
  type ColorFormatChannel,
  type ColorFormatSpace,
} from './color-values.js';
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
 * A field's visible label: a short mark (`shown`, hidden from assistive technology) and the full
 * name in hidden text, so the input is named by the full name, which starts with the mark.
 */
function ChannelLabel({ shown, name }: { shown: string; name: string }) {
  return (
    <Label {...hooks.slot('channel-label')}>
      <span aria-hidden="true">{shown}</span>
      <VisuallyHidden elementType="span">{name}</VisuallyHidden>
    </Label>
  );
}

/**
 * A channel's number input, labelled visibly by the first letter of its localized name (R, G, B;
 * H, S, L or B; A) and named by the whole name. The wheel over it steps the channel by its step,
 * within its range, whether or not it has focus.
 */
function ChannelInput({
  channel,
  space,
}: {
  channel: ColorFormatChannel;
  space: ColorFormatSpace | undefined;
}) {
  const { locale } = useLocale();
  const picker = useContext(ColorPickerStateContext);
  const ref = useRef<HTMLDivElement>(null);
  const color = picker && space ? picker.color.toFormat(space) : picker?.color;
  const name = color?.getChannelName(channel, locale) ?? channel;
  useWheelSteps(ref, (direction) => {
    if (!picker) return;
    const current = space ? picker.color.toFormat(space) : picker.color;
    const range = current.getChannelRange(channel);
    // Onto the step grid, as the arrow keys step, so 50.2% steps to 51%.
    const steps = (current.getChannelValue(channel) - range.minValue) / range.step;
    const value = (Math.round(steps) + direction) * range.step + range.minValue;
    const next = clamp(Number(value.toFixed(6)), range.minValue, range.maxValue);
    picker.setColor(current.withChannelValue(channel, next));
  });
  return (
    <AriaColorField ref={ref} {...hooks.slot('channel')} channel={channel} colorSpace={space}>
      <ChannelLabel shown={name.charAt(0).toLocaleUpperCase(locale)} name={name} />
      <Input {...hooks.slot('input')} />
    </AriaColorField>
  );
}

/**
 * The picker's inputs for its format: a hex input, or a number input per channel of the format's
 * colour space (React Aria `ColorField` with `channel`), then alpha for a format that has it. Each
 * input has a visible label: `#` for hex and the channel's initial for a channel.
 */
export function ColorChannelInputs({ format }: { format: ColorFieldFormat }) {
  const strings = useUiStrings();
  const { hasHex, space, channels } = describeFormatInputs(format);
  return (
    <div {...hooks.slot('channels')}>
      {hasHex ? (
        <AriaColorField {...hooks.slot('hex')}>
          <ChannelLabel shown="#" name={strings.hexColor} />
          <Input {...hooks.slot('input')} />
        </AriaColorField>
      ) : null}
      {channels.map((channel) => (
        <ChannelInput key={channel} channel={channel} space={space} />
      ))}
    </div>
  );
}

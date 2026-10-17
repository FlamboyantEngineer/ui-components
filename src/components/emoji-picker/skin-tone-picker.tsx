import { Radio, RadioGroup } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { skinTones, withSkinTone, type SkinTone } from './emoji-catalog.js';

export interface SkinTonePickerProps {
  value: SkinTone;
  onChange: (tone: SkinTone) => void;
}

const hooks = createHooks('emoji-picker', ['skin-tones', 'skin-tone']);

/** A row of raised-hand swatches, one radio per skin tone. */
export function SkinTonePicker({ value, onChange }: SkinTonePickerProps) {
  const strings = useUiStrings();
  return (
    <RadioGroup
      className={hooks.slotClass('skin-tones')}
      aria-label={strings.skinTone}
      orientation="horizontal"
      value={value}
      onChange={(tone) => onChange(tone as SkinTone)}
    >
      {skinTones.map((tone) => (
        <Radio
          key={tone}
          value={tone}
          className={hooks.slotClass('skin-tone')}
          aria-label={strings.skinToneName(tone)}
        >
          <span aria-hidden="true">{withSkinTone('✋', tone)}</span>
        </Radio>
      ))}
    </RadioGroup>
  );
}

'use client';

import { Radio, RadioGroup } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { skinTones, withSkinTone, type SkinTone } from './emoji-catalog.js';
import { useEmojiPickerContext } from './emoji-picker-context.js';

/** The skin tone part: caller attributes and class go on the radio group. */
export type EmojiPickerSkinTonesProps = BaseProps;

const hooks = createHooks('emoji-picker', ['skin-tones', 'skin-tone']);

/** A row of raised-hand swatches, one radio per skin tone, for the enclosing picker. */
export function EmojiPickerSkinTones({ className, ...rest }: EmojiPickerSkinTonesProps) {
  const strings = useUiStrings();
  const { tone, setTone } = useEmojiPickerContext();
  return (
    <RadioGroup
      {...rest}
      {...hooks.slot('skin-tones', undefined, className)}
      aria-label={strings.skinTone}
      orientation="horizontal"
      value={tone}
      onChange={(value) => setTone(value as SkinTone)}
    >
      {skinTones.map((item) => (
        <Radio
          key={item}
          value={item}
          className={hooks.slotClass('skin-tone')}
          aria-label={strings.skinToneName(item)}
        >
          <span aria-hidden="true">{withSkinTone('✋', item)}</span>
        </Radio>
      ))}
    </RadioGroup>
  );
}

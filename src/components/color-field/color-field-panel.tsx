'use client';

import { ColorArea, ColorSlider, ColorThumb, Dialog, SliderTrack } from '../../primitives/index.js';
import { PopoverPanel } from '../popover/popover.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ColorSwatchPicker, ColorSwatchPickerItem } from '../color-swatch/color-swatch.js';
import type { FieldState } from '../field/field.js';
import { ColorChannelInputs, ColorFormatChoice } from './color-field-channels.js';
import { ColorFieldEyeDropper } from './color-field-eye-dropper.js';
import { hasAlpha, type ColorFieldFormat } from './color-values.js';

interface ColorFieldPanelProps {
  label: string;
  state: FieldState<string | null>;
  format: ColorFieldFormat;
  formats: readonly ColorFieldFormat[];
  onFormatChange: (format: ColorFieldFormat) => void;
  /** Preset colours, offered as swatches. */
  swatches: readonly string[];
  /** Draws the eye dropper where the browser has one. */
  allowsEyeDropper: boolean;
}

export const colorFieldHooks = createHooks('color-field', [
  'trigger',
  'swatch',
  'value',
  'group',
  'entry',
  'popover',
  'dialog',
  'area',
  'slider',
  'track',
  'thumb',
  'input',
  'swatches',
  'clear',
]);

const hooks = colorFieldHooks;

function ChannelSlider({ channel }: { channel: 'hue' | 'alpha' }) {
  return (
    <ColorSlider {...hooks.slot('slider', { channel })} colorSpace="hsb" channel={channel}>
      <SliderTrack {...hooks.slot('track')}>
        <ColorThumb {...hooks.slot('thumb')} />
      </SliderTrack>
    </ColorSlider>
  );
}

/**
 * The picker popover: the format choice, a saturation and brightness area, the hue slider (and the
 * alpha slider for an alpha format), the format's inputs, the eye dropper, the preset swatches and
 * Clear, which closes the picker once the colour is gone.
 */
export function ColorFieldPanel({
  label,
  state,
  format,
  formats,
  onFormatChange,
  swatches,
  allowsEyeDropper,
}: ColorFieldPanelProps) {
  const strings = useUiStrings();
  return (
    <>
      <PopoverPanel
        {...hooks.slot('popover', { layer: 'dropdown' })}
        placement="bottom start"
        offset={4}
      >
        <Dialog {...hooks.slot('dialog')} aria-label={label}>
          {({ close }) => (
            <>
              <ColorFormatChoice
                format={format}
                formats={formats}
                onFormatChange={onFormatChange}
              />
              <ColorArea
                {...hooks.slot('area')}
                colorSpace="hsb"
                xChannel="saturation"
                yChannel="brightness"
              >
                <ColorThumb {...hooks.slot('thumb')} />
              </ColorArea>
              <ChannelSlider channel="hue" />
              {hasAlpha(format) ? <ChannelSlider channel="alpha" /> : null}
              <ColorChannelInputs format={format} />
              {swatches.length > 0 ? (
                <ColorSwatchPicker className={hooks.slotClass('swatches')} size="sm">
                  {swatches.map((swatch) => (
                    <ColorSwatchPickerItem key={swatch} color={swatch} />
                  ))}
                </ColorSwatchPicker>
              ) : null}
              {state.isRequired ? null : (
                <Button
                  className={hooks.slotClass('clear')}
                  variant="ghost"
                  size="sm"
                  isDisabled={!state.canClear}
                  onPress={() => {
                    state.clear();
                    close();
                  }}
                >
                  {strings.clear}
                </Button>
              )}
              {allowsEyeDropper ? <ColorFieldEyeDropper /> : null}
            </>
          )}
        </Dialog>
      </PopoverPanel>
    </>
  );
}

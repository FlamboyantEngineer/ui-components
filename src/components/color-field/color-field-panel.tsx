'use client';

import { useUiStrings } from '../../core/provider.js';
import { ColorArea, ColorSlider, ColorThumb, Dialog, SliderTrack } from '../../primitives/index.js';
import { DEFAULT_DROPDOWN_OFFSET } from '../../utils/overlay-defaults.js';
import { Button } from '../button/button.js';
import { ColorSwatchPicker, ColorSwatchPickerItem } from '../color-swatch/color-swatch.js';
import type { FieldState } from '../field/field.js';
import { PopoverPanel } from '../popover/popover.js';
import { ColorChannelInputs, ColorFormatChoice } from './color-field-channels.js';
import { ColorFieldEyeDropper } from './color-field-eye-dropper.js';
import { colorFieldHooks } from './color-field-hooks.js';
import type { ColorFieldFormat } from './color-values.js';

interface ColorFieldPanelProps {
  label: string;
  state: FieldState<string | null>;
  format: ColorFieldFormat;
  formats: readonly ColorFieldFormat[];
  onFormatChange: (format: ColorFieldFormat) => void;
  /** Adds the alpha slider and input, and the hex input's visible `#`. */
  showsAlpha: boolean;
  /** Preset colours, offered as swatches. */
  swatches: readonly string[];
  /** Draws the eye dropper where the browser has one. */
  allowsEyeDropper: boolean;
}

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
 * alpha slider while it offers opacity), the format's inputs, the eye dropper, the preset
 * swatches and Clear, which closes the picker once the colour is gone.
 */
export function ColorFieldPanel({
  label,
  state,
  format,
  formats,
  onFormatChange,
  showsAlpha,
  swatches,
  allowsEyeDropper,
}: ColorFieldPanelProps) {
  const strings = useUiStrings();
  return (
    <>
      <PopoverPanel
        {...hooks.slot('popover', { layer: 'dropdown' })}
        placement="bottom start"
        offset={DEFAULT_DROPDOWN_OFFSET}
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
              {showsAlpha ? <ChannelSlider channel="alpha" /> : null}
              <ColorChannelInputs format={format} showsAlpha={showsAlpha} />
              {swatches.length > 0 ? (
                <ColorSwatchPicker className={hooks.slotClass('swatches')} size="sm">
                  {swatches.map((swatch, index) => (
                    // Swatches may repeat a colour: each place is its own option.
                    <ColorSwatchPickerItem key={`${index} ${swatch}`} color={swatch} />
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

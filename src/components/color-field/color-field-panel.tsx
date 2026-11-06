'use client';

import { useUiStrings } from '../../core/provider.js';
import {
  ColorArea,
  ColorSlider,
  ColorThumb,
  ColorWheel,
  ColorWheelTrack,
  Dialog,
  SliderTrack,
} from '../../primitives/index.js';
import { isFocusLost } from '../../utils/composed-focus.js';
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
  /** How the picker edits the hue: a slider or a wheel. */
  hueControl: ColorFieldHueControl;
}

/** How a colour field's picker edits the hue: a straight slider or a ring around a centre. */
export type ColorFieldHueControl = 'slider' | 'wheel';

/** The hue wheel's outer radius and ring width in pixels: geometry the wheel's thumb follows. */
const wheelRadius = 80;
const wheelRingWidth = 20;

const hooks = colorFieldHooks;

function ChannelSlider({ channel }: { channel: 'hue' | 'alpha' }) {
  return (
    <ColorSlider
      {...hooks.slot('slider', { channel })}
      ref={channel === 'hue' ? focusReplacedHue : undefined}
      colorSpace="hsb"
      channel={channel}
    >
      <SliderTrack {...hooks.slot('track')}>
        <ColorThumb {...hooks.slot('thumb')} />
      </SliderTrack>
    </ColorSlider>
  );
}

/**
 * Moves focus to a hue control that replaced the one that held it, when the presentation switches
 * while the picker is open; on first mount focus is elsewhere and stays there.
 */
function focusReplacedHue(element: HTMLElement | null) {
  if (element && isFocusLost(element)) element.querySelector('input')?.focus();
}

function HueWheel() {
  return (
    <ColorWheel
      {...hooks.slot('wheel')}
      ref={focusReplacedHue}
      outerRadius={wheelRadius}
      innerRadius={wheelRadius - wheelRingWidth}
    >
      <ColorWheelTrack {...hooks.slot('wheel-track')} />
      <ColorThumb {...hooks.slot('thumb')} />
    </ColorWheel>
  );
}

/**
 * The picker popover: the format choice, a saturation and brightness area, the hue slider or wheel (and the
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
  hueControl,
}: ColorFieldPanelProps) {
  const strings = useUiStrings();
  return (
    <>
      <PopoverPanel
        {...hooks.slot('popover', { layer: 'dropdown' })}
        placement="bottom start"
        offset={DEFAULT_DROPDOWN_OFFSET}
      >
        <Dialog {...hooks.slot('dialog', { hueControl })} aria-label={label}>
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
              {hueControl === 'wheel' ? <HueWheel /> : <ChannelSlider channel="hue" />}
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

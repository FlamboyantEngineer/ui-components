import { useUiStrings } from '../../core/provider.js';
import type { ButtonSize } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { MenuItemEntry } from '../menu/menu.js';

/** A zoom the preset menu offers that the caller resolves, such as fitting the page width. */
export interface ZoomPreset {
  /** Passed to `onPresetAction` when the preset is chosen. */
  id: string;
  /** The menu item's text. */
  label: string;
}

interface ZoomPresetMenuProps {
  /** Percentages and named presets, in menu order. No entries draw no menu. */
  presets: readonly (number | ZoomPreset)[] | undefined;
  onPresetAction: ((id: string) => void) | undefined;
  /** Formats a percentage entry like the control's value. */
  formatter: Intl.NumberFormat;
  className: string;
  size: ButtonSize;
  isDisabled: boolean;
  /** Requests a percentage entry's zoom. */
  onRequest: (value: number) => void;
}

/** A menu button whose items request a percentage or report a named preset. */
export function ZoomPresetMenu({
  presets = [],
  onPresetAction,
  formatter,
  onRequest,
  ...trigger
}: ZoomPresetMenuProps) {
  const strings = useUiStrings();
  if (presets.length === 0) return null;
  const items = presets.map(
    (preset): MenuItemEntry =>
      typeof preset === 'number'
        ? { id: preset, label: formatter.format(preset) }
        : { id: preset.id, label: preset.label },
  );
  return (
    <DropdownMenu
      {...trigger}
      iconOnly
      icon="chevron-down"
      label={strings.zoomPresets}
      placement="bottom end"
      items={items}
      onAction={(key) => {
        if (typeof key === 'number') onRequest(key);
        else onPresetAction?.(key);
      }}
    />
  );
}

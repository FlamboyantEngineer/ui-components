import { MoreGlyph } from '../../src/core/glyphs.js';
import { Button } from '../../src/components/button/button.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../../src/components/menu/menu.js';

/**
 * A row's menu button, as hosts put in a collection row: Pin and Archive. Closing the menu returns
 * focus to the button, not to the row.
 */
export function RowMenu({ label, onAction }: { label: string; onAction?: (key: string) => void }) {
  return (
    <MenuTrigger>
      <Button icon={MoreGlyph} size="sm" label={label} />
      <MenuPopover>
        <Menu onAction={(key) => onAction?.(String(key))}>
          <MenuItem id="pin">Pin</MenuItem>
          <MenuItem id="archive">Archive</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

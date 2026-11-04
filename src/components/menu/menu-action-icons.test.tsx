import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MenuButton, openMenu, readMenuIcons } from '../../../test/menu-fixtures.js';
import { CopyGlyph, StarGlyph } from '../../core/glyphs.js';
import { resolveActionIcon } from './menu-action-icons.js';

describe('resolveActionIcon', () => {
  it('UIC-MENU-6.1 replaces, removes or keeps an action icon', () => {
    expect(resolveActionIcon(undefined, 'copy', CopyGlyph)).toBe(CopyGlyph);
    expect(resolveActionIcon({}, 'copy', CopyGlyph)).toBe(CopyGlyph);
    expect(resolveActionIcon({ copy: StarGlyph }, 'copy', CopyGlyph)).toBe(StarGlyph);
    expect(resolveActionIcon({ copy: null }, 'copy', CopyGlyph)).toBeNull();
    expect(resolveActionIcon({ copy: undefined }, 'copy', CopyGlyph)).toBeUndefined();
    expect(resolveActionIcon({ copy: StarGlyph }, 'copy')).toBe(StarGlyph);
  });

  it('UIC-MENU-6.1 draws mixed iconed and iconless rows, names each by its label only', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <MenuButton
        onAction={onAction}
        items={[
          { id: 'copy', label: 'Copy', icon: resolveActionIcon({ copy: StarGlyph }, 'copy') },
          { id: 'paste', label: 'Paste', icon: resolveActionIcon({ paste: null }, 'paste') },
          { id: 'cut', label: 'Cut', icon: CopyGlyph, tone: 'danger', isDisabled: true },
        ]}
      />,
    );
    const menu = await openMenu(user);
    expect(readMenuIcons(menu)).toEqual({ Copy: 'star', Paste: null, Cut: 'copy' });
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onAction).toHaveBeenCalledWith('copy');
  });
});

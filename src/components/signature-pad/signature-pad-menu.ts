'use client';

// The signature pad's own entries in the shared field menu: Upload image, Paste image, Delete image
// and Undo stroke (specs/SIGNATURE-PAD.md, UIC-SIGNATURE-PAD-5).

import { ClipboardGlyph, DeleteGlyph, UndoGlyph, UploadGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { FieldState } from '../field/field.js';
import {
  defaultFieldMenu,
  type FieldMenuAction,
  type FieldMenuEntry,
} from '../field/field-menu-entries.js';
import type { IconSource } from '../icon/icon.js';
import type { MenuItemEntry } from '../menu/menu.js';
import { type MenuActionIcons, resolveActionIcon } from '../menu/menu-action-icons.js';
import type { ImageIntake } from './signature-image.js';
import { type SignatureValue, withoutLastStroke } from './signature-path.js';

/** The signature pad's own menu actions, offered before the field's. */
export type SignaturePadAction = 'upload-image' | 'paste-image' | 'delete-image' | 'undo-stroke';

/**
 * Icons for the signature pad's menu actions and the field's, by action; `null` removes an
 * action's own icon.
 */
export type SignaturePadMenuIcons = MenuActionIcons<SignaturePadAction | FieldMenuAction>;

const padKeys: ReadonlySet<Key> = new Set<SignaturePadAction>([
  'upload-image',
  'paste-image',
  'delete-image',
  'undo-stroke',
]);

function isSignaturePadAction(key: Key): key is SignaturePadAction {
  return padKeys.has(key);
}

interface SignatureMenuOptions {
  state: FieldState<SignatureValue | null>;
  /** The caller's field menu, or `undefined` for the default one. */
  menu: readonly FieldMenuEntry[] | undefined;
  onMenuAction: ((key: Key) => void) | undefined;
  menuIcons: SignaturePadMenuIcons | undefined;
  /** Whether the image mode is offered. */
  allowsImage: boolean;
  /** Whether the image mode shows. */
  isImageMode: boolean;
  intake: ImageIntake;
  /** Sets and commits the value, as the pad's own buttons do. */
  settle: (next: SignatureValue | null) => void;
}

/** What the pad holds that its menu can act on, and whether an image can be taken now. */
function readPadValue(value: SignatureValue | null, takesImage: boolean) {
  return {
    takesImage,
    hasImage: value?.kind === 'image' && value.src !== '',
    drawing: value?.kind === 'drawn' && value.paths.length > 0 ? value : null,
  };
}

/** The pad's entries that apply to what it holds, disabled while the field is locked. */
function usePadEntries(
  { takesImage, hasImage, drawing }: ReturnType<typeof readPadValue>,
  { isLocked, icons }: { isLocked: boolean; icons: SignaturePadMenuIcons | undefined },
): MenuItemEntry[] {
  const strings = useUiStrings();
  const entry = (id: SignaturePadAction, label: string, glyph: IconSource): MenuItemEntry => ({
    id,
    label,
    icon: resolveActionIcon(icons, id, glyph),
    isDisabled: isLocked,
  });
  const offered: (MenuItemEntry | false)[] = [
    takesImage && entry('upload-image', strings.uploadSignatureImage, UploadGlyph),
    takesImage && entry('paste-image', strings.pasteSignatureImage, ClipboardGlyph),
    hasImage && entry('delete-image', strings.deleteSignatureImage, DeleteGlyph),
    drawing !== null && entry('undo-stroke', strings.undoStroke, UndoGlyph),
  ];
  return offered.filter((item) => item !== false);
}

/**
 * The field menu with the pad's actions first, each offered while it applies to the mode shown and
 * the value: Upload image and Paste image in the image mode, empty or not, Delete image while an
 * image is held (in place of the field's Clear, which would do the same), and Undo stroke while a
 * drawing has a stroke. The typed mode adds none, and no action switches the mode. A read-only field shows them disabled. An empty
 * caller menu still leaves the browser's context menu alone.
 */
export function useSignatureMenu(options: SignatureMenuOptions) {
  const { state, intake, settle } = options;
  const held = readPadValue(state.value, options.allowsImage && options.isImageMode);
  const own = usePadEntries(held, {
    isLocked: state.isReadOnly || state.isDisabled,
    icons: options.menuIcons,
  });
  const shared = (options.menu ?? defaultFieldMenu).filter(
    (entry) => !(held.hasImage && entry === 'clear'),
  );
  const separator: FieldMenuEntry[] =
    own.length > 0 && shared.length > 0 ? [{ type: 'separator', id: 'pad-actions' }] : [];
  const run: Record<SignaturePadAction, () => void> = {
    'upload-image': intake.upload,
    'paste-image': () => void intake.paste(),
    'delete-image': intake.clear,
    'undo-stroke': () => {
      if (held.drawing) settle(withoutLastStroke(held.drawing));
    },
  };
  return {
    menu: options.menu?.length === 0 ? [] : [...own, ...separator, ...shared],
    onMenuAction(key: Key) {
      if (isSignaturePadAction(key)) run[key]();
      else options.onMenuAction?.(key);
    },
  };
}

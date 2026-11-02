'use client';

// The signature pad's own entries in the shared field menu: Upload image, Paste image, Delete image
// and Undo stroke (specs/SIGNATURE-PAD.md, UIC-SIGNATURE-PAD-5).

import { ClipboardGlyph, DeleteGlyph, UndoGlyph, UploadGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { defaultFieldMenu, type FieldMenuEntry } from '../field/field-menu-entries.js';
import type { FieldState } from '../field/field.js';
import type { MenuItemEntry } from '../menu/menu.js';
import type { ImageIntake } from './signature-image.js';
import { withoutLastStroke, type SignatureValue } from './signature-path.js';

type PadAction = 'upload-image' | 'paste-image' | 'delete-image' | 'undo-stroke';

const padKeys: ReadonlySet<Key> = new Set<PadAction>([
  'upload-image',
  'paste-image',
  'delete-image',
  'undo-stroke',
]);

function isPadAction(key: Key): key is PadAction {
  return padKeys.has(key);
}

interface SignatureMenuOptions {
  state: FieldState<SignatureValue | null>;
  /** The caller's field menu, or `undefined` for the default one. */
  menu: readonly FieldMenuEntry[] | undefined;
  onMenuAction: ((key: Key) => void) | undefined;
  /** Whether the image mode is offered. */
  allowsImage: boolean;
  /** Whether the image mode shows. */
  isImageMode: boolean;
  isEmpty: boolean;
  intake: ImageIntake;
  /** Shows the image mode, before an image is taken into an empty pad. */
  showImageMode: () => void;
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
  isLocked: boolean,
): MenuItemEntry[] {
  const strings = useUiStrings();
  const offered: (MenuItemEntry | false)[] = [
    takesImage && { id: 'upload-image', label: strings.uploadSignatureImage, icon: UploadGlyph },
    takesImage && { id: 'paste-image', label: strings.pasteSignatureImage, icon: ClipboardGlyph },
    hasImage && { id: 'delete-image', label: strings.deleteSignatureImage, icon: DeleteGlyph },
    drawing !== null && { id: 'undo-stroke', label: strings.undoStroke, icon: UndoGlyph },
  ];
  return offered
    .filter((entry) => entry !== false)
    .map((entry) => ({ ...entry, isDisabled: isLocked }));
}

/**
 * The field menu with the pad's actions first, each offered while it can apply: Upload image and
 * Paste image while the image mode is offered and showing or the pad is empty (so no signature is
 * lost), Delete image while an image is held (in place of the field's Clear, which would do the
 * same), and Undo stroke while a drawing is held. A read-only field shows them disabled. An empty
 * caller menu still leaves the browser's context menu alone.
 */
export function useSignatureMenu(options: SignatureMenuOptions) {
  const { state, intake, settle } = options;
  const held = readPadValue(
    state.value,
    options.allowsImage && (options.isImageMode || options.isEmpty),
  );
  const own = usePadEntries(held, state.isReadOnly || state.isDisabled);
  const shared = (options.menu ?? defaultFieldMenu).filter(
    (entry) => !(held.hasImage && entry === 'clear'),
  );
  const separator: FieldMenuEntry[] =
    own.length > 0 && shared.length > 0 ? [{ type: 'separator', id: 'pad-actions' }] : [];
  const run: Record<PadAction, () => void> = {
    'upload-image': () => {
      options.showImageMode();
      intake.upload();
    },
    'paste-image': () => {
      options.showImageMode();
      void intake.paste();
    },
    'delete-image': intake.clear,
    'undo-stroke': () => {
      if (held.drawing) settle(withoutLastStroke(held.drawing));
    },
  };
  return {
    menu: options.menu?.length === 0 ? [] : [...own, ...separator, ...shared],
    onMenuAction(key: Key) {
      if (isPadAction(key)) run[key]();
      else options.onMenuAction?.(key);
    },
  };
}

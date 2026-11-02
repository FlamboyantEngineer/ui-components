import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import {
  SignaturePad,
  type DrawnSignature,
  type ImageSignature,
  type SignatureValue,
} from './signature-pad.js';

const drawing: DrawnSignature = {
  kind: 'drawn',
  width: 600,
  height: 200,
  paths: ['M10 10 L50 40', 'M60 20 L90 20'],
};

const image: ImageSignature = {
  kind: 'image',
  src: 'data:image/png;base64,iVBORw0KGgo=',
  type: 'image/png',
  width: 96,
  height: 32,
};

const srcDescriptor = requireDefined(
  Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src'),
);

beforeEach(() => {
  // jsdom decodes no image: report a load, as a browser would.
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get(this: HTMLImageElement) {
      return srcDescriptor.get?.call(this) as string;
    },
    set(this: HTMLImageElement, value: string) {
      srcDescriptor.set?.call(this, value);
      queueMicrotask(() => this.onload?.(new Event('load')));
    },
  });
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(96);
  vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(32);
});

afterEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, 'src', srcDescriptor);
  vi.restoreAllMocks();
});

/** Opens the field menu with a secondary click on `target`. */
function openMenu(target: Element) {
  fireEvent.contextMenu(target);
  return screen.findByRole('menu', { name: 'Signature actions' });
}

const names = (menu: HTMLElement) =>
  within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent);

function choose(menu: HTMLElement, name: string, user = userEvent.setup()) {
  return user.click(within(menu).getByRole('menuitem', { name }));
}

describe('SignaturePad field menu', () => {
  it('UIC-SIGNATURE-PAD-5.1 UIC-SIGNATURE-PAD-5.2 offers Undo stroke on a drawing, from the canvas, and undoes through the commit path', async () => {
    const onCommit = vi.fn<(value: SignatureValue | null) => void>();
    const { container } = render(
      <SignaturePad label="Signature" defaultValue={drawing} onCommit={onCommit} />,
    );
    const canvas = requireDefined(container.querySelector('.ui-signature-pad__canvas'));
    let menu = await openMenu(canvas);
    expect(names(menu)).toEqual(['Undo stroke', 'Clear', 'Reset']);
    await choose(menu, 'Undo stroke');
    expect(onCommit).toHaveBeenLastCalledWith({ ...drawing, paths: ['M10 10 L50 40'] });
    menu = await openMenu(canvas);
    await choose(menu, 'Undo stroke');
    expect(onCommit).toHaveBeenLastCalledWith(null);
    // An empty drawing has no stroke to undo, and the draw mode takes no image.
    menu = await openMenu(canvas);
    expect(names(menu)).toEqual(['Clear', 'Reset']);
  });

  it('UIC-SIGNATURE-PAD-5.1 offers Delete image in place of Clear while an image is held', async () => {
    const onCommit = vi.fn<(value: SignatureValue | null) => void>();
    const onMenuAction = vi.fn();
    render(
      <SignaturePad
        label="Signature"
        defaultValue={image}
        onCommit={onCommit}
        onMenuAction={onMenuAction}
      />,
    );
    const menu = await openMenu(screen.getByRole('img', { name: 'Signature' }));
    expect(names(menu)).toEqual(['Upload image', 'Paste image', 'Delete image', 'Reset']);
    await choose(menu, 'Delete image');
    expect(onCommit).toHaveBeenLastCalledWith(null);
    // The pad's own actions are not the caller's.
    expect(onMenuAction).not.toHaveBeenCalled();
  });

  it('UIC-SIGNATURE-PAD-5.1 follows the mode chosen: an empty image mode takes an image from the menu', async () => {
    const onCommit = vi.fn<(value: SignatureValue | null) => void>();
    // Set up first: the user-event setup puts in its own clipboard.
    const user = userEvent.setup();
    const read = vi.fn().mockResolvedValue([
      {
        types: ['image/png'],
        getType: () => Promise.resolve(new Blob([new Uint8Array(64)], { type: 'image/png' })),
      },
    ]);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { read } });
    render(<SignaturePad label="Signature" onCommit={onCommit} />);
    let menu = await openMenu(screen.getByRole('img', { name: 'Signature' }));
    expect(names(menu)).toEqual(['Clear', 'Reset']);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('radio', { name: 'Type' }));
    menu = await openMenu(screen.getByRole('textbox'));
    expect(names(menu)).toEqual(['Clear', 'Reset']);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('radio', { name: 'Image' }));
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    menu = await openMenu(screen.getByRole('img', { name: 'Signature' }));
    expect(names(menu)).toEqual(['Upload image', 'Paste image', 'Clear', 'Reset']);
    await choose(menu, 'Upload image', user);
    expect(click).toHaveBeenCalledOnce();
    menu = await openMenu(screen.getByRole('img', { name: 'Signature' }));
    await choose(menu, 'Paste image', user);
    await waitFor(() => expect(onCommit).toHaveBeenCalledOnce());
    expect(onCommit.mock.lastCall?.[0]).toMatchObject({ kind: 'image', width: 96, height: 32 });
  });

  it('UIC-SIGNATURE-PAD-5.1 offers no image intake over a signature of another mode', async () => {
    const user = userEvent.setup();
    render(<SignaturePad label="Signature" defaultValue={{ kind: 'typed', text: 'Ada' }} />);
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Shift>}{F10}{/Shift}');
    const menu = await screen.findByRole('menu', { name: 'Signature actions' });
    expect(names(menu)).toEqual(['Clear', 'Reset']);
  });

  it('UIC-SIGNATURE-PAD-5.3 shows the pad actions disabled while read-only and no menu while disabled', async () => {
    const { rerender } = render(<SignaturePad label="Signature" value={image} isReadOnly />);
    const menu = await openMenu(screen.getByRole('img', { name: 'Signature' }));
    for (const name of ['Upload image', 'Paste image', 'Delete image']) {
      expect(within(menu).getByRole('menuitem', { name })).toHaveAttribute('aria-disabled', 'true');
    }
    rerender(<SignaturePad label="Signature" value={image} isDisabled />);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(fireEvent.contextMenu(screen.getByRole('img', { name: 'Signature' }))).toBe(true);
  });

  it('UIC-SIGNATURE-PAD-5.1 leaves the browser menu alone for an empty caller menu', () => {
    render(<SignaturePad label="Signature" defaultValue={drawing} menu={[]} />);
    expect(fireEvent.contextMenu(screen.getByRole('img', { name: 'Signature' }))).toBe(true);
  });
});

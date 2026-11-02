import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Form } from '../form/form.js';
import { SignaturePad, type ImageSignature } from './signature-pad.js';

const image: ImageSignature = {
  kind: 'image',
  src: 'data:image/png;base64,iVBORw0KGgo=',
  type: 'image/png',
  width: 96,
  height: 32,
};

/** Whether the stubbed image decoder loads the next image, and the size it reports. */
let decodes = true;
/** What the stubbed decoder waits for before it reports. */
let decoded: Promise<void> = Promise.resolve();

const srcDescriptor = requireDefined(
  Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src'),
);

beforeEach(() => {
  decodes = true;
  decoded = Promise.resolve();
  // jsdom decodes no image: report a load, or an error, as a browser would.
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get(this: HTMLImageElement) {
      return srcDescriptor.get?.call(this) as string;
    },
    set(this: HTMLImageElement, value: string) {
      srcDescriptor.set?.call(this, value);
      void decoded.then(() => {
        if (decodes) this.onload?.(new Event('load'));
        else this.onerror?.(new Event('error'));
      });
    },
  });
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(96);
  vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(32);
});

afterEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, 'src', srcDescriptor);
  vi.restoreAllMocks();
});

function png(name = 'signature.png', size = 64) {
  return new File([new Uint8Array(size)], name, { type: 'image/png' });
}

/** A promise and the function that settles it, for work that finishes when a test says so. */
function deferred<T>() {
  let settle: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    settle = resolve;
  });
  return { promise, settle };
}

/** A clipboard whose reads each wait until the test hands them their image; set up after the user. */
function stubClipboard() {
  const reads: Array<(file: Blob) => void> = [];
  const read = vi.fn(() => {
    const pending = deferred<Blob>();
    reads.push(pending.settle);
    return pending.promise.then((file) => [
      { types: ['image/png'], getType: () => Promise.resolve(file) },
    ]);
  });
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { read } });
  return reads;
}

/** Lets pending reads and decodes run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

function fileInput(container: HTMLElement) {
  return requireDefined(container.querySelector<HTMLInputElement>('input[type="file"]'));
}

function message(container: HTMLElement) {
  return requireDefined(container.querySelector('.ui-signature-pad__image-message'));
}

function paste(target: Element, files: File[]) {
  const event = createEvent.paste(target);
  Object.assign(event, { clipboardData: { files } });
  // eslint-disable-next-line testing-library/prefer-user-event -- jsdom has no DataTransfer to carry pasted files
  fireEvent(target, event);
}

describe('SignaturePad image mode', () => {
  it('UIC-SIGNATURE-PAD-4.1 UIC-SIGNATURE-PAD-4.2 uploads an image and commits it as the value', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(<SignaturePad label="Signature" onCommit={onCommit} />);
    for (const name of ['Draw', 'Type', 'Image']) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('radio', { name: 'Image' }));
    const area = screen.getByRole('img', { name: 'Signature' });
    expect(area).toHaveAccessibleDescription('No image yet. Upload or paste one.');
    expect(fileInput(container)).toHaveAttribute(
      'accept',
      'image/png,image/jpeg,image/webp,image/gif',
    );
    await user.upload(fileInput(container), png());
    await waitFor(() => expect(onCommit).toHaveBeenCalledOnce());
    expect(onCommit).toHaveBeenLastCalledWith({
      kind: 'image',
      src: expect.stringMatching(/^data:image\/png;base64,/) as unknown,
      type: 'image/png',
      width: 96,
      height: 32,
    });
    expect(container.querySelector('.ui-signature-pad__image-preview')).toHaveAttribute(
      'src',
      expect.stringMatching(/^data:image\/png/) as unknown,
    );
    expect(area).not.toHaveAccessibleDescription();
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-mode', 'image');
    expectHooksMatchSpec(container, 'SIGNATURE-PAD', {
      slots: ['image', 'image-surface', 'image-preview', 'image-message'],
    });
  });

  it('UIC-SIGNATURE-PAD-4.2 takes a pasted image, from a paste or the Paste image button', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const read = vi.fn().mockResolvedValue([
      // Another image than the pasted one, so taking it is a change.
      { types: ['text/plain', 'image/png'], getType: () => Promise.resolve(png('copied.png', 80)) },
    ]);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { read } });
    const { container } = render(
      <SignaturePad label="Signature" modes={['image']} onCommit={onCommit} />,
    );
    expect(container.querySelector('.ui-signature-pad__modes')).toBeNull();
    paste(screen.getByRole('img', { name: 'Signature' }), [png()]);
    await waitFor(() => expect(onCommit).toHaveBeenCalledOnce());
    paste(screen.getByRole('button', { name: 'Upload image' }), []);
    await waitFor(() =>
      expect(message(container)).toHaveTextContent('The clipboard holds no image.'),
    );
    await user.click(screen.getByRole('button', { name: 'Paste image' }));
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(2));
    expect(message(container)).toBeEmptyDOMElement();
    read.mockRejectedValueOnce(new Error('denied'));
    await user.click(screen.getByRole('button', { name: 'Paste image' }));
    await waitFor(() =>
      expect(message(container)).toHaveTextContent('The clipboard holds no image.'),
    );
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it('UIC-SIGNATURE-PAD-4.3 refuses another type, a file too large and an unreadable image', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onChange = vi.fn();
    const { container } = render(
      <SignaturePad
        label="Signature"
        defaultValue={image}
        maxImageSize={100}
        onChange={onChange}
      />,
    );
    await user.upload(fileInput(container), new File(['hi'], 'note.txt', { type: 'text/plain' }));
    await waitFor(() =>
      expect(message(container)).toHaveTextContent('Choose a PNG, JPEG, WebP or GIF image.'),
    );
    expect(message(container)).toHaveAttribute('role', 'status');
    await user.upload(fileInput(container), png('big.png', 200));
    await waitFor(() =>
      expect(message(container)).toHaveTextContent('Choose an image of 100 B or less.'),
    );
    decodes = false;
    await user.upload(fileInput(container), png());
    await waitFor(() =>
      expect(message(container)).toHaveTextContent('The image could not be read.'),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('.ui-signature-pad__image-preview')).toHaveAttribute(
      'src',
      image.src,
    );
  });

  it('UIC-SIGNATURE-PAD-4.4 clears, leaves the mode with no hidden image, and refuses changes while locked', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container, rerender } = render(
      <SignaturePad label="Signature" defaultValue={image} onCommit={onCommit} />,
    );
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-mode', 'image');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(container.querySelector('.ui-signature-pad__image-preview')).toBeNull();
    rerender(
      <SignaturePad key="again" label="Signature" defaultValue={image} onCommit={onCommit} />,
    );
    await user.click(screen.getByRole('radio', { name: 'Draw' }));
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-mode', 'draw');
    rerender(
      <SignaturePad key="locked" label="Signature" value={image} isReadOnly onCommit={onCommit} />,
    );
    for (const name of ['Upload image', 'Paste image', 'Clear']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    paste(screen.getByRole('img', { name: 'Signature' }), [png()]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it('UIC-SIGNATURE-PAD-4.4 counts an image as a signature in a required field and submits it as JSON', async () => {
    const user = userEvent.setup();
    const submitted: Array<FormDataEntryValue | null> = [];
    render(
      <Form
        aria-label="Sign"
        onSubmit={(event) => {
          event.preventDefault();
          submitted.push(new FormData(event.currentTarget).get('signature'));
        }}
      >
        <SignaturePad label="Signature" name="signature" isRequired defaultValue={image} />
        <button type="submit">Send</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(submitted).toEqual([JSON.stringify(image)]);
  });

  it('UIC-SIGNATURE-PAD-4.2 drops a paste whose clipboard read settles after the mode changed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const reads = stubClipboard();
    const { container } = render(
      <SignaturePad label="Signature" onChange={onChange} onCommit={onCommit} />,
    );
    await user.click(screen.getByRole('radio', { name: 'Image' }));
    await user.click(screen.getByRole('button', { name: 'Paste image' }));
    await user.click(screen.getByRole('radio', { name: 'Type' }));
    reads[0]?.(png());
    await settle();
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-mode', 'type');
    // A failed read that settles late leaves no message either.
    await user.click(screen.getByRole('radio', { name: 'Image' }));
    await user.click(screen.getByRole('button', { name: 'Paste image' }));
    await user.click(screen.getByRole('button', { name: 'Upload image' }));
    await user.upload(fileInput(container), png());
    await waitFor(() => expect(onCommit).toHaveBeenCalledOnce());
    reads[1]?.(new Blob(['not an image'], { type: 'text/plain' }));
    await settle();
    expect(message(container)).toBeEmptyDOMElement();
    expect(onCommit).toHaveBeenCalledOnce();
  });

  it('UIC-SIGNATURE-PAD-4.2 keeps the latest image when an earlier clipboard read settles last', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const reads = stubClipboard();
    render(<SignaturePad label="Signature" modes={['image']} onCommit={onCommit} />);
    // Paste image waits on the clipboard while a paste brings a newer image at once.
    await user.click(screen.getByRole('button', { name: 'Paste image' }));
    paste(screen.getByRole('img', { name: 'Signature' }), [png('newer.png', 40)]);
    await waitFor(() => expect(onCommit).toHaveBeenCalledOnce());
    const newer = onCommit.mock.lastCall?.[0] as ImageSignature;
    reads[0]?.(png('older.png', 90));
    await settle();
    expect(onCommit).toHaveBeenCalledOnce();
    expect(screen.getByRole('img', { name: 'Signature' }).querySelector('img')).toHaveAttribute(
      'src',
      newer.src,
    );
  });

  it('UIC-SIGNATURE-PAD-4.2 drops an image still decoding when the host replaces the value or locks the field', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const reads = stubClipboard();
    const { rerender } = render(
      <SignaturePad label="Signature" modes={['image']} value={null} onCommit={onCommit} />,
    );
    const decoding = deferred<undefined>();
    decoded = decoding.promise;
    await user.click(screen.getByRole('button', { name: 'Paste image' }));
    reads[0]?.(png());
    await settle();
    rerender(
      <SignaturePad label="Signature" modes={['image']} value={image} onCommit={onCommit} />,
    );
    decoding.settle(undefined);
    await settle();
    expect(onCommit).not.toHaveBeenCalled();
    const locking = deferred<undefined>();
    decoded = locking.promise;
    await user.click(screen.getByRole('button', { name: 'Paste image' }));
    reads[1]?.(png());
    await settle();
    rerender(
      <SignaturePad
        label="Signature"
        modes={['image']}
        value={image}
        isDisabled
        onCommit={onCommit}
      />,
    );
    locking.settle(undefined);
    await settle();
    expect(onCommit).not.toHaveBeenCalled();
  });
});

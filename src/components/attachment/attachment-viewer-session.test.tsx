import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { type AttachmentData, AttachmentList } from './attachment.js';

const harbour: AttachmentData = {
  id: 'harbour',
  name: 'Harbour.png',
  mediaType: 'image/png',
  url: '/files/harbour.png',
};
const tower: AttachmentData = {
  id: 'tower',
  name: 'Tower.jpg',
  mediaType: 'image/jpeg',
  url: '/files/tower.jpg',
};
const bridge: AttachmentData = {
  id: 'bridge',
  name: 'Bridge.png',
  mediaType: 'image/png',
  url: '/files/bridge.png',
};
const menu: AttachmentData = {
  id: 'menu',
  name: 'Menu.pdf',
  mediaType: 'application/pdf',
  url: '/files/menu.pdf',
};

async function openViewer(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: `View ${name}` }));
  return screen.findByRole('dialog', { name });
}

describe('AttachmentList viewer session', () => {
  it.each([
    ['an empty list', [] as AttachmentData[]],
    ['files without images', [menu]],
  ])(
    'UIC-ATTACHMENT-2.2 ends the viewer when its images give way to %s and opens nothing after',
    async (_, between) => {
      const user = userEvent.setup();
      const input = createRef<HTMLTextAreaElement>();
      const { rerender } = render(
        <>
          <AttachmentList attachments={[harbour]} finalFocus={input} />
          <textarea ref={input} aria-label="Message" />
        </>,
      );
      await openViewer(user, 'Harbour.png');
      rerender(
        <>
          <AttachmentList attachments={between} finalFocus={input} />
          <textarea ref={input} aria-label="Message" />
        </>,
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      const expected =
        between.length === 0
          ? screen.getByRole('textbox', { name: 'Message' })
          : screen.getByRole('link', { name: 'Download Menu.pdf' });
      await waitFor(() => expect(expected).toHaveFocus());
      rerender(
        <>
          <AttachmentList attachments={[tower]} finalFocus={input} />
          <textarea ref={input} aria-label="Message" />
        </>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Tower.jpg' })).toBeInTheDocument();
      await openViewer(user, 'Tower.jpg');
    },
  );

  it('UIC-ATTACHMENT-2.2 shows the image that takes the place of the shown one, else the last', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AttachmentList attachments={[harbour, tower, bridge]} />);
    await openViewer(user, 'Tower.jpg');
    rerender(<AttachmentList attachments={[harbour, bridge]} />);
    expect(await screen.findByRole('dialog', { name: 'Bridge.png' })).toBeInTheDocument();
    rerender(<AttachmentList attachments={[harbour]} />);
    expect(await screen.findByRole('dialog', { name: 'Harbour.png' })).toBeInTheDocument();
    rerender(<AttachmentList attachments={[tower, harbour]} />);
    expect(await screen.findByRole('dialog', { name: 'Harbour.png' })).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  it('UIC-ATTACHMENT-2.2 forgets a closed viewer whose images left', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AttachmentList attachments={[harbour, tower]} />);
    await openViewer(user, 'Tower.jpg');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    rerender(<AttachmentList attachments={[]} />);
    rerender(<AttachmentList attachments={[harbour]} />);
    await openViewer(user, 'Harbour.png');
    expect(screen.queryByText(/of/)).not.toBeInTheDocument();
  });
});

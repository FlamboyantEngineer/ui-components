import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ChatAttachmentList, type ChatAttachmentData } from './chat-attachment.js';

const harbour: ChatAttachmentData = {
  id: 'harbour',
  name: 'Harbour.png',
  mediaType: 'image/png',
  url: '/files/harbour.png',
};
const tower: ChatAttachmentData = {
  id: 'tower',
  name: 'Tower.jpg',
  mediaType: 'image/jpeg',
  url: '/files/tower.jpg',
};
const bridge: ChatAttachmentData = {
  id: 'bridge',
  name: 'Bridge.png',
  mediaType: 'image/png',
  url: '/files/bridge.png',
};
const menu: ChatAttachmentData = {
  id: 'menu',
  name: 'Menu.pdf',
  mediaType: 'application/pdf',
  url: '/files/menu.pdf',
};

async function openViewer(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: `View ${name}` }));
  return screen.findByRole('dialog', { name });
}

describe('ChatAttachmentList viewer session', () => {
  it.each([
    ['an empty list', [] as ChatAttachmentData[]],
    ['files without images', [menu]],
  ])(
    'UIC-CHAT-ATTACHMENT-2.2 ends the viewer when its images give way to %s and opens nothing after',
    async (_, between) => {
      const user = userEvent.setup();
      const input = createRef<HTMLTextAreaElement>();
      const { rerender } = render(
        <>
          <ChatAttachmentList attachments={[harbour]} finalFocus={input} />
          <textarea ref={input} aria-label="Message" />
        </>,
      );
      await openViewer(user, 'Harbour.png');
      rerender(
        <>
          <ChatAttachmentList attachments={between} finalFocus={input} />
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
          <ChatAttachmentList attachments={[tower]} finalFocus={input} />
          <textarea ref={input} aria-label="Message" />
        </>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Tower.jpg' })).toBeInTheDocument();
      await openViewer(user, 'Tower.jpg');
    },
  );

  it('UIC-CHAT-ATTACHMENT-2.2 shows the image that takes the place of the shown one, else the last', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChatAttachmentList attachments={[harbour, tower, bridge]} />);
    await openViewer(user, 'Tower.jpg');
    rerender(<ChatAttachmentList attachments={[harbour, bridge]} />);
    expect(await screen.findByRole('dialog', { name: 'Bridge.png' })).toBeInTheDocument();
    rerender(<ChatAttachmentList attachments={[harbour]} />);
    expect(await screen.findByRole('dialog', { name: 'Harbour.png' })).toBeInTheDocument();
    rerender(<ChatAttachmentList attachments={[tower, harbour]} />);
    expect(await screen.findByRole('dialog', { name: 'Harbour.png' })).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  it('UIC-CHAT-ATTACHMENT-2.2 forgets a closed viewer whose images left', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChatAttachmentList attachments={[harbour, tower]} />);
    await openViewer(user, 'Tower.jpg');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    rerender(<ChatAttachmentList attachments={[]} />);
    rerender(<ChatAttachmentList attachments={[harbour]} />);
    await openViewer(user, 'Harbour.png');
    expect(screen.queryByText(/of/)).not.toBeInTheDocument();
  });
});

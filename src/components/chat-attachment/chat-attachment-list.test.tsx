import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatAttachmentList, type ChatAttachmentData } from './chat-attachment.js';

const attachments: ChatAttachmentData[] = [
  { id: 'harbour', name: 'Harbour.png', mediaType: 'image/png', url: '/files/harbour.png' },
  { id: 'menu', name: 'Menu.pdf', mediaType: 'application/pdf', size: 2048, url: '/m.pdf' },
  {
    id: 'tower',
    name: 'Tower.jpg',
    mediaType: 'image/jpeg',
    url: '/files/tower.jpg',
    thumbnailUrl: '/files/tower-small.jpg',
  },
  { id: 'notes', name: 'Notes.txt', mediaType: 'text/plain', status: 'error', error: 'Too large' },
];

function items(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.ui-chat-attachment-list__item'));
}

/** A composer-style owner that drops an attachment when its remove button is pressed. */
function Composer({ initial, keepList }: { initial: ChatAttachmentData[]; keepList: boolean }) {
  const [listed, setListed] = useState(initial);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const list = (
    <ChatAttachmentList
      attachments={listed}
      finalFocus={inputRef}
      onRemove={(id) => setListed((current) => current.filter((item) => item.id !== id))}
    />
  );
  return (
    <>
      {keepList || listed.length > 0 ? list : null}
      <textarea ref={inputRef} aria-label="Message" />
    </>
  );
}

describe('ChatAttachmentList', () => {
  it('UIC-CHAT-ATTACHMENT-2.1 lists the attachments in order under the default name', () => {
    const { container } = render(<ChatAttachmentList attachments={attachments} />);
    const list = screen.getByRole('list', { name: 'Attachments' });
    expect(list).toHaveClass('ui-chat-attachment-list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(
      items(container).map((item) => item.firstElementChild?.getAttribute('data-kind')),
    ).toEqual(['image', 'pdf', 'image', 'text']);
    expectHooksMatchSpec(container, 'CHAT-ATTACHMENT', { slots: ['item', 'preview', 'icon'] });
  });

  it('UIC-CHAT-ATTACHMENT-2.1 takes the owner name and renders nothing when empty', () => {
    const { container, rerender } = render(
      <>
        <h3 id="files-heading">Shared files</h3>
        <ChatAttachmentList attachments={attachments} aria-labelledby="files-heading" />
      </>,
    );
    expect(screen.getByRole('list', { name: 'Shared files' })).not.toHaveAttribute('aria-label');
    rerender(<ChatAttachmentList attachments={attachments} aria-label="Files to send" />);
    expect(screen.getByRole('list', { name: 'Files to send' })).toBeInTheDocument();
    rerender(<ChatAttachmentList attachments={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-CHAT-ATTACHMENT-2.1 keeps every control in the Tab order, in reading order', async () => {
    const user = userEvent.setup();
    render(<ChatAttachmentList attachments={attachments} onRemove={() => {}} onRetry={() => {}} />);
    const names: string[] = [];
    for (let step = 0; step < 9; step += 1) {
      await user.tab();
      names.push(document.activeElement?.getAttribute('aria-label') ?? '');
    }
    expect(names).toEqual([
      'View Harbour.png',
      'Download Harbour.png',
      'Remove Harbour.png',
      'Download Menu.pdf',
      'Remove Menu.pdf',
      'View Tower.jpg',
      'Download Tower.jpg',
      'Remove Tower.jpg',
      '',
    ]);
    expect(document.activeElement).toHaveTextContent('Retry');
  });

  it('UIC-CHAT-ATTACHMENT-2.2 opens the media viewer on the pressed image with the other images', async () => {
    const user = userEvent.setup();
    render(<ChatAttachmentList attachments={attachments} />);
    expect(screen.queryByRole('button', { name: 'View Menu.pdf' })).not.toBeInTheDocument();
    const opener = screen.getByRole('button', { name: 'View Tower.jpg' });
    await user.click(opener);
    const dialog = await screen.findByRole('dialog', { name: 'Tower.jpg' });
    expect(within(dialog).getByText('2 of 2')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'Tower.jpg' })).toHaveAttribute(
      'src',
      '/files/tower.jpg',
    );
    expect(within(dialog).getByRole('link', { name: 'Download Tower.jpg' })).toHaveAttribute(
      'href',
      '/files/tower.jpg',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Previous' }));
    expect(await screen.findByRole('dialog', { name: 'Harbour.png' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('UIC-CHAT-ATTACHMENT-2.3 passes the attachment id to onRemove and onRetry', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onRetry = vi.fn();
    render(<ChatAttachmentList attachments={attachments} onRemove={onRemove} onRetry={onRetry} />);
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: 'Remove Menu.pdf' }));
    expect(onRemove).toHaveBeenCalledWith('menu');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledWith('notes');
  });

  it('UIC-CHAT-ATTACHMENT-2.4 moves the focus to the next attachment, the previous one, then the composer', async () => {
    const user = userEvent.setup();
    render(<Composer initial={attachments.slice(0, 3)} keepList />);
    act(() => screen.getByRole('button', { name: 'Remove Menu.pdf' }).focus());
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove Tower.jpg' })).toHaveFocus(),
    );
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove Harbour.png' })).toHaveFocus(),
    );
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus());
  });

  it('UIC-CHAT-ATTACHMENT-2.4 sends the focus to the composer when the owner stops rendering the list', async () => {
    const user = userEvent.setup();
    render(<Composer initial={attachments.slice(1, 2)} keepList={false} />);
    await user.click(screen.getByRole('button', { name: 'Remove Menu.pdf' }));
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus());
  });

  it('UIC-CHAT-ATTACHMENT-2.5 appends the caller class and forwards the id and data attributes', () => {
    const { container } = render(
      <ChatAttachmentList
        attachments={attachments}
        className="caller"
        id="files"
        data-testid="probe"
      />,
    );
    const list = screen.getByRole('list');
    expect(list).toHaveClass('ui-chat-attachment-list', 'caller');
    expect(list).toHaveAttribute('id', 'files');
    expect(list).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'CHAT-ATTACHMENT', { callerAttributes: ['data-testid'] });
  });
});

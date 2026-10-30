import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderController, settle } from '../../../test/chat-controller-fixtures.js';
import type { ChatUploadContext } from './chat-controller.js';
import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';

/** An `upload` whose calls the test settles one by one. */
function createTestUpload() {
  const calls: Array<{
    file: File;
    context: ChatUploadContext;
    resolve: (data: Partial<ChatAttachmentData>) => void;
    reject: (error: unknown) => void;
  }> = [];
  const upload = vi.fn(
    (file: File, context: ChatUploadContext) =>
      new Promise<Partial<ChatAttachmentData>>((resolve, reject) => {
        calls.push({ file, context, resolve, reject });
      }),
  );
  return { upload, calls };
}

const photo = () => new File(['pixels'], 'soup.png', { type: 'image/png' });
const notes = () => new File(['text'], 'notes.txt', { type: 'text/plain' });

describe('useChatController attachments', () => {
  it('UIC-CHAT-CONTROLLER-4.1 uploads attached files with their progress', async () => {
    const { upload, calls } = createTestUpload();
    const { result } = renderController({ upload });
    act(() => result.current.props.onAttach?.([photo()]));
    expect(result.current.props.attachments).toEqual([
      expect.objectContaining({
        name: 'soup.png',
        mediaType: 'image/png',
        size: 6,
        status: 'uploading',
        progress: 0,
      }),
    ]);
    expect(calls[0]?.file.name).toBe('soup.png');
    act(() => calls[0]?.context.onProgress(0.5));
    expect(result.current.props.attachments[0]?.progress).toBe(0.5);
    calls[0]?.resolve({ url: 'https://example.com/soup.png' });
    await settle();
    expect(result.current.props.attachments[0]).toMatchObject({
      status: 'complete',
      url: 'https://example.com/soup.png',
      progress: undefined,
    });
  });

  it('UIC-CHAT-CONTROLLER-4.1 marks a failed upload and uploads it again on retry', async () => {
    const { upload, calls } = createTestUpload();
    const { result } = renderController({ upload });
    act(() => result.current.props.onAttach?.([photo(), notes()]));
    calls[0]?.reject(new Error('Too large.'));
    calls[1]?.reject('offline');
    await settle();
    const [first, second] = result.current.props.attachments;
    expect(first).toMatchObject({ status: 'error', error: 'Too large.' });
    expect(second).toMatchObject({ status: 'error', error: undefined });
    act(() => result.current.props.onRetryAttachment?.(first?.id ?? ''));
    expect(result.current.props.attachments[0]).toMatchObject({
      status: 'uploading',
      progress: 0,
      error: undefined,
    });
    expect(calls).toHaveLength(3);
    calls[2]?.resolve({});
    await settle();
    expect(result.current.props.attachments[0]?.status).toBe('complete');
  });

  it('UIC-CHAT-CONTROLLER-4.1 removes a file and aborts its upload', async () => {
    const { upload, calls } = createTestUpload();
    const { result } = renderController({ upload });
    act(() => result.current.props.onAttach?.([photo()]));
    act(() =>
      result.current.props.onRemoveAttachment?.(result.current.props.attachments[0]?.id ?? ''),
    );
    expect(calls[0]?.context.signal.aborted).toBe(true);
    expect(result.current.props.attachments).toEqual([]);
    calls[0]?.resolve({ url: 'late' });
    await settle();
    expect(result.current.props.attachments).toEqual([]);
  });

  it('UIC-CHAT-CONTROLLER-4.1 offers no attaching without upload', () => {
    const { result } = renderController();
    expect(result.current.props.onAttach).toBeUndefined();
    expect(result.current.props.onRemoveAttachment).toBeUndefined();
    expect(result.current.props.onRetryAttachment).toBeUndefined();
    expect(result.current.props.attachments).toEqual([]);
  });

  it('UIC-CHAT-CONTROLLER-4.2 sends the uploaded files with the next message', async () => {
    const { upload, calls } = createTestUpload();
    const { result, at } = renderController({ upload });
    act(() => result.current.props.onAttach?.([photo(), notes()]));
    calls[0]?.resolve({ url: 'https://example.com/soup.png' });
    await settle();
    act(() => result.current.send('Like this?'));
    expect(at().messages.at(-1)?.parts).toEqual([
      {
        type: 'files',
        attachments: [
          expect.objectContaining({ name: 'soup.png', url: 'https://example.com/soup.png' }),
        ],
      },
      { type: 'text', text: 'Like this?' },
    ]);
    expect(result.current.props.attachments).toEqual([
      expect.objectContaining({ name: 'notes.txt', status: 'uploading' }),
    ]);
  });

  it('UIC-CHAT-CONTROLLER-4.2 sends uploaded files without text, and queues them during a run', async () => {
    const { upload, calls } = createTestUpload();
    const { result, at } = renderController({ upload });
    act(() => result.current.send('Hello'));
    act(() => result.current.props.onAttach?.([photo()]));
    calls[0]?.resolve({});
    await settle();
    act(() => result.current.send(''));
    expect(result.current.queue).toEqual([
      expect.objectContaining({
        text: '',
        attachments: [expect.objectContaining({ name: 'soup.png' })],
      }),
    ]);
    at().push({ type: 'finish' });
    await settle();
    expect(at().messages.at(-1)?.parts).toEqual([
      { type: 'files', attachments: [expect.objectContaining({ name: 'soup.png' })] },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-5.3 cancels uploads when the conversation resets', async () => {
    const { upload, calls } = createTestUpload();
    const { result } = renderController({ upload });
    act(() => result.current.props.onAttach?.([photo()]));
    act(() => result.current.resetConversation());
    expect(calls[0]?.context.signal.aborted).toBe(true);
    expect(result.current.props.attachments).toEqual([]);
    calls[0]?.resolve({ url: 'https://example.com/soup.png' });
    await settle();
    expect(result.current.props.attachments).toEqual([]);
  });
});

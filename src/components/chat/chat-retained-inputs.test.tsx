import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { message, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import type { ChatProps } from './chat.js';

installEditorDom();

describe('Conversation-owned interactive drafts', () => {
  it('UIC-CHAT-1.5 UIC-CHAT-QUESTION-2.7 retains an in-flight answer and its failure across removal and remount', async () => {
    let reject: (error: Error) => void = () => undefined;
    const response = new Promise<void>((_resolve, fail) => {
      reject = fail;
    });
    const onAnswerQuestion = vi.fn(() => response);
    const options: Partial<ChatProps> = {
      conversationId: 'first',
      onAnswerQuestion,
      messages: [
        message('question', 'ana', {
          parts: [
            {
              type: 'question',
              id: 'ask',
              status: 'pending',
              questions: [
                { id: 'note', question: 'Any notes?', selectionMode: 'none', options: [] },
              ],
            },
          ],
        }),
      ],
    };
    const { user, rerenderWith } = renderChat(options);
    await user.type(screen.getByRole('textbox', { name: /Any notes/ }), 'Keep this answer');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    rerenderWith({ ...options, messages: [] });
    rerenderWith(options);
    expect(screen.getByRole('textbox', { name: /Any notes/ })).toHaveValue('Keep this answer');
    expect(screen.getByRole('button', { name: /Submit/ })).toHaveAttribute('aria-disabled', 'true');
    expect(onAnswerQuestion).toHaveBeenCalledTimes(1);
    await act(async () => reject(new Error('Try again')));
    expect(screen.getByRole('alert')).toHaveTextContent('Try again');
    expect(screen.getByRole('textbox', { name: /Any notes/ })).toHaveValue('Keep this answer');
  });

  it('UIC-CHAT-1.5 UIC-CHAT-TOOL-CALL-4.2 retains a denial draft without stealing focus on remount and resets in another conversation', async () => {
    const options: Partial<ChatProps> = {
      conversationId: 'first',
      onDeny: vi.fn(),
      messages: [
        message('approval', 'ana', {
          parts: [
            {
              type: 'tool-call',
              id: 'apply',
              name: 'apply_change',
              status: 'approval-requested',
              grouping: 'standalone',
            },
          ],
        }),
      ],
    };
    const { user, rerenderWith } = renderChat(options);
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    await user.type(screen.getByRole('textbox', { name: /Reason/ }), 'Keep the old version');
    await user.click(screen.getByRole('textbox', { name: 'Message' }));
    rerenderWith({ ...options, messages: [] });
    rerenderWith(options);
    expect(screen.getByRole('textbox', { name: /Reason/ })).toHaveValue('Keep the old version');
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus();
    rerenderWith({ ...options, conversationId: 'second' });
    expect(screen.queryByRole('textbox', { name: /Reason/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    expect(screen.getByRole('textbox', { name: /Reason/ })).toHaveValue('');
  });

  it('UIC-CHAT-QUESTION-2.7 ignores an earlier request after settlement and virtual remount begin a new lifetime', async () => {
    let rejectOld: (error: Error) => void = () => undefined;
    let acceptNew: () => void = () => undefined;
    const oldRequest = new Promise<void>((_resolve, reject) => {
      rejectOld = reject;
    });
    const newRequest = new Promise<void>((resolve) => {
      acceptNew = resolve;
    });
    const onAnswerQuestion = vi.fn().mockReturnValueOnce(oldRequest).mockReturnValue(newRequest);
    const question = (status: 'pending' | 'dismissed') =>
      message('question', 'ana', {
        parts: [
          {
            type: 'question',
            id: 'ask',
            status,
            questions: [{ id: 'note', question: 'Any notes?', selectionMode: 'none', options: [] }],
          },
        ],
      });
    const options = {
      conversationId: 'first',
      onAnswerQuestion,
      messages: [question('pending')],
    };
    const { user, rerenderWith } = renderChat(options);
    await user.type(screen.getByRole('textbox', { name: /Any notes/ }), 'Old answer');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    rerenderWith({ ...options, messages: [question('dismissed')] });
    rerenderWith({ ...options, messages: [] });
    rerenderWith(options);
    await user.type(screen.getByRole('textbox', { name: /Any notes/ }), 'New answer');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await act(async () => rejectOld(new Error('Earlier failure')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('textbox', { name: /Any notes/ })).toHaveValue('New answer');
    await act(async () => acceptNew());
    expect(screen.getByRole('button', { name: 'Submit' })).not.toHaveAttribute('aria-disabled');
    expect(onAnswerQuestion).toHaveBeenCalledTimes(2);
  });
});

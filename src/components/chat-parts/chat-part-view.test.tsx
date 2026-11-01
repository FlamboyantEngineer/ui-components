import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { ChatPart, ChatQuestionPart, ChatToolCallPart } from './chat-part.js';
import { ChatParts, type ChatToolRenderer } from './chat-parts.js';

const approvalCall: ChatToolCallPart = {
  type: 'tool-call',
  id: 'call-1',
  name: 'delete_draft',
  label: 'Delete the old draft',
  status: 'approval-requested',
  args: { draft: 'menu-v1' },
  approval: { scopeLabel: 'this chat' },
};

const question: ChatQuestionPart = {
  type: 'question',
  id: 'ask-1',
  status: 'pending',
  questions: [
    {
      id: 'diet',
      question: 'Which menu should I plan?',
      selectionMode: 'single',
      options: [
        { id: 'veggie', label: 'Vegetarian' },
        { id: 'fish', label: 'Fish' },
      ],
    },
  ],
};

const toolCard = (container: HTMLElement) => container.querySelector('.ui-chat-tool-call');

describe('ChatParts part views', () => {
  it('UIC-CHAT-PARTS-3.1 renders reasoning, streaming its Markdown', () => {
    const { container } = render(
      <ChatParts
        parts={[{ type: 'reasoning', id: 'r1', text: 'Comparing **menus', status: 'streaming' }]}
      />,
    );
    const panel = screen.getByRole('group', { name: 'Thinking…' });
    expect(within(panel).getByText('menus').tagName).toBe('STRONG');
    expect(container.querySelector('.ui-chat-reasoning__text')).toHaveAttribute(
      'data-streaming',
      'true',
    );
  });

  it('UIC-CHAT-PARTS-3.1 labels streaming reasoning by its title, closed without expandsActivity', () => {
    render(
      <ChatParts
        parts={[
          {
            type: 'reasoning',
            id: 'r1',
            text: 'Hm',
            title: 'Comparing menus',
            status: 'streaming',
          },
        ]}
        expandsActivity={false}
      />,
    );
    expect(screen.getByRole('button', { name: 'Comparing menus' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('UIC-CHAT-PARTS-3.2 calls the approval callbacks with the call id', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    const onAlwaysAllow = vi.fn();
    render(
      <ChatParts
        parts={[approvalCall]}
        onApprove={onApprove}
        onDeny={onDeny}
        onAlwaysAllow={onAlwaysAllow}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Approve/ }));
    expect(onApprove).toHaveBeenCalledWith('call-1');
    await user.click(screen.getByRole('button', { name: 'Always allow in this chat' }));
    expect(onAlwaysAllow).toHaveBeenCalledWith('call-1');
    await user.click(screen.getByRole('button', { name: /^Deny/ }));
    await user.keyboard('Not yet{Enter}');
    expect(onDeny).toHaveBeenCalledWith('call-1', 'Not yet');
  });

  it('UIC-CHAT-PARTS-3.2 shows no approval buttons without their callbacks', () => {
    const { container } = render(<ChatParts parts={[approvalCall]} />);
    expect(toolCard(container)).toHaveAttribute('data-status', 'approval-requested');
    expect(screen.queryByRole('button', { name: /^Approve/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Deny/ })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-PARTS-1.2 prefixes the DOM ids of tool calls and questions with the message id', () => {
    const parts: ChatPart[] = [approvalCall, question];
    const { container, rerender } = render(<ChatParts parts={parts} messageId="m7" />);
    expect(toolCard(container)).toHaveAttribute('id', 'm7-call-1');
    expect(container.querySelector('.ui-chat-question')).toHaveAttribute('id', 'm7-ask-1');
    rerender(<ChatParts parts={parts} />);
    expect(toolCard(container)).toHaveAttribute('id', 'call-1');
    expect(container.querySelector('.ui-chat-question')).toHaveAttribute('id', 'ask-1');
  });

  it('UIC-CHAT-PARTS-1.2 keeps the DOM ids of two messages apart whatever hyphens their ids hold', () => {
    const call = (id: string): ChatPart => ({ ...approvalCall, id });
    const { container } = render(
      <>
        <ChatParts parts={[call('p')]} messageId="m-1" />
        <ChatParts parts={[call('1-p')]} messageId="m" />
        <ChatParts parts={[call('x')]} messageId="a b%" />
      </>,
    );
    const ids = [...container.querySelectorAll('.ui-chat-tool-call')].map((card) => card.id);
    expect(ids).toEqual(['m%2D1-p', 'm-1-p', 'a%20b%25-x']);
    expect(new Set(ids).size).toBe(3);
  });

  it('UIC-CHAT-PARTS-3.3 draws a tool renderer in place of the body, with the bound handlers', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const render_ = vi.fn<ChatToolRenderer['render']>((call, handlers) => (
      <button type="button" onClick={() => handlers.onApprove?.()}>
        Keep {String((call.args as { draft: string }).draft)}
      </button>
    ));
    const { container } = render(
      <ChatParts
        parts={[{ ...approvalCall, status: 'succeeded', approval: undefined }]}
        toolRenderers={{ delete_draft: { render: render_ } }}
        onApprove={onApprove}
      />,
    );
    const card = toolCard(container) as HTMLElement;
    await user.click(within(card).getByRole('button', { name: /Delete the old draft/ }));
    await user.click(within(card).getByRole('button', { name: 'Keep menu-v1' }));
    expect(onApprove).toHaveBeenCalledWith('call-1');
    expect(within(card).queryByText('Arguments')).not.toBeInTheDocument();
    const [, handlers] = requireDefined(render_.mock.lastCall);
    expect(handlers.onDeny).toBeUndefined();
    expect(handlers.onAlwaysAllow).toBeUndefined();
  });

  it('UIC-CHAT-PARTS-3.3 draws a card renderer in place of the whole card', () => {
    const { container } = render(
      <ChatParts
        parts={[approvalCall, { ...approvalCall, id: 'call-2', name: 'search_recipes' }]}
        toolRenderers={{
          delete_draft: { replaces: 'card', render: (call) => <p>Custom card for {call.id}</p> },
        }}
      />,
    );
    expect(screen.getByText('Custom card for call-1')).toBeInTheDocument();
    expect(container.querySelectorAll('.ui-chat-tool-call')).toHaveLength(1);
    expect(toolCard(container)).toHaveAttribute('id', 'call-2');
  });

  it('UIC-CHAT-PARTS-3.4 reports answers and dismissal with the question id', async () => {
    const user = userEvent.setup();
    const onAnswerQuestion = vi.fn();
    const onDismissQuestion = vi.fn();
    const { rerender } = render(<ChatParts parts={[question]} />);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true');
    rerender(
      <ChatParts
        parts={[question]}
        onAnswerQuestion={onAnswerQuestion}
        onDismissQuestion={onDismissQuestion}
      />,
    );
    await user.click(screen.getByRole('radio', { name: 'Fish' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onAnswerQuestion).toHaveBeenCalledWith('ask-1', [
      { questionId: 'diet', optionIds: ['fish'] },
    ]);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismissQuestion).toHaveBeenCalledWith('ask-1');
  });

  it('UIC-CHAT-PARTS-3.4 lets the card await the answers the host accepts asynchronously', async () => {
    const user = userEvent.setup();
    const onAnswerQuestion = vi.fn(() => new Promise<void>(() => {}));
    const { container } = render(
      <ChatParts parts={[question]} messageId="m7" onAnswerQuestion={onAnswerQuestion} />,
    );
    await user.click(screen.getByRole('radio', { name: 'Fish' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onAnswerQuestion).toHaveBeenCalledTimes(1);
    expect(container.querySelector('#m7-ask-1')).toHaveAttribute('data-submitting', 'true');
  });

  it('UIC-CHAT-PARTS-4.1 UIC-CHAT-PARTS-4.2 renders plans and sources', () => {
    render(
      <ChatParts
        parts={[
          {
            type: 'plan',
            id: 'plan',
            title: 'Dinner for six',
            steps: [
              { id: 'shop', label: 'Shop', status: 'done' },
              { id: 'cook', label: 'Cook', status: 'in-progress' },
            ],
          },
          { type: 'sources', sources: [{ id: 's1', title: 'Seasonal produce' }] },
        ]}
      />,
    );
    expect(screen.getByRole('list', { name: 'Dinner for six' })).toHaveClass('ui-chat-plan__list');
    expect(screen.getByRole('list', { name: '1 source' })).toHaveTextContent('Seasonal produce');
  });

  it('UIC-CHAT-PARTS-4.3 renders attachments and retries a failed upload by id', async () => {
    const user = userEvent.setup();
    const onRetryAttachment = vi.fn();
    const parts: ChatPart[] = [
      {
        type: 'files',
        attachments: [
          { id: 'a1', name: 'menu.pdf', mediaType: 'application/pdf', size: 2048 },
          { id: 'a2', name: 'list.txt', mediaType: 'text/plain', status: 'error' },
        ],
      },
    ];
    const { rerender } = render(<ChatParts parts={parts} />);
    expect(screen.getByRole('list', { name: 'Attachments' })).toHaveTextContent('menu.pdf');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    rerender(<ChatParts parts={parts} onRetryAttachment={onRetryAttachment} />);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetryAttachment).toHaveBeenCalledWith('a2');
  });

  it('UIC-CHAT-PARTS-4.4 renders code and terminal parts, applying with the part', async () => {
    const user = userEvent.setup();
    const onApplyCode = vi.fn();
    const code: ChatPart = { type: 'code', code: 'const salt = 1;', title: 'recipe.ts' };
    render(
      <ChatParts
        parts={[code, { type: 'code', code: '$ ls\nrecipes', variant: 'terminal' }]}
        onApplyCode={onApplyCode}
      />,
    );
    const block = screen.getByRole('group', { name: 'recipe.ts' });
    await user.click(within(block).getByRole('button', { name: 'Apply' }));
    expect(onApplyCode).toHaveBeenCalledWith('const salt = 1;', code);
    expect(screen.getByRole('group', { name: 'Terminal' })).toHaveAttribute(
      'data-variant',
      'terminal',
    );
  });

  it('UIC-CHAT-PARTS-4.5 renders a diff under its title', () => {
    const { container } = render(
      <ChatParts
        parts={[
          { type: 'diff', title: 'shopping.md', oldText: 'eggs\nmilk', newText: 'eggs\noat milk' },
          { type: 'diff', oldText: 'a', newText: 'b' },
        ]}
      />,
    );
    const [titled, untitled] = container.querySelectorAll('.ui-chat-parts__diff');
    expect(titled?.querySelector('.ui-chat-parts__diff-title')).toHaveTextContent('shopping.md');
    expect(screen.getByRole('group', { name: 'shopping.md' })).toHaveClass('ui-text-diff');
    expect(untitled?.querySelector('.ui-chat-parts__diff-title')).toBeNull();
    expect(untitled?.querySelector('.ui-text-diff')).not.toHaveAttribute('aria-labelledby');
    expectHooksMatchSpec(container, 'CHAT-PARTS', { slots: ['diff', 'diff-title'] });
  });

  it('UIC-CHAT-PARTS-4.6 draws custom parts through renderPart, and nothing without it', () => {
    const custom: ChatPart = { type: 'custom', name: 'weather', data: { high: 21 } };
    const renderPart = vi.fn(() => <p>21 degrees</p>);
    const { container, rerender } = render(<ChatParts parts={[custom]} renderPart={renderPart} />);
    expect(screen.getByText('21 degrees')).toBeInTheDocument();
    expect(renderPart).toHaveBeenCalledWith(custom);
    rerender(<ChatParts parts={[custom]} />);
    expect(container.querySelector('.ui-chat-parts')).toBeEmptyDOMElement();
  });
});

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatQuestion } from '../chat-question/chat-question.js';
import type { ChatToolCallPart } from './chat-part.js';
import { ChatParts } from './chat-parts.js';

const inherited = ['constructor', '__proto__', 'toString'];

const call = (name: string): ChatToolCallPart => ({
  type: 'tool-call',
  id: `call-${name}`,
  name,
  label: `Run ${name}`,
  status: 'succeeded',
});

describe('Caller keys that name Object members', () => {
  it.each(inherited)('UIC-CHAT-QUESTION-2.1 answers a question whose id is %s', async (id) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ChatQuestion
        id="ask"
        status="pending"
        onSubmit={onSubmit}
        questions={[
          {
            id,
            question: 'Which menu should I plan?',
            selectionMode: 'single',
            options: [
              { id: 'veggie', label: 'Vegetarian' },
              { id: 'fish', label: 'Fish' },
            ],
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('radio', { name: 'Fish' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledWith([{ questionId: id, optionIds: ['fish'] }]);
  });

  it.each(inherited)(
    'UIC-CHAT-PARTS-3.3 draws the standard card for an unregistered tool named %s',
    (name) => {
      const { container } = render(<ChatParts parts={[call(name)]} toolRenderers={{}} />);
      expect(container.querySelector('.ui-chat-tool-call')).toHaveAttribute('id', `call-${name}`);
      expect(screen.getByRole('button', { name: new RegExp(`Run ${name}`) })).toBeInTheDocument();
    },
  );

  it.each(inherited)('UIC-CHAT-PARTS-3.3 uses a renderer registered under %s', (name) => {
    const toolRenderers = Object.fromEntries([
      [name, { replaces: 'card' as const, render: () => <p>Own renderer for {name}</p> }],
    ]);
    render(<ChatParts parts={[call(name)]} toolRenderers={toolRenderers} />);
    expect(screen.getByText(`Own renderer for ${name}`)).toBeInTheDocument();
  });
});

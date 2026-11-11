import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CommentText } from './comment-text.js';

const stored = 'Ask @[Ana Lopez](ana) and @[Jon Berg](jon).';

describe('CommentText', () => {
  it('UIC-COMMENT-THREAD-3.2 shows stored text with each mention as a chip named by the person', () => {
    const { container } = render(<CommentText text={stored} data-testid="body" />);
    const root = container.querySelector('.ui-comment-text');
    expect(root).toHaveTextContent('Ask Ana Lopez and Jon Berg.');
    expect(root).toHaveAttribute('data-testid', 'body');
    const chips = container.querySelectorAll('.ui-comment-text__mention');
    expect([...chips].map((chip) => chip.textContent)).toEqual(['Ana Lopez', 'Jon Berg']);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'COMMENT-THREAD', {
      slots: ['mention'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-COMMENT-THREAD-3.2 opens the card the host supplies from a mention chip', async () => {
    const user = userEvent.setup();
    render(
      <CommentText
        text={stored}
        renderCard={(person) =>
          person.id === 'ana' ? <p>{`${person.name}, pastry`}</p> : undefined
        }
      />,
    );
    const chip = screen.getByRole('button', { name: 'Ana Lopez' });
    expect(screen.queryByRole('button', { name: 'Jon Berg' })).not.toBeInTheDocument();
    await user.click(chip);
    expect(await screen.findByText('Ana Lopez, pastry')).toBeInTheDocument();
  });

  it('UIC-COMMENT-THREAD-3.2 reads mentions in the host format with parse', () => {
    const { container } = render(
      <CommentText
        text="Hi <@ana>"
        parse={(text) => [
          { kind: 'text', text: text.slice(0, 3) },
          { kind: 'mention', text: text.slice(3), id: 'ana', name: 'Ana Lopez' },
        ]}
      />,
    );
    expect(container.querySelector('.ui-comment-text__mention')).toHaveTextContent('Ana Lopez');
  });
});

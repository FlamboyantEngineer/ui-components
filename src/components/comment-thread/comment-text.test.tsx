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

  it('UIC-COMMENT-THREAD-3.2 marks each chip with its kind and hands the kind to renderCard', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CommentText
        text="Ask @group[Bakers](bakers), not `@[Ana](ana)`"
        renderCard={(target) => <p>{`${target.name} is a ${target.kind}`}</p>}
      />,
    );
    const chips = container.querySelectorAll('.ui-comment-text__mention');
    expect(chips).toHaveLength(1);
    expect(chips[0]).toHaveAttribute('data-kind', 'group');
    expect(container.querySelector('.ui-comment-text')).toHaveTextContent(
      'Ask Bakers, not `@[Ana](ana)`',
    );
    await user.click(screen.getByRole('button', { name: 'Bakers' }));
    expect(await screen.findByText('Bakers is a group')).toBeInTheDocument();
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

describe('CommentText inline Markdown', () => {
  it('UIC-COMMENT-THREAD-3.3 reads inline Markdown around mention chips', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CommentText
        format="markdown-inline"
        text={
          '**Ask @[Ana Lopez](ana)** about _the `@[Jon](jon)` token_ ~~today~~\n# not a heading'
        }
        renderCard={(person) => <p>{`${person.name}, pastry`}</p>}
      />,
    );
    const root = container.querySelector('.ui-comment-text');
    expect(root).toHaveAttribute('data-format', 'markdown-inline');
    const strong = container.querySelector('strong');
    expect(strong).toHaveTextContent('Ask Ana Lopez');
    expect(container.querySelector('em code')).toHaveTextContent('@[Jon](jon)');
    expect(container.querySelector('del')).toHaveTextContent('today');
    expect(root).toHaveTextContent('# not a heading');
    await user.click(screen.getByRole('button', { name: 'Ana Lopez' }));
    expect(await screen.findByText('Ana Lopez, pastry')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'COMMENT-THREAD', { slots: ['mention'] });
  });

  it('UIC-COMMENT-THREAD-3.3 keeps raw HTML as text and links only safe addresses', () => {
    const { container } = render(
      <CommentText
        format="markdown-inline"
        text={
          '<img src=x onerror=alert(1)> [docs](https://example.com/a) [bad](javascript:alert(1)) ![pic](https://example.com/p.png) [see @[Ana](ana)](/people)'
        }
        renderCard={(person) => <p>{person.name}</p>}
      />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.ui-comment-text')).toHaveTextContent(
      '<img src=x onerror=alert(1)> docs (opens in a new tab) bad pic see Ana',
    );
    expect(screen.getByRole('link', { name: /docs/ })).toHaveAttribute(
      'href',
      'https://example.com/a',
    );
    expect(screen.queryByRole('link', { name: 'bad' })).not.toBeInTheDocument();
    const inLink = screen.getByRole('link', { name: 'see Ana' });
    expect(inLink.querySelector('.ui-comment-text__mention')).toHaveTextContent('Ana');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('UIC-COMMENT-THREAD-3.3 writes mentions in a link address and title as their tokens', () => {
    render(
      <CommentText
        format="markdown-inline"
        text={'[profile](https://example.com/@[Ana](ana) "About @[Ana](ana)")'}
        renderCard={(person) => <p>{person.name}</p>}
      />,
    );
    const link = screen.getByRole('link', { name: /profile/ });
    expect(link).toHaveAttribute('href', 'https://example.com/@[Ana](ana)');
    expect(link).toHaveAttribute('title', 'About @[Ana](ana)');
  });

  it('UIC-COMMENT-THREAD-3.3 shows plain text as written by default', () => {
    const { container } = render(<CommentText text="**not bold** @[Ana](ana)" />);
    expect(container.querySelector('strong')).toBeNull();
    expect(container.querySelector('.ui-comment-text')).toHaveAttribute('data-format', 'plain');
    expect(container.querySelector('.ui-comment-text')).toHaveTextContent('**not bold** Ana');
  });
});

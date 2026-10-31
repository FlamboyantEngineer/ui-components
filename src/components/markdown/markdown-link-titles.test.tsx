import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown.js';

describe('Markdown link titles', () => {
  it('UIC-MARKDOWN-2.3 forwards inline and reference link titles without changing the name', () => {
    render(
      <Markdown
        source={[
          '[Guide](/guide "Context for the reader") and [catalogue][seeds].',
          '',
          "[seeds]: https://example.com/seeds 'Seed \\'catalogue\\''",
        ].join('\n')}
      />,
    );
    const guide = screen.getByRole('link', { name: 'Guide' });
    expect(guide).toHaveAttribute('title', 'Context for the reader');
    expect(guide).toHaveTextContent(/^Guide$/);
    const seeds = screen.getByRole('link', { name: /^catalogue/ });
    expect(seeds).toHaveAttribute('title', "Seed 'catalogue'");
  });

  it('UIC-MARKDOWN-2.3 leaves out an absent or empty title and keeps escaped text', () => {
    render(
      <Markdown
        source={
          '[none](/a) [empty](/b "") [escaped](/c "Say \\"hi\\" & *wave*") [paren](/d (Aside))'
        }
      />,
    );
    expect(screen.getByRole('link', { name: 'none' })).not.toHaveAttribute('title');
    expect(screen.getByRole('link', { name: 'empty' })).not.toHaveAttribute('title');
    expect(screen.getByRole('link', { name: 'escaped' })).toHaveAttribute(
      'title',
      'Say "hi" & *wave*',
    );
    expect(screen.getByRole('link', { name: 'paren' })).toHaveAttribute('title', 'Aside');
  });
});

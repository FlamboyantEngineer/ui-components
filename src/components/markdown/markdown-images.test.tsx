import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown.js';

describe('Markdown images', () => {
  it('UIC-MARKDOWN-2.1 loads an image lazily without sending the page as referrer', () => {
    render(<Markdown source={'![A pear](https://example.com/pear.png "Pear")'} />);
    const image = screen.getByRole('img', { name: 'A pear' });
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('decoding', 'async');
  });

  it('UIC-MARKDOWN-2.8 lets renderNode draw an image without the defaults', () => {
    render(
      <Markdown
        source="![A pear](/pear.png)"
        renderNode={(node) =>
          node.type === 'image' ? <img src={node.src} alt={node.alt} loading="eager" /> : undefined
        }
      />,
    );
    const image = screen.getByRole('img', { name: 'A pear' });
    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).not.toHaveAttribute('referrerpolicy');
  });
});

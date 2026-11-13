import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
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

  it('UIC-MARKDOWN-2.14 draws images as links to their sources with the link policy', () => {
    const { container } = render(
      <Markdown
        images="link"
        source={
          '![A pear](https://example.com/pear.png "Pear") ![](/plum.png) [see ![a fig](/fig.png)](/figs)'
        }
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const pear = screen.getByRole('link', { name: /A pear/ });
    expect(pear).toHaveAttribute('href', 'https://example.com/pear.png');
    expect(pear).toHaveAttribute('title', 'Pear');
    expect(pear).toHaveAttribute('target', '_blank');
    expect(pear).toHaveClass('ui-markdown__image-link');
    expect(screen.getByRole('link', { name: '/plum.png' })).toHaveAttribute('href', '/plum.png');
    // Inside another link, the image is its text, so no link nests in a link.
    const figs = screen.getByRole('link', { name: 'see a fig' });
    expect(figs).toHaveAttribute('href', '/figs');
    expect(figs.querySelector('a')).toBeNull();
    expectHooksMatchSpec(container, 'MARKDOWN');
  });
});

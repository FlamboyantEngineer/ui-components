import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { defaultHtmlPolicy } from './sanitize-html.js';
import { HtmlMarkup } from './html-markup.js';

describe('HtmlMarkup images', () => {
  it('UIC-HTML-MARKUP-2.1 loads an image lazily without sending the page as referrer', () => {
    render(<HtmlMarkup markup={'<img src="https://example.com/pear.png" alt="A pear">'} />);
    const image = screen.getByRole('img', { name: 'A pear' });
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('decoding', 'async');
  });

  it('UIC-HTML-MARKUP-2.1 drops content attributes the default policy does not keep', () => {
    render(
      <HtmlMarkup
        markup={'<img src="/pear.png" alt="A pear" referrerpolicy="unsafe-url" loading="eager">'}
      />,
    );
    const image = screen.getByRole('img', { name: 'A pear' });
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('UIC-HTML-MARKUP-2.5 keeps the attributes a host policy allows over the defaults', () => {
    const policy = {
      ...defaultHtmlPolicy,
      attributes: [...defaultHtmlPolicy.attributes, 'loading', 'referrerpolicy'],
    };
    render(
      <HtmlMarkup
        markup={'<img src="/pear.png" alt="A pear" referrerpolicy="origin" loading="eager">'}
        policy={policy}
      />,
    );
    const image = screen.getByRole('img', { name: 'A pear' });
    expect(image).toHaveAttribute('referrerpolicy', 'origin');
    expect(image).toHaveAttribute('loading', 'eager');
  });

  it('UIC-HTML-MARKUP-2.3 lets renderElement draw an image without the defaults', () => {
    render(
      <HtmlMarkup
        markup={'<img src="/pear.png" alt="A pear">'}
        renderElement={(element) =>
          element.tag === 'img' ? <img src={element.attributes.src} alt="A pear" /> : undefined
        }
      />,
    );
    expect(screen.getByRole('img', { name: 'A pear' })).not.toHaveAttribute('loading');
  });
});

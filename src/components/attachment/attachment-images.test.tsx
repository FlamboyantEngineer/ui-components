import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { Attachment } from './attachment.js';

describe('Attachment images', () => {
  it('UIC-ATTACHMENT-1.2 loads a thumbnail lazily without sending the page as referrer', () => {
    const { container } = render(
      <UiProvider>
        <Attachment
          id="photo"
          name="Harbour.png"
          mediaType="image/png"
          url="https://example.com/harbour.png"
          onPreview={() => {}}
        />
        <Attachment
          id="map"
          name="Map.png"
          mediaType="image/png"
          url="https://example.com/map.png"
        />
      </UiProvider>,
    );
    expect(screen.getByRole('img', { name: 'Map.png' })).toBeInTheDocument();
    const images = container.querySelectorAll('.ui-attachment__thumbnail');
    expect(images).toHaveLength(2);
    for (const image of images) {
      expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('decoding', 'async');
    }
  });

  it('UIC-ATTACHMENT-1.10 gives the thumbnail the size the host knows, so it keeps its shape while loading', () => {
    render(
      <UiProvider>
        <Attachment
          id="photo"
          name="Harbour.png"
          mediaType="image/png"
          url="https://example.com/harbour.png"
          width={1600.4}
          height={900}
        />
        <Attachment
          id="tower"
          name="Tower.png"
          mediaType="image/png"
          url="https://example.com/tower.png"
          width={700}
          height={1200}
          onPreview={() => {}}
        />
      </UiProvider>,
    );
    const photo = screen.getByRole('img', { name: 'Harbour.png' });
    expect(photo).toHaveAttribute('width', '1600');
    expect(photo).toHaveAttribute('height', '900');
    const tower = screen.getByRole('button', { name: 'View Tower.png' }).querySelector('img');
    expect(tower).toHaveAttribute('width', '700');
    expect(tower).toHaveAttribute('height', '1200');
  });

  it('UIC-ATTACHMENT-1.10 leaves the size to the loaded image when the host gives none or half of one', () => {
    render(
      <UiProvider>
        <Attachment
          id="photo"
          name="Harbour.png"
          mediaType="image/png"
          url="https://example.com/harbour.png"
          width={1600}
        />
        <Attachment
          id="map"
          name="Map.png"
          mediaType="image/png"
          url="https://example.com/map.png"
          width={0}
          height={900}
        />
      </UiProvider>,
    );
    for (const name of ['Harbour.png', 'Map.png']) {
      const image = screen.getByRole('img', { name });
      expect(image).not.toHaveAttribute('width');
      expect(image).not.toHaveAttribute('height');
    }
  });
});

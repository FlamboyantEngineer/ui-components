import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { ChatAttachment } from './chat-attachment.js';

describe('ChatAttachment images', () => {
  it('UIC-CHAT-ATTACHMENT-1.2 loads a thumbnail lazily without sending the page as referrer', () => {
    const { container } = render(
      <UiProvider>
        <ChatAttachment
          id="photo"
          name="Harbour.png"
          mediaType="image/png"
          url="https://example.com/harbour.png"
          onPreview={() => {}}
        />
        <ChatAttachment
          id="map"
          name="Map.png"
          mediaType="image/png"
          url="https://example.com/map.png"
        />
      </UiProvider>,
    );
    expect(screen.getByRole('img', { name: 'Map.png' })).toBeInTheDocument();
    const images = container.querySelectorAll('.ui-chat-attachment__thumbnail');
    expect(images).toHaveLength(2);
    for (const image of images) {
      expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('decoding', 'async');
    }
  });
});

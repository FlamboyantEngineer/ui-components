import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { parseEmojiData } from './emoji-catalog.js';
import { EmojiPickerTrigger } from './emoji-picker.js';

const fixture = parseEmojiData(['smileys', '😀||grinning face|grinning|happy,smile'].join('\n'));
const loadEmoji = () => Promise.resolve(fixture);

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

function Trigger({ isDisabled, onSelect }: { isDisabled: boolean; onSelect: () => void }) {
  return (
    <EmojiPickerTrigger loadEmoji={loadEmoji} isDisabled={isDisabled} onSelect={onSelect}>
      <Button isDisabled={isDisabled}>React</Button>
    </EmojiPickerTrigger>
  );
}

describe('EmojiPickerTrigger locking', { timeout: 15_000 }, () => {
  it.each(['pointer', 'keyboard'] as const)(
    'UIC-EMOJI-PICKER-3.1 closes an open picker for good when it turns disabled (%s)',
    async (opening) => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const { rerender } = render(<Trigger isDisabled={false} onSelect={onSelect} />);
      const button = screen.getByRole('button', { name: 'React' });
      if (opening === 'pointer') await user.click(button);
      else {
        button.focus();
        await user.keyboard('{Enter}');
      }
      const grid = await screen.findByRole('grid');
      const grinning = within(grid).getByRole('row', { name: 'grinning face' });
      rerender(<Trigger isDisabled onSelect={onSelect} />);
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await user.click(grinning);
      expect(onSelect).not.toHaveBeenCalled();
      await user.click(button);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      rerender(<Trigger isDisabled={false} onSelect={onSelect} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
  );
});

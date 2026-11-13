import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import { type ComposerControlsValue, useComposerControlsValue } from './composer-controls.js';
import { MessageComposer } from './message-composer.js';
import { RichMessageComposer } from './rich/rich-message-composer.js';

installEditorDom();

/** A host control that keeps the composer's actions, as a tool that inserts text later does. */
function Probe({ onValue }: { onValue: (value: ComposerControlsValue) => void }) {
  onValue(useComposerControlsValue('Probe'));
  return null;
}

describe('Composer insertion while disabled', () => {
  it.each([
    ['plain', MessageComposer],
    ['rich', RichMessageComposer],
  ] as const)(
    'UIC-MESSAGE-COMPOSER-1.4 UIC-MESSAGE-COMPOSER-3.7 refuses text and pills from its tools while disabled (%s)',
    (_, Composer) => {
      let controls: ComposerControlsValue | null = null;
      const probe = (
        <Probe
          onValue={(value) => {
            controls = value;
          }}
        />
      );
      const { rerender } = render(
        <Composer aria-label="Message" onSubmit={() => undefined} startControls={probe} />,
      );
      const box = screen.getByRole('textbox', { name: 'Message' });
      rerender(
        <Composer
          aria-label="Message"
          onSubmit={() => undefined}
          startControls={probe}
          isDisabled
        />,
      );
      act(() => {
        controls?.insertText('🙂');
        controls?.insertPill({ kind: 'mention', label: 'Ana', id: 'ana' } as never);
      });
      expect(box.textContent || (box as HTMLTextAreaElement).value || '').toBe('');
      rerender(<Composer aria-label="Message" onSubmit={() => undefined} startControls={probe} />);
      act(() => {
        controls?.insertText('🙂');
      });
      expect(box.textContent || (box as HTMLTextAreaElement).value).toBe('🙂');
    },
  );
});

describe('Composer insertion at its length limit', () => {
  it('UIC-MESSAGE-COMPOSER-1.1 inserts only what fits under maxLength, in whole characters', () => {
    let controls: ComposerControlsValue | null = null;
    render(
      <MessageComposer
        aria-label="Message"
        defaultValue="Hello"
        maxLength={8}
        onSubmit={() => undefined}
        startControls={
          <Probe
            onValue={(value) => {
              controls = value;
            }}
          />
        }
      />,
    );
    const box = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Message' });
    box.setSelectionRange(5, 5);
    act(() => {
      controls?.insertText(' 🙂🙂 there');
    });
    // Three units of room: the space and one emoji (two units); the next emoji would split.
    expect(box.value).toBe('Hello 🙂');
    act(() => {
      controls?.insertText('!');
    });
    expect(box.value).toBe('Hello 🙂');
  });
});

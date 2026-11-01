import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberField } from '../number-field/number-field.js';
import { SignaturePad } from '../signature-pad/signature-pad.js';
import { Card } from './card.js';
import { CardAction } from './card-parts.js';

// Which card a click belongs to, and which content keeps its clicks (UIC-CARD-3.2).

describe('Card background clicks', () => {
  it('UIC-CARD-3.2 lets the innermost actionable card own a background click', async () => {
    const user = userEvent.setup();
    const onOuter = vi.fn();
    const onInner = vi.fn();
    render(
      <Card title="Trip" onAction={onOuter}>
        <p>Outer notes</p>
        <Card title="Day one" onAction={onInner}>
          <p>Inner notes</p>
        </Card>
        <Card title="Day two">
          <p>Plain notes</p>
        </Card>
      </Card>,
    );
    await user.click(screen.getByText('Inner notes'));
    expect(onInner).toHaveBeenCalledTimes(1);
    expect(onOuter).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Day one' }));
    expect(onInner).toHaveBeenCalledTimes(2);
    expect(onOuter).not.toHaveBeenCalled();
    await user.click(screen.getByText('Plain notes'));
    expect(onOuter).toHaveBeenCalledTimes(1);
    await user.click(screen.getByText('Outer notes'));
    expect(onOuter).toHaveBeenCalledTimes(2);
    expect(onInner).toHaveBeenCalledTimes(2);
  });

  it('UIC-CARD-3.2 leaves clicks in editors and roving widgets alone', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onRadio = vi.fn();
    render(
      <Card title="Notes" onAction={onAction}>
        {/* React types refuse the empty value, which makes an editor as `true` does. */}
        <div ref={(node) => node?.setAttribute('contenteditable', '')}>Empty value</div>
        <div contentEditable="plaintext-only" suppressContentEditableWarning>
          Plain text only
        </div>
        <div contentEditable suppressContentEditableWarning>
          <p>
            <strong>Inherited</strong>
          </p>
          <span contentEditable={false}>Fixed island</span>
        </div>
        <div role="radiogroup" aria-label="Size">
          <div role="radio" aria-checked="false" tabIndex={-1} onClick={onRadio}>
            Small
          </div>
        </div>
        <p>Background</p>
      </Card>,
    );
    for (const text of ['Empty value', 'Plain text only', 'Inherited', 'Fixed island']) {
      await user.click(screen.getByText(text));
    }
    await user.click(screen.getByRole('radio', { name: 'Small' }));
    expect(onRadio).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled();
    await user.click(screen.getByText('Background'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('UIC-CARD-3.2 keeps the first action element when a later copy of it leaves', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const card = (withCopy: boolean) => (
      <Card
        onAction={onAction}
        header={
          <>
            <CardAction>Seeds</CardAction>
            {withCopy ? <CardAction>Seeds copy</CardAction> : null}
          </>
        }
      >
        <p>Twelve packets</p>
      </Card>
    );
    const { rerender } = render(card(true));
    rerender(card(false));
    await user.click(screen.getByText('Twelve packets'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('UIC-CARD-3.2 leaves presses on gesture surfaces, and drags released elsewhere, to them', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { container } = render(
      <Card title="Mixer" onAction={onAction}>
        <NumberField display="slider" label="Volume" defaultValue={4} maxValue={10} />
        <NumberField label="Gain" defaultValue={2} showScrubber />
        <SignaturePad label="Signature" />
        <p>Background</p>
      </Card>,
    );
    const background = screen.getByText('Background');
    for (const surface of [
      '.ui-number-field__thumb',
      '.ui-number-field__track',
      '.ui-number-field__scrubber',
      '.ui-signature-pad__surface',
    ]) {
      const target = container.querySelector<HTMLElement>(surface) as HTMLElement;
      // A press on the surface, then a press that starts there and is released on the background.
      await user.click(target);
      await user.pointer([
        { keys: '[MouseLeft>]', target },
        { target: background },
        { keys: '[/MouseLeft]' },
      ]);
    }
    expect(onAction).not.toHaveBeenCalled();
    await user.click(background);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

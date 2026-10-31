import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Card } from './card.js';

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
});

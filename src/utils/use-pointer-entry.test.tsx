import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { DOMAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as primitives from '../primitives/index.js';
import { usePointerEntry } from './use-pointer-entry.js';

function Trigger({
  props,
  isDisabled = false,
}: {
  props: DOMAttributes<Element>;
  isDisabled?: boolean;
}) {
  return <button {...usePointerEntry(props, isDisabled)}>Preview</button>;
}

afterEach(() => vi.restoreAllMocks());

describe('initial pointer entry', () => {
  it.each([null, 'keyboard', 'virtual'] as const)(
    'UIC-HOVER-CARD-1.2 UIC-TOOLTIP-1.2 continues a %s entry only on real pointer movement',
    async (modality) => {
      const user = userEvent.setup();
      const getModality = vi.spyOn(primitives, 'getInteractionModality').mockReturnValue(modality);
      const onPointerEnter = vi.fn();
      const onPointerMove = vi.fn();
      const onPointerLeave = vi.fn();
      render(<Trigger props={{ onPointerEnter, onPointerMove, onPointerLeave }} />);
      const trigger = screen.getByRole('button', { name: 'Preview' });
      await user.pointer({ target: trigger, coords: { x: 20, y: 10 } });
      expect(onPointerEnter).not.toHaveBeenCalled();
      expect(onPointerMove).toHaveBeenCalledOnce();
      getModality.mockReturnValue('pointer');
      await user.pointer({ target: trigger, coords: { x: 21, y: 10 } });
      expect(onPointerEnter).toHaveBeenCalledOnce();
      expect(onPointerMove).toHaveBeenCalledTimes(2);
      await user.pointer({ target: trigger, coords: { x: 22, y: 10 } });
      expect(onPointerEnter).toHaveBeenCalledOnce();
      expect(onPointerMove).toHaveBeenCalledTimes(3);
      await user.unhover(trigger);
      expect(onPointerLeave).toHaveBeenCalledOnce();
    },
  );

  it.each(['leave', 'blur', 'disable', 'unmount'] as const)(
    'UIC-HOVER-CARD-1.2 UIC-TOOLTIP-1.2 cancels a pending entry on %s',
    async (cancel) => {
      const user = userEvent.setup();
      const getModality = vi.spyOn(primitives, 'getInteractionModality').mockReturnValue(null);
      const onPointerEnter = vi.fn();
      const props = { onPointerEnter };
      const { rerender, unmount } = render(<Trigger props={props} />);
      const trigger = screen.getByRole('button', { name: 'Preview' });
      await user.tab();
      await user.pointer({ target: trigger, coords: { x: 20, y: 10 } });
      expect(onPointerEnter).not.toHaveBeenCalled();
      if (cancel === 'leave') await user.unhover(trigger);
      if (cancel === 'blur') await user.tab();
      if (cancel === 'disable') rerender(<Trigger props={props} isDisabled />);
      if (cancel === 'unmount') unmount();
      getModality.mockReturnValue('pointer');
      await user.pointer({
        target: cancel === 'leave' || cancel === 'unmount' ? document.body : trigger,
        coords: { x: 21, y: 10 },
      });
      expect(onPointerEnter).not.toHaveBeenCalled();
    },
  );

  it('UIC-HOVER-CARD-1.2 leaves established pointer and touch entries to React Aria', async () => {
    const user = userEvent.setup();
    const getModality = vi.spyOn(primitives, 'getInteractionModality').mockReturnValue('pointer');
    const onPointerEnter = vi.fn();
    render(<Trigger props={{ onPointerEnter }} />);
    const trigger = screen.getByRole('button', { name: 'Preview' });
    await user.pointer({ target: trigger, coords: { x: 20, y: 10 } });
    await user.pointer({ target: trigger, coords: { x: 21, y: 10 } });
    expect(onPointerEnter).toHaveBeenCalledOnce();
    await user.unhover(trigger);
    getModality.mockReturnValue(null);
    await user.pointer({ keys: '[TouchA>]', target: trigger });
    expect(onPointerEnter).toHaveBeenCalledTimes(2);
    await user.pointer({ keys: '[/TouchA]' });
  });
});

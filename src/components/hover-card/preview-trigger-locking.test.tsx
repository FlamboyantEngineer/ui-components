import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { PreviewContent } from '../../../test/preview-content-fixtures.js';
import { PreviewTrigger } from './preview-trigger.js';

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('PreviewTrigger locking', () => {
  it.each(['press', 'hover'] as const)(
    'UIC-HOVER-CARD-4.4 closes an open %s preview for good when the trigger turns disabled',
    async (trigger) => {
      // Check pressing separately from hovering during the preview's warm handoff window.
      const user = userEvent.setup({ skipHover: true });
      const onOpenChange = vi.fn();
      const preview = (isDisabled: boolean) => (
        <PreviewTrigger
          trigger={trigger}
          preview={<PreviewContent name="Maria Santos" />}
          defaultOpen
          onOpenChange={onOpenChange}
          isDisabled={isDisabled}
        >
          Maria Santos
        </PreviewTrigger>
      );
      const { rerender } = render(preview(false));
      expect(await screen.findByRole('dialog', { name: 'Maria Santos' })).toBeVisible();
      rerender(preview(true));
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'Maria Santos' })).not.toBeInTheDocument(),
      );
      expect(onOpenChange.mock.calls).toEqual([[false]]);
      rerender(preview(false));
      expect(screen.queryByRole('dialog', { name: 'Maria Santos' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Maria Santos' }));
      expect(onOpenChange).toHaveBeenCalledTimes(trigger === 'press' ? 2 : 1);
    },
  );
});

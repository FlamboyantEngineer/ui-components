import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { ToolbarRow } from './toolbar-row.js';

describe.each(['toolbar', 'group', 'none'] as const)(
  'ToolbarRow busy attributes with %s',
  (role) => {
    it('UIC-LAYOUT-1.3 UIC-LAYOUT-3.3 forwards busy state without making controls or status inert', async () => {
      const user = userEvent.setup();
      const refresh = vi.fn();
      const content = (
        <>
          <button type="button" onClick={refresh}>
            Refresh
          </button>
          <span role="status">Reading data</span>
        </>
      );
      const { container, rerender } = render(
        <ToolbarRow role={role} aria-busy data-owner="background">
          {content}
        </ToolbarRow>,
      );
      const row = requireDefined(container.querySelector('.ui-toolbar-row'));
      expect(row).toHaveAttribute('aria-busy', 'true');
      expect(row).not.toHaveAttribute('inert');
      expect(row).not.toHaveAttribute('data-pending');
      expect(screen.getByRole('status')).toHaveTextContent('Reading data');
      expectHooksMatchSpec(container, 'LAYOUT', { callerAttributes: ['data-owner'] });
      await user.click(screen.getByRole('button', { name: 'Refresh' }));
      expect(refresh).toHaveBeenCalledOnce();
      rerender(
        <ToolbarRow role={role} aria-busy={false} data-owner="background">
          {content}
        </ToolbarRow>,
      );
      expect(container.querySelector('.ui-toolbar-row')).toBe(row);
      expect(row).toHaveAttribute('aria-busy', 'false');
      expect(screen.getByRole('button', { name: 'Refresh' })).toHaveFocus();
    });

    it('UIC-LAYOUT-1.3 UIC-LAYOUT-3.3 preserves the explicit busy attribute in server-rendered markup', () => {
      const view = renderToStaticMarkup(
        <ToolbarRow role={role} aria-busy>
          <button type="button">Refresh</button>
        </ToolbarRow>,
      );
      expect(view).toContain('aria-busy="true"');
    });
  },
);

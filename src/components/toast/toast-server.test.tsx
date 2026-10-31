// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PortalContainerProvider, PortalHost } from '../portal/portal.js';
import { ToastRegion, createToastQueue } from './toast.js';

describe('ToastRegion on the server', () => {
  it.each([
    { name: 'an empty queue', titles: [] },
    { name: 'a populated queue', titles: ['Saved', 'Synced'] },
  ])('UIC-TOAST-2.4 renders $name under a portal host or a pending container', ({ titles }) => {
    expect(typeof globalThis.HTMLElement).toBe('undefined');
    const queue = createToastQueue({ defaultTimeout: 0 });
    for (const title of titles) queue.add({ title });
    expect(
      renderToString(
        <PortalHost>
          <ToastRegion queue={queue} />
        </PortalHost>,
      ),
    ).toBe('<div class="ui-portal-host"></div>');
    expect(
      renderToString(
        <PortalContainerProvider container={null}>
          <ToastRegion queue={queue} />
        </PortalContainerProvider>,
      ),
    ).toBe('');
    expect(renderToString(<ToastRegion queue={queue} />)).toBe('');
  });
});

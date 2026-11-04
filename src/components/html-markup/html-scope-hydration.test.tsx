import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { htmlScopeCases } from '../../../test/html-scope-fixtures.js';
import { HtmlMarkup } from './html-markup.js';

describe('HtmlMarkup filtered scope boundaries', () => {
  for (const sample of htmlScopeCases) {
    it(`UIC-HTML-MARKUP-1.2 UIC-HTML-MARKUP-1.3 UIC-HTML-MARKUP-1.7 UIC-HTML-MARKUP-2.1 hydrates ${sample.name} without replacing server nodes`, async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const content = <HtmlMarkup markup={sample.markup} policy={sample.policy} />;
      const host = document.createElement('div');
      document.body.append(host);
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        const view = renderToString(content);
        host.innerHTML = view;
        expect(host.innerHTML).toBe(view);
        expect(host).toHaveTextContent(sample.text);
        const walker = document.createTreeWalker(host, NodeFilter.SHOW_ALL);
        const serverNodes: Node[] = [];
        while (walker.nextNode()) serverNodes.push(walker.currentNode);
        const errors: unknown[] = [];
        await act(async () => {
          root = hydrateRoot(host, content, { onRecoverableError: (error) => errors.push(error) });
        });
        expect(errors).toEqual([]);
        expect(host.innerHTML).toBe(view);
        expect(serverNodes.every((node) => host.contains(node))).toBe(true);
        expect(consoleError).not.toHaveBeenCalled();
      } finally {
        act(() => root?.unmount());
        host.remove();
        consoleError.mockRestore();
      }
    });
  }
});

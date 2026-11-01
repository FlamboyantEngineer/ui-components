import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChatTextToken } from './chat-part.js';
import { ChatParts } from './chat-parts.js';

const alice: ChatTextToken = { start: 0, end: 2, kind: 'mention', id: 'a', label: 'Alice' };

function renderText(text: string) {
  const { container } = render(
    <ChatParts parts={[{ type: 'text', id: 'text', text, tokens: [alice] }]} />,
  );
  return {
    pills: container.querySelectorAll('.ui-chat-parts__token'),
    markdown: container.querySelector('.ui-markdown'),
  };
}

describe('ChatParts token markers in literal text', () => {
  it.each([
    ['text', '@A literal ￹0￻', 'Alice literal ￹0￻'],
    ['code', '@A in `￹0￻`', 'Alice in ￹0￻'],
    ['a link', '@A at [￹0￻](https://example.com/a)', 'Alice at ￹0￻'],
    ['entities', '@A and &#xFFF9;0&#xFFFB;', 'Alice and ￹0￻'],
    ['a longer run', '@A ￹￹￹0￻', 'Alice ￹￹￹0￻'],
  ])(
    'UIC-CHAT-PARTS-2.4 draws only the listed token as a pill beside marker-like %s',
    (_, text, shown) => {
      const { pills, markdown } = renderText(text);
      expect(pills).toHaveLength(1);
      expect(pills[0]).toHaveTextContent('Alice');
      expect(markdown?.textContent).toContain(shown);
    },
  );
});

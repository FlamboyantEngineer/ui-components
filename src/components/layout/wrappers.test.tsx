import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Contents, EmbeddedFrame, InlineContents } from './wrappers.js';

describe('Wrappers', () => {
  it('UIC-LAYOUT-3.1 hides transparent wrappers without unmounting their children', () => {
    const { container, rerender } = render(
      <>
        <Contents>
          <input defaultValue="draft" />
        </Contents>
        <InlineContents>Kiwi</InlineContents>
      </>,
    );
    const input = container.querySelector('input')!;
    rerender(
      <>
        <Contents hidden>
          <input defaultValue="draft" />
        </Contents>
        <InlineContents hidden>Kiwi</InlineContents>
      </>,
    );
    const [contents, inline] = Array.from(container.children) as HTMLElement[];
    expect(contents!.hidden).toBe(true);
    expect(inline!.hidden).toBe(true);
    expect(container.querySelector('input')).toBe(input);
    expectHooksMatchSpec(container, 'LAYOUT');
  });

  it('UIC-LAYOUT-3.2 sandboxes the embedded frame unless permissions are granted and names it by title', () => {
    const { container, rerender } = render(<EmbeddedFrame title="Report.pdf" src="about:blank" />);
    const frame = () => container.querySelector('iframe')!;
    expect(frame()).toHaveAttribute('sandbox', '');
    expect(frame()).toHaveAttribute('title', 'Report.pdf');
    rerender(<EmbeddedFrame title="Report.pdf" sandbox="allow-scripts" />);
    expect(frame()).toHaveAttribute('sandbox', 'allow-scripts');
    expectHooksMatchSpec(container, 'LAYOUT');
  });
});

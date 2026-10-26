import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
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
    const input = requireDefined(container.querySelector('input'));
    rerender(
      <>
        <Contents hidden>
          <input defaultValue="draft" />
        </Contents>
        <InlineContents hidden>Kiwi</InlineContents>
      </>,
    );
    const [contents, inline] = Array.from(container.children) as HTMLElement[];
    expect(requireDefined(contents).hidden).toBe(true);
    expect(requireDefined(inline).hidden).toBe(true);
    expect(container.querySelector('input')).toBe(input);
    expectHooksMatchSpec(container, 'LAYOUT');
  });

  it('UIC-LAYOUT-3.2 sandboxes the embedded frame unless permissions are granted and names it by title', () => {
    const { container, rerender } = render(<EmbeddedFrame title="Report.pdf" src="about:blank" />);
    const frame = () => requireDefined(container.querySelector('iframe'));
    expect(frame()).toHaveAttribute('sandbox', '');
    expect(frame()).toHaveAttribute('title', 'Report.pdf');
    rerender(<EmbeddedFrame title="Report.pdf" sandbox="allow-scripts" />);
    expect(frame()).toHaveAttribute('sandbox', 'allow-scripts');
    expectHooksMatchSpec(container, 'LAYOUT');
  });
});

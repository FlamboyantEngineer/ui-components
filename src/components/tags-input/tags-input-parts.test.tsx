import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type * as TagGroupModule from '../tag-group/tag-group.js';
import { TagsInput } from './tags-input.js';

const tagRenders = vi.hoisted(() => ({ count: 0 }));

// Counts the renders of each tag, to check that typing leaves the tags alone.
vi.mock('../tag-group/tag-group.js', async (importOriginal) => {
  const actual = await importOriginal<typeof TagGroupModule>();
  return {
    ...actual,
    Tag: (props: Parameters<typeof actual.Tag>[0]) => {
      tagRenders.count += 1;
      return createElement(actual.Tag, props);
    },
  };
});

describe('TagsInputControl', () => {
  it('UIC-TAGS-INPUT-2.3 does not render the tags again as the reader types', async () => {
    const user = userEvent.setup();
    const tags = Array.from({ length: 40 }, (_, index) => `tag-${index}`);
    render(<TagsInput label="Labels" defaultValue={tags} />);
    const input = screen.getByRole('textbox', { name: 'Labels' });
    await user.click(input);
    tagRenders.count = 0;
    await user.keyboard('abc');
    expect(input).toHaveValue('abc');
    expect(tagRenders.count).toBe(0);
    await user.keyboard('{Enter}');
    expect(screen.getAllByRole('row')).toHaveLength(41);
    expect(tagRenders.count).toBeGreaterThan(0);
  });
});

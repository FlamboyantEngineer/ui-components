import { FolderGlyph } from '../../core/glyphs.js';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { HeadingLevelContext } from '../section-header/section-header.js';
import { RecordHeader } from './record-header.js';

describe('RecordHeader', { timeout: 15_000 }, () => {
  it('UIC-RECORD-HEADER-1.1 UIC-RECORD-HEADER-1.5 shows the identifier with a copy button', () => {
    const { container } = render(
      <RecordHeader
        identifier="REQ-12"
        icon={FolderGlyph}
        title="Cooling rack"
        className="extra"
        id="record"
        data-lab="record"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('ui-record-header', 'extra');
    expect(root).toHaveAttribute('id', 'record');
    expect(root).toHaveAttribute('data-lab', 'record');
    expect(root).not.toHaveAttribute('data-editable');
    const label = container.querySelector('.ui-record-header__label');
    expect(label).toHaveClass('ui-record-label');
    expect(label).toHaveAttribute('data-size', 'sm');
    expect(label).toHaveTextContent('REQ-12');
    expect(label?.querySelector('[data-glyph="folder"]')).not.toBeNull();
    const copy = screen.getByRole('button', { name: 'Copy REQ-12' });
    expect(copy.closest('.ui-record-header__copy')).toHaveClass('ui-copy-button');
    expect(container.querySelector('.ui-record-header__identity')).toContainElement(copy);
    expectHooksMatchSpec(container, 'RECORD-HEADER', {
      slots: ['identity', 'label', 'copy', 'title'],
      callerAttributes: ['data-lab'],
    });
  });

  it('UIC-RECORD-HEADER-1.2 draws the title as a heading at the section level', () => {
    const { rerender } = render(<RecordHeader identifier="REQ-12" title="Cooling rack" />);
    expect(screen.getByRole('heading', { name: 'Cooling rack', level: 3 })).toHaveClass(
      'ui-record-header__title',
    );
    rerender(<RecordHeader identifier="REQ-12" title="Cooling rack" headingLevel={1} />);
    expect(screen.getByRole('heading', { level: 1 }).tagName).toBe('H1');
    rerender(
      <HeadingLevelContext value={1}>
        <RecordHeader identifier="REQ-12" title="Cooling rack" />
      </HeadingLevelContext>,
    );
    expect(screen.getByRole('heading', { name: 'Cooling rack' }).tagName).toBe('H2');
  });

  it('UIC-RECORD-HEADER-1.3 edits the title in place', async () => {
    const user = userEvent.setup();
    const onTitleChange = vi.fn();
    const { container } = render(
      <RecordHeader
        identifier="REQ-12"
        title="Cooling rack"
        onTitleChange={onTitleChange}
        headingLevel={2}
      />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-editable', 'true');
    const heading = screen.getByRole('heading', { level: 2, name: 'Cooling rack' });
    expect(heading.tagName).toBe('DIV');
    expect(heading).toHaveClass('ui-record-header__title');
    const edit = screen.getByRole('button', { name: /^Edit Title/ });
    expect(heading).toContainElement(edit);
    await user.click(edit);
    await user.keyboard('Wire cooling rack{Enter}');
    expect(onTitleChange).toHaveBeenCalledWith('Wire cooling rack');
  });

  it('UIC-RECORD-HEADER-1.3 shows a placeholder for an empty editable title', () => {
    render(
      <RecordHeader
        identifier="REQ-13"
        title=""
        titlePlaceholder="Untitled"
        onTitleChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /^Edit Title/ })).toHaveTextContent('Untitled');
  });

  it('UIC-RECORD-HEADER-1.4 UIC-RECORD-HEADER-2.1 adds status, metadata and actions in reading order', () => {
    const { container, rerender } = render(
      <RecordHeader
        identifier="REQ-12"
        title="Cooling rack"
        status={<span>Open</span>}
        meta={['Created by Maria Santos', null, 'Updated 2 hours ago']}
        actions={<button type="button">Share</button>}
      />,
    );
    const parts = [...(container.firstElementChild?.children ?? [])].map((part) =>
      requireDefined(
        part.className.split(' ').find((name) => name.startsWith('ui-record-header__')),
      ),
    );
    expect(parts).toEqual([
      'ui-record-header__identity',
      'ui-record-header__title',
      'ui-record-header__status',
      'ui-record-header__meta',
      'ui-record-header__actions',
    ]);
    expect(container.querySelector('.ui-record-header__meta')).toHaveClass('ui-meta-line');
    expect(container.querySelector('.ui-record-header__meta')).toHaveTextContent(
      'Created by Maria Santos · Updated 2 hours ago',
    );
    expectHooksMatchSpec(container, 'RECORD-HEADER', { slots: 'all' });
    rerender(<RecordHeader identifier="REQ-12" title="Cooling rack" status={null} meta={[]} />);
    expect(container.querySelector('.ui-record-header__status')).toBeNull();
    expect(container.querySelector('.ui-record-header__meta')).toBeNull();
    expect(container.querySelector('.ui-record-header__actions')).toBeNull();
  });
});

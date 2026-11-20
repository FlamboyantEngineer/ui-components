import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CloseGlyph, FilePdfGlyph } from '../../core/glyphs.js';
import { Icon } from '../icon/icon.js';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from './index.js';

it('UIC-ATTACHMENT-3.1 composes an attachment from its media, content and actions', async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  const { container } = render(
    <Attachment id="timetable" role="group" aria-label="timetable.pdf" data-testid="file">
      <AttachmentMedia>
        <Icon icon={FilePdfGlyph} />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>timetable.pdf</AttachmentTitle>
        <AttachmentDescription>24 KB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction label="Remove timetable.pdf" icon={CloseGlyph} onPress={onRemove} />
      </AttachmentActions>
    </Attachment>,
  );
  const attachment = screen.getByRole('group', { name: 'timetable.pdf' });
  expect(attachment).toHaveAttribute('id', 'timetable');
  expect(attachment).toHaveAttribute('data-display', 'parts');
  expect(attachment).toHaveAttribute('data-status', 'complete');
  expect(attachment).toHaveAttribute('data-size', 'md');
  expect(attachment).toHaveAttribute('data-orientation', 'horizontal');
  expect(attachment).toHaveAttribute('data-testid', 'file');
  expect(attachment.querySelector('.ui-attachment__media')).toHaveAttribute('data-variant', 'icon');
  expect(within(attachment).getByText('24 KB')).toHaveClass('ui-attachment__description');
  await user.click(within(attachment).getByRole('button', { name: 'Remove timetable.pdf' }));
  expect(onRemove).toHaveBeenCalledOnce();
  expectHooksMatchSpec(container, 'ATTACHMENT', {
    slots: ['media', 'content', 'title', 'description', 'actions', 'action'],
    callerAttributes: ['data-testid'],
  });
});

it('UIC-ATTACHMENT-3.1 publishes a composed attachment’s status, size, orientation and media', () => {
  render(
    <Attachment status="error" size="xs" orientation="vertical" aria-label="beach.png">
      <AttachmentMedia variant="image">
        <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>beach.png</AttachmentTitle>
      </AttachmentContent>
    </Attachment>,
  );
  const attachment = screen.getByLabelText('beach.png');
  expect(attachment).toHaveAttribute('data-status', 'error');
  expect(attachment).toHaveAttribute('data-size', 'xs');
  expect(attachment).toHaveAttribute('data-orientation', 'vertical');
  expect(attachment.querySelector('.ui-attachment__media')).toHaveAttribute(
    'data-variant',
    'image',
  );
});

it('UIC-ATTACHMENT-3.2 holds attachments in a row the caller names', () => {
  const { container } = render(
    <AttachmentGroup role="list" aria-label="Files">
      <Attachment role="listitem">
        <AttachmentContent>
          <AttachmentTitle>notes.txt</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
      <Attachment role="listitem" size="sm">
        <AttachmentContent>
          <AttachmentTitle>map.png</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
    </AttachmentGroup>,
  );
  const group = screen.getByRole('list', { name: 'Files' });
  expect(group).toHaveClass('ui-attachment-group');
  expect(within(group).getAllByRole('listitem')).toHaveLength(2);
  expectHooksMatchSpec(container, 'ATTACHMENT', { slots: ['content', 'title'] });
});

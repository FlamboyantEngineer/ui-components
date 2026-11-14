import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Attachment, type AttachmentData } from './attachment.js';

const photo: AttachmentData = {
  id: 'photo',
  name: 'Harbour.png',
  mediaType: 'image/png',
  url: '/files/harbour.png',
  thumbnailUrl: '/files/harbour-small.png',
};

const report: AttachmentData = {
  id: 'report',
  name: 'Trip plan.pdf',
  mediaType: 'application/pdf',
  size: 482_000,
  url: '/files/trip-plan.pdf',
};

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-attachment');
}

/** An attachment whose upload failed until Retry starts it again. */
function Retrying({ removable }: { removable: boolean }) {
  const [status, setStatus] = useState<AttachmentData['status']>('error');
  return (
    <Attachment
      {...report}
      status={status}
      error="The connection dropped."
      onRetry={() => setStatus('uploading')}
      onRemove={removable ? () => {} : undefined}
    />
  );
}

describe('Attachment', () => {
  it('UIC-ATTACHMENT-1.1 UIC-ATTACHMENT-1.3 shows a file as a chip with its glyph, name and size', () => {
    const { container } = render(<Attachment {...report} />);
    const element = root(container);
    expect(element).toHaveAttribute('data-kind', 'pdf');
    expect(element).toHaveAttribute('data-status', 'complete');
    expect(element).toHaveAttribute('data-display', 'chip');
    expect(element?.querySelector('.ui-attachment__icon')).toHaveAttribute(
      'data-glyph',
      'file-pdf',
    );
    expect(screen.getByText('Trip plan.pdf')).toHaveClass('ui-attachment__name');
    expect(screen.getByText('470.7 KB')).toHaveClass('ui-attachment__size');
    expectHooksMatchSpec(container, 'ATTACHMENT', {
      slots: ['icon', 'name', 'size', 'download'],
    });
  });

  it('UIC-ATTACHMENT-1.3 writes the size in the provider locale and leaves it out when unknown', () => {
    const { container } = render(
      <UiProvider locale="fr-FR">
        <Attachment {...report} />
        <Attachment id="notes" name="notes" mediaType="" />
      </UiProvider>,
    );
    expect(screen.getByText('470,7 KB')).toBeInTheDocument();
    const notes = container.querySelectorAll('.ui-attachment')[1];
    expect(notes).toHaveAttribute('data-kind', 'file');
    expect(notes?.querySelector('.ui-attachment__size')).toBeNull();
    expect(notes?.querySelector('.ui-attachment__icon')).toHaveAttribute('data-glyph', 'file');
  });

  it('UIC-ATTACHMENT-1.2 shows an image as its thumbnail, named by the file name', () => {
    const { container } = render(<Attachment {...photo} />);
    const image = screen.getByRole('img', { name: 'Harbour.png' });
    expect(image).toHaveClass('ui-attachment__thumbnail');
    expect(image).toHaveAttribute('src', '/files/harbour-small.png');
    expect(root(container)).toHaveAttribute('data-display', 'thumbnail');
    expect(container.querySelector('.ui-attachment__name')).toBeNull();
    expectHooksMatchSpec(container, 'ATTACHMENT', { slots: ['thumbnail'] });
  });

  it('UIC-ATTACHMENT-1.2 makes the thumbnail a preview button with onPreview', async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    const { container } = render(
      <Attachment {...photo} thumbnailUrl={undefined} onPreview={onPreview} />,
    );
    const button = screen.getByRole('button', { name: 'View Harbour.png' });
    expect(button).toHaveClass('ui-attachment__preview', 'ui-button');
    const image = button.querySelector('.ui-attachment__thumbnail');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('src', '/files/harbour.png');
    await user.click(button);
    expect(onPreview).toHaveBeenCalledOnce();
    expectHooksMatchSpec(container, 'ATTACHMENT', { slots: ['preview', 'thumbnail'] });
  });

  it('UIC-ATTACHMENT-1.2 falls back to the chip when the image fails to load', () => {
    const { container } = render(<Attachment {...photo} onPreview={() => {}} />);
    const image = container.querySelector('.ui-attachment__thumbnail');
    if (!image) throw new Error('No thumbnail');
    fireEvent.error(image);
    expect(root(container)).toHaveAttribute('data-display', 'chip');
    expect(screen.queryByRole('button', { name: 'View Harbour.png' })).not.toBeInTheDocument();
    expect(root(container)?.querySelector('.ui-attachment__icon')).toHaveAttribute(
      'data-glyph',
      'file-image',
    );
    expect(screen.getByText('Harbour.png')).toBeInTheDocument();
  });

  it('UIC-ATTACHMENT-1.2 keeps a new thumbnail when the departed one fails', () => {
    const { container, rerender } = render(
      <Attachment {...photo} thumbnailUrl="/files/harbour-uploading.png" />,
    );
    const departed = container.querySelector('.ui-attachment__thumbnail');
    if (!departed) throw new Error('No thumbnail');
    rerender(<Attachment {...photo} thumbnailUrl="/files/harbour-small.png" />);
    fireEvent.error(departed);
    expect(root(container)).toHaveAttribute('data-display', 'thumbnail');
    expect(container.querySelector('.ui-attachment__thumbnail')).toHaveAttribute(
      'src',
      '/files/harbour-small.png',
    );
  });

  it('UIC-ATTACHMENT-1.2 falls back for an image that failed before its handler was attached', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    const width = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);
    const { container } = render(<Attachment {...photo} />);
    expect(root(container)).toHaveAttribute('data-display', 'chip');
    complete.mockRestore();
    width.mockRestore();
  });

  it('UIC-ATTACHMENT-1.4 shows the upload progress with its value', () => {
    const { container } = render(<Attachment {...report} status="uploading" progress={0.45} />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading Trip plan.pdf' });
    expect(bar).toHaveClass('ui-attachment__progress', 'ui-progress-bar');
    expect(bar).toHaveAttribute('aria-valuenow', '45');
    expect(bar).toHaveAttribute('aria-valuetext', '45%');
    expect(root(container)).toHaveAttribute('data-status', 'uploading');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'ATTACHMENT', { slots: ['progress'] });
  });

  it('UIC-ATTACHMENT-1.4 shows an indeterminate bar without progress', () => {
    render(<Attachment {...photo} status="uploading" />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading Harbour.png' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('data-indeterminate', 'true');
  });

  it('UIC-ATTACHMENT-1.5 shows the error as an alert, by default naming the file', () => {
    const { container, rerender } = render(<Attachment {...report} status="error" />);
    const alert = screen.getByRole('alert');
    expect(alert.parentElement).toHaveClass('ui-attachment__error', 'ui-inline-error');
    expect(alert).toHaveTextContent('Trip plan.pdf could not be uploaded.');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    rerender(<Attachment {...report} error="The file is too large." />);
    expect(screen.getByRole('alert')).toHaveTextContent('The file is too large.');
    expect(root(container)).toHaveAttribute('data-status', 'error');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'ATTACHMENT', { slots: ['error'] });
  });

  it('UIC-ATTACHMENT-1.5 retries a failed upload and moves the focus to the remove button', async () => {
    const user = userEvent.setup();
    render(<Retrying removable />);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByRole('progressbar', { name: 'Uploading Trip plan.pdf' })).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove Trip plan.pdf' })).toHaveFocus(),
    );
  });

  it('UIC-ATTACHMENT-1.5 moves the focus to the attachment after Retry when it has no remove button', async () => {
    const user = userEvent.setup();
    const { container } = render(<Retrying removable={false} />);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(root(container)).toHaveFocus());
    expect(root(container)).toHaveAttribute('tabindex', '-1');
  });

  it('UIC-ATTACHMENT-1.6 offers a download link once complete', () => {
    render(<Attachment {...report} />);
    const link = screen.getByRole('link', { name: 'Download Trip plan.pdf' });
    expect(link).toHaveClass('ui-attachment__download', 'ui-link');
    expect(link).toHaveAttribute('href', '/files/trip-plan.pdf');
    expect(link).toHaveAttribute('download', 'Trip plan.pdf');
    expect(link.querySelector('[data-glyph="download"]')).not.toBeNull();
  });

  it('UIC-ATTACHMENT-1.7 removes the attachment from its button', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { container } = render(<Attachment {...report} onRemove={onRemove} />);
    const remove = screen.getByRole('button', { name: 'Remove Trip plan.pdf' });
    expect(remove).toHaveClass('ui-attachment__remove', 'ui-button');
    expect(remove.querySelector('[data-glyph="close"]')).not.toBeNull();
    await user.click(remove);
    expect(onRemove).toHaveBeenCalledOnce();
    expectHooksMatchSpec(container, 'ATTACHMENT', { slots: ['remove'] });
  });

  it('UIC-ATTACHMENT-1.8 ignores URLs with an unsafe scheme', () => {
    const { container } = render(
      <Attachment {...photo} url="javascript:alert(1)" thumbnailUrl="javascript:alert(2)" />,
    );
    expect(root(container)).toHaveAttribute('data-display', 'chip');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('UIC-ATTACHMENT-1.9 appends the caller class and forwards data attributes, keeping the id off the element', () => {
    const { container } = render(
      <Attachment {...report} className="caller" data-testid="probe" data-kind="other" />,
    );
    const element = root(container);
    expect(element).toHaveClass('ui-attachment', 'caller');
    expect(element).toHaveAttribute('data-testid', 'probe');
    expect(element).toHaveAttribute('data-kind', 'pdf');
    expect(element).not.toHaveAttribute('id');
    expectHooksMatchSpec(container, 'ATTACHMENT', { callerAttributes: ['data-testid'] });
  });
});

import { FolderGlyph } from '../../core/glyphs.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { RecordLabel } from './record-label.js';

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`.ui-record-label__${name}`);

describe('RecordLabel', () => {
  it('UIC-RECORD-LABEL-1.1 keeps the icon and identifier together before the name', () => {
    const { container } = render(
      <RecordLabel icon={FolderGlyph} identifier="REQ-12" name="  Brake pressure limits " />,
    );
    const element = root(container);
    expect(element.tagName).toBe('SPAN');
    expect(element).toHaveClass('ui-record-label');
    const identity = slot(container, 'identity');
    expect(identity?.firstElementChild).toHaveClass('ui-record-label__icon', 'ui-icon');
    expect(identity?.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(identity?.lastElementChild).toHaveClass('ui-record-label__identifier');
    expect(identity).toHaveTextContent(/^REQ-12$/);
    expect(element).toHaveTextContent(/^REQ-12 Brake pressure limits$/);
    expect(slot(container, 'name')).toHaveTextContent(/^Brake pressure limits$/);
    expectHooksMatchSpec(container, 'RECORD-LABEL', {
      slots: ['identity', 'icon', 'identifier', 'name'],
    });
  });

  it('UIC-RECORD-LABEL-1.1 omits a blank name and the icon when none is given', () => {
    const { container, rerender } = render(<RecordLabel identifier="REQ-12" name="   " />);
    expect(slot(container, 'name')).toBeNull();
    expect(slot(container, 'icon')).toBeNull();
    expect(root(container)).toHaveTextContent(/^REQ-12$/);
    rerender(<RecordLabel identifier="<b>A-1</b>" icon={<svg role="img" aria-label="Kind" />} />);
    expect(container.querySelector('b')).toBeNull();
    expect(slot(container, 'icon')).toContainElement(
      screen.getByRole('img', { name: 'Kind', hidden: true }),
    );
  });

  it('UIC-RECORD-LABEL-1.2 cuts the name by default and wraps it on request', () => {
    const { container, rerender } = render(<RecordLabel identifier="REQ-12" name="Limits" />);
    expect(root(container)).toHaveAttribute('data-truncate', 'true');
    expect(slot(container, 'name')).toHaveClass('ui-truncation-tooltip');
    rerender(<RecordLabel identifier="REQ-12" name="Limits" truncate={false} />);
    expect(root(container)).not.toHaveAttribute('data-truncate');
    expect(slot(container, 'name')).not.toHaveClass('ui-truncation-tooltip');
    expect(slot(container, 'name')?.tagName).toBe('SPAN');
  });

  it('UIC-RECORD-LABEL-1.3 links the whole label through the provider', () => {
    const { container, rerender } = render(
      <UiProvider renderLink={(props) => <a {...props} data-routed="true" />}>
        <RecordLabel identifier="REQ-12" name="Limits" href="/records/12" aria-describedby="hint" />
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: 'REQ-12 Limits' });
    expect(link).toBe(root(container));
    expect(link).toHaveClass('ui-record-label', 'ui-link');
    expect(link).toHaveAttribute('href', '/records/12');
    expect(link).toHaveAttribute('data-routed', 'true');
    expect(link).toHaveAttribute('data-variant', 'secondary');
    expect(link).toHaveAttribute('aria-describedby', 'hint');
    expectHooksMatchSpec(container, 'RECORD-LABEL', { callerAttributes: ['data-routed'] });
    rerender(<RecordLabel identifier="REQ-12" href="https://example.com/12" isExternal />);
    const external = screen.getByRole('link');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAccessibleName('REQ-12 (opens in a new tab)');
    rerender(<RecordLabel identifier="REQ-12" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(root(container)).not.toHaveAttribute('tabindex');
  });

  it('UIC-RECORD-LABEL-1.3 names a label without a link from hidden text, never the span', () => {
    const { container, rerender } = render(
      <RecordLabel
        identifier="REQ-12"
        name="Limits"
        aria-label="Requirement 12, Limits"
        aria-labelledby="heading"
        aria-describedby="hint"
      />,
    );
    const label = root(container);
    expect(label).not.toHaveAttribute('aria-label');
    expect(label).not.toHaveAttribute('aria-labelledby');
    expect(label).toHaveAttribute('aria-describedby', 'hint');
    expect(screen.getByText('Requirement 12, Limits')).toHaveClass(
      'ui-record-label__accessible-label',
    );
    expect(slot(container, 'identity')).toHaveAttribute('aria-hidden', 'true');
    expect(slot(container, 'name')).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'RECORD-LABEL', {
      slots: ['identity', 'identifier', 'name', 'accessible-label'],
    });

    rerender(<RecordLabel identifier="REQ-12" href="/records/12" aria-label="Requirement 12" />);
    expect(screen.getByRole('link', { name: 'Requirement 12' })).toBe(root(container));
    expect(slot(container, 'accessible-label')).toBeNull();
    expect(slot(container, 'identity')).not.toHaveAttribute('aria-hidden');
  });

  it('UIC-RECORD-LABEL-1.4 sizes the icon with the label, medium by default', () => {
    const { container, rerender } = render(<RecordLabel identifier="REQ-12" icon={FolderGlyph} />);
    expect(root(container)).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<RecordLabel identifier="REQ-12" icon={FolderGlyph} size={size} />);
      expect(root(container)).toHaveAttribute('data-size', size);
      expect(slot(container, 'icon')).toHaveAttribute('data-size', size);
    }
  });

  it('UIC-RECORD-LABEL-1.5 shows only that a record is restricted or missing', () => {
    const { container, rerender } = render(
      <RecordLabel
        identifier="REQ-12"
        name="Limits"
        icon={FolderGlyph}
        href="/12"
        unavailable="restricted"
      />,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(root(container)).toHaveAttribute('data-unavailable', 'restricted');
    expect(root(container)).toHaveTextContent(/^Restricted item$/);
    expect(slot(container, 'icon')?.querySelector('[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'lock',
    );
    expect(slot(container, 'name')).toBeNull();
    rerender(<RecordLabel identifier="REQ-12" unavailable="missing" />);
    expect(root(container)).toHaveTextContent(/^Missing item$/);
    expect(slot(container, 'icon')?.querySelector('[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'warning',
    );
    expectHooksMatchSpec(container, 'RECORD-LABEL');
  });

  it('UIC-RECORD-LABEL-1.6 forwards the class, id and data attributes', () => {
    const { container } = render(
      <RecordLabel identifier="REQ-12" className="extra" id="label" data-row="3" data-size="x" />,
    );
    expect(root(container)).toHaveClass('ui-record-label', 'extra');
    expect(root(container)).toHaveAttribute('id', 'label');
    expect(root(container)).toHaveAttribute('data-row', '3');
    expect(root(container)).toHaveAttribute('data-size', 'md');
    expectHooksMatchSpec(container, 'RECORD-LABEL', { callerAttributes: ['data-row'] });
  });
  it('UIC-RECORD-LABEL-3.1 selects plain or chip presentation without changing the record identity', () => {
    const { rerender } = render(
      <RecordLabel identifier="DOC-7" name="Field notes" href="/records/7" />,
    );
    expect(screen.getByRole('link', { name: 'DOC-7 Field notes' })).toHaveAttribute(
      'data-mode',
      'label',
    );
    rerender(
      <RecordLabel
        mode="chip"
        identifier="DOC-7"
        name="Field notes"
        href="/records/7"
        version="v2"
      />,
    );
    expect(screen.getByRole('link', { name: 'DOC-7 Field notes' })).toHaveAttribute(
      'href',
      '/records/7',
    );
    expect(screen.getByText('v2').closest('.ui-record-label')).toHaveAttribute('data-mode', 'chip');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Path } from './path.js';

describe('Path', () => {
  it('UIC-PATH-2.1 renders the formatted text in a left-to-right isolate without semantics', () => {
    const { container } = render(<Path path="/Garden/<Herbs>//Basil " />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveClass('ui-path');
    expect(root).toHaveTextContent(/^\/Garden\/<Herbs>\/Basil$/);
    const text = root.querySelector('bdi');
    expect(text).toHaveClass('ui-path__text');
    expect(text).toHaveAttribute('dir', 'ltr');
    expect(root.querySelector('a, nav, [role], [tabindex]')).toBeNull();
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('style');
    expectHooksMatchSpec(container, 'PATH', { slots: 'all' });
  });

  it('UIC-PATH-2.1 roots only slash-led strings and keeps array labels whole', () => {
    const { container, rerender } = render(<Path path="Garden/Herbs" />);
    expect(container).toHaveTextContent(/^Garden\/Herbs$/);
    rerender(<Path path={['Garden', 'https://example.test/basil']} />);
    expect(container).toHaveTextContent(/^Garden\/https:\/\/example\.test\/basil$/);
    rerender(<Path path=" /// " />);
    expect(container).toHaveTextContent(/^\/$/);
  });

  it('UIC-PATH-2.3 hides natively and stays quiet unless asked to announce', () => {
    const { container, rerender } = render(<Path path="/Garden" />);
    expect(container.querySelector('[aria-live]')).toBeNull();
    rerender(<Path path="/Garden/Herbs" live="polite" />);
    expect(container.firstElementChild).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveTextContent('/Garden/Herbs');
    rerender(<Path path="/Garden" hidden />);
    expect((container.firstElementChild as HTMLElement).hidden).toBe(true);
  });

  it('UIC-PATH-2.4 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <Path path="/Garden" className="caller" id="where" data-testid="probe" data-probe="yes" />,
    );
    const root = screen.getByTestId('probe');
    expect(root).toHaveClass('ui-path', 'caller');
    expect(root).toHaveAttribute('id', 'where');
    expect(root).toHaveAttribute('data-probe', 'yes');
    expectHooksMatchSpec(container, 'PATH', { callerAttributes: ['data-probe'] });
  });
});

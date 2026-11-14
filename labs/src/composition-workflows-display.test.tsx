import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FrameComposition } from './composition-workflows-display.js';

describe('Host frame composition', () => {
  it('UIC-COMPOSITION-WORKFLOWS-1.1 keeps repeated skip targets distinct inside an existing main', () => {
    render(
      <main>
        <FrameComposition />
        <FrameComposition />
      </main>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    const links = screen.getAllByRole('link', { name: 'Skip to sample content' });
    const targets = links.map((link) => link.getAttribute('href'));
    expect(new Set(targets).size).toBe(2);
    for (const target of targets) {
      expect(target).toMatch(/^#.+/);
      const content = document.getElementById(target?.slice(1) ?? '');
      expect(content).toHaveAttribute('tabindex', '-1');
    }
  });

  it('UIC-COMPOSITION-WORKFLOWS-1.1 lets a standalone host use main content semantics', () => {
    render(<FrameComposition contentElement="main" />);
    expect(screen.getByRole('main', { name: 'Sample content' })).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createLinkService, resolveNamedAction } from './pdf-link-service.js';

function createActions() {
  return {
    followDestination: vi.fn(),
    goToPage: vi.fn(),
    readPosition: () => ({ currentPage: 1, pageCount: 3 }),
  };
}

describe('PDF link service', () => {
  it('UIC-PDF-VIEWER-2.4 opens links to the web in a new tab', () => {
    const link = document.createElement('a');
    createLinkService(createActions()).addLinkAttributes(link, 'https://example.com/', false);
    expect(link.href).toBe('https://example.com/');
    expect(link.title).toBe('https://example.com/');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('nofollow noopener noreferrer');
  });

  it('UIC-PDF-VIEWER-2.4 leaves a link with an unsafe address without a destination', () => {
    const link = document.createElement('a');
    createLinkService(createActions()).addLinkAttributes(link, 'javascript:alert(1)', false);
    expect(link).not.toHaveAttribute('href');
    expect(link).not.toHaveAttribute('target');
  });

  it('UIC-PDF-VIEWER-2.4 sends destinations to the viewer instead of the browser', () => {
    const actions = createActions();
    const service = createLinkService(actions);
    expect(service.getDestinationHash('local markets')).toBe('#local%20markets');
    expect(service.getDestinationHash([{ num: 1, gen: 0 }, { name: 'Fit' }])).toBe('#');
    expect(service.getAnchorUrl('')).toBe('#');
    const destination = [{ num: 2, gen: 0 }, { name: 'Fit' }];
    service.goToDestination(destination);
    expect(actions.followDestination).toHaveBeenCalledWith(destination);
    service.executeSetOCGState({ state: [] });
  });

  it('UIC-PDF-VIEWER-2.4 runs the named page actions and ignores the others', () => {
    const position = { currentPage: 1, pageCount: 3 };
    expect(resolveNamedAction('NextPage', position)).toBe(2);
    expect(resolveNamedAction('NextPage', { currentPage: 2, pageCount: 3 })).toBe(2);
    expect(resolveNamedAction('PrevPage', position)).toBe(0);
    expect(resolveNamedAction('PrevPage', { currentPage: 0, pageCount: 3 })).toBe(0);
    expect(resolveNamedAction('FirstPage', position)).toBe(0);
    expect(resolveNamedAction('LastPage', position)).toBe(2);
    expect(resolveNamedAction('Print', position)).toBeNull();

    const actions = createActions();
    const service = createLinkService(actions);
    service.executeNamedAction('LastPage');
    service.executeNamedAction('GoBack');
    expect(actions.goToPage.mock.calls).toEqual([[2]]);
  });
});

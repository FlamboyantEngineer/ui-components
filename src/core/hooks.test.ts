import { describe, expect, it } from 'vitest';
import {
  createHooks,
  dataAttributes,
  measuredProperty,
  mergeClassNames,
  pickDataAttributes,
  splitDataAttributes,
} from './hooks.js';

describe('createHooks', () => {
  const hooks = createHooks('icon-button', ['glyph', 'label']);

  it('UIC-HOOKS-1.1 puts the root class on the root element', () => {
    expect(hooks.className).toBe('ui-icon-button');
    expect(hooks.root().className).toBe('ui-icon-button');
  });

  it('UIC-HOOKS-1.1 rejects names that are not kebab case', () => {
    expect(() => createHooks('IconButton')).toThrow();
    expect(() => createHooks('button', ['Label' as 'label'])).toThrow();
  });

  it('UIC-HOOKS-1.2 builds slot classes from declared slots', () => {
    expect(hooks.slot('glyph').className).toBe('ui-icon-button__glyph');
    expect(hooks.slotClass('label')).toBe('ui-icon-button__label');
    expect(hooks.slot('label', { truncated: true })).toEqual({
      className: 'ui-icon-button__label',
      'data-truncated': 'true',
    });
  });

  it('UIC-HOOKS-1.3 appends the caller class after the root class', () => {
    expect(hooks.root({ className: 'toolbar-action' }).className).toBe(
      'ui-icon-button toolbar-action',
    );
  });

  it('UIC-HOOKS-2.1 publishes options as data attributes', () => {
    expect(hooks.root({ data: { variant: 'ghost', size: 'md' } })).toMatchObject({
      'data-variant': 'ghost',
      'data-size': 'md',
    });
  });

  it('UIC-HOOKS-2.3 forwards caller data attributes and lets hook values win', () => {
    const props = { 'data-testid': 'save', 'data-variant': 'caller', id: 'x', onClick: () => {} };
    const root = hooks.root({ props, data: { variant: 'primary' } });
    expect(root).toEqual({
      className: 'ui-icon-button',
      'data-testid': 'save',
      'data-variant': 'primary',
    });
  });
});

describe('dataAttributes', () => {
  it('UIC-HOOKS-2.2 renders true states as "true" and omits false ones', () => {
    expect(
      dataAttributes({ loading: true, disabled: false, empty: null, focusVisible: true, count: 3 }),
    ).toEqual({ 'data-loading': 'true', 'data-focus-visible': 'true', 'data-count': '3' });
  });

  it('accepts full attribute names', () => {
    expect(dataAttributes({ 'data-tone': 'info' })).toEqual({ 'data-tone': 'info' });
  });
});

describe('caller attribute helpers', () => {
  it('UIC-HOOKS-2.3 picks and splits data attributes', () => {
    const props = { 'data-row': 2, 'data-flag': true, 'data-off': false, title: 't' };
    expect(pickDataAttributes(props)).toEqual({ 'data-row': '2', 'data-flag': 'true' });
    const [data, rest] = splitDataAttributes(props);
    expect(data).toEqual({ 'data-row': '2', 'data-flag': 'true' });
    expect(rest).toEqual({ title: 't' });
  });

  it('joins class names', () => {
    expect(mergeClassNames('ui-a', undefined, false, 'b')).toBe('ui-a b');
  });
});

describe('measuredProperty', () => {
  it('UIC-HOOKS-3.2 names measured values --ui-<name>', () => {
    expect(measuredProperty('trigger-width', 120)).toEqual({ '--ui-trigger-width': '120px' });
    expect(measuredProperty('offset', '2rem')).toEqual({ '--ui-offset': '2rem' });
    expect(() => measuredProperty('Bad Name', 1)).toThrow();
  });
});

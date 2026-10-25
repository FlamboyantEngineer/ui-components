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
  const hooks = createHooks('button', ['glyph', 'label']);

  it('UIC-HOOKS-1.1 puts the root class on the root element', () => {
    expect(hooks.className).toBe('ui-button');
    expect(hooks.root().className).toBe('ui-button');
  });

  it('UIC-HOOKS-1.1 rejects names that are not kebab case', () => {
    expect(() => createHooks('Button')).toThrow();
    expect(() => createHooks('button', ['Label' as 'label'])).toThrow();
  });

  it('UIC-HOOKS-1.2 builds slot classes from declared slots', () => {
    expect(hooks.slot('glyph').className).toBe('ui-button__glyph');
    expect(hooks.slotClass('label')).toBe('ui-button__label');
    expect(hooks.slot('label', { truncated: true })).toEqual({
      className: 'ui-button__label',
      'data-truncated': 'true',
    });
  });

  it('UIC-HOOKS-1.3 appends the caller class after the root class', () => {
    expect(hooks.root({ className: 'toolbar-action' }).className).toBe('ui-button toolbar-action');
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
      className: 'ui-button',
      'data-testid': 'save',
      'data-variant': 'primary',
    });
  });

  it('UIC-HOOKS-2.2 UIC-HOOKS-2.3 clears caller attributes for inactive hook values', () => {
    const root = hooks.root({
      props: {
        'data-disabled': 'true',
        'data-loading': 'true',
        'data-focus-visible': 'true',
        'data-note': 'caller',
      },
      data: { disabled: false, loading: undefined, 'data-focus-visible': null },
    });
    expect(root).toEqual({
      className: 'ui-button',
      'data-disabled': undefined,
      'data-loading': undefined,
      'data-focus-visible': undefined,
      'data-note': 'caller',
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
  it('UIC-HOOKS-2.3 picks and splits data attributes, rendering values as React does', () => {
    const props = {
      'data-row': 2,
      'data-flag': true,
      'data-off': false,
      'data-gone': undefined,
      'data-none': null,
      title: 't',
    };
    const picked = { 'data-row': '2', 'data-flag': 'true', 'data-off': 'false' };
    expect(pickDataAttributes(props)).toEqual(picked);
    const [data, rest] = splitDataAttributes(props);
    expect(data).toEqual(picked);
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

import { describe, expect, it } from 'vitest';
import {
  createHooks,
  dataAttributes,
  measuredProperty,
  mergeClassNames,
  pickDataAttributes,
  splitDataAttributes,
} from './hooks.js';
import type { BaseProps } from './props.js';

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

  it('UIC-HOOKS-2.3 clears a caller attribute on a slot for an inactive hook value', () => {
    const props = { 'data-open': 'true', ...hooks.slot('label', { open: false, pressed: true }) };
    expect(props).toEqual({
      className: 'ui-button__label',
      'data-open': undefined,
      'data-pressed': 'true',
    });
  });
});

describe('createHooks shadcn/ui slot names', () => {
  const hooks = createHooks('dialog', ['close', 'body'], {
    root: 'dialog-overlay',
    close: 'dialog-close',
  });

  it('UIC-HOOKS-1.5 writes the declared data-slot on the root and on named slots only', () => {
    expect(hooks.root()).toEqual({ className: 'ui-dialog', 'data-slot': 'dialog-overlay' });
    expect(hooks.slot('close')).toEqual({
      className: 'ui-dialog__close',
      'data-slot': 'dialog-close',
    });
    expect(hooks.slot('body')).toEqual({ className: 'ui-dialog__body' });
    expect(hooks.dataSlot('close')).toBe('dialog-close');
    expect(hooks.dataSlot('body')).toBeUndefined();
  });

  it('UIC-HOOKS-1.5 lets a caller data-slot name a composed part', () => {
    const button = createHooks('button', [], { root: 'button' });
    expect(button.root({ props: hooks.slot('close') })['data-slot']).toBe('dialog-close');
    expect(button.root({ props: {} })['data-slot']).toBe('button');
    expect(button.root({ className: 'host ui-dialog__close' })['data-slot']).toBe('dialog-close');
    expect(button.root({ className: 'ui-dialog__body' })['data-slot']).toBe('button');
  });

  it('UIC-HOOKS-1.6 gives other names to the classes listed, keeping the others', () => {
    const sheet = hooks.withDataSlots({
      'ui-dialog': 'sheet-overlay',
      'ui-dialog__close': null,
      'ui-dialog__body': 'sheet-body',
    });
    expect(sheet.root()['data-slot']).toBe('sheet-overlay');
    expect(sheet.slot('close')).toEqual({ className: 'ui-dialog__close' });
    expect(sheet.slot('body')['data-slot']).toBe('sheet-body');
    expect(sheet.withDataSlots({}).dataSlot('root')).toBe('sheet-overlay');
    expect(hooks.dataSlot('root')).toBe('dialog-overlay');
    expect(sheet.slots).toEqual(['close', 'body']);
  });

  it('UIC-HOOKS-1.5 renders no data-slot for a component that declares none', () => {
    expect(createHooks('pdf-viewer', ['page']).root()).toEqual({ className: 'ui-pdf-viewer' });
  });

  it('UIC-HOOKS-1.5 rejects slot names that are not kebab case', () => {
    expect(() => createHooks('card', [], { root: 'Card' })).toThrow();
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

  it('UIC-HOOKS-2.3 reads only own props and skips invalid data names', () => {
    const inherited = Object.create({ 'data-inherited': 'x', title: 'inherited' }) as object;
    const props = Object.assign(inherited, { 'data-a b': 1, 'data-row': 2, 'data-': 3, id: 'a' });
    expect(pickDataAttributes(props)).toEqual({ 'data-row': '2' });
    const [data, rest] = splitDataAttributes(props);
    expect(data).toEqual({ 'data-row': '2' });
    expect(rest).toEqual({ 'data-a b': 1, 'data-': 3, id: 'a' });
  });

  it('UIC-HOOKS-2.3 takes a typed caller null, which omits the attribute', () => {
    const props: BaseProps = { className: 'caller', 'data-row': 2, 'data-none': null };
    const root = createHooks('row').root({ className: props.className, props });
    expect(root).toEqual({ className: 'ui-row caller', 'data-row': '2' });
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

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createHooks } from '../src/core/hooks.js';
import { expectHooksMatchSpec, parseHookTable, specRegistry } from './hooks.js';

const spec = parseHookTable(
  'SAMPLE',
  `# Sample

## Hooks

| Hook | Kind | Values | Description |
| --- | --- | --- | --- |
| \`ui-sample\` | root | | Root. |
| \`ui-sample__label\` | slot | | Label. |
| \`ui-sample__icon\` | slot | | Icon. |
| \`data-variant\` | attribute | \`primary\`, \`secondary\` | Emphasis. |
| \`data-busy\` | state | \`true\` | While busy. |
| \`data-index\` | attribute | | Position. |
| \`--ui-sample-width\` | property | | Measured width. |
`,
);

const hooks = createHooks('sample', ['label', 'icon', 'extra']);

function Sample({
  variant = 'primary',
  busy = false,
  extra = false,
  icon = true,
  ...rest
}: {
  variant?: string;
  busy?: boolean;
  extra?: boolean;
  icon?: boolean;
  [key: `data-${string}`]: string;
}) {
  return (
    <div
      {...hooks.root({ props: rest, data: { variant, busy, index: 3 } })}
      style={{ '--ui-sample-width': '10px' } as React.CSSProperties}
    >
      <span {...hooks.slot('label')}>Label</span>
      {icon ? <span {...hooks.slot('icon')} /> : null}
      {extra ? <span {...hooks.slot('extra')} /> : null}
    </div>
  );
}

function failureOf(run: () => void): string {
  try {
    run();
  } catch (error) {
    return String(error);
  }
  return '';
}

describe('expectHooksMatchSpec', () => {
  it('UIC-HOOKS-4.1 passes markup that matches the spec', () => {
    const { container } = render(<Sample busy />);
    expectHooksMatchSpec(container, spec, { slots: 'all' });
  });

  it('UIC-HOOKS-4.1 fails on an undeclared slot class', () => {
    const { container } = render(<Sample extra />);
    expect(failureOf(() => expectHooksMatchSpec(container, spec))).toContain(
      'class ui-sample__extra is not declared in any spec',
    );
  });

  it('UIC-HOOKS-4.1 fails on an undeclared attribute or a value outside the list', () => {
    const { container } = render(<Sample variant="loud" data-note="x" />);
    const failure = failureOf(() => expectHooksMatchSpec(container, spec));
    expect(failure).toContain('data-variant="loud", expected one of primary, secondary');
    expect(failure).toContain('undeclared data-note="x"');
  });

  it('UIC-HOOKS-4.1 exempts declared caller attributes', () => {
    const { container } = render(<Sample data-note="x" />);
    expectHooksMatchSpec(container, spec, { callerAttributes: ['data-note'] });
  });

  it('UIC-HOOKS-4.1 fails when a required slot or the root is missing', () => {
    const { container } = render(<Sample icon={false} />);
    expect(failureOf(() => expectHooksMatchSpec(container, spec, { slots: ['icon'] }))).toContain(
      'slot ui-sample__icon did not render',
    );
    const empty = render(<p />).container;
    expect(failureOf(() => expectHooksMatchSpec(empty, spec))).toContain(
      'none of the roots ui-sample rendered',
    );
  });

  it('UIC-HOOKS-4.1 parses the spec hook tables once per worker, across module resets', async () => {
    const registry = specRegistry();
    expect(registry.get('BUTTON')?.hooks.length).toBeGreaterThan(0);
    vi.resetModules();
    const reloaded = await import('./hooks.js');
    expect(reloaded.specRegistry()).toBe(registry);
  });
});

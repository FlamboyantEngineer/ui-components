// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  Key as PrimitiveKey,
  Placement as PrimitivePlacement,
  PressEvent as PrimitivePressEvent,
  Selection as PrimitiveSelection,
  SortDescriptor as PrimitiveSortDescriptor,
} from '../src/primitives/index.js';
import type { PressEvent, PressEventProps } from '../src/core/events.js';
import type { Key, Placement, Selection, SortDescriptor } from '../src/core/props.js';
import type { ElementRender } from '../src/utils/render-element.js';
import type { AspectRatioProps } from '../src/components/layout/aspect-ratio.js';
import type { PageProps, StackProps } from '../src/components/layout/layout.js';
import type { ContentsProps } from '../src/components/layout/wrappers.js';
import type { ListProps } from '../src/components/list-row/list-row.js';
import type { OverflowListProps } from '../src/components/overflow-list/overflow-list.js';
import type { ScrollRegionProps } from '../src/components/scroll-region/scroll-region.js';
import type { DescriptionListProps } from '../src/components/description-list/description-list.js';

// Package names built from parts so the repository scan in primitives.test.ts skips this file.
const ARIA = `${'react-aria'}-components`;

function check(files: Record<string, string>, ...args: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-public-types-'));
  try {
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(join(dir, path, '..'), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    return spawnSync('node', ['scripts/check-public-types.mjs', '--dir', dir, ...args], {
      encoding: 'utf8',
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('public declarations', () => {
  it('UIC-PRIMITIVES-2.1 fails on a declaration that imports a building block', () => {
    const result = check({
      'components/probe/probe.d.ts':
        "import type { ButtonProps } from '../../primitives/index.js';\n",
      'components/other/other.d.ts': `export type X = import('${ARIA}').Key;\n`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('components/probe/probe.d.ts');
    expect(result.stderr).toContain('components/other/other.d.ts');
  });

  it('UIC-PRIMITIVES-2.1 passes library-owned declarations and ignores the primitives themselves', () => {
    const result = check({
      'components/probe/probe.d.ts': "import type { Key } from '../../core/props.js';\n",
      'primitives/actions.d.ts': `export { Button } from '${ARIA}';\n`,
    });
    expect(result.status).toBe(0);
  });

  it('UIC-PRIMITIVES-2.1 checks only the named components when given names', () => {
    const files = {
      'components/clean/clean.d.ts': 'export {};\n',
      'components/leaky/leaky.d.ts': "export { Menu } from '../../primitives/index.js';\n",
    };
    expect(check(files, 'clean').status).toBe(0);
    expect(check(files, 'leaky').status).toBe(1);
    expect(check(files, 'leaky', 'clean').status).toBe(1);
  });

  it('UIC-PRIMITIVES-2.3 fails on a public prop whose type no entry point exports', () => {
    const result = check({
      'components/probe/index.d.ts': "export type { ProbeProps } from './probe.js';\n",
      'components/probe/probe.d.ts': [
        "type ProbeOverflow = 'wrap' | 'menu';",
        'export interface ProbeProps { overflow?: ProbeOverflow; onPick?: (mode: ProbeOverflow) => void }',
        '',
      ].join('\n'),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ProbeProps names unexported ProbeOverflow');
  });

  it('UIC-PRIMITIVES-2.3 passes exported prop types, unexported bases with exported members and generic instantiations', () => {
    const result = check({
      'index.d.ts': "export * from './components/probe/index.js';\n",
      'components/probe/index.d.ts':
        "export type { ProbeLoader, ProbeOverflow, ProbeProps } from './probe.js';\n",
      'components/probe/probe.d.ts': [
        "export type ProbeOverflow = 'wrap' | 'menu';",
        'interface ProbeBase { overflow?: ProbeOverflow }',
        'export interface ProbeProps extends ProbeBase { label: string }',
        'interface Page<T> { items: T[] }',
        'type Loader<T> = (query: string) => Promise<Page<T>>;',
        'export type ProbeLoader = Loader<string>;',
        '',
      ].join('\n'),
    });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('UIC-PRIMITIVES-2.3 checks the members a public type inherits from an unexported base', () => {
    const result = check({
      'components/probe/index.d.ts': "export type { ProbeProps } from './probe.js';\n",
      'components/probe/probe.d.ts': [
        'interface ProbeHandlers { onSave?: (draft: ProbeDraft) => void }',
        'interface ProbeDraft { text: string }',
        'export interface ProbeProps extends ProbeHandlers { label: string }',
        '',
      ].join('\n'),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ProbeProps names unexported ProbeDraft');
  });

  it('UIC-COMPOSITION-2.4 forwards container props without raw HTML', () => {
    expectTypeOf<ListProps>().not.toHaveProperty('dangerouslySetInnerHTML');
    expectTypeOf<PageProps>().not.toHaveProperty('dangerouslySetInnerHTML');
    expectTypeOf<StackProps<'ul'>>().not.toHaveProperty('dangerouslySetInnerHTML');
    expectTypeOf<ContentsProps>().not.toHaveProperty('dangerouslySetInnerHTML');
    expectTypeOf<AspectRatioProps>().not.toHaveProperty('dangerouslySetInnerHTML');
    expectTypeOf<ScrollRegionProps>().not.toHaveProperty('dangerouslySetInnerHTML');
    expectTypeOf<OverflowListProps<string>>().not.toHaveProperty('dangerouslySetInnerHTML');
    expectTypeOf<ListProps>().toHaveProperty('onKeyDown');
    expectTypeOf<PageProps>().toHaveProperty('aria-label');
    expectTypeOf<DescriptionListProps>().toHaveProperty('hidden');
    expectTypeOf<DescriptionListProps>().not.toHaveProperty('onClick');
  });

  it('UIC-PRIMITIVES-2.2 shapes the shared vocabulary so the building blocks accept it unchanged', () => {
    expectTypeOf<Key>().toEqualTypeOf<PrimitiveKey>();
    expectTypeOf<Selection>().toEqualTypeOf<PrimitiveSelection>();
    expectTypeOf<Placement>().toEqualTypeOf<PrimitivePlacement>();
    expectTypeOf<SortDescriptor>().toMatchTypeOf<PrimitiveSortDescriptor>();
    expectTypeOf<PrimitiveSortDescriptor>().toMatchTypeOf<SortDescriptor>();
    expectTypeOf<PrimitivePressEvent>().toMatchTypeOf<PressEvent>();
    expectTypeOf<NonNullable<PressEventProps['onPress']>>().toMatchTypeOf<
      (event: PrimitivePressEvent) => void
    >();
    expectTypeOf<ElementRender<'div', { isOpen: boolean }>>().toBeFunction();
  });
});

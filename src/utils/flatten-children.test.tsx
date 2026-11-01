import { Fragment, isValidElement } from 'react';
import { describe, expect, it } from 'vitest';
import { flattenChildren } from './flatten-children.js';

const keysOf = (nodes: readonly unknown[]) =>
  nodes.map((node) => (isValidElement(node) ? node.key : node));

describe('flattenChildren', () => {
  it('UIC-COMMENT-THREAD-1.5 lists the children of fragments in place, keyed apart', () => {
    const nodes = flattenChildren(
      <>
        <b key="a" />
        <Fragment key="group">
          <b key="a" />
          {[<i key="x" />, <i key="y" />]}
        </Fragment>
        {'text'}
        <></>
      </>,
    );
    expect(nodes).toHaveLength(5);
    expect(new Set(keysOf(nodes)).size).toBe(5);
    expect(nodes[4]).toBe('text');
  });

  it('UIC-COMMENT-THREAD-1.5 keeps direct children as Children.toArray keys them', () => {
    const nodes = flattenChildren([<b key="a" />, <b key="b" />]);
    expect(keysOf(nodes)).toEqual(['.$a', '.$b']);
    expect(flattenChildren(<></>)).toEqual([]);
    expect(flattenChildren(null)).toEqual([]);
  });
});

'use client';

import { useMemo } from 'react';
import type { Key } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/tabs.js';
import { Tree } from '../tree/tree.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import type { PdfOutlineNode, PdfTextContent, PdfViewport } from './pdf-engine.js';
import { PdfViewerThumbnails } from './pdf-viewer-thumbnails.js';
import type { LoadedPdf } from './use-pdf-document.js';

interface PdfViewerSidebarProps<
  V extends PdfViewport = PdfViewport,
  C extends PdfTextContent = PdfTextContent,
> {
  /** The open document as the reader turned it. */
  view: LoadedPdf<V, C>;
  currentPage: number;
  onPageChange(pageIndex: number): void;
  /** Sends the reader to a destination of the document. */
  followDestination(destination: unknown): void;
}

/** An outline entry as a tree row: its id is its path of positions, unique in the tree. */
interface OutlineItem {
  id: string;
  node: PdfOutlineNode;
  children: OutlineItem[];
}

interface OutlineTree {
  items: OutlineItem[];
  byId: Map<Key, OutlineItem>;
  /** Entries the document opens expanded. */
  expanded: Key[];
}

function buildOutlineTree(nodes: readonly PdfOutlineNode[]): OutlineTree {
  const tree: OutlineTree = { items: [], byId: new Map(), expanded: [] };
  const toItems = (entries: readonly PdfOutlineNode[], path: string): OutlineItem[] =>
    entries.map((node, index) => {
      const id = `${path}${index}`;
      const item = { id, node, children: toItems(node.items, `${id}.`) };
      tree.byId.set(id, item);
      if ((node.count ?? 0) > 0 && item.children.length > 0) tree.expanded.push(id);
      return item;
    });
  tree.items = toItems(nodes, '');
  return tree;
}

/** The document's outline: choosing an entry goes to its destination or opens its web address. */
function PdfViewerOutline({
  outline,
  followDestination,
}: {
  outline: readonly PdfOutlineNode[];
  followDestination(destination: unknown): void;
}) {
  const strings = useUiStrings();
  const tree = useMemo(() => buildOutlineTree(outline), [outline]);
  return (
    <Tree
      aria-label={strings.outline}
      className={hooks.slotClass('outline')}
      items={tree.items}
      getTextValue={(item) => item.node.title}
      defaultExpandedKeys={tree.expanded}
      onAction={(key) => {
        const node = tree.byId.get(key)?.node;
        if (node?.url) window.open(node.url, '_blank', 'noopener,noreferrer');
        else if (node?.dest) followDestination(node.dest);
      }}
    />
  );
}

/**
 * The panel beside the pages: the pages as thumbnails, and the document's outline when it has one,
 * which it then opens on.
 */
export function PdfViewerSidebar<V extends PdfViewport, C extends PdfTextContent>({
  view,
  currentPage,
  onPageChange,
  followDestination,
}: PdfViewerSidebarProps<V, C>) {
  const strings = useUiStrings();
  const hasOutline = view.outline.length > 0;
  return (
    <div {...hooks.slot('sidebar')}>
      <Tabs
        size="sm"
        defaultSelectedKey={hasOutline ? 'outline' : 'pages'}
        disabledKeys={hasOutline ? [] : ['outline']}
      >
        <TabList aria-label={strings.sidebar}>
          <Tab id="pages">{strings.pages}</Tab>
          <Tab id="outline">{strings.outline}</Tab>
        </TabList>
        <TabPanel id="pages">
          <PdfViewerThumbnails view={view} currentPage={currentPage} onPageChange={onPageChange} />
        </TabPanel>
        <TabPanel id="outline">
          <PdfViewerOutline outline={view.outline} followDestination={followDestination} />
        </TabPanel>
      </Tabs>
    </div>
  );
}

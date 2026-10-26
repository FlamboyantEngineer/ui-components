import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/tabs.js';
import { Tree } from '../tree/tree.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { PdfViewerThumbnails } from './pdf-viewer-thumbnails.js';
function buildOutlineTree(nodes) {
    const tree = { items: [], byId: new Map(), expanded: [] };
    const toItems = (entries, path) => entries.map((node, index) => {
        const id = `${path}${index}`;
        const item = { id, node, children: toItems(node.items, `${id}.`) };
        tree.byId.set(id, item);
        if ((node.count ?? 0) > 0 && item.children.length > 0)
            tree.expanded.push(id);
        return item;
    });
    tree.items = toItems(nodes, '');
    return tree;
}
/** The document's outline: choosing an entry goes to its destination or opens its web address. */
function PdfViewerOutline({ outline, followDestination, }) {
    const strings = useUiStrings();
    const tree = useMemo(() => buildOutlineTree(outline), [outline]);
    return (_jsx(Tree, { "aria-label": strings.outline, className: hooks.slotClass('outline'), items: tree.items, getTextValue: (item) => item.node.title, defaultExpandedKeys: tree.expanded, onAction: (key) => {
            const node = tree.byId.get(key)?.node;
            if (node?.url)
                window.open(node.url, '_blank', 'noopener,noreferrer');
            else if (node?.dest)
                followDestination(node.dest);
        } }));
}
/**
 * The panel beside the pages: the pages as thumbnails, and the document's outline when it has one,
 * which it then opens on.
 */
export function PdfViewerSidebar({ view, currentPage, onPageChange, followDestination, }) {
    const strings = useUiStrings();
    const hasOutline = view.outline.length > 0;
    return (_jsx("div", { ...hooks.slot('sidebar'), children: _jsxs(Tabs, { size: "sm", defaultSelectedKey: hasOutline ? 'outline' : 'pages', disabledKeys: hasOutline ? [] : ['outline'], children: [_jsxs(TabList, { "aria-label": strings.sidebar, children: [_jsx(Tab, { id: "pages", children: strings.pages }), _jsx(Tab, { id: "outline", children: strings.outline })] }), _jsx(TabPanel, { id: "pages", children: _jsx(PdfViewerThumbnails, { view: view, currentPage: currentPage, onPageChange: onPageChange }) }), _jsx(TabPanel, { id: "outline", children: _jsx(PdfViewerOutline, { outline: view.outline, followDestination: followDestination }) })] }) }));
}
//# sourceMappingURL=pdf-viewer-sidebar.js.map
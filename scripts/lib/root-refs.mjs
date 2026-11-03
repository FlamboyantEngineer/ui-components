// Finds the exported components whose props declare no `ref` (UIC-COMPOSITION-2.5): every component
// that renders a root element of its own takes one, typed with that element. The components that
// render no element of their own are listed in ROOTLESS with the reason, and the list is checked too.

import ts from 'typescript';

/**
 * The exported components that render no element of their own, so they take no `ref`, and why.
 * Keep each reason short; a component that gains a root element leaves the list.
 */
export const ROOTLESS = new Map([
  ['AppFrameBandContent', 'projects its children into a band region'],
  ['AppFrameContent', 'projects its children into a frame region'],
  ['CardAction', "makes its children the card's action"],
  ['ChatMessageActionsMenu', 'attaches a context menu to its target element'],
  ['DrawerTrigger', 'pairs its trigger child with a drawer'],
  ['Glyph', "draws an icon component, whose element is that component's own"],
  ['HeadingLevelContext', 'a context provider'],
  ['HoverCardTrigger', 'pairs its trigger child with a hover card'],
  ['MenuTrigger', 'pairs its trigger child with a menu'],
  ['MenubarMenu', 'pairs a menubar trigger with its menu'],
  ['ModalHost', "renders the controller's modals"],
  ['ModalTrigger', 'pairs its trigger child with a modal'],
  ['PopoverTrigger', 'pairs its trigger child with a popover'],
  ['Portal', 'moves its children into a portal container'],
  ['PortalContainerProvider', 'a context provider'],
  ['ProjectionContent', 'projects its children into an outlet'],
  ['ProjectionOutlet', 'renders the projected content'],
  ['ProjectionProvider', 'a context provider'],
  ['ShortcutAppearanceContext', 'a context provider'],
  ['SubmenuTrigger', 'pairs its item child with a submenu'],
  ['TextMatch', 'renders text runs'],
  ['TextMatchProvider', 'a context provider'],
  ['Tooltip', 'pairs its trigger child with a tooltip'],
  ['UiProvider', 'a context provider'],
  ['UnsavedChangesGuard', 'renders a confirmation only while it blocks'],
]);

/**
 * @param {ts.TypeChecker} checker
 * @param {ts.Symbol} symbol
 */
function resolveAlias(checker, symbol) {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

/**
 * Whether a call signature renders React content: it returns an element or a node.
 * @param {ts.TypeChecker} checker
 * @param {ts.Signature} signature
 */
function rendersContent(checker, signature) {
  return /\b(Element|ReactElement|ReactNode)\b/.test(
    checker.typeToString(signature.getReturnType()),
  );
}

/**
 * Lists the problems with root refs among the components the entry points export: a component
 * outside ROOTLESS whose props have no `ref`, and a ROOTLESS entry that is no longer exported or
 * now takes a `ref`.
 * @param {string[]} entries the declaration files a host imports
 * @param {{ rootless?: Map<string, string>, checkRootless?: boolean }} [options] `checkRootless`
 *   false skips the report of ROOTLESS entries not exported, for a run over some components only.
 * @returns {{ problems: string[], checked: number }}
 */
export function findMissingRootRefs(entries, { rootless = ROOTLESS, checkRootless = true } = {}) {
  const program = ts.createProgram(entries, { noEmit: true, skipLibCheck: true });
  const checker = program.getTypeChecker();
  /** @type {Map<string, boolean>} whether each exported component's props declare `ref` */
  const components = new Map();
  for (const entry of entries) {
    const source = program.getSourceFile(entry);
    const module = source && checker.getSymbolAtLocation(source);
    if (!module) continue;
    for (const exported of checker.getExportsOfModule(module)) {
      if (!/^[A-Z]/.test(exported.name) || components.has(exported.name)) continue;
      const symbol = resolveAlias(checker, exported);
      if (!(symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))) continue;
      const [signature] = checker.getTypeOfSymbol(symbol).getCallSignatures();
      if (!signature || !rendersContent(checker, signature)) continue;
      const [props] = signature.getParameters();
      const propsType = props && checker.getTypeOfSymbol(props);
      // A glyph is an icon's drawing, which an `Icon` renders and takes the ref for.
      if (propsType && checker.typeToString(propsType) === 'GlyphComponentProps') continue;
      const hasRef = propsType ? checker.getPropertyOfType(propsType, 'ref') !== undefined : false;
      components.set(exported.name, hasRef);
    }
  }
  const problems = [];
  for (const [name, hasRef] of [...components].sort(([a], [b]) => a.localeCompare(b))) {
    if (rootless.has(name)) {
      if (hasRef) problems.push(`${name} takes a ref but is listed as rootless`);
    } else if (!hasRef) {
      problems.push(`${name} declares no ref for its root element`);
    }
  }
  for (const name of checkRootless ? rootless.keys() : []) {
    if (!components.has(name)) problems.push(`${name} is listed as rootless but not exported`);
  }
  return { problems, checked: components.size };
}

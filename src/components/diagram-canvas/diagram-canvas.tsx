import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps, SelectionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeProps, mergeRefs } from '../../utils/merge-props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { DiagramEdges } from './diagram-edges.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import { DiagramMinimap } from './diagram-minimap.js';
import type { DiagramEdge, DiagramNode, DiagramViewport } from './diagram-model.js';
import { DiagramNodeView, type DiagramNodeRenderState } from './diagram-node.js';
import { formatDiagramLink } from './diagram-links.js';
import { DiagramOutline } from './diagram-outline.js';
import {
  DiagramPaletteContext,
  useCanvasPalette,
  usePaletteDrop,
  type DiagramPalette,
} from './diagram-palette.js';
import { DiagramToolbar, type DiagramView } from './diagram-toolbar.js';
import type { DiagramEdgeRouting } from './edge-route.js';
import { useBackgroundPointer } from './use-background-pointer.js';
import type { DiagramConnection } from './use-diagram-connect.js';
import { useDiagramController, type DiagramController } from './use-diagram-controller.js';

export type { DiagramEdge, DiagramNode, DiagramPort, DiagramViewport } from './diagram-model.js';
export type { DiagramNodeRenderState } from './diagram-node.js';
export { DiagramPaletteItem, type DiagramPaletteItemProps } from './diagram-palette.js';
export type { DiagramView } from './diagram-toolbar.js';
export type { DiagramConnection } from './use-diagram-connect.js';
export {
  routeDiagramEdge,
  type DiagramEdgeEnd,
  type DiagramEdgeRouting,
  type DiagramPoint,
  type DiagramPortSide,
  type DiagramRect,
  type DiagramRoute,
  type DiagramRouteOptions,
} from './edge-route.js';

/** A request for a new node from the palette: its type and where, in diagram pixels. */
export interface DiagramNodeAddRequest {
  type: string;
  x: number;
  y: number;
}

export interface DiagramCanvasProps<T = unknown>
  extends
    BaseProps,
    AriaLabellingProps,
    Pick<
      SelectionProps,
      'selectionMode' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'
    > {
  /** The nodes, in reading and Tab order. */
  nodes: readonly DiagramNode<T>[];
  /** The edges between them. */
  edges: readonly DiagramEdge[];
  /** Draws a node's content. Defaults to its label. */
  renderNode?: ((node: DiagramNode<T>, state: DiagramNodeRenderState) => ReactNode) | undefined;
  /** How edges run between nodes. Defaults to `bezier`. */
  routing?: DiagramEdgeRouting | undefined;
  /** Lets the reader move, connect, add and remove nodes. */
  isEditing?: boolean | undefined;
  /** Moved nodes snap to multiples of it, in diagram pixels; `0` turns snapping off. Defaults to 10. */
  gridSize?: number | undefined;
  /** The pan and zoom, controlled. Without it or `defaultViewport`, the view fits every node at first. */
  viewport?: DiagramViewport | undefined;
  /** The pan and zoom at first, uncontrolled. */
  defaultViewport?: DiagramViewport | undefined;
  /** Called with the pan and zoom after each change. */
  onViewportChange?: ((viewport: DiagramViewport) => void) | undefined;
  /** The view shown, controlled. */
  view?: DiagramView | undefined;
  /** The view shown at first, uncontrolled. Defaults to `canvas`. */
  defaultView?: DiagramView | undefined;
  /** Called when the reader switches between the canvas and the outline. */
  onViewChange?: ((view: DiagramView) => void) | undefined;
  /** Called with every node, moved or without the removed ones, after a move or removal. */
  onNodesChange?: ((nodes: DiagramNode<T>[]) => void) | undefined;
  /** Called with the edges left after a removal. */
  onEdgesChange?: ((edges: DiagramEdge[]) => void) | undefined;
  /** Called when the reader connects a port to a node or a port. */
  onConnect?: ((connection: DiagramConnection) => void) | undefined;
  /** Called when the reader adds a node from the palette. */
  onNodeAdd?: ((request: DiagramNodeAddRequest) => void) | undefined;
  /** The palette: `DiagramPaletteItem`s, shown beside the canvas. */
  palette?: ReactNode;
  /** Shows the overview of the whole diagram. Defaults to true. */
  showMinimap?: boolean | undefined;
}

function isTextEntry(target: EventTarget): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}

/** Each node's description: the labels of the nodes it leads to and comes from. */
function describeLinks(controller: DiagramController, strings: ReturnType<typeof useUiStrings>) {
  return (node: DiagramNode) => {
    const { outgoing, incoming } = controller.links.get(node.id)!;
    return [
      outgoing.length > 0
        ? strings.diagramOutgoing(outgoing.map(formatDiagramLink).join(', '))
        : '',
      incoming.length > 0
        ? strings.diagramIncoming(incoming.map(formatDiagramLink).join(', '))
        : '',
    ]
      .filter(Boolean)
      .join(' ');
  };
}

/** The pannable, zoomable surface: edges, nodes, the marquee and the minimap. */
function DiagramViewportArea<T>({
  controller,
  palette,
  routing,
  renderNode,
  selectionMode,
  showMinimap,
}: Required<Pick<DiagramCanvasProps<T>, 'routing' | 'selectionMode' | 'showMinimap'>> &
  Pick<DiagramCanvasProps<T>, 'renderNode'> & {
    controller: DiagramController;
    palette: DiagramPalette;
  }) {
  const strings = useUiStrings();
  const ref = useRef<HTMLDivElement>(null);
  const { viewport, stepZoom } = controller.view;
  const { marquee, pointerProps } = useBackgroundPointer(controller, selectionMode);
  const { dropProps, isDropTarget } = usePaletteDrop({ ref, palette });
  const describe = describeLinks(controller, strings);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isTextEntry(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === '+' || event.key === '=') stepZoom(1);
    else if (event.key === '-') stepZoom(-1);
    else return;
    event.preventDefault();
  };
  return (
    <div
      {...hooks.slot('viewport', { dropTarget: isDropTarget })}
      ref={mergeRefs(ref, controller.setViewportElement)}
      style={{ position: 'relative', touchAction: 'none' }}
      {...mergeProps(dropProps, pointerProps, {
        onKeyDown,
        // Focusing a node scrolls its clipped container; the view pans with its transform instead.
        onScroll: (event: { currentTarget: HTMLElement }) => event.currentTarget.scrollTo(0, 0),
      })}
    >
      <div
        {...hooks.slot('content')}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom / 100})`,
        }}
      >
        <DiagramEdges controller={controller} routing={routing} />
        {controller.nodes.map((node) => (
          <DiagramNodeView
            key={toKeyIdentity(node.id)}
            node={node as DiagramNode<T>}
            controller={controller}
            description={describe(node)}
            renderNode={renderNode}
          />
        ))}
      </div>
      {controller.nodes.length === 0 ? (
        <p {...hooks.slot('empty')}>{strings.diagramEmpty}</p>
      ) : null}
      {marquee ? (
        <div
          {...hooks.slot('marquee')}
          style={{
            position: 'absolute',
            left: marquee.x,
            top: marquee.y,
            width: marquee.width,
            height: marquee.height,
          }}
        />
      ) : null}
      {showMinimap ? <DiagramMinimap controller={controller} /> : null}
    </div>
  );
}

/**
 * A pannable, zoomable diagram of nodes the caller renders, joined by edges drawn as SVG paths
 * between their ports. Nodes are named, focusable groups: the reader selects them by click,
 * Shift-click, marquee or Space, moves between connected nodes with the arrow keys and, in edit
 * mode, moves nodes by drag or arrow keys on a grid, connects ports by drag or by keyboard, adds
 * nodes from a palette and removes them. The data is the caller's: every change arrives through a
 * callback as plain data. An outline view lists the nodes and their links.
 */
export function DiagramCanvas<T = unknown>({
  nodes,
  edges,
  renderNode,
  routing = 'bezier',
  isEditing = false,
  gridSize = 10,
  selectionMode = 'multiple',
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  viewport: viewportProp,
  defaultViewport,
  onViewportChange,
  view: viewProp,
  defaultView = 'canvas',
  onViewChange,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeAdd,
  palette: paletteContent,
  showMinimap = true,
  'aria-label': ariaLabel,
  className,
  ...rest
}: DiagramCanvasProps<T>) {
  const strings = useUiStrings();
  const [view, setView] = useControllableState(viewProp, defaultView, onViewChange);
  const controller = useDiagramController({
    ...{ nodes, edges, isEditing, gridSize, selectionMode, selectedKeys, defaultSelectedKeys },
    ...{
      onSelectionChange,
      viewport: viewportProp,
      defaultViewport,
      onViewportChange,
      onEdgesChange,
      onConnect,
    },
    onNodesChange: onNodesChange as ((nodes: DiagramNode[]) => void) | undefined,
  });
  const palette = useCanvasPalette({ controller, gridSize, onNodeAdd });
  const area = { routing, renderNode, selectionMode, showMinimap };
  return (
    <div
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: {
          view,
          routing,
          editing: isEditing,
          connecting: controller.connect.connecting !== null,
        },
      })}
      role="group"
      aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.diagram)}
    >
      <DiagramPaletteContext.Provider value={palette}>
        <DiagramToolbar controller={controller} view={view} onViewChange={setView} />
        {paletteContent ? (
          <div {...hooks.slot('palette')} role="group" aria-label={strings.diagramPalette}>
            {paletteContent}
          </div>
        ) : null}
        {view === 'canvas' ? (
          <DiagramViewportArea {...area} controller={controller} palette={palette} />
        ) : (
          <DiagramOutline controller={controller} />
        )}
      </DiagramPaletteContext.Provider>
      <VisuallyHidden>
        <div {...hooks.slot('status')} role="status">
          {controller.message}
        </div>
      </VisuallyHidden>
    </div>
  );
}

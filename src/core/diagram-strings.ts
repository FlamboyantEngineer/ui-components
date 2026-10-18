/** Strings of diagram canvases and the views drawn on them. */
export interface DiagramStrings {
  /** Default accessible name of a diagram canvas. */
  diagram: string;
  /** Names the switch between the canvas and the outline. */
  diagramView: string;
  /** The canvas option of that switch. */
  diagramCanvasView: string;
  /** The outline option of that switch. */
  diagramOutlineView: string;
  /** Describes what a diagram node is, for assistive technology. */
  diagramNode: string;
  /** Names the button that fits the whole diagram in view. */
  diagramFit: string;
  /** Default accessible name of a diagram palette. */
  diagramPalette: string;
  /** What a diagram without nodes shows. */
  diagramEmpty: string;
  /** Read in a node's description while it is selected. */
  diagramSelected: string;
  /** Names a node's port, from the node's label and the port's. */
  diagramPortLabel: (node: string, port: string) => string;
  /** Labels the list of the nodes a node leads to, in the outline. */
  diagramLeadsTo: string;
  /** Labels the list of the nodes that lead to a node, in the outline. */
  diagramComesFrom: string;
  /** Lists the labels of the nodes a node leads to. */
  diagramOutgoing: (labels: string) => string;
  /** Lists the labels of the nodes that lead to a node. */
  diagramIncoming: (labels: string) => string;
  /** Announces moved nodes, from the first node's label and the count. */
  diagramMoved: (label: string, count: number) => string;
  /** Announces a connection started from a port, from its name. */
  diagramConnecting: (port: string) => string;
  /** Announces a new connection, from the labels of its ends. */
  diagramConnected: (source: string, target: string) => string;
  /** Announces a connection given up. */
  diagramConnectCancelled: string;
  /** Announces removed nodes and connections, from their count. */
  diagramRemoved: (count: number) => string;
  /** Names the button that removes a connection, from the labels of its ends. */
  diagramRemoveConnection: (source: string, target: string) => string;
  /** Default accessible name of a state machine view. */
  stateMachine: string;
  /** Read in the description of the current state. */
  stateMachineCurrent: string;
  /** Read in the description of the initial state. */
  stateMachineInitial: string;
  /** Read in the description of a final state. */
  stateMachineFinal: string;
  /** Names a state's port that starts a new transition. */
  stateMachineAddTransition: string;
}

export const diagramStrings: DiagramStrings = {
  diagram: 'Diagram',
  diagramView: 'View',
  diagramCanvasView: 'Diagram',
  diagramOutlineView: 'Outline',
  diagramNode: 'node',
  diagramFit: 'Fit to view',
  diagramPalette: 'Palette',
  diagramEmpty: 'No nodes',
  diagramSelected: 'Selected.',
  diagramLeadsTo: 'Leads to',
  diagramComesFrom: 'Comes from',
  diagramPortLabel: (node, port) => `${node}, ${port}`,
  diagramOutgoing: (labels) => `Leads to ${labels}.`,
  diagramIncoming: (labels) => `Comes from ${labels}.`,
  diagramMoved: (label, count) => (count === 1 ? `${label} moved` : `${count} nodes moved`),
  diagramConnecting: (port) =>
    `Connecting from ${port}. Choose a node or port and press Enter, or press Escape to cancel.`,
  diagramConnected: (source, target) => `Connected ${source} to ${target}`,
  diagramConnectCancelled: 'Connection cancelled',
  diagramRemoved: (count) => (count === 1 ? '1 item removed' : `${count} items removed`),
  diagramRemoveConnection: (source, target) => `Remove connection from ${source} to ${target}`,
  stateMachine: 'State machine',
  stateMachineCurrent: 'Current state.',
  stateMachineInitial: 'Initial state.',
  stateMachineFinal: 'Final state.',
  stateMachineAddTransition: 'new transition',
};

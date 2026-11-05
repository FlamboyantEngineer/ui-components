import { defineStrings } from '../message-format.js';
/** Strings of diagram canvases and the views drawn on them. */
interface DiagramStrings {
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
  /** Names the note a state machine sequence shows while it has no states. */
  stateMachineEmpty: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const diagramStrings = defineStrings<DiagramStrings>({
  diagramPortLabel: (node, port) => ({ node, port }),
  diagramOutgoing: (labels) => ({ labels }),
  diagramIncoming: (labels) => ({ labels }),
  diagramMoved: (label, count) => ({ label, count }),
  diagramConnecting: (port) => ({ port }),
  diagramConnected: (source, target) => ({ source, target }),
  diagramRemoved: (count) => ({ count }),
  diagramRemoveConnection: (source, target) => ({ source, target }),
});

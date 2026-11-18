import { defineStrings } from '../message-format.js';
/** Strings of signal traces: the plot, its cursors and their readings. */
interface SignalStrings {
  /** Names the drawing of signal traces, which pans and zooms from the keyboard. */
  signalPlot: string;
  /** Tells how to pan, zoom and reset signal traces from the keyboard. */
  signalPlotHint: string;
  /** The time range signal traces show, from its formatted ends. */
  signalTimeRange: (from: string, to: string) => string;
  /** Names one of the linked time cursors, counting from 1. */
  signalCursor: (cursor: number) => string;
  /** The time between the second cursor and the first, formatted. */
  signalTimeDifference: (value: string) => string;
  /** Names the table of channel values at the cursors. */
  signalReadings: string;
  /** Heads the readings table's column of channels. */
  signalChannel: string;
  /** Heads the readings table's row of cursor times. */
  signalTime: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const signalStrings = defineStrings<SignalStrings>({
  signalTimeRange: (from, to) => ({ from, to }),
  signalCursor: (cursor) => ({ cursor }),
  signalTimeDifference: (value) => ({ value }),
});

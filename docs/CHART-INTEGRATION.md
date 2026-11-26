# Numeric chart integration

Import both views and their types from `@flamboyantengineer/ui-components/chart`. Load the package reference stylesheet or style the hooks in the chart spec. The chart family supplies the figure, axes, keyboard navigation, measurements, and table view.

Plot and readout menus open in the document body by default. When customizing the reference theme, set the menu surface (`--ref-raised`), text, hover, and focus colors on the document root so nested menus inherit the chart palette. For a chart themed inside one panel, wrap it in a `PortalHost` inside that panel. [Portal host reference](../specs/PORTAL.md#uic-portal-13---portal-host)

The Chart lab opens with the measurement showcase. Switch between Signal capture, Frequency response and Elapsed events to try the examples, read their setup notes and use the pointer and keyboard guide. [Chart lab](../labs/chart.html#measurement-showcase)

## Replace a multi-channel plot

Keep the capture in its original numeric units. Map each trace to a stable channel id and an array of samples. A null amplitude marks a gap. Reference points can use a different x grid. Lower and upper limits belong to the measurement's x coordinate. Pass the same array identities across renders while the capture is unchanged.

```tsx
<LinkedLineChart
  label="Capture"
  xLabel="Time (ns)"
  xUnits={{ s: 1, ms: 1e-3, µs: 1e-6, ns: 1e-9 }}
  formatX={(seconds) => (seconds * 1e9).toFixed(2) + ' ns'}
  channels={[
    {
      id: 'v',
      label: 'Voltage',
      unit: 'V',
      samples: voltage,
      reference,
      threshold: 1,
      legend: {
        labels: {
          measured: 'Measured',
          reference: 'Reference',
          envelope: 'Tolerance',
          threshold: 'Threshold',
        },
      },
    },
    { id: 'i', label: 'Current', unit: 'mA', samples: current, yRange: [0, 60] },
  ]}
  xReferences={[{ id: 'trigger', label: 'Trigger', value: triggerTime }]}
  visibleRange={range}
  onVisibleRangeChange={setRange}
  cursors={cursors}
  onCursorsChange={(next, reading) => {
    setCursors(next);
    reportMeasurement(reading);
  }}
  markers={markers}
  onMarkersChange={setMarkers}
/>
```

Give each layer a legend label to make it toggleable. Hover or focus a visible entry to bring its line forward. Restoring a hidden line also brings it forward. Use `legendPlacement` to choose a corner or place the legend above the plot. A channel's `legend.hiddenKeys` and `onHiddenKeysChange` let the host synchronize its visibility with other controls.

Click a named channel point or its label to reveal and highlight its readout row. A keyboard user can focus the point and press Enter or Space. Stable point IDs within each channel keep coincident peaks distinguishable. Handling a cursor highlights its shared row across the linked channels. Column widths stay stable throughout the drag. Every channel repeats the shared x-axis ticks and title. Select a readout row to emphasize its plotted cursor, point, reference or measurement. For example, a rise-time result can provide `highlights: [{ type: 'interval', channelId: 'v', from: lowCrossing, to: highCrossing }]`. For a peak, supply `{ type: 'sample', channelId: 'v', x, y }` in the same array. These coordinates come from the host and may be recalculated as cursors move.

Supply `defaultVisibleRange`, `defaultCursors` or `defaultMarkers` for initial positions the chart then owns. For automatic placement by a host algorithm, update the corresponding controlled values in source units. Drag to pan, Shift+drag to select an x interval, or Ctrl+wheel to zoom about the pointer. Right-click the plot and choose **Reset view** to restore the full extent. Keyboard users can press Home on the focused plot or open the same menu with Shift+F10. A channel's menu offers manual, nearest-sample, extrema, threshold, band and peak-to-peak placement. Click a movable position in the readout to edit it. A bare number uses source units, and suffixes in `xUnits` convert to source units. For example, a cursor at 160 ns has a position of 0.00000016 when the capture uses seconds.

Use `xReferences` for a shared fixed coordinate such as a trigger. For a channel-specific measurement, supply `points: [{ id, label, x, y }]` on that channel. For example, the capture lab scans each original sample array for its highest valid amplitude and supplies that sample as a fixed point. Both types appear alongside A and B in the readout.

For a host-controlled set of movable cursors, pass `cursorList` and `onCursorListChange`. Each item has a unique stable `name` and numeric `x`. Supply an optional `label` for the displayed name. Operators can click a cursor name in the readout to rename it. Store the list from `onCursorListChange` to retain names between sessions. The A/B tuple remains available for hosts that only control those two positions. Insert a cursor from the plot menu, or delete it from its line or readout row.

For frequency data, set `xScale="log"`, supply frequencies in Hz and format labels as desired. A channel can independently set `yScale="log"`. A logarithmic axis needs positive coordinates. Supply linear y values for a linear dB axis when the host already expresses amplitude in decibels.

## Add a calculated readout

Pass `measurements` as an array for externally calculated results or as a pure function for results that follow interaction. Give each row a stable id and label. Put a scalar in `value`, or supply per-channel cells in `valuesByChannel`, keyed by the original string or number channel id. Format each result with its measurement unit.

```tsx
<LinkedLineChart
  label="Capture"
  channels={channels}
  measurements={({ cursors, xReferences }) => {
    const cursor = cursors.find((c) => c.name === 'B');
    const trigger = xReferences.find((r) => r.id === 'trigger');
    return [
      {
        id: 'delay',
        label: 'Delay from trigger',
        value: cursor && trigger ? formatTime(cursor.x - trigger.value) : '—',
      },
    ];
  }}
  xReferences={[{ id: 'trigger', label: 'Trigger', value: triggerTime }]}
/>
```

Use the context’s original channel samples for peaks, threshold crossings and rise time. `nearestDisplayedSample(channelId, x)` reproduces the plot cursor’s readout. The capture lab precomputes rise time once and recalculates peak and peak-to-peak from the original samples between A and B as either cursor moves.

## Measure a horizontal or vertical difference

Pass free coordinates as numbers. To follow an existing chart element, pass its stable identity. This example measures trigger-to-B delay across the capture and the voltage rise from a free baseline to a named peak.

```tsx
<LinkedLineChart
  label="Capture"
  channels={channels}
  xReferences={[{ id: 'trigger', label: 'Trigger', value: triggerTime }]}
  defaultDifferentialCursors={[
    {
      id: 'delay',
      label: 'Delay',
      axis: 'x',
      from: { type: 'reference', id: 'trigger' },
      to: { type: 'cursor', name: 'B' },
    },
    {
      id: 'rise',
      label: 'Voltage rise',
      axis: 'y',
      channelId: 'v',
      from: 0,
      to: { type: 'point', channelId: 'v', id: 'peak' },
    },
  ]}
/>
```

The shaded interval follows both diamonds. The host can style its fill and opacity through `.ui-linked-line-chart__delta-band`. The operator can drag a diamond to detach it, or use its context menu to bind it again. Updating the peak’s coordinates or moving B updates the readout immediately. Pass `differentialCursors` and `onDifferentialCursorsChange` to store the definitions in the host. A `measurements` callback can read `context.differentials` for the resolved values, including changes caused by source movement. A missing endpoint produces a null delta until its source returns.

## Replace an elapsed-time event view

Pass each occurrence separately, including coincident ones. The stable id distinguishes them in the drawing. Omitting the end makes a point. The built-in details and table retain numeric endpoints even if the formatter rounds to a common label.

```tsx
<EventChart
  label="Recorded events"
  xLabel="Elapsed time"
  formatX={(seconds) => (seconds * 1e6).toFixed(2) + ' µs'}
  events={[
    { id: 'start', label: 'Started', start: 0.000001 },
    { id: 'window', label: 'Window', start: 0.000001, end: 0.00000125 },
  ]}
/>
```

The elapsed-time and linked views have the same viewport contract. To synchronize separate figures, supply the same visible range and change handler with compatible coordinate units and capture extents. Each figure can also show its own full-data table.

[Chart API and styling hooks](../specs/CHART.md) · [Interactive chart lab](../labs/chart.html)

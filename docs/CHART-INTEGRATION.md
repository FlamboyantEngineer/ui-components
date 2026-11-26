# Numeric chart integration

Import both views and their types from `@flamboyantengineer/ui-components/chart`. Load the package reference stylesheet or style the hooks in the chart spec. The chart family supplies the figure, axes, keyboard navigation, measurements, and table view.

## Replace a multi-channel plot

Keep the capture in its original numeric units. Map each trace to a stable channel id and an array of samples. A null amplitude marks a gap. Reference points can use a different x grid. Lower and upper limits belong to the measurement's x coordinate. Pass the same array identities across renders while the capture is unchanged.

```tsx
<LinkedLineChart
  label="Capture"
  xLabel="Time (ns)"
  formatX={(seconds) => (seconds * 1e9).toFixed(2) + ' ns'}
  channels={[
    { id: 'v', label: 'Voltage', unit: 'V', samples: voltage, reference, threshold: 1 },
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

Supply `defaultVisibleRange`, `defaultCursors` or `defaultMarkers` for initial positions the chart then owns. For automatic placement by a host algorithm, update the corresponding controlled values in source units. Drag to pan, Shift+drag to select an x interval, or Ctrl+wheel to zoom about the pointer. Right-click the plot and choose **Reset view** to restore the full extent. Keyboard users can press Home on the focused plot or open the same menu with Shift+F10. A channel's menu offers manual, nearest-sample, extrema, threshold, band and peak-to-peak placement. Position fields take source units. For example, a cursor at 160 ns has a position of 0.00000016 when the capture uses seconds.

Use `xReferences` for a shared fixed coordinate such as a trigger. For a channel-specific measurement, supply `points: [{ id, label, x, y }]` on that channel. For example, the capture lab scans each original sample array for its highest valid amplitude and supplies that sample as a fixed point. Both types appear alongside A and B in the readout.

For frequency data, set `xScale="log"`, supply frequencies in Hz and format labels as desired. A channel can independently set `yScale="log"`. A logarithmic axis needs positive coordinates. Supply linear y values for a linear dB axis when the host already expresses amplitude in decibels.

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

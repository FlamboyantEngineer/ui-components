'use client';

import { useUiStrings } from '../../core/provider.js';
import type { LinearScale, ScaleTick } from '../../utils/linear-scale.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { ChartAxis } from '../chart/chart-axis.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { SignalChannel } from './signal-channel.js';
import { SignalCursor } from './signal-cursor.js';
import type { SignalLayout } from './signal-layout.js';
import type { SignalChannel as SignalChannelData } from './signal-model.js';
import { signalTracesHooks as hooks } from './signal-traces-hooks.js';
import { usePlotGestures } from './use-plot-gestures.js';
import type { SignalView } from './use-signal-view.js';

interface SignalPlotProps {
  view: SignalView;
  /** Each channel with its value scale, in drawing order. */
  channels: ReadonlyArray<{ channel: SignalChannelData; scale: LinearScale }>;
  layout: SignalLayout;
  /** The time scale over the visible range, across the plotted area. */
  timeScale: LinearScale;
  timeTicks: ReadonlyArray<ScaleTick<number>>;
  formatTime: (time: number) => string;
  idPrefix: string;
  /** The plot element, which the caller measures, and the callback ref that sets it. */
  plot: HTMLDivElement | null;
  setPlot: (element: HTMLDivElement | null) => void;
}

/** The cursor lines across every channel, for the cursors inside the visible range. */
function CursorLines({
  view,
  layout,
  timeScale,
}: Pick<SignalPlotProps, 'view' | 'layout' | 'timeScale'>) {
  const { cursors, range } = view;
  return cursors.map((time, index) =>
    time < range[0] || time > range[1] ? null : (
      <line
        key={index}
        {...hooks.slot('cursor-line', { cursor: String(index + 1) })}
        x1={timeScale.map(time)}
        x2={timeScale.map(time)}
        y1={layout.cursorSpan[0]}
        y2={layout.cursorSpan[1]}
      />
    ),
  );
}

/** Both cursors' handles, each kept at the plot's edge while its time lies outside the range. */
function CursorHandles(
  props: Pick<SignalPlotProps, 'view' | 'layout' | 'timeScale' | 'formatTime'> & {
    timeAtClientX: (clientX: number) => number;
  },
) {
  const { view, layout, timeScale, formatTime } = props;
  const strings = useUiStrings();
  const { cursors, domain, range, setCursors } = view;
  const toX = (time: number) => Math.min(Math.max(timeScale.map(time), layout.left), layout.right);
  const move = (index: number, time: number) =>
    setCursors(index === 0 ? [time, cursors[1]] : [cursors[0], time]);
  return cursors.map((time, index) => (
    <SignalCursor
      key={index}
      number={index === 0 ? 1 : 2}
      time={time}
      domain={domain}
      range={range}
      x={toX(time)}
      top={layout.cursorSpan[0]}
      height={layout.cursorSpan[1] - layout.cursorSpan[0]}
      label={strings.signalCursor(index + 1)}
      valueText={formatTime(time)}
      onChange={(next) => move(index, next)}
      timeAtClientX={props.timeAtClientX}
    />
  ));
}

/**
 * The focusable drawing: each channel's band, the shared time axis, the cursor lines and the
 * cursor handles, panned and zoomed by pointer, wheel and keyboard.
 */
export function SignalPlot(props: SignalPlotProps) {
  const { view, channels, layout, timeScale, timeTicks, formatTime, idPrefix, plot, setPlot } =
    props;
  const strings = useUiStrings();
  const timeAtClientX = (clientX: number) =>
    timeScale.invert(clientX - (plot?.getBoundingClientRect().left ?? 0));
  const gestures = usePlotGestures({
    plot,
    domain: view.domain,
    range: view.range,
    setRange: view.setRange,
    plotWidth: layout.right - layout.left,
    timeAtClientX,
    ownPressSelector: `.${hooks.slotClass('cursor')}`,
  });
  return (
    <div
      {...hooks.slot('plot')}
      ref={setPlot}
      role="group"
      tabIndex={0}
      aria-label={strings.signalPlot}
      aria-describedby={`${idPrefix}-range ${idPrefix}-hint`}
      style={{ position: 'relative', touchAction: 'none' }}
      {...gestures}
    >
      <VisuallyHidden id={`${idPrefix}-hint`}>{strings.signalPlotHint}</VisuallyHidden>
      <svg
        {...hooks.slot('drawing')}
        width={layout.width}
        height={layout.height}
        aria-hidden="true"
        focusable="false"
      >
        {channels.map(({ channel, scale }, index) => (
          <SignalChannel
            key={toKeyIdentity(channel.id)}
            channel={channel}
            index={index}
            valueScale={scale}
            plotX={[layout.left, layout.right]}
            range={view.range}
            mapTime={(time) => timeScale.map(time)}
            clipId={`${idPrefix}-clip-${String(index)}`}
            emptyText={strings.noData}
          />
        ))}
        <ChartAxis
          className={hooks.slotClass('time-axis')}
          position="bottom"
          ticks={timeTicks}
          offset={layout.axisY}
          range={[layout.left, layout.right]}
        />
        <CursorLines view={view} layout={layout} timeScale={timeScale} />
      </svg>
      <CursorHandles {...{ view, layout, timeScale, formatTime }} timeAtClientX={timeAtClientX} />
    </div>
  );
}

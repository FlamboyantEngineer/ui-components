'use client';

import { useId, useState } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { Button } from '../../primitives/index.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { layoutSequence, type SequenceLayout } from './sequence-layout.js';
import { hooks } from './state-machine-view-hooks.js';
import { useSequenceMeasurements } from './use-sequence-measurements.js';
import type { StateMachineState, StateMachineViewProps } from './state-machine-view.js';

interface SequencePartsProps {
  props: StateMachineViewProps;
  layout: SequenceLayout;
}

function describeState(
  state: StateMachineState,
  props: StateMachineViewProps,
  strings: UiStrings,
): string {
  return [
    state.id === props.currentKey ? strings.stateMachineCurrent : '',
    state.id === (props.initialState ?? props.states[0]?.id) ? strings.stateMachineInitial : '',
    state.isFinal ? strings.stateMachineFinal : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function StateMachineSequenceStates({ props, layout }: SequencePartsProps) {
  const strings = useUiStrings();
  const descriptionId = useId();
  const initial = props.initialState ?? props.states[0]?.id;
  return (
    <div
      {...hooks.slot('state-row')}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      {layout.states.map(({ state, x, width }, index) => {
        const flags = {
          current: state.id === props.currentKey,
          initial: state.id === initial,
          final: state.isFinal,
          selected: state.id === props.selectedKey,
          first: index === 0,
          last: index === layout.states.length - 1,
        };
        return (
          <div
            key={toKeyIdentity(state.id)}
            {...hooks.slot('state-position', { ...flags, key: toKeyIdentity(state.id) })}
            role="group"
            aria-label={state.label}
            style={{
              position: 'absolute',
              left: x,
              top: layout.rowY,
              width,
              height: layout.rowHeight,
              pointerEvents: 'auto',
            }}
          >
            <Button
              {...hooks.slot('state', flags)}
              aria-label={state.label}
              aria-describedby={`${descriptionId}-${index}`}
              aria-current={flags.current ? 'step' : undefined}
              aria-pressed={flags.selected}
              onPress={() => props.onSelectionChange?.(state.id)}
              style={{ width: '100%', height: '100%' }}
            >
              {flags.initial ? <span {...hooks.slot('initial-marker')} aria-hidden="true" /> : null}
              <span {...hooks.slot('state-label')} style={{ width: 'max-content' }}>
                {state.label}
              </span>
            </Button>
            <VisuallyHidden as="span" id={`${descriptionId}-${index}`}>
              {describeState(state, props, strings)}
            </VisuallyHidden>
          </div>
        );
      })}
    </div>
  );
}

function getRouteFlags(route: SequenceLayout['routes'][number], props: StateMachineViewProps) {
  return {
    direction: route.direction,
    lane: route.lane,
    key: toKeyIdentity(route.transition.id),
    active: route.transition.id === props.activeTransitionKey,
    outgoing: route.transition.from === props.selectedKey,
  };
}

function StateMachineSequenceRoutes({ props, layout }: SequencePartsProps) {
  const routes = [...layout.routes].sort((a, b) => {
    const priority = (route: typeof a) =>
      Number(route.transition.id === props.activeTransitionKey) * 2 +
      Number(route.transition.from === props.selectedKey);
    return priority(a) - priority(b);
  });
  return (
    <svg
      {...hooks.slot('routes')}
      aria-hidden="true"
      focusable="false"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    >
      {routes.map((route) => (
        <g
          key={toKeyIdentity(route.transition.id)}
          {...hooks.slot('route', getRouteFlags(route, props))}
        >
          <path {...hooks.slot('connector')} d={route.path} />
          <path {...hooks.slot('arrow')} d={route.arrow} />
        </g>
      ))}
    </svg>
  );
}

function StateMachineSequenceLabels({ props, layout }: SequencePartsProps) {
  // Label reading/focus order follows caller order, independently of lane packing and line stacking.
  const routes = new Map(layout.routes.map((route) => [route.transition.id, route]));
  return props.transitions.map((transition) => {
    const route = routes.get(transition.id);
    if (!route || !transition.label?.trim()) return null;
    return (
      <Tooltip
        key={toKeyIdentity(transition.id)}
        content={props.getTransitionTooltip?.(transition)}
        isDisabled={!props.getTransitionTooltip}
      >
        <Button
          {...hooks.slot('transition-label', getRouteFlags(route, props))}
          aria-label={transition.label}
          onPress={() => props.onTransitionAction?.(transition.id)}
          onContextMenu={(event) => props.onTransitionContextMenu?.(transition.id, event)}
          style={{
            position: 'absolute',
            left: route.labelX,
            top: route.labelY,
            width: 'max-content',
            zIndex: 2,
          }}
        >
          {props.renderTransitionLabel?.(transition) ?? transition.label}
        </Button>
      </Tooltip>
    );
  });
}

export function StateMachineSequence({
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...props
}: StateMachineViewProps) {
  const strings = useUiStrings();
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const measurements = useSequenceMeasurements(viewport);
  const layout = layoutSequence({
    states: props.states,
    transitions: props.transitions,
    density: props.density,
    geometry: props.sequenceGeometry,
    measurements,
  });
  return (
    <div
      {...hooks.root({
        className: props.className,
        props,
        data: {
          presentation: 'sequence',
          density: props.density ?? 'default',
          orientation: 'horizontal',
        },
      })}
      id={props.id}
      ref={ref}
      role="group"
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel ?? (ariaLabelledby ? undefined : strings.stateMachine)}
      style={{ minWidth: 0, maxWidth: '100%' }}
    >
      <div
        {...hooks.slot('viewport')}
        ref={setViewport}
        style={{ position: 'relative', maxWidth: '100%' }}
      >
        <div
          {...hooks.slot('content')}
          style={{
            position: 'relative',
            width: layout.width,
            height: layout.height,
            ...measuredProperty('sequence-lane-pitch', layout.lanePitch),
            ...measuredProperty('sequence-state-gap', layout.stateGap),
            ...measuredProperty('sequence-row-spacer', layout.rowSpacer),
          }}
        >
          <StateMachineSequenceRoutes props={props} layout={layout} />
          <StateMachineSequenceStates props={props} layout={layout} />
          <StateMachineSequenceLabels props={props} layout={layout} />
        </div>
      </div>
    </div>
  );
}

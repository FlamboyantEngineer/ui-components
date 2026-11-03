'use client';

import { useId, useMemo, useRef, useState, type MouseEvent } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../../primitives/index.js';
import { isElement } from '../../utils/is-element.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { layoutSequence, type SequenceLayout } from './sequence-layout.js';
import {
  getContextMenuRequestHandlers,
  useReleaseMissingSelection,
} from './sequence-interaction.js';
import { SequenceStates, useStateFocusRecovery } from './sequence-states.js';
import { hooks } from './state-machine-view-hooks.js';
import { useSequenceMeasurements } from './use-sequence-measurements.js';
import type { StateMachineViewProps } from './state-machine-view.js';

type SequenceProps = Omit<StateMachineViewProps, 'presentation'>;

interface SequencePartsProps {
  props: SequenceProps;
  layout: SequenceLayout;
}

/** A state button or transition label, whose own context menu requests never reach the background. */
const targetSelector = `.${hooks.slotClass('state')}, .${hooks.slotClass('transition-label')}`;

function getRouteFlags(route: SequenceLayout['routes'][number], props: SequenceProps) {
  return {
    direction: route.direction,
    lane: route.lane,
    key: toKeyIdentity(route.transition.id),
    selected: route.transition.id === props.selectedTransitionKey,
    outgoing: route.transition.from === props.selectedKey,
  };
}

function StateMachineSequenceRoutes({ props, layout }: SequencePartsProps) {
  const routes = [...layout.routes].sort((a, b) => {
    const priority = (route: typeof a) =>
      Number(route.transition.id === props.selectedTransitionKey) * 2 +
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
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
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
  const descriptionId = useId();
  // Label reading/focus order follows caller order, independently of lane packing and line stacking.
  const routes = new Map(layout.routes.map((route) => [route.transition.id, route]));
  return props.transitions.map((transition, index) => {
    const route = routes.get(transition.id);
    if (!route || !transition.label?.trim()) return null;
    const flags = getRouteFlags(route, props);
    const menu = getContextMenuRequestHandlers(
      props.onTransitionContextMenu &&
        ((event) => props.onTransitionContextMenu?.(transition.id, transition, event)),
    );
    const hint = props.getTransitionTooltip?.(transition);
    const isDescribed = Boolean(transition.description) || hint != null;
    const id = `${descriptionId}-${index}`;
    return (
      <span key={toKeyIdentity(transition.id)}>
        <Tooltip content={hint} isDisabled={hint == null}>
          <Button
            {...hooks.slot('transition-label', flags)}
            aria-label={transition.label}
            aria-describedby={isDescribed ? id : undefined}
            aria-pressed={flags.selected}
            onPress={(event) => {
              if (transition.id !== props.selectedTransitionKey) {
                props.onTransitionSelectionChange?.(transition.id);
              }
              props.onTransitionAction?.(transition.id, transition, event);
            }}
            onKeyDown={(event) => {
              menu.onKeyDown?.(event);
              event.continuePropagation();
            }}
            onContextMenu={menu.onContextMenu}
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
        {isDescribed ? (
          // The hint is read here too, always, so its own description never repeats it.
          <VisuallyHidden as="span" id={id}>
            {transition.description} {hint}
          </VisuallyHidden>
        ) : null}
      </span>
    );
  });
}

/** The focusable note shown while there are no states, the keyboard's way to the background menu. */
function StateMachineSequenceEmpty({ props }: { props: SequenceProps }) {
  const strings = useUiStrings();
  const contentId = useId();
  const menu = getContextMenuRequestHandlers(props.onBackgroundContextMenu);
  const content = props.renderEmptyState?.();
  return (
    <div
      {...hooks.slot('empty')}
      role="note"
      tabIndex={0}
      aria-label={props.emptyLabel ?? strings.stateMachineEmpty}
      aria-describedby={content == null ? undefined : contentId}
      onKeyDown={menu.onKeyDown}
    >
      {content == null ? null : (
        <div {...hooks.slot('empty-content')} id={contentId}>
          {content}
        </div>
      )}
    </div>
  );
}

/** Whether every state and transition the host selected is still shown, and so selectable. */
function useSelectionReconciliation(props: SequenceProps, layout: SequenceLayout) {
  const selectedState = props.states.find((state) => state.id === props.selectedKey);
  useReleaseMissingSelection(
    props.selectedKey,
    Boolean(selectedState && !selectedState.isDisabled),
    props.onSelectionChange,
  );
  const selectedRoute = layout.routes.find(
    (route) => route.transition.id === props.selectedTransitionKey,
  );
  useReleaseMissingSelection(
    props.selectedTransitionKey,
    Boolean(selectedRoute?.transition.label?.trim()),
    props.onTransitionSelectionChange,
  );
}

export function StateMachineSequence({
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  'aria-details': ariaDetails,
  ...props
}: SequenceProps) {
  const strings = useUiStrings();
  const rootRef = useRef<HTMLDivElement>(null);
  const rootRefs = useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const focus = useStateFocusRecovery(rootRef, props.states);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const measurements = useSequenceMeasurements(viewport);
  const layout = layoutSequence({
    states: props.states,
    transitions: props.transitions,
    density: props.density,
    geometry: props.sequenceGeometry,
    measurements,
  });
  useSelectionReconciliation(props, layout);
  const background = getContextMenuRequestHandlers(props.onBackgroundContextMenu);
  const onBackgroundContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    // A state or label request belongs to its target alone, handled or not.
    if (isElement(event.target) && event.target.closest(targetSelector)) return;
    background.onContextMenu?.(event);
  };
  const isEmpty = props.states.length === 0;
  return (
    <div
      {...hooks.root({
        className: props.className,
        props,
        data: {
          presentation: 'sequence',
          density: props.density ?? 'default',
          orientation: 'horizontal',
          empty: isEmpty,
        },
      })}
      id={props.id}
      ref={rootRefs}
      role="group"
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel ?? (ariaLabelledby ? undefined : strings.stateMachine)}
      aria-describedby={ariaDescribedby}
      aria-details={ariaDetails}
      style={{ minWidth: 0, maxWidth: '100%' }}
    >
      <div
        {...hooks.slot('viewport')}
        ref={setViewport}
        onContextMenu={onBackgroundContextMenu}
        style={{ position: 'relative', maxWidth: '100%' }}
      >
        {isEmpty ? (
          <StateMachineSequenceEmpty props={props} />
        ) : (
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
            <SequenceStates props={props} layout={layout} rootRef={rootRef} focus={focus} />
            <StateMachineSequenceLabels props={props} layout={layout} />
          </div>
        )}
      </div>
    </div>
  );
}

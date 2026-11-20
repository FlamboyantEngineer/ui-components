import { Icon } from '../../src/components/icon/icon.js';
import { Spinner } from '../../src/components/progress-bar/index.js';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../../src/components/trace/index.js';
import { CheckGlyph, ErrorGlyph, SearchGlyph } from '../../src/core/glyphs.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const icons = {
  done: <Icon icon={CheckGlyph} size="inherit" />,
  running: <Spinner size="sm" />,
  pending: <Icon icon={SearchGlyph} size="inherit" />,
  error: <Icon icon={ErrorGlyph} size="inherit" />,
} as const;

mountLab(
  <>
    <LabSection title="Line statuses">
      <StateMatrix
        axes={{ status: ['done', 'running', 'pending', 'error'] }}
        render={({ status }) => (
          <Trace aria-label={`${status} trace`} role="group">
            <TraceLine status={status === 'done' ? undefined : status}>
              <TraceIcon>{icons[status]}</TraceIcon>
              <TraceTitle>Searched the timetables</TraceTitle>{' '}
              <TraceDescription>3s</TraceDescription>
            </TraceLine>
          </Trace>
        )}
      />
    </LabSection>
    <LabSection title="Collapsible steps">
      <StateMatrix
        axes={{ expanded: ['collapsed', 'expanded'] }}
        render={({ expanded }) => (
          <div style={{ inlineSize: '22rem' }}>
            <Trace aria-label={`${expanded} steps`} role="group">
              <TraceCollapsible defaultExpanded={expanded === 'expanded'}>
                <TraceCollapsibleTrigger>
                  <TraceLine>
                    <TraceTitle>Thought</TraceTitle> <TraceDescription>for 4s</TraceDescription>
                  </TraceLine>
                </TraceCollapsibleTrigger>
                <TraceCollapsibleContent>
                  The morning ferry is quicker than the coast road, and it runs every hour.
                </TraceCollapsibleContent>
              </TraceCollapsible>
              <a href="#timetable">
                <TraceLine>
                  <TraceIcon>{icons.done}</TraceIcon>
                  <TraceTitle>Opened the timetable</TraceTitle>
                </TraceLine>
              </a>
            </Trace>
          </div>
        )}
      />
    </LabSection>
  </>,
);

// Sample data and stand-ins shared by the Chat Activity lab's cases and its simulation.

import type { ChatPlanStep } from '../../src/components/chat-activity/chat-activity.js';
import { IconLabel } from '../../src/components/icon-label/icon-label.js';

export const reasoningText =
  'The reader wants to reach **Porto** on Saturday morning. I should compare the early trains, check the timetable for changes and pick the cheapest fare that arrives before ten.';

export const planSteps: readonly ChatPlanStep[] = [
  { id: 'trains', label: 'Find trains to Porto', status: 'done' },
  { id: 'timetable', label: 'Check the timetable', status: 'in-progress' },
  { id: 'fares', label: 'Compare the fares', status: 'pending' },
  { id: 'museum', label: 'Reserve the tile museum', status: 'failed' },
  { id: 'cafe', label: 'Find a café near the station', status: 'skipped' },
];

interface LabToolCallProps {
  label: string;
  isRunning?: boolean;
}

/** A stand-in for a tool call: a glyph and what the tool did, or is doing. */
export function LabToolCall({ label, isRunning = false }: LabToolCallProps) {
  return <IconLabel icon={isRunning ? 'clock' : 'check'} label={label} size="sm" />;
}

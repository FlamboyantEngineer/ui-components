// Neutral models and reasoning efforts for the Chat Model Picker lab.

import type {
  ChatEffortOption,
  ChatModelOption,
} from '../../src/components/chat-model-picker/index.js';

export const labEfforts: ChatEffortOption[] = [
  { id: 'low', label: 'Low', description: 'Fastest replies' },
  { id: 'medium', label: 'Medium', description: 'A balance of speed and depth' },
  { id: 'high', label: 'High', description: 'Takes longer, thinks harder' },
];

export const labModels: ChatModelOption[] = [
  {
    id: 'swift',
    label: 'Swift',
    description: 'Quick answers to everyday questions',
    efforts: ['low', 'medium'],
    defaultEffort: 'low',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Thoughtful answers for most work',
    defaultEffort: 'medium',
  },
  {
    id: 'deep',
    label: 'Deep',
    description: 'Careful reasoning for hard problems',
    badge: 'New',
    efforts: ['medium', 'high'],
    defaultEffort: 'high',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Answers straight away, without reasoning',
    efforts: [],
  },
  {
    id: 'max',
    label: 'Max',
    badge: 'Preview',
    isDisabled: true,
    disabledReason: 'Not available in this workspace',
  },
];

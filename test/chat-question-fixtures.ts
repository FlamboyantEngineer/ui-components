// Sample questions an agent asks while helping to set up a small app.

import type { ChatQuestionItem } from '../src/components/chat-question/chat-question.js';

export const databaseQuestion: ChatQuestionItem = {
  id: 'database',
  question: 'Which database should the starter app use?',
  header: 'Database',
  selectionMode: 'single',
  allowsOther: true,
  options: [
    {
      id: 'postgres',
      label: 'PostgreSQL',
      description: 'Relational, with JSON columns.',
      isRecommended: true,
      preview: '```sql\nCREATE TABLE notes (id serial PRIMARY KEY);\n```',
    },
    {
      id: 'sqlite',
      label: 'SQLite',
      description: 'One file, no server.',
      preview: 'A single **file** beside the app.',
    },
    { id: 'mysql', label: 'MySQL' },
  ],
};

export const featuresQuestion: ChatQuestionItem = {
  id: 'features',
  question: 'Which features should the first version include?',
  header: 'Features',
  selectionMode: 'multiple',
  allowsOther: true,
  options: [
    { id: 'sign-in', label: 'Sign-in' },
    { id: 'search', label: 'Search', preview: 'Full-text search over **notes**.' },
    { id: 'export', label: 'Export to CSV' },
  ],
};

export const nameQuestion: ChatQuestionItem = {
  id: 'name',
  question: 'What should the app be called?',
  selectionMode: 'none',
  options: [],
};

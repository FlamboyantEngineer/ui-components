// Questions a code helper asks while setting up a small notes app, and a recipe planner's.

import type {
  ChatQuestionAnswer,
  ChatQuestionItem,
} from '../../src/components/chat-question/chat-question.js';

export const databaseQuestion: ChatQuestionItem = {
  id: 'database',
  question: 'Which database should the notes app use?',
  header: 'Database',
  selectionMode: 'single',
  allowsOther: true,
  options: [
    {
      id: 'postgres',
      label: 'PostgreSQL',
      description: 'Relational, with JSON columns and full-text search.',
      isRecommended: true,
      preview: [
        '```sql',
        'CREATE TABLE notes (',
        '  id serial PRIMARY KEY,',
        '  body text NOT NULL',
        ');',
        '```',
      ].join('\n'),
    },
    {
      id: 'sqlite',
      label: 'SQLite',
      description: 'One file beside the app, no server to run.',
      preview: ['```sql', 'CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT);', '```'].join(
        '\n',
      ),
    },
    { id: 'mysql', label: 'MySQL', description: 'A widely hosted relational server.' },
  ],
};

export const featuresQuestion: ChatQuestionItem = {
  id: 'features',
  question: 'Which features should the first version include?',
  header: 'Features',
  selectionMode: 'multiple',
  allowsOther: true,
  options: [
    { id: 'sign-in', label: 'Sign-in', description: 'Accounts with email and password.' },
    { id: 'search', label: 'Search', isRecommended: true },
    { id: 'export', label: 'Export to CSV' },
  ],
};

export const nameQuestion: ChatQuestionItem = {
  id: 'name',
  question: 'What should the app be called?',
  header: 'Name',
  selectionMode: 'none',
  options: [],
};

export const layoutQuestion: ChatQuestionItem = {
  id: 'layout',
  question: 'How should the notes page be laid out?',
  header: 'Layout',
  selectionMode: 'single',
  options: [
    {
      id: 'list',
      label: 'One list',
      preview: '**One list** of notes, newest first.\n\n- Title and first line\n- Edited time',
    },
    {
      id: 'columns',
      label: 'Two columns',
      isRecommended: true,
      preview:
        '**Two columns**: the list on the left and the open note on the right.\n\n| Left | Right |\n| --- | --- |\n| Notes | Open note |',
    },
    {
      id: 'board',
      label: 'Board',
      preview: '**A board** of cards grouped by tag, such as _Ideas_, _Doing_ and _Done_.',
    },
  ],
};

export const servingsQuestion: ChatQuestionItem = {
  id: 'servings',
  question: 'How many people are you cooking for?',
  header: 'Servings',
  selectionMode: 'single',
  allowsOther: true,
  options: [
    { id: 'two', label: 'Two' },
    { id: 'four', label: 'Four', isRecommended: true },
    { id: 'six', label: 'Six' },
  ],
};

export const toppingsQuestion: ChatQuestionItem = {
  id: 'toppings',
  question: 'Which toppings should the soup have?',
  selectionMode: 'multiple',
  allowsOther: true,
  options: [
    { id: 'herbs', label: 'Fresh herbs' },
    { id: 'croutons', label: 'Croutons', description: 'Baked from yesterday’s bread.' },
    { id: 'cream', label: 'Sour cream' },
  ],
};

export const setupQuestions = [databaseQuestion, featuresQuestion, nameQuestion];

export const setupAnswers: ChatQuestionAnswer[] = [
  { questionId: 'database', optionIds: ['postgres'] },
  { questionId: 'features', optionIds: ['search', 'export'], otherText: 'Offline mode' },
  { questionId: 'name', optionIds: [], otherText: 'Pocket Notes' },
];

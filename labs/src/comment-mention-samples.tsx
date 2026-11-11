import type { MentionCandidate } from '../../src/components/comment-composer/index.js';
import { createCommentMentions } from '../../src/components/comment-composer/rich/index.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { samplePeople } from './people-samples.js';

/** A group and an assistant the reader can mention beside the people. */
const sampleGroups: readonly MentionCandidate[] = [
  { kind: 'group', id: 'bakers', name: 'Bakers', description: 'Team', count: 4 },
  { kind: 'assistant', id: 'helper', name: 'Helper', description: 'Assistant' },
];

/**
 * Who `@` finds: the sample people, then a group and an assistant, matched by the start of a name,
 * after a short delay.
 */
export const sampleMentions = createCommentMentions({
  search: (query, signal) =>
    new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        const lower = query.toLowerCase();
        const matches = (name: string) =>
          name.split(' ').some((part) => part.toLowerCase().startsWith(lower));
        resolve([
          ...samplePeople
            .filter((person) => matches(person.name))
            .map((person) => ({
              id: String(person.id),
              name: person.name,
              avatar: person.src,
              description: person.statusLabel,
            })),
          ...sampleGroups.filter((candidate) => matches(candidate.name)),
        ]);
      }, 150);
      signal.addEventListener('abort', () => {
        window.clearTimeout(timer);
        reject(new Error('aborted'));
      });
    }),
});

/** The card a mention chip opens: the person's sample profile. */
export function renderSampleCard({ id, name }: { id: string; name: string }) {
  const person = samplePeople.find((candidate) => candidate.id === id);
  return person ? (
    <UserCard
      name={name}
      src={person.src}
      status={person.status}
      statusLabel={person.statusLabel}
    />
  ) : undefined;
}

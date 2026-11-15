---
'@flamboyantengineer/ui-components': minor
---

Agents can react to chat messages. A message's reactions (`ChatReaction`) can name who reacted by participant (`participantIds`), so an assistant's reaction reads as, for example, "👍 1, reacted by Trip planner", and the reader's chip is pressed when their id is there. `setChatReaction(messages, { messageId, emoji, participantId, isReacted })` adds or takes back a participant's reaction. `useChatController` takes a `reaction` stream event (by default on the reader's message the reply answers) and offers `setReaction({ messageId, emoji, isReacted, participantId })`, which reacts as the assistant unless another participant is named.

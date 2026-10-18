/** Strings of notification lists and centres, approval panels and decision controls. */
export interface ReviewStrings {
  /** Names a notification list and the bell that opens it. */
  notifications: string;
  /** Names the notification bell with the unread count. */
  notificationsWithCount: (unread: number) => string;
  /** Names the choice between all and unread notifications. */
  notificationFilter: string;
  /** Shows every notification. */
  allNotifications: string;
  /** Marks an unread notification, and shows only those. */
  unread: string;
  markAllRead: string;
  markRead: string;
  markUnread: string;
  /** The title of an empty notification list. */
  noNotifications: string;
  /** The title of a notification list showing only unread ones, with none left. */
  noUnreadNotifications: string;
  /** Under the title of an empty notification list. */
  notificationsEmpty: string;
  /** Under the title of an unread notification list with none left. */
  unreadNotificationsEmpty: string;
  /** Announces notifications that arrived: one by its title, several by their count. */
  newNotifications: (count: number, title: string) => string;
  /** Groups items whose day is unknown. */
  earlier: string;
  /** Names an approval panel. */
  approvals: string;
  /** The approvals given against those required (`2 of 3 approvals`). */
  approvalProgress: (approved: number, required: number) => string;
  /** An approver's decision, or the outcome of all of them. */
  approvalDecision: (decision: 'pending' | 'approved' | 'rejected' | 'abstained') => string;
  /** Names the list of people and groups whose decision is asked. */
  approvers: string;
  /** Marks the reader among the approvers. */
  you: string;
  /** Reminds a pending approver of the request, by name. */
  remindApprover: (name: string) => string;
  /** Asks an approver who decided to decide again, by name. */
  requestApprovalAgain: (name: string) => string;
  /** Names the reader's own decision. */
  yourDecision: string;
  approve: string;
  reject: string;
  /** Submits a decision. */
  submitDecision: string;
  /** Titles the dialog that signs a decision. */
  signDecision: string;
  /** Shown when submitting a decision failed without a message of its own. */
  decisionFailed: string;
}

const approvalDecisionNames = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  abstained: 'Abstained',
} as const;

export const reviewStrings: ReviewStrings = {
  notifications: 'Notifications',
  notificationsWithCount: (unread) =>
    unread > 0 ? `Notifications, ${unread} unread` : 'Notifications',
  notificationFilter: 'Show',
  allNotifications: 'All',
  unread: 'Unread',
  markAllRead: 'Mark all as read',
  markRead: 'Mark as read',
  markUnread: 'Mark as unread',
  noNotifications: 'No notifications',
  noUnreadNotifications: 'Nothing unread',
  notificationsEmpty: 'New notifications appear here.',
  unreadNotificationsEmpty: 'You are all caught up.',
  newNotifications: (count, title) =>
    count === 1 ? `New notification: ${title}` : `${count} new notifications`,
  earlier: 'Earlier',
  approvals: 'Approvals',
  approvalProgress: (approved, required) =>
    required === 1 ? `${approved} of 1 approval` : `${approved} of ${required} approvals`,
  approvalDecision: (decision) => approvalDecisionNames[decision],
  approvers: 'Approvers',
  you: 'You',
  remindApprover: (name) => `Remind ${name}`,
  requestApprovalAgain: (name) => `Request again from ${name}`,
  yourDecision: 'Your decision',
  approve: 'Approve',
  reject: 'Reject',
  submitDecision: 'Submit',
  signDecision: 'Sign your decision',
  decisionFailed: 'The decision could not be submitted.',
};

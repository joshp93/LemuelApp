/**
 * Per-emoji reaction counts on a note.
 */
export interface ReactionCounts {
  [emoji: string]: number;
}

/**
 * A single reaction detail as returned by the getReactions endpoint.
 */
export interface ReactionDetail {
  reactorUuid: string;
  displayName: string;
  reactionType: string;
  createdAt: string;
}

/**
 * Response shape for the getReactions endpoint.
 */
export interface GetReactionsResponse {
  reactionCounts: ReactionCounts;
  userReaction?: string;
  reactions: ReactionDetail[];
}

/**
 * A single reply entity as returned by the backend.
 */
export interface ReplyEntity {
  pk: string;
  sk: string;
  content: string;
  authorUuid: string;
  displayName: string;
  createdAt: string;
}

/**
 * Response shape for the getReplies endpoint.
 */
export interface GetRepliesResponse {
  items: ReplyEntity[];
  lastKey?: string;
}

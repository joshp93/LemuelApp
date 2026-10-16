import type { ReplyEntity } from "../models/reactions-and-replies";

/** Marks the sort keys of replies that only exist on this device so far. */
const PENDING_REPLY_PREFIX = "pending:";

let pendingCount = 0;

/**
 * Builds the stand-in shown for a reply the moment it is submitted.
 *
 * The sort key is deliberately one the backend cannot issue, so the real reply
 * that replaces it is never mistaken for it.
 *
 * @param content - The reply text.
 * @param authorUuid - The author's Cognito UUID.
 * @param displayName - The author's display name, or an empty string when it is
 *   not known yet.
 * @returns A reply entity to show until the server answers.
 */
export function buildPendingReply(
  content: string,
  authorUuid: string,
  displayName: string,
): ReplyEntity {
  pendingCount += 1;
  const sk = `${PENDING_REPLY_PREFIX}${Date.now()}:${pendingCount}`;

  return {
    pk: sk,
    sk,
    content,
    authorUuid,
    displayName,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Whether a reply is still waiting for the server to acknowledge it.
 *
 * @param reply - The reply to test.
 * @returns True when the reply has not been saved yet.
 */
export function isPendingReply(reply: ReplyEntity): boolean {
  return reply.sk.startsWith(PENDING_REPLY_PREFIX);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react";
import { useAuthData } from "../stores/authStore";
import { useAioha } from "@aioha/react-provider";
import { KeyTypes } from "@aioha/aioha";
import { useProgrammaticAuth, useAuthStore } from "hive-authentication";
import { toast } from "sonner";
import { buildCommentOptions as buildRewardCommentOptions, type RewardOption } from "hive-react-kit";
import { getHiveApiNode } from "../stores/hiveNodeStore";

/** Convert percentage (0-100) to Hive vote weight (1% = 100, 100% = 10000) */
function convertPercentageToWeight(percentage: number): number {
  const clamped = Math.max(0, Math.min(100, percentage));
  return Math.round(clamped * 100);
}

const DEVELOPER_ACCOUNT = 'sagarkothari88';
const BENEFICIARY_WEIGHT = 1000; // 10%

/** Check if body has audio or video content */
function hasMediaContent(body: string): boolean {
  return /https?:\/\/audio\.3speak\.tv\/play\?a=/.test(body) ||
    /https?:\/\/play\.3speak\.tv\/(?:watch|embed)\?v=/.test(body);
}

/** Build comment_options operation with beneficiaries for media posts */
function buildCommentOptions(author: string, permlink: string): any[] {
  return ['comment_options', {
    author,
    permlink,
    max_accepted_payout: '1000000.000 HBD',
    percent_hbd: 10000,
    allow_votes: true,
    allow_curation_rewards: true,
    extensions: [[0, {
      beneficiaries: [{ account: DEVELOPER_ACCOUNT, weight: BENEFICIARY_WEIGHT }]
    }]]
  }];
}

function generateRandomPermlink(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

const REPLY_SNAP_API = 'https://api-hcurators.sagarkothari88.one/curation/reply-snap';

// Module-level cache so the API is called at most once per token
let _replySnapCache: { token: string; content: string } | null = null;
let _replySnapFetching = false;

function fetchReplySnapSuffix(token: string): void {
  const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  if (_replySnapFetching || (_replySnapCache && _replySnapCache.token === bearerToken)) return;
  _replySnapFetching = true;
  fetch(REPLY_SNAP_API, {
    headers: { Authorization: bearerToken, 'X-Hive-Node': getHiveApiNode() },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.content) _replySnapCache = { token: bearerToken, content: data.content };
    })
    .catch(() => { /* ignore */ })
    .finally(() => { _replySnapFetching = false; });
}

function getReplySnapSuffix(): string {
  return _replySnapCache?.content ?? '';
}

/** Known app suffix patterns to strip from post body when editing */
const APP_SUFFIX_PATTERNS = [
  /\s*(?:<br\s*\/?>)?\s*<sub>\[via Apps from\]\(https:\/\/linktr\.ee\/sagarkothari88\)<\/sub>\s*$/,
];

/** Strip known app suffixes from body text (e.g. for pre-filling edit textarea) */
export function stripAppSuffix(body: string): string {
  let cleaned = body;
  for (const pattern of APP_SUFFIX_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Also strip the dynamic reply-snap suffix if cached
  const suffix = getReplySnapSuffix();
  if (suffix && cleaned.endsWith(suffix)) {
    cleaned = cleaned.slice(0, -suffix.length);
  }
  return cleaned.trimEnd();
}

export function useHiveOperations() {
  const { aioha } = useAioha();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { username, currentUser, token } = useAuthData();
  const { loginWithPrivateKey } = useProgrammaticAuth(aioha!);
  const haAuthStore = useAuthStore();

  // Trigger a single fetch when token becomes available
  useEffect(() => {
    if (token) fetchReplySnapSuffix(token);
  }, [token]);

  /** Append the reply-snap suffix to a body string */
  const withSuffix = useCallback((body: string) => {
    const suffix = getReplySnapSuffix();
    if (!suffix || body.includes(suffix.trim())) return body;
    return body + suffix;
  }, []);

  const serverCallback = useCallback(async () => {
    const serverResponse = currentUser?.serverResponse;
    if (!serverResponse) {
      throw new Error("User not authenticated.");
    }
    const serverData = JSON.parse(serverResponse);
    return JSON.stringify({
      token: serverData.token,
      ecencyToken: serverData.ecencyToken,
      privatePostingKey: serverData.privatePostingKey,
    });
  }, [currentUser?.serverResponse]);

  const getPrivatePostingKey = useCallback((): string | undefined => {
    if (!currentUser?.serverResponse) return undefined;
    try {
      const data = JSON.parse(currentUser.serverResponse) as { privatePostingKey?: string };
      return data.privatePostingKey;
    } catch {
      return undefined;
    }
  }, [currentUser?.serverResponse]);

  const ensureProgrammaticAuth = useCallback(async () => {
    const privatePostingKey = getPrivatePostingKey();
    if (!username || !privatePostingKey) return;
    await loginWithPrivateKey(username, privatePostingKey, serverCallback);
  }, [username, getPrivatePostingKey, loginWithPrivateKey, serverCallback]);

  const vote = useCallback(
    async (author: string, permlink: string, weight: number) => {
      if (!username) throw new Error("User not authenticated");
      if (!aioha) throw new Error("Wallet not available");
      setLoading(true);
      setError(null);
      try {
        if (getPrivatePostingKey()) {
          await ensureProgrammaticAuth();
        }
        await haAuthStore.switchToPostingForCurrentUser();
        const hiveWeight = convertPercentageToWeight(weight);
        const result = await aioha.vote(author, permlink, hiveWeight);
        if (!result.success) {
          throw new Error((result as any).error || (result as any).message || "Vote failed");
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to vote";
        setError(errorMessage);
        if (
          !errorMessage.toLowerCase().includes("cancel") &&
          !errorMessage.toLowerCase().includes("reject")
        ) {
          toast.error(errorMessage);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [username, getPrivatePostingKey, ensureProgrammaticAuth, aioha]
  );

  const comment = useCallback(
    async (
      parentAuthor: string,
      parentPermlink: string,
      body: string,
      title?: string,
      jsonMetadata?: string,
      reward: RewardOption = 'default'
    ) => {
      if (!username) throw new Error("User not authenticated");
      if (!aioha) throw new Error("Wallet not available");
      setLoading(true);
      setError(null);
      try {
        if (getPrivatePostingKey()) {
          await ensureProgrammaticAuth();
        }
        await haAuthStore.switchToPostingForCurrentUser();
        const permlink = generateRandomPermlink(8);
        const commentTitle = title || (parentAuthor ? `Re: ${parentAuthor}'s post` : body.slice(0, 50).trim());
        const metadata = jsonMetadata ?? JSON.stringify({
          app: 'peakd/2026.3.1',
          developer: DEVELOPER_ACCOUNT,
          tags: ['hsnaps'],
          format: 'markdown',
        });

        const finalBody = withSuffix(body);
        // Build operations. Reward-routing takes priority (user-selected); fall
        // back to the 3speak media beneficiary only when the default routing is
        // kept AND the body contains audio/video.
        const operations: any[] = [
          ['comment', {
            parent_author: parentAuthor,
            parent_permlink: parentPermlink,
            author: username,
            permlink,
            title: commentTitle,
            body: finalBody,
            json_metadata: metadata
          }]
        ];
        const rewardOp = buildRewardCommentOptions(username!, permlink, reward);
        if (rewardOp) {
          operations.push(rewardOp);
        } else if (hasMediaContent(body)) {
          operations.push(buildCommentOptions(username!, permlink));
        }

        const result = await aioha.signAndBroadcastTx(operations, KeyTypes.Posting);
        if (!result.success) {
          throw new Error((result as any).error || (result as any).message || "Comment failed");
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to post comment";
        setError(errorMessage);
        if (
          !errorMessage.toLowerCase().includes("cancel") &&
          !errorMessage.toLowerCase().includes("reject")
        ) {
          toast.error(errorMessage);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [username, getPrivatePostingKey, ensureProgrammaticAuth, aioha]
  );

  /** Edit an existing post by broadcasting a comment with the same permlink. */
  const editPost = useCallback(
    async (
      parentAuthor: string,
      parentPermlink: string,
      permlink: string,
      body: string,
      title?: string,
      jsonMetadata?: string
    ) => {
      if (!username) throw new Error("User not authenticated");
      if (!aioha) throw new Error("Wallet not available");
      setLoading(true);
      setError(null);
      try {
        if (getPrivatePostingKey()) {
          await ensureProgrammaticAuth();
        }
        await haAuthStore.switchToPostingForCurrentUser();
        const commentTitle = title || "";
        const finalBody = withSuffix(body);
        const result = await aioha.comment(
          parentAuthor,
          parentPermlink,
          permlink,
          commentTitle,
          finalBody,
          jsonMetadata ?? JSON.stringify({
            app: 'peakd/2026.3.1',
            developer: DEVELOPER_ACCOUNT,
            tags: ['hsnaps'],
            format: 'markdown',
          })
        );
        if (!result.success) {
          throw new Error((result as any).error || (result as any).message || "Edit failed");
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to edit post";
        setError(errorMessage);
        if (
          !errorMessage.toLowerCase().includes("cancel") &&
          !errorMessage.toLowerCase().includes("reject")
        ) {
          toast.error(errorMessage);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [username, getPrivatePostingKey, ensureProgrammaticAuth, aioha]
  );

  /** Post the same body to multiple feeds in one transaction (one comment op per feed). */
  const commentToMultipleFeeds = useCallback(
    async (
      items: Array<{ parentAuthor: string; parentPermlink: string; jsonMetadata: string }>,
      body: string,
      title?: string
    ) => {
      if (!username) throw new Error("User not authenticated");
      if (!aioha) throw new Error("Wallet not available");
      if (items.length === 0) throw new Error("No feeds selected");
      setLoading(true);
      setError(null);
      try {
        if (getPrivatePostingKey()) {
          await ensureProgrammaticAuth();
        }
        await haAuthStore.switchToPostingForCurrentUser();
        const finalBody = withSuffix(body);
        const operations: any[] = [];
        items.forEach(({ parentAuthor, parentPermlink, jsonMetadata }) => {
          const perm = generateRandomPermlink(8);
          operations.push([
            "comment",
            {
              parent_author: parentAuthor,
              parent_permlink: parentPermlink,
              author: username,
              permlink: perm,
              title: title || (parentAuthor ? `Re: ${parentAuthor}'s post` : body.slice(0, 50).trim()),
              body: finalBody,
              json_metadata: jsonMetadata,
            },
          ]);
          if (hasMediaContent(body)) {
            operations.push(buildCommentOptions(username!, perm));
          }
        });
        const result = await aioha.signAndBroadcastTx(operations, KeyTypes.Posting);
        if (!result.success) {
          throw new Error((result as any).error || (result as any).message || "Multi-feed post failed");
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to post to feeds";
        setError(errorMessage);
        if (
          !errorMessage.toLowerCase().includes("cancel") &&
          !errorMessage.toLowerCase().includes("reject")
        ) {
          toast.error(errorMessage);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [username, getPrivatePostingKey, ensureProgrammaticAuth, aioha]
  );

  const voteAndComment = useCallback(
    async (
      parentAuthor: string,
      parentPermlink: string,
      weight: number,
      body: string,
      title?: string
    ) => {
      if (!username) throw new Error("User not authenticated");
      if (!aioha) throw new Error("Wallet not available");
      setLoading(true);
      setError(null);
      try {
        if (getPrivatePostingKey()) {
          await ensureProgrammaticAuth();
        }
        await haAuthStore.switchToPostingForCurrentUser();
        const hiveWeight = convertPercentageToWeight(weight);
        const permlink = generateRandomPermlink(8);
        const commentTitle = title || `Re: ${parentAuthor}'s post`;
        const finalBody = withSuffix(body);
        const operations: any[] = [
          [
            "vote",
            {
              author: parentAuthor,
              permlink: parentPermlink,
              voter: username,
              weight: hiveWeight,
            },
          ],
          [
            "comment",
            {
              parent_author: parentAuthor,
              parent_permlink: parentPermlink,
              author: username,
              permlink,
              title: commentTitle,
              body: finalBody,
              json_metadata: JSON.stringify({
                tags: ["hivepolls"],
                app: "hivepolls/1.0.0",
                format: "markdown",
              }),
            },
          ],
        ];
        if (hasMediaContent(body)) {
          operations.push(buildCommentOptions(username!, permlink));
        }
        const result = await aioha.signAndBroadcastTx(operations, KeyTypes.Posting);
        if (!result.success) {
          throw new Error((result as any).error || (result as any).message || "Vote and comment transaction failed");
        }
        return {
          success: result.success,
          transactionId: result.result,
          operations: ["vote", "comment"],
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to vote and comment";
        setError(errorMessage);
        if (
          !errorMessage.toLowerCase().includes("cancel") &&
          !errorMessage.toLowerCase().includes("reject")
        ) {
          toast.error(errorMessage);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [username, getPrivatePostingKey, ensureProgrammaticAuth, aioha]
  );

  const setFollowState = useCallback(
    async (target: string, what: string[]) => {
      if (!username) throw new Error("User not authenticated");
      if (!aioha) throw new Error("Wallet not available");
      setLoading(true);
      setError(null);
      try {
        if (getPrivatePostingKey()) {
          await ensureProgrammaticAuth();
        }
        await haAuthStore.switchToPostingForCurrentUser();
        const result = await aioha.signAndBroadcastTx(
          [
            [
              "custom_json",
              {
                required_auths: [],
                required_posting_auths: [username],
                id: "follow",
                json: JSON.stringify([
                  "follow",
                  { follower: username, following: target, what },
                ]),
              },
            ],
          ],
          KeyTypes.Posting
        );
        if (!result.success) {
          throw new Error(
            (result as any).error || (result as any).message || "Follow operation failed"
          );
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Follow operation failed";
        setError(errorMessage);
        if (
          !errorMessage.toLowerCase().includes("cancel") &&
          !errorMessage.toLowerCase().includes("reject")
        ) {
          toast.error(errorMessage);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [username, getPrivatePostingKey, ensureProgrammaticAuth, aioha, haAuthStore]
  );

  const follow = useCallback(
    (target: string) => setFollowState(target, ["blog"]),
    [setFollowState]
  );

  const unfollow = useCallback(
    (target: string) => setFollowState(target, []),
    [setFollowState]
  );

  return {
    vote,
    comment,
    editPost,
    commentToMultipleFeeds,
    voteAndComment,
    follow,
    unfollow,
    loading,
    error,
  };
}

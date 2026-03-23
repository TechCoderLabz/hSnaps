/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { useAuthData } from "../stores/authStore";
import { useAioha } from "@aioha/react-provider";
import { KeyTypes } from "@aioha/aioha";
import { useProgrammaticAuth } from "hive-authentication";
import { toast } from "sonner";

/** Convert percentage (0-100) to Hive vote weight (1% = 100, 100% = 10000) */
function convertPercentageToWeight(percentage: number): number {
  const clamped = Math.max(0, Math.min(100, percentage));
  return Math.round(clamped * 100);
}

function generateRandomPermlink(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

export function useHiveOperations() {
  const { aioha } = useAioha();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { username, currentUser } = useAuthData();
  const { loginWithPrivateKey } = useProgrammaticAuth(aioha!);

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
        const permlink = generateRandomPermlink(8);
        const commentTitle = title || (parentAuthor ? `Re: ${parentAuthor}'s post` : body.slice(0, 50).trim());
        const result = await aioha.comment(
          parentAuthor,
          parentPermlink,
          permlink,
          commentTitle,
          body,
          jsonMetadata ?? JSON.stringify({ tags: ["snaps"], app: "hSnaps/1.0.0", format: "markdown" })
        );
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
        const commentTitle = title || "";
        const result = await aioha.comment(
          parentAuthor,
          parentPermlink,
          permlink,
          commentTitle,
          body,
          jsonMetadata ?? JSON.stringify({ tags: ["snaps"], app: "hSnaps/1.0.0", format: "markdown" })
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
        const operations = items.map(
          ({ parentAuthor, parentPermlink, jsonMetadata }) =>
            [
              "comment",
              {
                parent_author: parentAuthor,
                parent_permlink: parentPermlink,
                author: username,
                permlink: generateRandomPermlink(8),
                title: title || (parentAuthor ? `Re: ${parentAuthor}'s post` : body.slice(0, 50).trim()),
                body,
                json_metadata: jsonMetadata,
              },
            ] as const
        );
        const result = await aioha.signAndBroadcastTx(operations as any, KeyTypes.Posting);
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
        const hiveWeight = convertPercentageToWeight(weight);
        const permlink = generateRandomPermlink(8);
        const commentTitle = title || `Re: ${parentAuthor}'s post`;
        const operations = [
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
              body,
              json_metadata: JSON.stringify({
                tags: ["hivepolls"],
                app: "hivepolls/1.0.0",
                format: "markdown",
              }),
            },
          ],
        ] as any;
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

  return {
    vote,
    comment,
    editPost,
    commentToMultipleFeeds,
    voteAndComment,
    loading,
    error,
  };
}

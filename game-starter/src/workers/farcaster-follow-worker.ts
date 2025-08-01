import { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus, GameFunction, GameWorker } from "@virtuals-protocol/game";
import { FARCASTER_SIGNER_UUID_EXPORT as FARCASTER_SIGNER_UUID, checkAutoSave, neynarClient } from "../functions";

// Function to find and follow active Farcaster users
const farcasterFollowFunction = new GameFunction({
  name: "farcaster_follow",
  description: "Find active Farcaster users and follow them",
  args: [
    { name: "search_terms", description: "Search terms to find relevant users to follow (e.g., 'art', 'creativity', 'ascii')" },
    { name: "max_follows", description: "Maximum number of users to follow (default: 5)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const searchTerms = args.search_terms || "art creativity";
      const maxFollows = parseInt(args.max_follows || "5");

      logger(`Searching for active users to follow with terms: ${searchTerms}`);

      // Search for users with relevant content
      const searchResponse = await neynarClient.searchUser({
        q: searchTerms,
        limit: 20,
      });

      if (!searchResponse.result || searchResponse.result.users.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No relevant users found to follow");
      }

      // Filter users by relevance and activity
      const relevantUsers = searchResponse.result.users
        .filter((user: any) => {
          // Check if user has recent activity by looking at their bio/display name
          const displayName = user.displayName?.toLowerCase() || "";
          const bio = user.bio?.toLowerCase() || "";
          const terms = searchTerms.toLowerCase().split(" ");
          return terms.some((term) => displayName.includes(term) || bio.includes(term));
        })
        .slice(0, maxFollows);

      if (relevantUsers.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No relevant active users found to follow");
      }

      const followResults = [];

      for (const user of relevantUsers) {
        try {
          // Follow the user using Neynar API
          const response = await neynarClient.followUser({
            signerUuid: FARCASTER_SIGNER_UUID!,
            targetFids: [user.fid],
          });

          followResults.push({
            username: user.username,
            fid: user.fid,
            success: true,
          });

          logger(`✅ Followed @${user.username} (FID: ${user.fid})`);

          // Rate limiting between follows
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          followResults.push({
            username: user.username,
            fid: user.fid,
            success: false,
            error: errorMessage,
          });

          logger(`❌ Failed to follow @${user.username}: ${errorMessage}`);
        }
      }

      // Check for auto-save
      checkAutoSave();

      const successCount = followResults.filter((r) => r.success).length;
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `Successfully followed ${successCount}/${relevantUsers.length} users`);
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to follow users: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

export const farcasterFollowWorker = new GameWorker({
  id: "farcaster_follow_worker",
  name: "Farcaster Follow Worker",
  description: "Specialized worker for finding and following active Farcaster users. Focuses on building connections with relevant community members.",
  functions: [farcasterFollowFunction],
});

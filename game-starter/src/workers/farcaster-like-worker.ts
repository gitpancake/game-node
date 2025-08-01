import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";
import { neynarClient, FARCASTER_SIGNER_UUID_EXPORT as FARCASTER_SIGNER_UUID, checkAutoSave } from "../functions";

// Function to find and like relevant casts
const farcasterLikeFunction = new GameFunction({
  name: "farcaster_like",
  description: "Find recent casts that are relevant and like them",
  args: [
    { name: "search_terms", description: "Search terms to find relevant casts to like (e.g., 'art', 'creativity', 'ascii')" },
    { name: "max_likes", description: "Maximum number of casts to like (default: 10)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const searchTerms = args.search_terms || "art creativity";
      const maxLikes = parseInt(args.max_likes || "10");

      logger(`Searching for casts to like with terms: ${searchTerms}`);

      // Search for users with relevant content
      const searchResponse = await neynarClient.searchUser({
        q: searchTerms,
        limit: 10,
      });

      if (!searchResponse.result || searchResponse.result.users.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No relevant users found to like casts from");
      }

      const likeResults = [];

      // Get casts from relevant users
      for (const user of searchResponse.result.users.slice(0, 5)) {
        try {
          const userCasts = await neynarClient.fetchCastsForUser({
            fid: user.fid,
            limit: Math.ceil(maxLikes / 5),
          });

          if (!userCasts.casts || userCasts.casts.length === 0) {
            continue;
          }

          // Filter casts by relevance to our search terms
          const relevantCasts = userCasts.casts
            .filter((cast: any) => {
              const text = cast.text?.toLowerCase() || "";
              const terms = searchTerms.toLowerCase().split(" ");
              return terms.some(term => text.includes(term));
            })
            .slice(0, 3);

          for (const cast of relevantCasts) {
            try {
              // Like the cast using Neynar API
              const response = await neynarClient.publishCast({
                signerUuid: FARCASTER_SIGNER_UUID!,
                text: `👍`, // Simple like reaction
                parent: cast.hash, // This makes it a reply
              });

              likeResults.push({
                castHash: cast.hash,
                success: true,
              });

              logger(`✅ Liked cast ${cast.hash}`);

              // Rate limiting between likes
              await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              likeResults.push({
                castHash: cast.hash,
                success: false,
                error: errorMessage,
              });

              logger(`❌ Failed to like cast ${cast.hash}: ${errorMessage}`);
            }
          }

        } catch (error) {
          logger(`❌ Failed to fetch casts for user ${user.username}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Check for auto-save
      checkAutoSave();

      const successCount = likeResults.filter(r => r.success).length;
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Successfully liked ${successCount}/${likeResults.length} casts`
      );

    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Failed to like casts: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
  },
});

export const farcasterLikeWorker = new GameWorker({
  id: "farcaster_like_worker",
  name: "Farcaster Like Worker",
  description: "Specialized worker for finding and liking relevant casts on Farcaster. Focuses on engaging with content that aligns with our interests.",
  functions: [farcasterLikeFunction],
}); 
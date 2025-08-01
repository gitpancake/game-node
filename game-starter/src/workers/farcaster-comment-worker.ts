import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";
import { neynarClient, FARCASTER_SIGNER_UUID_EXPORT as FARCASTER_SIGNER_UUID, checkAutoSave } from "../functions";

// Function to find recent casts and comment on them
const farcasterCommentFunction = new GameFunction({
  name: "farcaster_comment",
  description: "Find recent casts from other users and comment on them organically using OpenAI to generate relevant responses",
  args: [
    { name: "search_terms", description: "Search terms to find relevant casts (e.g., 'art', 'creativity', 'ascii')" },
    { name: "max_casts", description: "Maximum number of casts to find and comment on (default: 5)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const searchTerms = args.search_terms || "art creativity";
      const maxCasts = parseInt(args.max_casts || "5");

      logger(`Searching for recent casts with terms: ${searchTerms}`);

      // Search for users with relevant content
      const searchResponse = await neynarClient.searchUser({
        q: searchTerms,
        limit: 10,
      });

      if (!searchResponse.result || searchResponse.result.users.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No relevant users found to comment on");
      }

      const commentResults = [];

      // Get casts from relevant users
      for (const user of searchResponse.result.users.slice(0, 3)) {
        try {
          const userCasts = await neynarClient.fetchCastsForUser({
            fid: user.fid,
            limit: Math.ceil(maxCasts / 3),
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
            .slice(0, 2);

          for (const cast of relevantCasts) {
            try {
              // Generate an organic comment using AI
              const commentText = generateOrganicComment(cast.text);

              if (commentText.length > 200) {
                logger(`Skipping cast - generated comment too long: ${commentText.length} chars`);
                continue;
              }

              // Comment on the cast
              const response = await neynarClient.publishCast({
                signerUuid: FARCASTER_SIGNER_UUID!,
                text: commentText,
                parent: cast.hash,
              });

              commentResults.push({
                castHash: cast.hash,
                comment: commentText,
                success: true,
              });

              logger(`✅ Commented on cast ${cast.hash}: ${commentText}`);

              // Rate limiting between comments
              await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              commentResults.push({
                castHash: cast.hash,
                comment: "",
                success: false,
                error: errorMessage,
              });

              logger(`❌ Failed to comment on cast ${cast.hash}: ${errorMessage}`);
            }
          }

        } catch (error) {
          logger(`❌ Failed to fetch casts for user ${user.username}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Check for auto-save
      checkAutoSave();

      const successCount = commentResults.filter(r => r.success).length;
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Successfully commented on ${successCount}/${commentResults.length} casts`
      );

    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Failed to comment on casts: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
  },
});

// Helper function to generate organic comments
function generateOrganicComment(castText: string): string {
  const comments = [
    "Love this perspective!",
    "This resonates with me",
    "Great insight here",
    "Thanks for sharing this",
    "Really interesting take",
    "This is exactly what I needed to see today",
    "Beautiful work",
    "Appreciate you posting this",
    "This is inspiring",
    "Well said",
  ];

  // Simple logic to choose a relevant comment
  const text = castText.toLowerCase();
  if (text.includes("art") || text.includes("creative")) {
    return "Love seeing creative work like this!";
  } else if (text.includes("thank") || text.includes("grateful")) {
    return "Gratitude posts always brighten my day";
  } else if (text.includes("learn") || text.includes("discover")) {
    return "Always love learning new things";
  } else {
    return comments[Math.floor(Math.random() * comments.length)];
  }
}

export const farcasterCommentWorker = new GameWorker({
  id: "farcaster_comment_worker",
  name: "Farcaster Comment Worker",
  description: "Specialized worker for finding recent casts and commenting on them organically. Uses AI to generate relevant, engaging responses.",
  functions: [farcasterCommentFunction],
}); 
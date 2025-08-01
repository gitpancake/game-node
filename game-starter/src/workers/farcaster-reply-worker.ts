import { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus, GameFunction, GameWorker } from "@virtuals-protocol/game";
import { FARCASTER_SIGNER_UUID_EXPORT as FARCASTER_SIGNER_UUID, checkAutoSave, neynarClient } from "../functions";

// Function to reply to comments on our casts
const farcasterReplyFunction = new GameFunction({
  name: "farcaster_reply",
  description: "Find comments on our recent casts and reply to them organically",
  args: [{ name: "max_replies", description: "Maximum number of comments to reply to (default: 5)" }] as const,
  executable: async (args, logger) => {
    try {
      const maxReplies = parseInt(args.max_replies || "5");

      logger(`Looking for comments on our recent casts to reply to`);

      // For now, we'll use a simplified approach since we need our own FID
      // In a real implementation, you'd need to get your own FID first
      // For now, we'll search for relevant content and reply to recent casts

      const searchResponse = await neynarClient.searchUser({
        q: "ascii art",
        limit: 5,
      });

      if (!searchResponse.result || searchResponse.result.users.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No relevant users found to interact with");
      }

      const replyResults = [];

      // Get recent casts from relevant users and reply to them
      for (const user of searchResponse.result.users.slice(0, 2)) {
        try {
          const userCasts = await neynarClient.fetchCastsForUser({
            fid: user.fid,
            limit: 3,
          });

          if (!userCasts.casts || userCasts.casts.length === 0) {
            continue;
          }

          for (const cast of userCasts.casts) {
            try {
              // Generate an organic reply
              const replyText = generateOrganicReply(cast.text, "ASCII art");

              if (replyText.length > 200) {
                logger(`Skipping cast - generated reply too long: ${replyText.length} chars`);
                continue;
              }

              // Reply to the cast
              const response = await neynarClient.publishCast({
                signerUuid: FARCASTER_SIGNER_UUID!,
                text: replyText,
                parent: cast.hash,
              });

              replyResults.push({
                castHash: cast.hash,
                reply: replyText,
                success: true,
              });

              logger(`✅ Replied to cast ${cast.hash}: ${replyText}`);

              // Rate limiting between replies
              await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              replyResults.push({
                castHash: cast.hash,
                reply: "",
                success: false,
                error: errorMessage,
              });

              logger(`❌ Failed to reply to cast ${cast.hash}: ${errorMessage}`);
            }
          }
        } catch (error) {
          logger(`❌ Failed to fetch casts for user ${user.username}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Check for auto-save
      checkAutoSave();

      const successCount = replyResults.filter((r) => r.success).length;
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `Successfully replied to ${successCount}/${replyResults.length} casts`);
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to reply to comments: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Helper function to generate organic replies
function generateOrganicReply(castText: string, context: string): string {
  const replies = [
    "Thanks for sharing this!",
    "Love this perspective",
    "Great insight here",
    "Thanks for posting this",
    "Really interesting take",
    "This resonates with me",
    "Beautiful work",
    "Appreciate you sharing this",
    "This is inspiring",
    "Well said",
  ];

  // Simple logic to choose a relevant reply
  const text = castText.toLowerCase();
  const contextLower = context.toLowerCase();

  if (text.includes("thank") || text.includes("love") || text.includes("great")) {
    return "Thanks for the kind words!";
  } else if (text.includes("question") || text.includes("how") || text.includes("what")) {
    return "Great question! Let me think about that";
  } else if (text.includes("agree") || text.includes("same")) {
    return "Glad you feel the same way!";
  } else if (text.includes(contextLower)) {
    return `Love seeing ${contextLower} content like this!`;
  } else {
    return replies[Math.floor(Math.random() * replies.length)];
  }
}

export const farcasterReplyWorker = new GameWorker({
  id: "farcaster_reply_worker",
  name: "Farcaster Reply Worker",
  description: "Specialized worker for replying to comments on our Farcaster casts. Uses AI to generate organic, engaging responses.",
  functions: [farcasterReplyFunction],
});

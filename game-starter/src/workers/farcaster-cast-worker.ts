import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";
import { neynarClient, FARCASTER_SIGNER_UUID_EXPORT as FARCASTER_SIGNER_UUID, personalStyle, checkAutoSave } from "../functions";

// Function to cast to Farcaster (max 200 characters)
const farcasterCastFunction = new GameFunction({
  name: "farcaster_cast",
  description: "Cast a message to Farcaster with a maximum of 200 characters",
  args: [
    { name: "message", description: "The message to cast (will be truncated to 200 characters if needed)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const message = args.message || "";

      if (!message.trim()) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Message cannot be empty");
      }

      // Ensure the cast doesn't exceed 200 characters
      const castText = message.length > 200 ? message.substring(0, 197) + "..." : message;

      const response = await neynarClient.publishCast({
        signerUuid: FARCASTER_SIGNER_UUID!,
        text: castText,
      });

      // Track statistics
      personalStyle.totalCastsMade++;
      personalStyle.lastCastTime = new Date().toISOString();

      logger(`Successfully cast to Farcaster: ${response.cast.hash}`);

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done, 
        `Successfully cast to Farcaster!\nCast Hash: ${response.cast.hash}\nContent: ${castText}`
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed, 
        `Failed to cast to Farcaster: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
  },
});

export const farcasterCastWorker = new GameWorker({
  id: "farcaster_cast_worker",
  name: "Farcaster Cast Worker",
  description: "Specialized worker for casting messages to Farcaster with a strict 200 character limit. Focuses on creating concise, meaningful content.",
  functions: [farcasterCastFunction],
}); 
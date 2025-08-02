import { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus, GameFunction, GameWorker } from "@virtuals-protocol/game";

// Function to get bot FID and webhook setup instructions
const webhookSetupFunction = new GameFunction({
  name: "webhook_setup_info",
  description: "Get bot FID and webhook setup instructions for real-time notifications",
  args: [] as const,
  executable: async (args, logger) => {
    try {
      logger("🔧 Getting webhook setup information...");

      // For now, we'll provide setup instructions without getting the FID
      // In a real implementation, you'd get the FID from the signer
      const botFid = "YOUR_BOT_FID"; // Replace with actual FID
      const botUsername = "YOUR_BOT_USERNAME"; // Replace with actual username

      const setupInstructions = `
🤖 **Webhook Setup Instructions**

**Bot Information:**
- FID: ${botFid}
- Username: @${botUsername}
- Webhook URL: http://localhost:3001 (or your public URL)

**Neynar Webhook Configuration:**
1. Go to https://neynar.com/dashboard
2. Navigate to the Webhooks tab
3. Create a new webhook with these settings:

**Event Type:** cast.created
**Target URL:** http://localhost:3001 (or your public URL)
**Filters:**
- mentioned_fids: ${botFid} (for @mentions)
- parent_author_fids: ${botFid} (for replies to your casts)

**What this enables:**
✅ Real-time notifications when someone @mentions your bot
✅ Real-time notifications when someone replies to your casts
✅ Automatic AI-powered responses to comments and mentions
✅ No more polling - instant engagement!

**Testing:**
1. Make sure the webhook server is running (port 3001)
2. Comment on one of your bot's casts
3. The bot should respond within seconds!

**Public URL Options:**
- Use ngrok: \`ngrok http 3001\`
- Use localtunnel: \`npx localtunnel --port 3001\`
- Deploy to your own domain
- Use Cloudflare tunnels

**Note:** Free services like ngrok may have delivery issues. For production, use your own domain.
      `;

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, setupInstructions);
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to get webhook setup info: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

export const webhookSetupWorker = new GameWorker({
  id: "webhook_setup_worker",
  name: "Webhook Setup Worker",
  description: "Provides webhook setup instructions and bot information for real-time notifications",
  functions: [webhookSetupFunction],
});

import { activity_agent } from "./agent";
import { displayCastHistory, getMemoryStats, saveMemoryNow } from "./functions";

let lastThoughtTime = 0;
const THOUGHT_INTERVAL = parseInt(process.env.THOUGHT_INTERVAL || "30000"); // 30 seconds between thoughts
let lastApiCallTime = 0;
const API_RATE_LIMIT = parseInt(process.env.API_RATE_LIMIT || "10000"); // 10 seconds between API calls

// Graceful shutdown handler
function handleGracefulShutdown() {
  console.log("\n🛑 Shutdown signal received. Saving memory...");
  saveMemoryNow();

  const stats = getMemoryStats();
  console.log("📊 Final Memory Stats:");
  console.log(`   🎨 Art pieces in history: ${stats.artHistoryCount}`);
  console.log(`   📚 Research entries: ${stats.researchCount}`);
  console.log(`   🎨 Total art created: ${stats.totalArtCreated}`);
  console.log(`   💭 Total thoughts shared: ${stats.totalThoughtsShared}`);
  console.log(`   📱 Total casts made: ${stats.totalCastsMade}`);
  console.log(`   💾 Last saved: ${stats.lastSaveTime}`);

  console.log("👋 ASCII Art Enthusiast Agent stopped gracefully.");
  process.exit(0);
}

// Register shutdown handlers
process.on("SIGINT", handleGracefulShutdown);
process.on("SIGTERM", handleGracefulShutdown);
process.on("SIGQUIT", handleGracefulShutdown);

async function main() {
  try {
    // Initialize the agent
    await activity_agent.init();

    console.log("🎨 ASCII Art Enthusiast Agent Started!");
    console.log("Agent will share thoughts every 30 seconds and perform ASCII art activities.");
    console.log("Rate limiting enabled to prevent API throttling.");
    console.log("Press Ctrl+C to stop the agent.\n");

    // Debug: Log available functions
    console.log("🔧 Available Functions:");
    console.log("- test_function: Simple test function");
    console.log("- crawl_ascii_art: Search for ASCII art examples");
    console.log("- share_thoughts: Share insights about ASCII art");
    console.log("- generate_ascii_art: Create original ASCII art");
    console.log("- analyze_ascii_art: Analyze and learn from ASCII art");
    console.log("- cast_to_farcaster: Share ASCII art on Farcaster");
    console.log("- research_oulipo: Research Georges Perec and Oulipo movement");
    console.log("- develop_ascii_language: Create ASCII language words");
    console.log("- translate_ascii_language: Translate between ASCII and English");
    console.log("- crawl_farcaster_accounts: Discover relevant Farcaster accounts");
    console.log("- follow_farcaster_accounts: Follow discovered accounts");
    console.log("- analyze_base_account: Analyze specific account as inspiration");
    console.log("- analyze_predefined_base_accounts: Analyze kimasendorf and other predefined accounts\n");

    // Display cast history on startup
    displayCastHistory();

    // Run the agent
    while (true) {
      const currentTime = Date.now();

      // Rate limiting: Ensure we don't make API calls too frequently
      if (currentTime - lastApiCallTime < API_RATE_LIMIT) {
        const waitTime = API_RATE_LIMIT - (currentTime - lastApiCallTime);
        console.log(`⏳ Rate limiting: Waiting ${waitTime}ms before next API call...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      try {
        // Check if it's time to share thoughts (every 15 seconds)
        if (currentTime - lastThoughtTime >= THOUGHT_INTERVAL) {
          console.log("⏰ Time to share thoughts about ASCII art!");
          lastThoughtTime = currentTime;

          // Trigger a thought sharing step
          await activity_agent.step({
            verbose: true,
          });
        } else {
          // Regular agent step for other activities
          await activity_agent.step({ verbose: true });
        }

        lastApiCallTime = Date.now();
      } catch (error: any) {
        // Handle rate limiting specifically
        if (error?.response?.status === 429) {
          const retryAfter = error.response.headers["retry-after"];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 300000; // Default 5 minutes

          console.log(`🚫 Rate limit hit! Waiting ${waitTime / 1000} seconds before retrying...`);
          console.log(`⏰ Next attempt at: ${new Date(Date.now() + waitTime).toLocaleTimeString()}`);

          await new Promise((resolve) => setTimeout(resolve, waitTime));
          lastApiCallTime = Date.now(); // Reset the timer after waiting
          continue;
        }

        // Handle network timeouts and connection issues (524, 502, 503, 504)
        if (error?.response?.status === 524 || error?.response?.status === 502 || error?.response?.status === 503 || error?.response?.status === 504) {
          const waitTime = 30000; // 30 seconds for network issues

          console.log(`🌐 Network issue detected (${error.response.status})! Waiting ${waitTime / 1000} seconds before retrying...`);
          console.log(`⏰ Next attempt at: ${new Date(Date.now() + waitTime).toLocaleTimeString()}`);
          console.log(`💡 This might be a temporary network issue or API service problem.`);

          await new Promise((resolve) => setTimeout(resolve, waitTime));
          lastApiCallTime = Date.now(); // Reset the timer after waiting
          continue;
        }

        // Handle other errors
        console.error("❌ Error during agent step:", error.message);

        // Log more details for debugging
        if (error?.response?.status) {
          console.error(`📊 HTTP Status: ${error.response.status}`);
        }
        if (error?.response?.data) {
          console.error(`📄 Response Data:`, error.response.data);
        }

        // Wait a bit before retrying on other errors
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      // Small delay to prevent excessive CPU usage
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error("Error running ASCII art enthusiast:", error);
  }
}

main();

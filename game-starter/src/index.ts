import { activity_agent } from "./agent";
import { displayCastHistory, getMemoryStats, saveMemoryNow } from "./functions";

let lastThoughtTime = 0;
const THOUGHT_INTERVAL = parseInt(process.env.THOUGHT_INTERVAL || "1800000"); // 30 minutes between outreach activities (further reduced frequency)
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
    // Initialize the agent with retry logic for rate limiting
    let initRetries = 0;
    const maxInitRetries = 5;

    while (initRetries < maxInitRetries) {
      try {
        console.log(`🔄 Attempting to initialize agent (attempt ${initRetries + 1}/${maxInitRetries})...`);
        await activity_agent.init();
        break; // Success, exit the retry loop
      } catch (error: any) {
        initRetries++;

        // Handle rate limiting specifically
        if (error?.response?.status === 429) {
          const retryAfter = error.response.headers["retry-after"];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 300000; // Default 5 minutes

          console.log(`🚫 Rate limit hit during initialization! Waiting ${waitTime / 1000} seconds before retry...`);
          console.log(`⏰ Next attempt at: ${new Date(Date.now() + waitTime).toLocaleTimeString()}`);

          if (initRetries < maxInitRetries) {
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          } else {
            console.error("❌ Max initialization retries reached. Exiting...");
            process.exit(1);
          }
        }

        // Handle other initialization errors
        console.error(`❌ Initialization error (attempt ${initRetries}/${maxInitRetries}):`, error.message);
        if (initRetries >= maxInitRetries) {
          console.error("❌ Max initialization retries reached. Exiting...");
          process.exit(1);
        }

        // Wait before retrying other errors
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    console.log("🎨 ASCII Art Enthusiast Agent Started!");
    console.log("Agent will perform outreach every 30 minutes and cast 1-2 times per day.");
    console.log("Rate limiting enabled to prevent API throttling.");
    console.log("Press Ctrl+C to stop the agent.\n");

    // Debug: Log available workers and their functions
    console.log("🔧 Available Workers:");
    console.log("📚 Research Worker:");
    console.log("  - research_oulipo: Research Georges Perec and Oulipo movement");
    console.log("");
    console.log("🎨 Creative Worker:");
    console.log("  - crawl_ascii_art: Search for ASCII art examples");
    console.log("  - generate_ascii_art: Create original ASCII art");
    console.log("  - analyze_ascii_art: Analyze and learn from ASCII art");
    console.log("");
    console.log("📱 Social Worker:");
    console.log("  - share_thoughts: Share insights about ASCII art");
    console.log("  - cast_to_farcaster: Share ASCII art on Farcaster");
    console.log("  - crawl_farcaster_accounts: Discover relevant Farcaster accounts");
    console.log("  - follow_farcaster_accounts: Follow discovered accounts");
    console.log("  - analyze_base_account: Analyze specific account as inspiration");
    console.log("  - analyze_predefined_base_accounts: Analyze kimasendorf and other predefined accounts");
    console.log("  - analyze_account_with_casts: Enhanced account analysis with cast examination");
    console.log("  - like_cast: Like specific casts on Farcaster");
    console.log("  - comment_on_cast: Comment on specific casts");
    console.log("  - browse_and_interact: Browse and interact with relevant casts");
    console.log("  - active_social_engagement: Comprehensive community engagement");
    console.log("  - ensure_casting_and_following: Guarantee casting and following");
    console.log("");
    console.log("🔤 Language Worker:");
    console.log("  - develop_ascii_language: Create ASCII language words");
    console.log("  - translate_ascii_language: Translate between ASCII and English");
    console.log("");
    console.log("⚙️ System Worker:");
    console.log("  - test_function: Simple test function\n");

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
        // Check if it's time for outreach (every 30 minutes)
        if (currentTime - lastThoughtTime >= THOUGHT_INTERVAL) {
          console.log("⏰ Time for outreach, discovery, and engagement!");
          lastThoughtTime = currentTime;

          // Trigger outreach and discovery (but not necessarily casting)
          await activity_agent.step({
            verbose: false,
          });
        } else {
          // Regular agent step for other activities (research, language development, etc.)
          await activity_agent.step({ verbose: false });
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

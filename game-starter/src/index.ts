import { activity_agent } from "./agent";
import { displayCastHistory, getMemoryStats, saveMemoryNow } from "./functions";

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
    console.log("🔄 Initializing ASCII Art Enthusiast Agent...");
    await activity_agent.init();
    await activity_agent.run(300, { verbose: true }); // Run every 5 minutes instead of 15 seconds

    console.log("🎨 ASCII Art Enthusiast Agent Started!");
    console.log("Agent is now running autonomously using the GAME framework.");
    console.log("Press Ctrl+C to stop the agent.\n");

    // Display available workers
    console.log("🔧 Available Workers:");
    console.log("📱 Farcaster Cast Worker:");
    console.log("  - farcaster_cast: Cast messages (max 200 characters)");
    console.log("");
    console.log("💬 Farcaster Comment Worker:");
    console.log("  - farcaster_comment: Find and comment on relevant casts");
    console.log("");
    console.log("👍 Farcaster Like Worker:");
    console.log("  - farcaster_like: Find and like relevant casts");
    console.log("");
    console.log("👥 Farcaster Follow Worker:");
    console.log("  - farcaster_follow: Find and follow active users");
    console.log("");
    console.log("↩️ Farcaster Reply Worker:");
    console.log("  - farcaster_reply: Reply to comments on our casts");
    console.log("");
    console.log("💬 Farcaster Comment Response Worker:");
    console.log("  - farcaster_respond_to_comments: Respond to comments on our own casts");
    console.log("");
    console.log("📚 Research Worker:");
    console.log("  - research_oulipo: Research Georges Perec and Oulipo movement");
    console.log("");
    console.log("🎨 Creative Worker:");
    console.log("  - crawl_ascii_art: Search for ASCII art examples");
    console.log("  - generate_ascii_art: Create original ASCII art");
    console.log("  - analyze_ascii_art: Analyze and learn from ASCII art");
    console.log("");
    console.log("🔤 Language Worker:");
    console.log("  - develop_ascii_language: Create ASCII language words");
    console.log("  - translate_ascii_language: Translate between ASCII and English");
    console.log("");
    console.log("⚙️ System Worker:");
    console.log("  - test_function: Simple test function\n");

    // Display cast history on startup
    displayCastHistory();

    // Let the GAME framework handle autonomous operation
    console.log("🚀 Agent is now running autonomously. The GAME framework will handle decision-making and execution.\n");

    // The GAME framework keeps the process alive and handles all execution
    // No need for any loops - just let it run!
  } catch (error) {
    console.error("❌ Error running ASCII art enthusiast:", error);
    process.exit(1);
  }
}

main();

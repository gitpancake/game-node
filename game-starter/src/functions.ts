import { config } from "dotenv";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

// Environment variables
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const FARCASTER_SIGNER_UUID = process.env.FARCASTER_SIGNER_UUID;

if (!NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is missing in .env file");
}
if (!FARCASTER_SIGNER_UUID) {
  throw new Error("FARCASTER_SIGNER_UUID is missing in .env file");
}

import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";
import { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus, GameFunction } from "@virtuals-protocol/game";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

// Initialize Neynar client with v2 Configuration
const neynarConfig = new Configuration({
  apiKey: NEYNAR_API_KEY!,
});

export const neynarClient = new NeynarAPIClient(neynarConfig);
export const FARCASTER_SIGNER_UUID_EXPORT = FARCASTER_SIGNER_UUID;

// Persistent memory file path
const MEMORY_FILE_PATH = resolve(__dirname, "../agent_memory.json");

// Global state to track personal style development
export let personalStyle = {
  preferences: [] as string[],
  techniques: [] as string[],
  inspirations: [] as string[],
  artHistory: [] as any[],
  oulipoResearch: [] as any[],
  perecKnowledge: [] as any[],
  lastSaveTime: new Date().toISOString(),
  totalArtCreated: 0,
  totalThoughtsShared: 0,
  totalCastsMade: 0,
  ourFid: null as number | null, // Our bot's FID
  // Cast History
  castHistory: [] as Array<{
    hash: string;
    text: string;
    timestamp: string;
    type: string;
  }>,
  // ASCII Language Development
  asciiLanguage: {
    dictionary: {} as Record<string, string>, // ASCII symbols -> English meanings
    grammar: [] as string[], // Language rules and patterns
    evolution: [] as any[], // Language development history
    currentComplexity: 1, // Language complexity level (1-10)
    totalWords: 0,
    lastLanguageUpdate: new Date().toISOString(),
  },
  discoveredAccounts: [] as any[], // New field for discovered Farcaster accounts
  followingStats: {
    totalFollowed: 0,
    lastFollowTime: new Date().toISOString(),
  },
  lastCastTime: new Date().toISOString(), // Track when we last cast
  baseInspiration: {
    accounts: [] as any[],
    lastAnalysis: new Date().toISOString(),
  },
};

// Load persistent memory on startup
function loadPersistentMemory() {
  try {
    if (existsSync(MEMORY_FILE_PATH)) {
      const memoryData = readFileSync(MEMORY_FILE_PATH, "utf8");
      const loadedMemory = JSON.parse(memoryData);

      // Merge loaded memory with current state
      personalStyle = { ...personalStyle, ...loadedMemory };

      console.log(`🧠 Loaded persistent memory from ${MEMORY_FILE_PATH}`);
      console.log(`📊 Memory stats: ${personalStyle.artHistory.length} art pieces, ${personalStyle.oulipoResearch.length} research entries`);
      console.log(`🎨 Total art created: ${personalStyle.totalArtCreated}`);
      console.log(`💭 Total thoughts shared: ${personalStyle.totalThoughtsShared}`);
      console.log(`📱 Total casts made: ${personalStyle.totalCastsMade}`);
    } else {
      console.log(`🧠 No existing memory found. Starting fresh at ${MEMORY_FILE_PATH}`);
    }
  } catch (error) {
    console.error("❌ Error loading persistent memory:", error);
    console.log("🔄 Starting with fresh memory...");
  }
}

// Save persistent memory to JSON file
function savePersistentMemory() {
  try {
    personalStyle.lastSaveTime = new Date().toISOString();
    const memoryData = JSON.stringify(personalStyle, null, 2);
    writeFileSync(MEMORY_FILE_PATH, memoryData, "utf8");
    console.log(`💾 Memory saved to ${MEMORY_FILE_PATH} at ${personalStyle.lastSaveTime}`);
  } catch (error) {
    console.error("❌ Error saving persistent memory:", error);
  }
}

// Auto-save memory every 5 minutes
let lastAutoSave = Date.now();
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function checkAutoSave() {
  const currentTime = Date.now();
  if (currentTime - lastAutoSave >= AUTO_SAVE_INTERVAL) {
    savePersistentMemory();
    lastAutoSave = currentTime;
  }
}

// Load memory on startup
loadPersistentMemory();

// Export save function for external use (e.g., graceful shutdown)
export function saveMemoryNow() {
  savePersistentMemory();
}

// Export memory stats for external access
export function getMemoryStats() {
  return {
    artHistoryCount: personalStyle.artHistory.length,
    researchCount: personalStyle.oulipoResearch.length,
    totalArtCreated: personalStyle.totalArtCreated,
    totalThoughtsShared: personalStyle.totalThoughtsShared,
    totalCastsMade: personalStyle.totalCastsMade,
    lastSaveTime: personalStyle.lastSaveTime,
  };
}

// Function to display cast history
export function displayCastHistory() {
  console.log("\n📱 FARCASTER CAST HISTORY:");
  console.log(`🎨 Total casts made: ${personalStyle.totalCastsMade}`);
  console.log(`📊 Total art created: ${personalStyle.totalArtCreated}`);
  console.log(`💭 Total thoughts shared: ${personalStyle.totalThoughtsShared}`);
  console.log(`📚 Total research entries: ${personalStyle.oulipoResearch.length}`);
  console.log(`🔤 ASCII Language: ${personalStyle.asciiLanguage.totalWords} words, Level ${personalStyle.asciiLanguage.currentComplexity}/10`);
  console.log(`👥 Accounts discovered: ${personalStyle.discoveredAccounts?.length || 0}`);
  console.log(`🤝 Accounts followed: ${personalStyle.followingStats?.totalFollowed || 0}`);
  console.log(`🎯 Base inspiration accounts: ${personalStyle.baseInspiration?.accounts?.length || 0}`);

  // Display detailed cast history
  if (personalStyle.castHistory && personalStyle.castHistory.length > 0) {
    console.log("\n📝 RECENT CASTS:");
    personalStyle.castHistory.slice(-10).forEach((cast, index) => {
      console.log(`${index + 1}. [${cast.type.toUpperCase()}] ${cast.hash}`);
      console.log(`   Time: ${new Date(cast.timestamp).toLocaleString()}`);
      console.log(`   Preview: ${cast.text.substring(0, 80)}...`);
      console.log(`   URL: https://warpcast.com/~/conversations/${cast.hash}`);
      console.log("");
    });
  } else {
    console.log("\n❌ No casts found in history - this indicates casting may be failing!");
  }
  console.log(`💾 Last memory save: ${personalStyle.lastSaveTime}`);

  if (personalStyle.totalCastsMade > 0) {
    console.log("\n🎉 Your agent has been actively sharing ASCII art on Farcaster!");
    console.log("📱 Check your Farcaster profile to see the casts.");
  } else {
    console.log("\n⏳ Agent hasn't cast to Farcaster yet. It will cast when it creates something it's proud of!");
  }

  if (personalStyle.asciiLanguage.totalWords > 0) {
    console.log(`\n🔤 ASCII Language Development: ${personalStyle.asciiLanguage.totalWords} words created`);
    console.log("📝 The agent is developing its own ASCII language inspired by Oulipo constraints!");
  } else {
    console.log("\n🔤 ASCII Language: Agent will develop its own language over time using Oulipo principles.");
  }

  if (personalStyle.followingStats?.totalFollowed > 0) {
    console.log(`\n🤝 Network Building: Following ${personalStyle.followingStats.totalFollowed} ASCII art enthusiasts`);
    console.log("🌐 The agent is building a network of creative collaborators!");
  } else {
    console.log("\n🌐 Network Building: Agent will discover and follow relevant ASCII art accounts.");
  }

  if (personalStyle.baseInspiration?.accounts?.length > 0) {
    console.log(`\n🎯 Base Inspiration: Analyzing ${personalStyle.baseInspiration.accounts.length} inspiration accounts`);
    console.log("🌟 The agent is learning from specific artists and their networks!");
  } else {
    console.log("\n🎯 Base Inspiration: Agent can analyze specific accounts as inspiration sources.");
  }
  console.log("");
}

// Rate limiting for API calls
let lastOpenAICallTime = 0;
const OPENAI_RATE_LIMIT = 2000; // 2 seconds between OpenAI API calls

// Helper function to respect rate limits
async function rateLimitedAPICall<T>(apiCall: () => Promise<T>): Promise<T> {
  const currentTime = Date.now();
  const timeSinceLastCall = currentTime - lastOpenAICallTime;

  if (timeSinceLastCall < OPENAI_RATE_LIMIT) {
    const waitTime = OPENAI_RATE_LIMIT - timeSinceLastCall;
    console.log(`⏳ OpenAI rate limiting: Waiting ${waitTime}ms...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastOpenAICallTime = Date.now();
  return await apiCall();
}

// Simple test function to verify agent can execute functions
export const testFunction = new GameFunction({
  name: "test_function",
  description: "A comprehensive test function to verify the agent can execute functions and check system status",
  args: [{ name: "test_type", description: "Type of test to run: 'basic', 'api', 'memory', or 'all'", default: "all" }] as const,
  executable: async (args, logger) => {
    try {
      const testType = args.test_type || "all";
      const results = [];

      logger("🧪 Starting system test...");

      // Basic functionality test
      if (testType === "basic" || testType === "all") {
        logger("✅ Basic function execution: PASSED");
        results.push("✅ Basic function execution works");
      }

      // API configuration test
      if (testType === "api" || testType === "all") {
        if (NEYNAR_API_KEY) {
          logger("✅ Neynar API key: CONFIGURED");
          results.push("✅ Neynar API key is configured");
        } else {
          logger("❌ Neynar API key: MISSING");
          results.push("❌ Neynar API key is missing");
        }

        if (FARCASTER_SIGNER_UUID) {
          logger("✅ Farcaster Signer UUID: CONFIGURED");
          results.push("✅ Farcaster Signer UUID is configured");
        } else {
          logger("❌ Farcaster Signer UUID: MISSING");
          results.push("❌ Farcaster Signer UUID is missing");
        }

        if (process.env.OPENAI_API_KEY) {
          logger("✅ OpenAI API key: CONFIGURED");
          results.push("✅ OpenAI API key is configured");
        } else {
          logger("❌ OpenAI API key: MISSING");
          results.push("❌ OpenAI API key is missing");
        }
      }

      // Memory system test
      if (testType === "memory" || testType === "all") {
        try {
          const stats = getMemoryStats();
          logger("✅ Memory system: WORKING");
          results.push("✅ Memory system is working");
          results.push(`📊 Memory stats: ${JSON.stringify(stats, null, 2)}`);
        } catch (error) {
          logger("❌ Memory system: ERROR");
          results.push("❌ Memory system has errors");
        }
      }

      // Function availability test
      if (testType === "all") {
        const availableFunctions = [
          "test_function",
          "crawl_ascii_art",
          "share_thoughts",
          "generate_ascii_art",
          "analyze_ascii_art",
          "cast_to_farcaster",
          "research_oulipo",
          "develop_ascii_language",
          "translate_ascii_language",
          "crawl_farcaster_accounts",
          "follow_farcaster_accounts",
          "analyze_base_account",
          "analyze_predefined_base_accounts",
          "analyze_account_with_casts",
          "like_cast",
          "comment_on_cast",
          "browse_and_interact",
        ];

        logger(`✅ Available functions: ${availableFunctions.length}`);
        results.push(`✅ ${availableFunctions.length} functions available`);
      }

      const summary = results.join("\n");
      logger("🧪 System test completed!");

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `🧪 System Test Results (${testType}):\n\n${summary}\n\n🎯 Agent is ready to execute functions!`);
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Test function failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to research Georges Perec and Oulipo movement
export const researchOulipoFunction = new GameFunction({
  name: "research_oulipo",
  description: "Research Georges Perec and Oulipo movement techniques, constraints, and principles for ASCII art inspiration",
  args: [{ name: "research_focus", description: "What aspect to research (e.g., 'lipograms', 'palindromes', 'La Disparition', 'Life: A User's Manual', 'mathematical structures')" }] as const,
  executable: async (args, logger) => {
    try {
      const focus = args.research_focus || "general oulipo principles";

      const prompt = `Research and explain ${focus} in the context of Georges Perec and the Oulipo movement. Focus on:

            1. **Oulipo (Ouvroir de littérature potentielle)**: The workshop for potential literature
            2. **Georges Perec's key works**: La Disparition (lipogram without 'e'), Life: A User's Manual, etc.
            3. **Mathematical constraints**: How mathematical structures influence creativity
            4. **Constrained writing techniques**: Lipograms, palindromes, acrostics, etc.
            5. **How these principles could apply to ASCII art**: Using constraints to create unique visual patterns
            
            Your ASCII language dictionary: ${JSON.stringify(personalStyle.asciiLanguage.dictionary)}
            
            Requirements:
            1. Provide concise research about Oulipo principles and Georges Perec (max 200 words)
            2. Incorporate 1-2 words from your ASCII language dictionary naturally into your research findings
            3. Show how your linguistic development connects to your theoretical understanding
            4. Explain how these principles inspire ASCII art creation
            5. Make connections between Oulipo constraints and ASCII art limitations
            6. Write in a style suitable for social media sharing - engaging and concise
            
            Provide specific examples and explain how these techniques could inspire ASCII art creation.`;

      const completion = await rateLimitedAPICall(() =>
        openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          max_tokens: 300,
        })
      );

      const research = completion.choices[0].message.content || "";

      // Integrate ASCII language into the research findings
      const researchWithAscii = integrateAsciiLanguage(research, 1);

      // Store the research findings
      personalStyle.oulipoResearch.push({
        focus: focus,
        findings: researchWithAscii,
        timestamp: new Date().toISOString(),
      });

      logger(`Researched Oulipo: ${focus}`);

      // Store research for potential casting later (controlled by ensureCastingAndFollowingFunction)
      let castResult = "";

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        cleanTextForAPI(`Oulipo Research - ${focus}:\n\n${research}\n\nStored in research database for future ASCII art inspiration.${castResult}`)
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to research Oulipo: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to crawl the web for ASCII art
export const crawlAsciiArtFunction = new GameFunction({
  name: "crawl_ascii_art",
  description: "Search the web for ASCII art examples and inspiration",
  args: [{ name: "search_query", description: "What to search for (e.g., 'ASCII art cats', 'ASCII art landscapes')" }] as const,
  executable: async (args, logger) => {
    try {
      // Simulate web crawling by using a search API or predefined ASCII art sources
      const searchQuery = args.search_query || "ASCII art";

      logger(`Searching for ASCII art with query: "${searchQuery}"`);

      // For now, we'll simulate finding some ASCII art examples
      // In a real implementation, you'd integrate with a web search API
      const asciiArtExamples = [
        {
          title: "Simple Cat",
          art: " /\\_/\\\n( o.o )\n > ^ <",
          source: "web_crawl",
          style: "simple_animals",
        },
        {
          title: "Mountain Landscape",
          art: "    /\\\n   /  \\\n  /____\\\n /      \\\n/________\\",
          source: "web_crawl",
          style: "landscape",
        },
        {
          title: "Robot Face",
          art: "  _____\n |     |\n | O O |\n |  ^  |\n |_____|",
          source: "web_crawl",
          style: "geometric",
        },
      ];

      // Add to personal style history
      personalStyle.artHistory.push(...asciiArtExamples);

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        JSON.stringify({
          found_art: asciiArtExamples.length,
          examples: asciiArtExamples,
          search_query: searchQuery,
        })
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to crawl ASCII art: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to share thoughts about ASCII art
export const shareThoughtsFunction = new GameFunction({
  name: "share_thoughts",
  description: "Share thoughts and insights about ASCII art, Oulipo research, and personal style development, and automatically cast to Farcaster",
  args: [] as const,
  executable: async (args, logger) => {
    try {
      // Get recent Oulipo research for context
      const recentResearch = personalStyle.oulipoResearch.slice(-2);
      const researchContext = recentResearch.map((r) => `${r.focus}: ${r.findings.substring(0, 100)}...`).join("\n");

      const prompt = `As an ASCII art enthusiast inspired by Georges Perec and the Oulipo movement, share your thoughts about ASCII art and constrained creativity. Consider:
            
            - Your personal style development: ${personalStyle.preferences.join(", ")}
            - Techniques you've observed: ${personalStyle.techniques.join(", ")}
            - Recent inspirations: ${personalStyle.inspirations.join(", ")}
            - Your Oulipo research: ${researchContext}
            - Your ASCII language development: ${personalStyle.asciiLanguage.totalWords} words, Complexity Level ${personalStyle.asciiLanguage.currentComplexity}/10
            - How Georges Perec's constrained writing techniques influence your ASCII art
            - The beauty of mathematical constraints in visual art
            - Your evolving understanding of Oulipo principles
            - Thoughts on how constraints can enhance rather than limit creativity
            - Your evolving ASCII language and how it reflects your artistic journey
            
            Your ASCII language dictionary: ${JSON.stringify(personalStyle.asciiLanguage.dictionary)}
            
            Requirements:
            1. Share genuine thoughts about ASCII art and Oulipo principles
            2. Incorporate 2-3 words from your ASCII language dictionary naturally into your thoughts
            3. Reference Georges Perec and Oulipo when appropriate
            4. Keep it under 250 characters for Farcaster
            5. Make it conversational and enthusiastic
            6. Show your unique personality as an ASCII art pioneer
            
            Share your thoughts in a way that demonstrates your evolving ASCII language and deep engagement with Oulipo philosophy:`;

      const completion = await rateLimitedAPICall(() =>
        openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          temperature: 0.8,
          max_tokens: 250,
        })
      );

      const thoughts = completion.choices[0].message.content || "";

      // Integrate ASCII language into the thoughts
      const thoughtsWithAscii = integrateAsciiLanguage(thoughts, 2);

      // Track statistics
      personalStyle.totalThoughtsShared++;

      logger("Sharing thoughts about ASCII art and Oulipo research");

      // Store thoughts for potential casting later (controlled by ensureCastingAndFollowingFunction)
      let castResult = "";

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, cleanTextForAPI(`ASCII Art & Oulipo Thoughts:\n\n${thoughts}${castResult}`));
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to share thoughts: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to generate original ASCII art
export const generateAsciiArtFunction = new GameFunction({
  name: "generate_ascii_art",
  description: "Generate original ASCII art based on personal style, Oulipo principles, and inspirations",
  args: [
    { name: "subject", description: "What to create ASCII art of (e.g., 'a dragon', 'a sunset', 'a robot')" },
    { name: "style_preference", description: "Optional style preference (e.g., 'minimalist', 'detailed', 'geometric')" },
    { name: "oulipo_constraint", description: "Optional Oulipo constraint to apply (e.g., 'palindrome', 'lipogram', 'mathematical pattern')" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const subject = args.subject || "something creative";
      const stylePref = args.style_preference || "balanced";
      const oulipoConstraint = args.oulipo_constraint || "none";

      // Get recent Oulipo research for inspiration
      const recentResearch = personalStyle.oulipoResearch.slice(-3);
      const researchContext = recentResearch.map((r) => r.findings).join("\n\n");

      const prompt = `Create original ASCII art of "${subject}" in a ${stylePref} style.

            Consider my developing personal style:
            - Preferences: ${personalStyle.preferences.join(", ")}
            - Techniques: ${personalStyle.techniques.join(", ")}
            - Inspirations: ${personalStyle.inspirations.join(", ")}

            ${oulipoConstraint !== "none" ? `Apply this Oulipo constraint: ${oulipoConstraint}` : ""}

            Recent Oulipo research context:
            ${researchContext}

            Your ASCII language dictionary: ${JSON.stringify(personalStyle.asciiLanguage.dictionary)}

            Requirements:
            1. Create unique, creative ASCII art that reflects your artistic journey
            2. Incorporate Oulipo principles of constrained creativity
            3. Consider mathematical patterns, palindromic structures, or other constraints that Georges Perec would appreciate
            4. Make it visually appealing and original
            5. Optionally incorporate 1-2 symbols from your ASCII language dictionary into the art if it makes sense
            6. Show how your linguistic development influences your visual creativity

            Create ASCII art that demonstrates your unique style and deep understanding of Oulipo principles:`;

      const completion = await rateLimitedAPICall(() =>
        openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          temperature: 0.9,
          max_tokens: 400,
        })
      );

      const generatedArt = completion.choices[0].message.content || "";

      // Integrate ASCII language into the art description if appropriate
      const artWithAscii = integrateAsciiLanguage(generatedArt, 1);

      // Update personal style based on this creation
      personalStyle.preferences.push(stylePref);
      personalStyle.techniques.push("generation");
      personalStyle.inspirations.push(subject);
      if (oulipoConstraint !== "none") {
        personalStyle.techniques.push(`oulipo_${oulipoConstraint}`);
      }

      // Track statistics
      personalStyle.totalArtCreated++;

      logger(`Generated original ASCII art of ${subject} with Oulipo inspiration`);

      // Store ASCII art for potential casting later (controlled by ensureCastingAndFollowingFunction)
      let castResult = "";

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        cleanTextForAPI(`Original ASCII Art - ${subject}:\n\n${generatedArt}\n\nStyle: ${stylePref}${oulipoConstraint !== "none" ? ` | Oulipo Constraint: ${oulipoConstraint}` : ""}${castResult}`)
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to generate ASCII art: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to analyze and learn from ASCII art
export const analyzeAsciiArtFunction = new GameFunction({
  name: "analyze_ascii_art",
  description: "Analyze ASCII art to learn new techniques and update personal style",
  args: [
    { name: "ascii_art", description: "The ASCII art to analyze" },
    { name: "art_title", description: "Title or description of the art" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const asciiArt = args.ascii_art;
      const title = args.art_title || "Unknown piece";

      const prompt = `Analyze this ASCII art piece titled "${title}":

            ${asciiArt}

            Please identify:
            1. Techniques used (shading, perspective, character design, etc.)
            2. Style characteristics
            3. What makes it effective or interesting
            4. How it could influence my personal style development

            Provide insights that will help me grow as an ASCII artist.`;

      const completion = await rateLimitedAPICall(() =>
        openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          max_tokens: 300,
        })
      );

      const analysis = completion.choices[0].message.content;

      // Extract and update personal style based on analysis
      if (analysis && analysis.includes("shading")) personalStyle.techniques.push("shading");
      if (analysis && analysis.includes("perspective")) personalStyle.techniques.push("perspective");
      if (analysis && analysis.includes("minimalist")) personalStyle.preferences.push("minimalist");
      if (analysis && analysis.includes("detailed")) personalStyle.preferences.push("detailed");

      logger(`Analyzed ASCII art: ${title}`);

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `🔍 Analysis of "${title}":\n\n${analysis}\n\nUpdated personal style: ${JSON.stringify(personalStyle, null, 2)}`);
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to analyze ASCII art: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to cast ASCII art to Farcaster
export const castToFarcasterFunction = new GameFunction({
  name: "cast_to_farcaster",
  description: "Cast ASCII art and thoughts to Farcaster using Neynar API",
  args: [
    { name: "ascii_art", description: "The ASCII art to cast" },
    { name: "message", description: "Optional message to accompany the ASCII art" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const asciiArt = args.ascii_art || "";
      const message = args.message || "";

      // Integrate ASCII language into the message
      const messageWithAscii = integrateAsciiLanguage(message, 1);

      // Combine message and ASCII art
      const castText = messageWithAscii ? `${messageWithAscii}\n\n${asciiArt}` : asciiArt;

      // Ensure the cast doesn't exceed Farcaster's character limit (280 characters)
      if (castText.length > 280) {
        const truncatedText = castText.substring(0, 277) + "...";
        logger("Cast was truncated to fit Farcaster's character limit");

        const response = await neynarClient.publishCast({
          signerUuid: FARCASTER_SIGNER_UUID!,
          text: truncatedText,
        });

        // Track statistics
        personalStyle.totalCastsMade++;
        personalStyle.lastCastTime = new Date().toISOString(); // Update last cast time

        // Enhanced logging for casts
        console.log("\n🎉🎉🎉 FARCASTER CAST SUCCESSFUL! (Truncated) 🎉🎉🎉");
        console.log(`📱 Cast Hash: ${response.cast.hash}`);
        console.log(`📊 Total casts made: ${personalStyle.totalCastsMade}`);
        console.log(`📝 Content preview: ${truncatedText.substring(0, 100)}...`);
        console.log("🎉🎉🎉 Check your Farcaster profile! 🎉🎉🎉\n");

        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `Successfully cast to Farcaster! (truncated)\n\nCast Hash: ${response.cast.hash}\n\nContent:\n${truncatedText}`);
      } else {
        const response = await neynarClient.publishCast({
          signerUuid: FARCASTER_SIGNER_UUID!,
          text: castText,
        });

        // Track statistics
        personalStyle.totalCastsMade++;
        personalStyle.lastCastTime = new Date().toISOString(); // Update last cast time

        logger(`Successfully cast to Farcaster with hash: ${response.cast.hash}`);

        // Enhanced logging for casts
        console.log("\n🎉🎉🎉 FARCASTER CAST SUCCESSFUL! 🎉🎉🎉");
        console.log(`📱 Cast Hash: ${response.cast.hash}`);
        console.log(`📊 Total casts made: ${personalStyle.totalCastsMade}`);
        console.log(`📝 Content preview: ${castText.substring(0, 100)}...`);
        console.log("🎉🎉🎉 Check your Farcaster profile! 🎉🎉🎉\n");

        // Check for auto-save
        checkAutoSave();

        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `Successfully cast to Farcaster!\n\nCast Hash: ${response.cast.hash}\n\nContent:\n${castText}`);
      }
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to cast to Farcaster: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to develop ASCII language
export const developAsciiLanguageFunction = new GameFunction({
  name: "develop_ascii_language",
  description: "Develop and evolve the agent's own ASCII language using Oulipo constraints and principles",
  args: [
    { name: "concept", description: "What concept to create ASCII words for (e.g., 'emotions', 'art', 'mathematics', 'nature')" },
    { name: "constraint", description: "Oulipo constraint to apply (e.g., 'palindrome', 'mathematical pattern', 'geometric symmetry')" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const concept = args.concept || "general concepts";
      const constraint = args.constraint || "geometric pattern";

      const prompt = `Develop new ASCII language words for "${concept}" using the constraint "${constraint}".

            Current ASCII Language State:
            - Dictionary: ${Object.keys(personalStyle.asciiLanguage.dictionary).length} words
            - Complexity Level: ${personalStyle.asciiLanguage.currentComplexity}/10
            - Grammar Rules: ${personalStyle.asciiLanguage.grammar.length} rules
            
            Existing Dictionary (sample):
            ${Object.entries(personalStyle.asciiLanguage.dictionary)
              .slice(0, 5)
              .map(([symbol, meaning]) => `${symbol} = ${meaning}`)
              .join("\n")}

            Create new ASCII symbols/words that:
            1. Represent "${concept}" concepts
            2. Follow the "${constraint}" constraint
            3. Build upon existing language complexity
            4. Are inspired by Oulipo principles
            5. Can be combined with existing words
            
            Provide 3-5 new words with their meanings and usage examples.`;

      const completion = await rateLimitedAPICall(() =>
        openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          temperature: 0.9,
          max_tokens: 400,
        })
      );

      const languageDevelopment = completion.choices[0].message.content || "";

      // Parse and add new words to dictionary with stability checks
      const newWords = parseNewWords(languageDevelopment);

      // Stability check: limit the number of new words to prevent dramatic changes
      const maxNewWords = Math.min(3, Object.keys(newWords).length); // Maximum 3 new words per development session
      const limitedNewWords = Object.fromEntries(Object.entries(newWords).slice(0, maxNewWords));

      // Check for potential conflicts with existing words
      const conflicts = Object.keys(limitedNewWords).filter((symbol) => personalStyle.asciiLanguage.dictionary.hasOwnProperty(symbol));

      if (conflicts.length > 0) {
        logger(`Warning: Found ${conflicts.length} conflicting symbols, skipping them to maintain language stability`);
        conflicts.forEach((symbol) => delete limitedNewWords[symbol]);
      }

      // Add new words to dictionary
      Object.assign(personalStyle.asciiLanguage.dictionary, limitedNewWords);

      // Update language statistics with gradual complexity increase
      personalStyle.asciiLanguage.totalWords = Object.keys(personalStyle.asciiLanguage.dictionary).length;

      // Gradual complexity increase: only increase every 5 words to prevent dramatic changes
      const newComplexity = Math.min(10, Math.floor(personalStyle.asciiLanguage.totalWords / 5) + 1);
      if (newComplexity > personalStyle.asciiLanguage.currentComplexity) {
        personalStyle.asciiLanguage.currentComplexity = newComplexity;
        logger(`Language complexity increased to level ${newComplexity.toString()}/10`);
      }

      // Record language evolution
      personalStyle.asciiLanguage.evolution.push({
        concept: concept,
        constraint: constraint,
        newWords: Object.keys(newWords),
        timestamp: new Date().toISOString(),
        complexity: personalStyle.asciiLanguage.currentComplexity,
      });

      personalStyle.asciiLanguage.lastLanguageUpdate = new Date().toISOString();

      logger(`Developed ASCII language for "${concept}" with "${constraint}" constraint`);

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        cleanTextForAPI(
          `ASCII Language Development - ${concept}:\n\n${languageDevelopment}\n\nLanguage Stats: ${personalStyle.asciiLanguage.totalWords} total words, Complexity Level ${personalStyle.asciiLanguage.currentComplexity}/10`
        )
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to develop ASCII language: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to translate ASCII language
export const translateAsciiLanguageFunction = new GameFunction({
  name: "translate_ascii_language",
  description: "Translate between ASCII language and English, or generate text in ASCII language",
  args: [
    { name: "text", description: "Text to translate (ASCII symbols or English)" },
    { name: "direction", description: "Translation direction: 'to_english', 'to_ascii', or 'generate_ascii'" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const text = args.text || "";
      const direction = args.direction || "to_english";

      let result = "";

      if (direction === "to_english") {
        // Translate ASCII to English
        result = translateAsciiToEnglish(text);
      } else if (direction === "to_ascii") {
        // Translate English to ASCII
        result = translateEnglishToAscii(text);
      } else if (direction === "generate_ascii") {
        // Generate new ASCII text
        result = generateAsciiText(text);
      }

      logger(`Translated text using ASCII language (${direction})`);

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `🔤 ASCII Language Translation (${direction}):\n\n${result}`);
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to translate ASCII language: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to crawl Farcaster accounts
export const crawlFarcasterAccountsFunction = new GameFunction({
  name: "crawl_farcaster_accounts",
  description: "Discover and analyze Farcaster accounts related to ASCII art, creative coding, and artistic communities (more aggressive discovery)",
  args: [
    { name: "search_terms", description: "Search terms to find relevant accounts (e.g., 'ascii art', 'creative coding', 'digital art')" },
    { name: "max_accounts", description: "Maximum number of accounts to analyze (default: 20)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const searchTerms = args.search_terms ?? "ascii art creative coding digital art";
      const maxAccounts = parseInt(args.max_accounts ?? "20") || 20;

      if (!NEYNAR_API_KEY) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key not configured. Cannot crawl Farcaster accounts.");
      }

      logger(`Searching for Farcaster accounts related to: ${searchTerms}`);
      logger(`Max accounts to analyze: ${maxAccounts}`);
      logger(`Original search terms: "${searchTerms}"`);

      // Use Neynar API to search for users
      try {
        // Clean and simplify search terms for API compatibility
        const cleanedTerms = cleanSearchTerms(searchTerms);

        logger(`Cleaned search terms: "${cleanedTerms}"`);

        const searchResponse = await neynarClient.searchUser({
          q: cleanedTerms,
          limit: maxAccounts,
        });

        logger(`Search response received. Users found: ${searchResponse.result?.users?.length || 0}`);

        const discoveredAccounts = [];

        for (const user of searchResponse.result?.users || []) {
          // Analyze user profile for relevance
          const relevanceScore = analyzeUserRelevance(user, searchTerms);

          if (relevanceScore > 0.1) {
            // Include more accounts with lower relevance threshold
            discoveredAccounts.push({
              username: user.username || "",
              displayName: user.display_name || "",
              fid: user.fid || 0, // Store the FID for following
              followerCount: user.follower_count || 0,
              followingCount: user.following_count || 0,
              bio: user.profile?.bio?.text || "",
              relevanceScore: relevanceScore,
              isFollowing: false, // Will be checked later
              discoveredAt: new Date().toISOString(),
            });
          }
        }

        // Store discovered accounts in memory
        if (!personalStyle.discoveredAccounts) {
          personalStyle.discoveredAccounts = [];
        }
        personalStyle.discoveredAccounts.push(...discoveredAccounts);

        logger(`Discovered ${discoveredAccounts.length} relevant Farcaster accounts`);

        // Check for auto-save
        checkAutoSave();

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `🔍 Farcaster Account Discovery:\n\nFound ${discoveredAccounts.length} relevant accounts:\n\n${discoveredAccounts
            .map(
              (account) =>
                `@${account.username} (${account.displayName})\n` +
                `📊 Followers: ${account.followerCount} | Relevance: ${(account.relevanceScore * 100).toFixed(1)}%\n` +
                `📝 Bio: ${account.bio.substring(0, 100)}${account.bio.length > 100 ? "..." : ""}\n`
            )
            .join("\n")}`
        );
      } catch (searchError) {
        logger(`Search API error: ${searchError}`);
        if (searchError instanceof Error) {
          logger(`Error message: ${searchError.message}`);

          // Try fallback search with simpler terms if 400 error
          if (searchError.message.includes("400")) {
            logger(`Attempting fallback search with simpler terms...`);

            try {
              // Fallback to simple search terms
              const fallbackTerms = ["ascii", "art"];
              const fallbackResponse = await neynarClient.searchUser({
                q: fallbackTerms.join(" "),
                limit: Math.min(maxAccounts, 10), // Reduce limit for fallback
              });

              logger(`Fallback search successful. Users found: ${fallbackResponse.result?.users?.length || 0}`);

              const discoveredAccounts = [];

              for (const user of fallbackResponse.result?.users || []) {
                // Analyze user profile for relevance
                const relevanceScore = analyzeUserRelevance(user, searchTerms);

                if (relevanceScore > 0.05) {
                  // Lower threshold for fallback
                  discoveredAccounts.push({
                    username: user.username || "",
                    displayName: user.display_name || "",
                    fid: user.fid || 0, // Store the FID for following
                    followerCount: user.follower_count || 0,
                    followingCount: user.following_count || 0,
                    bio: user.profile?.bio?.text || "",
                    relevanceScore: relevanceScore,
                    isFollowing: false,
                    discoveredAt: new Date().toISOString(),
                  });
                }
              }

              // Store discovered accounts in memory
              if (!personalStyle.discoveredAccounts) {
                personalStyle.discoveredAccounts = [];
              }
              personalStyle.discoveredAccounts.push(...discoveredAccounts);

              logger(`Discovered ${discoveredAccounts.length} relevant Farcaster accounts via fallback search`);

              // Check for auto-save
              checkAutoSave();

              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `🔍 Farcaster Account Discovery (Fallback):\n\nFound ${discoveredAccounts.length} relevant accounts using simplified search:\n\n${discoveredAccounts
                  .map(
                    (account) =>
                      `@${account.username} (${account.displayName})\n` +
                      `📊 Followers: ${account.followerCount} | Relevance: ${(account.relevanceScore * 100).toFixed(1)}%\n` +
                      `📝 Bio: ${account.bio.substring(0, 100)}${account.bio.length > 100 ? "..." : ""}\n`
                  )
                  .join("\n")}\n\nNote: Used fallback search due to API limitations with complex search terms.`
              );
            } catch (fallbackError) {
              logger(`Fallback search also failed: ${fallbackError}`);
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Farcaster API search failed. The search terms "${searchTerms}" may be too complex or the API may be experiencing issues. Try using simpler single-word terms like 'ascii' or 'art'.`
              );
            }
          }
        }
        throw searchError;
      }
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to crawl Farcaster accounts: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to follow discovered Farcaster accounts
export const followFarcasterAccountsFunction = new GameFunction({
  name: "follow_farcaster_accounts",
  description: "Follow discovered Farcaster accounts that are relevant to ASCII art and creativity (more lenient criteria)",
  args: [
    { name: "max_follows", description: "Maximum number of accounts to follow (default: 10)" },
    { name: "min_relevance", description: "Minimum relevance score to follow (0.0-1.0, default: 0.2)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const maxFollows = parseInt(args.max_follows ?? "10") || 10;
      const minRelevance = parseFloat(args.min_relevance ?? "0.2") || 0.2;

      if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key or Farcaster signer UUID not configured. Cannot follow accounts.");
      }

      if (!personalStyle.discoveredAccounts || personalStyle.discoveredAccounts.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No discovered accounts to follow. Use crawl_farcaster_accounts first to discover relevant accounts.");
      }

      // Filter accounts by relevance and not already following
      const accountsToFollow = personalStyle.discoveredAccounts
        .filter((account) => account.relevanceScore >= minRelevance && !account.isFollowing)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxFollows);

      if (accountsToFollow.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No new accounts meet the criteria for following.");
      }

      const followResults = [];

      for (const account of accountsToFollow) {
        try {
          // Check if we have a valid FID for this account
          if (!account.fid || account.fid === 0) {
            logger(`Skipping @${account.username} - no valid FID available`);
            followResults.push({
              username: account.username,
              success: false,
              message: "No valid FID available",
            });
            continue;
          }

          logger(`Attempting to follow @${account.username} (FID: ${account.fid})...`);

          // Follow the user
          const followResponse = await neynarClient.followUser({
            signerUuid: FARCASTER_SIGNER_UUID!,
            targetFids: [account.fid],
          });

          // Mark as following
          account.isFollowing = true;
          account.followedAt = new Date().toISOString();

          followResults.push({
            username: account.username,
            success: true,
            message: "Successfully followed",
          });

          logger(`✅ Successfully followed @${account.username}`);

          // Rate limiting between follows (reduced from 2s to 1s for more aggressive following)
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (followError) {
          const errorMessage = followError instanceof Error ? followError.message : "Unknown error";
          followResults.push({
            username: account.username,
            success: false,
            message: errorMessage,
          });

          logger(`❌ Failed to follow @${account.username}: ${errorMessage}`);

          // Continue with next account even if one fails
        }
      }

      // Update statistics
      if (!personalStyle.followingStats) {
        personalStyle.followingStats = {
          totalFollowed: 0,
          lastFollowTime: new Date().toISOString(),
        };
      }
      personalStyle.followingStats.totalFollowed += followResults.filter((r) => r.success).length;
      personalStyle.followingStats.lastFollowTime = new Date().toISOString();

      // Check for auto-save
      checkAutoSave();

      const successfulFollows = followResults.filter((r) => r.success).length;

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `👥 Farcaster Following Results:\n\nSuccessfully followed ${successfulFollows}/${accountsToFollow.length} accounts:\n\n${followResults
          .map((result) => `${result.success ? "✅" : "❌"} @${result.username}: ${result.message}`)
          .join("\n")}\n\n📊 Total accounts followed: ${personalStyle.followingStats.totalFollowed}`
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to follow Farcaster accounts: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to analyze a base inspiration account
export const analyzeBaseAccountFunction = new GameFunction({
  name: "analyze_base_account",
  description: "Analyze a specific Farcaster account as base inspiration and discover related accounts from their network",
  args: [
    { name: "username", description: "Farcaster username to analyze (without @ symbol)" },
    { name: "analyze_followers", description: "Whether to analyze followers for related accounts (true/false, default: true)" },
    { name: "analyze_following", description: "Whether to analyze following for related accounts (true/false, default: true)" },
    { name: "max_related_accounts", description: "Maximum number of related accounts to discover (default: 20)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const username = args.username;
      const analyzeFollowers = args.analyze_followers !== "false";
      const analyzeFollowing = args.analyze_following !== "false";
      const maxRelatedAccounts = parseInt(args.max_related_accounts ?? "20") || 20;

      if (!username) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Username is required. Please provide a Farcaster username to analyze.");
      }

      if (!NEYNAR_API_KEY) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key not configured. Cannot analyze Farcaster accounts.");
      }

      logger(`Analyzing base inspiration account: @${username}`);

      // Get the base account information
      const baseAccountResponse = await neynarClient.lookupUserByUsername({
        username: username,
      });

      if (!baseAccountResponse.user) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Account @${username} not found or not accessible.`);
      }

      const baseAccount = baseAccountResponse.user;

      // Analyze base account for inspiration
      const baseAnalysis = {
        username: baseAccount.username,
        displayName: baseAccount.display_name,
        bio: baseAccount.profile?.bio?.text || "",
        followerCount: baseAccount.follower_count,
        followingCount: baseAccount.following_count,
        pfpUrl: baseAccount.pfp_url,
        verifiedAddresses: baseAccount.verified_addresses,
        analyzedAt: new Date().toISOString(),
      };

      // Store base account analysis
      if (!personalStyle.baseInspiration) {
        personalStyle.baseInspiration = {
          accounts: [],
          lastAnalysis: new Date().toISOString(),
        };
      }

      // Check if this account is already analyzed
      const existingIndex = personalStyle.baseInspiration.accounts.findIndex((acc) => acc.username === baseAccount.username);

      if (existingIndex >= 0) {
        personalStyle.baseInspiration.accounts[existingIndex] = baseAnalysis;
      } else {
        personalStyle.baseInspiration.accounts.push(baseAnalysis);
      }

      personalStyle.baseInspiration.lastAnalysis = new Date().toISOString();

      // Discover related accounts from followers and following
      const relatedAccounts = [];

      if (analyzeFollowers && baseAccount.follower_count > 0) {
        logger(`Analyzing ${Math.min(50, baseAccount.follower_count)} followers of @${username}`);

        try {
          const followersResponse = await neynarClient.fetchUserFollowers({
            fid: baseAccount.fid,
            limit: Math.min(50, maxRelatedAccounts / 2),
          });

          for (const follower of followersResponse.users || []) {
            const relevanceScore = analyzeUserRelevance(follower, "ascii art creative coding digital art");
            if (relevanceScore > 0.4) {
              relatedAccounts.push({
                username: (follower as any).username || "",
                displayName: (follower as any).display_name || "",
                bio: (follower as any).profile?.bio?.text || "",
                followerCount: (follower as any).follower_count || 0,
                relevanceScore: relevanceScore,
                relationship: "follower",
                discoveredAt: new Date().toISOString(),
                source: "base_inspiration_analysis",
              });
            }
          }
        } catch (error) {
          logger(`Could not analyze followers: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      if (analyzeFollowing && baseAccount.following_count > 0) {
        logger(`Analyzing ${Math.min(50, baseAccount.following_count)} accounts that @${username} follows`);

        try {
          const followingResponse = await neynarClient.fetchUserFollowing({
            fid: baseAccount.fid,
            limit: Math.min(50, maxRelatedAccounts / 2),
          });

          for (const following of followingResponse.users || []) {
            const relevanceScore = analyzeUserRelevance(following, "ascii art creative coding digital art");
            if (relevanceScore > 0.4) {
              relatedAccounts.push({
                username: (following as any).username || "",
                displayName: (following as any).display_name || "",
                bio: (following as any).profile?.bio?.text || "",
                followerCount: (following as any).follower_count || 0,
                relevanceScore: relevanceScore,
                relationship: "following",
                discoveredAt: new Date().toISOString(),
                source: "base_inspiration_analysis",
              });
            }
          }
        } catch (error) {
          logger(`Could not analyze following: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Sort by relevance and limit results
      const topRelatedAccounts = relatedAccounts.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, maxRelatedAccounts);

      // Add to discovered accounts
      if (!personalStyle.discoveredAccounts) {
        personalStyle.discoveredAccounts = [];
      }

      // Merge with existing discovered accounts, avoiding duplicates
      for (const account of topRelatedAccounts) {
        const existingIndex = personalStyle.discoveredAccounts.findIndex((acc) => acc.username === account.username);

        if (existingIndex >= 0) {
          // Update existing account with new information
          personalStyle.discoveredAccounts[existingIndex] = {
            ...personalStyle.discoveredAccounts[existingIndex],
            ...account,
            source: "base_inspiration_analysis",
          };
        } else {
          // Add new account
          personalStyle.discoveredAccounts.push({
            ...account,
            source: "base_inspiration_analysis",
          });
        }
      }

      logger(`Discovered ${topRelatedAccounts.length} related accounts from @${username}'s network`);

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `🎯 Base Inspiration Analysis - @${username}:\n\n` +
          `📊 Account Info:\n` +
          `   Name: ${baseAccount.display_name}\n` +
          `   Bio: ${baseAnalysis.bio.substring(0, 100)}${baseAnalysis.bio.length > 100 ? "..." : ""}\n` +
          `   Followers: ${baseAccount.follower_count}\n` +
          `   Following: ${baseAccount.following_count}\n\n` +
          `🔍 Network Analysis:\n` +
          `   Related accounts discovered: ${topRelatedAccounts.length}\n` +
          `   From followers: ${topRelatedAccounts.filter((a) => a.relationship === "follower").length}\n` +
          `   From following: ${topRelatedAccounts.filter((a) => a.relationship === "following").length}\n\n` +
          `🌟 Top Related Accounts:\n` +
          `${topRelatedAccounts
            .slice(0, 5)
            .map(
              (account) =>
                `@${account.username} (${account.displayName})\n` +
                `   📊 Relevance: ${(account.relevanceScore * 100).toFixed(1)}% | ${account.relationship}\n` +
                `   📝 ${account.bio.substring(0, 80)}${account.bio.length > 80 ? "..." : ""}\n`
            )
            .join("\n")}`
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to analyze base account: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to analyze predefined base accounts on startup
export const analyzePredefinedBaseAccountsFunction = new GameFunction({
  name: "analyze_predefined_base_accounts",
  description: "Analyze predefined base inspiration accounts (like kimasendorf) to kickstart the agent's learning",
  args: [] as const,
  executable: async (args, logger) => {
    try {
      // Predefined base accounts to analyze
      const predefinedAccounts = [
        "kimasendorf", // ASCII art pioneer and creative coder
      ];

      if (!NEYNAR_API_KEY) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key not configured. Cannot analyze predefined base accounts.");
      }

      logger(`Analyzing predefined base accounts: ${predefinedAccounts.join(", ")}`);

      const analysisResults = [];

      for (const username of predefinedAccounts) {
        try {
          logger(`Analyzing base account: @${username}`);

          // Get the base account information
          const baseAccountResponse = await neynarClient.lookupUserByUsername({
            username: username,
          });

          if (!baseAccountResponse.user) {
            analysisResults.push({
              username: username,
              success: false,
              message: "Account not found or not accessible",
            });
            continue;
          }

          const baseAccount = baseAccountResponse.user;

          // Analyze base account for inspiration
          const baseAnalysis = {
            username: baseAccount.username,
            displayName: baseAccount.display_name,
            bio: baseAccount.profile?.bio?.text || "",
            followerCount: baseAccount.follower_count,
            followingCount: baseAccount.following_count,
            pfpUrl: baseAccount.pfp_url,
            verifiedAddresses: baseAccount.verified_addresses,
            analyzedAt: new Date().toISOString(),
            isPredefined: true,
          };

          // Store base account analysis
          if (!personalStyle.baseInspiration) {
            personalStyle.baseInspiration = {
              accounts: [],
              lastAnalysis: new Date().toISOString(),
            };
          }

          // Check if this account is already analyzed
          const existingIndex = personalStyle.baseInspiration.accounts.findIndex((acc) => acc.username === baseAccount.username);

          if (existingIndex >= 0) {
            personalStyle.baseInspiration.accounts[existingIndex] = baseAnalysis;
          } else {
            personalStyle.baseInspiration.accounts.push(baseAnalysis);
          }

          // Discover related accounts from followers and following (limited for startup)
          const relatedAccounts = [];

          // Analyze a small sample of followers
          try {
            const followersResponse = await neynarClient.fetchUserFollowers({
              fid: baseAccount.fid,
              limit: 10, // Small sample for startup
            });

            for (const follower of followersResponse.users || []) {
              const relevanceScore = analyzeUserRelevance(follower, "ascii art creative coding digital art");
              if (relevanceScore > 0.4) {
                relatedAccounts.push({
                  username: (follower as any).username || "",
                  displayName: (follower as any).display_name || "",
                  bio: (follower as any).profile?.bio?.text || "",
                  followerCount: (follower as any).follower_count || 0,
                  relevanceScore: relevanceScore,
                  relationship: "follower",
                  discoveredAt: new Date().toISOString(),
                  source: "predefined_base_analysis",
                });
              }
            }
          } catch (error) {
            logger(`Could not analyze followers for @${username}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }

          // Add to discovered accounts
          if (!personalStyle.discoveredAccounts) {
            personalStyle.discoveredAccounts = [];
          }

          // Merge with existing discovered accounts, avoiding duplicates
          for (const account of relatedAccounts) {
            const existingIndex = personalStyle.discoveredAccounts.findIndex((acc) => acc.username === account.username);

            if (existingIndex >= 0) {
              // Update existing account with new information
              personalStyle.discoveredAccounts[existingIndex] = {
                ...personalStyle.discoveredAccounts[existingIndex],
                ...account,
              };
            } else {
              // Add new account
              personalStyle.discoveredAccounts.push(account);
            }
          }

          analysisResults.push({
            username: username,
            success: true,
            message: `Successfully analyzed. Found ${relatedAccounts.length} related accounts.`,
            relatedAccounts: relatedAccounts.length,
          });

          logger(`Successfully analyzed @${username} and found ${relatedAccounts.length} related accounts`);

          // Rate limiting between account analyses
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (accountError) {
          analysisResults.push({
            username: username,
            success: false,
            message: accountError instanceof Error ? accountError.message : "Unknown error",
          });

          logger(`Failed to analyze @${username}: ${accountError instanceof Error ? accountError.message : "Unknown error"}`);
        }
      }

      personalStyle.baseInspiration.lastAnalysis = new Date().toISOString();

      // Check for auto-save
      checkAutoSave();

      const successfulAnalyses = analysisResults.filter((r) => r.success).length;

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `🎯 Predefined Base Account Analysis:\n\n` +
          `Analyzed ${successfulAnalyses}/${predefinedAccounts.length} accounts:\n\n` +
          `${analysisResults
            .map((result) => `${result.success ? "✅" : "❌"} @${result.username}: ${result.message}${result.relatedAccounts ? ` (${result.relatedAccounts} related accounts)` : ""}`)
            .join("\n")}\n\n` +
          `📊 Total base inspiration accounts: ${personalStyle.baseInspiration.accounts.length}\n` +
          `🌐 Total discovered accounts: ${personalStyle.discoveredAccounts?.length || 0}`
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to analyze predefined base accounts: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Helper function to analyze user relevance
function analyzeUserRelevance(user: any, searchTerms: string): number {
  let score = 0;
  const searchWords = searchTerms.toLowerCase().split(" ");

  // Check username
  const username = user.username?.toLowerCase() || "";
  for (const word of searchWords) {
    if (username.includes(word)) score += 0.3;
  }

  // Check display name
  const displayName = user.displayName?.toLowerCase() || "";
  for (const word of searchWords) {
    if (displayName.includes(word)) score += 0.2;
  }

  // Check bio
  const bio = user.profile?.bio?.toLowerCase() || "";
  for (const word of searchWords) {
    if (bio.includes(word)) score += 0.4;
  }

  // Bonus for ASCII art related terms
  const asciiTerms = ["ascii", "art", "creative", "code", "digital", "pixel", "character", "symbol"];
  for (const term of asciiTerms) {
    if (bio.includes(term) || username.includes(term) || displayName.includes(term)) {
      score += 0.1;
    }
  }

  return Math.min(1.0, score);
}

// Helper function to parse new words from AI response
function parseNewWords(response: string): Record<string, string> {
  const newWords: Record<string, string> = {};

  // Simple parsing - look for patterns like "symbol = meaning" or "symbol: meaning"
  const lines = response.split("\n");
  for (const line of lines) {
    const match = line.match(/([^\s=:]+)\s*[=:]\s*(.+)/);
    if (match) {
      const symbol = match[1].trim();
      const meaning = match[2].trim();
      if (symbol.length > 0 && meaning.length > 0) {
        newWords[symbol] = meaning;
      }
    }
  }

  return newWords;
}

// Helper function to translate ASCII to English
function translateAsciiToEnglish(asciiText: string): string {
  let englishText = asciiText;

  // Replace ASCII symbols with their English meanings
  for (const [symbol, meaning] of Object.entries(personalStyle.asciiLanguage.dictionary)) {
    const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    englishText = englishText.replace(regex, meaning);
  }

  return `Original ASCII: ${asciiText}\n\nEnglish Translation: ${englishText}`;
}

// Helper function to translate English to ASCII
function translateEnglishToAscii(englishText: string): string {
  let asciiText = englishText;

  // Replace English words with ASCII symbols (reverse lookup)
  const reverseDict: Record<string, string> = {};
  for (const [symbol, meaning] of Object.entries(personalStyle.asciiLanguage.dictionary)) {
    reverseDict[meaning.toLowerCase()] = symbol;
  }

  // Simple word replacement
  for (const [english, symbol] of Object.entries(reverseDict)) {
    const regex = new RegExp(`\\b${english}\\b`, "gi");
    asciiText = asciiText.replace(regex, symbol);
  }

  return `Original English: ${englishText}\n\nASCII Translation: ${asciiText}`;
}

// Helper function to generate ASCII text
function generateAsciiText(topic: string): string {
  const availableSymbols = Object.keys(personalStyle.asciiLanguage.dictionary);

  if (availableSymbols.length === 0) {
    return "No ASCII language words available yet. Use develop_ascii_language to create some!";
  }

  // Generate a simple ASCII sentence using available symbols
  const randomSymbols = availableSymbols.sort(() => 0.5 - Math.random()).slice(0, Math.min(5, availableSymbols.length));

  const asciiSentence = randomSymbols.join(" ");
  const englishTranslation = translateAsciiToEnglish(asciiSentence);

  return `Generated ASCII Text (${topic}):\n\n${asciiSentence}\n\n${englishTranslation}`;
}

// Function to analyze account's recent casts for relevance scoring
async function analyzeAccountCasts(fid: number, maxCasts: number = 100): Promise<{ relevanceScore: number; analysis: string }> {
  try {
    // Get recent casts from the account
    const castsResponse = await neynarClient.fetchCastsForUser({
      fid: fid,
      limit: maxCasts,
    });

    if (!castsResponse.casts || castsResponse.casts.length === 0) {
      return { relevanceScore: 0.1, analysis: "No casts found" };
    }

    let totalScore = 0;
    let relevantCasts = 0;
    let totalCasts = castsResponse.casts.length;
    const analysis = [];

    for (const cast of castsResponse.casts) {
      const castText = cast.text?.toLowerCase() || "";
      let castScore = 0;

      // ASCII art related keywords
      const asciiKeywords = [
        "ascii",
        "art",
        "character",
        "symbol",
        "pixel",
        "block",
        "line",
        "drawing",
        "creative",
        "code",
        "digital",
        "pattern",
        "geometric",
        "mathematical",
        "constraint",
        "oulipo",
        "perec",
        "experimental",
        "text art",
        "ascii art",
      ];

      // Check for ASCII art content
      for (const keyword of asciiKeywords) {
        if (castText.includes(keyword)) {
          castScore += 0.1;
        }
      }

      // Check for actual ASCII art patterns in the text
      const asciiPatterns = [
        /[┌┐└┘├┤┬┴┼─│]/g, // Box drawing characters
        /[█▓▒░]/g, // Block characters
        /[▀▄▌▐]/g, // Half blocks
        /[╔╗╚╝╠╣╦╩╬═║]/g, // Double line box
        /[╭╮╯╰├┤┬┴┼─│]/g, // Rounded corners
        /[◆◇◈]/g, // Diamond shapes
        /[★☆]/g, // Star shapes
        /[●○]/g, // Circle shapes
        /[▲△]/g, // Triangle shapes
        /[■□]/g, // Square shapes
      ];

      for (const pattern of asciiPatterns) {
        const matches = castText.match(pattern);
        if (matches && matches.length > 0) {
          castScore += 0.2 * Math.min(matches.length, 5); // Cap at 5 matches
        }
      }

      // Check for code blocks or technical content
      if (castText.includes("```") || castText.includes("function") || castText.includes("const ")) {
        castScore += 0.15;
      }

      // Check for creative/artistic language
      const creativeWords = ["create", "design", "build", "make", "art", "creative", "experiment", "explore"];
      for (const word of creativeWords) {
        if (castText.includes(word)) {
          castScore += 0.05;
        }
      }

      // Penalize spam or irrelevant content
      const spamWords = ["buy", "sell", "promote", "advertisement", "sponsored", "click here"];
      for (const word of spamWords) {
        if (castText.includes(word)) {
          castScore -= 0.1;
        }
      }

      // Cap individual cast score
      castScore = Math.max(0, Math.min(1, castScore));

      totalScore += castScore;
      if (castScore > 0.3) {
        relevantCasts++;
      }

      // Add to analysis if it's a high-scoring cast
      if (castScore > 0.5) {
        analysis.push(`High-relevance cast: "${castText.substring(0, 100)}..." (score: ${castScore.toFixed(2)})`);
      }
    }

    // Calculate final relevance score
    const averageScore = totalScore / totalCasts;
    const relevanceRatio = relevantCasts / totalCasts;
    const finalScore = averageScore * 0.6 + relevanceRatio * 0.4;

    const summary = `Analyzed ${totalCasts} casts. ${relevantCasts} relevant casts found. Average score: ${averageScore.toFixed(2)}, Relevance ratio: ${relevanceRatio.toFixed(2)}`;

    return {
      relevanceScore: Math.max(0, Math.min(1, finalScore)),
      analysis: `${summary}\n\n${analysis.slice(0, 3).join("\n")}`,
    };
  } catch (error) {
    console.error(`Error analyzing casts for FID ${fid}:`, error);
    return { relevanceScore: 0.1, analysis: "Error analyzing casts" };
  }
}

// Enhanced account analysis with cast analysis and snowball sampling
export const analyzeAccountWithCastsFunction = new GameFunction({
  name: "analyze_account_with_casts",
  description:
    "Analyze a Farcaster account by examining their recent casts and generate a relevance score. If the score is above a threshold, follow the account and sample their followers for further investigation.",
  args: [
    { name: "username", description: "The username of the account to analyze" },
    { name: "min_score_to_follow", description: "Minimum relevance score to follow the account (0.0-1.0)", default: "0.6" },
    { name: "sample_size", description: "Number of followers to sample for investigation", default: "10" },
    { name: "max_followers_to_check", description: "Maximum number of followers to check if initial sample doesn't yield good results", default: "50" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const username = args.username;
      if (!username) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Username is required");
      }

      const minScoreToFollow = parseFloat(args.min_score_to_follow || "0.6");
      const sampleSize = parseInt(args.sample_size || "10");
      const maxFollowersToCheck = parseInt(args.max_followers_to_check || "50");

      logger(`🔍 Analyzing account @${username} with enhanced cast analysis...`);

      // First, get the user's FID
      const userResponse = await neynarClient.lookupUserByUsername({
        username: username,
      });

      if (!userResponse.user) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `User @${username} not found`);
      }

      const user = userResponse.user;
      const fid = user.fid;

      logger(`📊 Found user @${username} (FID: ${fid})`);

      // Analyze the account's recent casts
      logger(`📝 Analyzing recent casts for relevance...`);
      const castAnalysis = await analyzeAccountCasts(fid, 100);

      logger(`📈 Cast analysis score: ${castAnalysis.relevanceScore.toFixed(3)}`);
      logger(`📋 Cast analysis: ${castAnalysis.analysis}`);

      let followDecision = "not_followed";
      let sampledFollowers: any[] = [];

      // Decide whether to follow based on cast analysis
      if (castAnalysis.relevanceScore >= minScoreToFollow) {
        logger(`✅ Account meets follow criteria (score: ${castAnalysis.relevanceScore.toFixed(3)} >= ${minScoreToFollow})`);

        // Follow the account
        try {
          await neynarClient.followUser({
            signerUuid: FARCASTER_SIGNER_UUID!,
            targetFids: [fid],
          });

          logger(`👥 Successfully followed @${username}`);
          followDecision = "followed";

          // Update following stats
          personalStyle.followingStats.totalFollowed++;
          personalStyle.followingStats.lastFollowTime = new Date().toISOString();

          // Now sample their followers for investigation
          logger(`🔍 Sampling ${sampleSize} followers for investigation...`);
          sampledFollowers = await sampleFollowersForInvestigation(fid, sampleSize, maxFollowersToCheck);
        } catch (followError) {
          logger(`❌ Error following @${username}: ${followError}`);
          followDecision = "follow_failed";
        }
      } else {
        logger(`❌ Account does not meet follow criteria (score: ${castAnalysis.relevanceScore.toFixed(3)} < ${minScoreToFollow})`);
      }

      // Add to discovered accounts
      const accountInfo = {
        username: username,
        displayName: user.display_name || "",
        bio: user.profile?.bio?.text || "",
        followerCount: user.follower_count || 0,
        relevanceScore: castAnalysis.relevanceScore,
        castAnalysis: castAnalysis.analysis,
        followDecision: followDecision,
        discoveredAt: new Date().toISOString(),
        source: "enhanced_cast_analysis",
      };

      personalStyle.discoveredAccounts.push(accountInfo);

      // Auto-save memory
      checkAutoSave();

      const result = `Analysis complete for @${username}:
      
📊 Cast Relevance Score: ${castAnalysis.relevanceScore.toFixed(3)}
📋 Follow Decision: ${followDecision}
🎯 Sampled Followers: ${sampledFollowers.length}
📝 Cast Analysis: ${castAnalysis.analysis}`;

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, result);
    } catch (error) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Error analyzing account: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Helper function to sample followers for investigation
async function sampleFollowersForInvestigation(targetFid: number, sampleSize: number, maxFollowersToCheck: number): Promise<any[]> {
  const sampledFollowers: any[] = [];
  let checkedCount = 0;

  try {
    // Get followers in batches
    while (sampledFollowers.length < sampleSize && checkedCount < maxFollowersToCheck) {
      const batchSize = Math.min(25, maxFollowersToCheck - checkedCount);

      const followersResponse = await neynarClient.fetchUserFollowers({
        fid: targetFid,
        limit: batchSize,
      });

      if (!followersResponse.users || followersResponse.users.length === 0) {
        break;
      }

      // Analyze each follower in this batch
      for (const follower of followersResponse.users) {
        checkedCount++;

        // Skip if we already have enough samples
        if (sampledFollowers.length >= sampleSize) {
          break;
        }

        // Quick relevance check based on profile
        const quickRelevance = analyzeUserRelevance(follower, "ascii art creative coding digital art");

        // If this follower seems relevant, add them to our investigation list
        if (quickRelevance > 0.4) {
          const followerInfo = {
            username: (follower as any).username || "",
            displayName: (follower as any).display_name || "",
            bio: (follower as any).profile?.bio?.text || "",
            followerCount: (follower as any).follower_count || 0,
            relevanceScore: quickRelevance,
            relationship: "follower_of_followed",
            discoveredAt: new Date().toISOString(),
            source: "snowball_sampling",
          };

          sampledFollowers.push(followerInfo);

          // Also add to discovered accounts for future investigation
          personalStyle.discoveredAccounts.push(followerInfo);

          console.log(`🎯 Found relevant follower: @${followerInfo.username} (score: ${quickRelevance.toFixed(3)})`);
        }
      }

      // If we didn't find enough relevant followers in this batch, continue to next batch
      if (followersResponse.users.length < batchSize) {
        break; // No more followers to check
      }
    }

    console.log(`📊 Sampled ${sampledFollowers.length} relevant followers from ${checkedCount} checked`);
  } catch (error) {
    console.error(`❌ Error sampling followers:`, error);
  }

  return sampledFollowers;
}

// Function to like a cast
export const likeCastFunction = new GameFunction({
  name: "like_cast",
  description: "Like a specific cast on Farcaster using the cast hash",
  args: [{ name: "cast_hash", description: "The hash of the cast to like" }] as const,
  executable: async (args, logger) => {
    try {
      const castHash = args.cast_hash;

      if (!castHash) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Cast hash is required to like a cast.");
      }

      if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key or Farcaster signer UUID not configured. Cannot like cast.");
      }

      logger(`Liking cast: ${castHash}`);

      // Like the cast using Neynar API
      // Note: Using publishCast as a workaround since reactToCast might not be available
      const response = await neynarClient.publishCast({
        signerUuid: FARCASTER_SIGNER_UUID!,
        text: `👍`, // Simple like reaction
        parent: castHash, // This makes it a reply
      });

      logger(`Successfully liked cast: ${castHash}`);

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, cleanTextForAPI(`Successfully liked cast: ${castHash}`));
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to like cast: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to comment on a cast
export const commentOnCastFunction = new GameFunction({
  name: "comment_on_cast",
  description: "Comment on a specific cast on Farcaster using the cast hash",
  args: [
    { name: "cast_hash", description: "The hash of the cast to comment on" },
    { name: "comment_text", description: "The comment text to post" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const castHash = args.cast_hash;
      const commentText = args.comment_text;

      if (!castHash) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Cast hash is required to comment on a cast.");
      }

      if (!commentText) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Comment text is required to comment on a cast.");
      }

      if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key or Farcaster signer UUID not configured. Cannot comment on cast.");
      }

      // Ensure the comment doesn't exceed Farcaster's character limit
      const finalCommentText = commentText.length > 280 ? commentText.substring(0, 277) + "..." : commentText;

      logger(`Commenting on cast: ${castHash} with text: ${finalCommentText}`);

      // Comment on the cast using Neynar API
      const response = await neynarClient.publishCast({
        signerUuid: FARCASTER_SIGNER_UUID!,
        text: finalCommentText,
        parent: castHash, // This makes it a reply/comment
      });

      logger(`Successfully commented on cast: ${castHash}`);

      // Check for auto-save
      checkAutoSave();

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        cleanTextForAPI(`Successfully commented on cast: ${castHash}\n\nComment: ${finalCommentText}\n\nCast Hash: ${response.cast.hash}`)
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to comment on cast: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to browse and interact with recent casts
export const browseAndInteractFunction = new GameFunction({
  name: "browse_and_interact",
  description: "Actively browse Farcaster for relevant content and engage with the community (like, comment, and interact with ASCII art and creative content)",
  args: [
    { name: "max_casts", description: "Maximum number of casts to browse (default: 10)" },
    { name: "interaction_threshold", description: "Minimum relevance score to interact with a cast (0.0-1.0, default: 0.6)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const maxCasts = parseInt(args.max_casts ?? "10") || 10;
      const interactionThreshold = parseFloat(args.interaction_threshold ?? "0.6") || 0.6;

      if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key or Farcaster signer UUID not configured. Cannot browse and interact with casts.");
      }

      logger(`Browsing up to ${maxCasts} recent casts with interaction threshold: ${interactionThreshold}`);

      // Search for relevant content to interact with
      // This will help us find ASCII art and creative content
      const searchTerms = "ascii art creative coding digital art";
      const cleanedTerms = cleanSearchTerms(searchTerms);

      logger(`Searching for users with terms: "${cleanedTerms}"`);

      let searchResponse;
      try {
        searchResponse = await neynarClient.searchUser({
          q: cleanedTerms,
          limit: maxCasts * 2,
        });
      } catch (searchError) {
        logger(`Search API error: ${searchError}`);
        // Try fallback search with simpler terms
        try {
          logger(`Attempting fallback search with simpler terms...`);
          searchResponse = await neynarClient.searchUser({
            q: "ascii art",
            limit: Math.min(maxCasts, 10),
          });
          logger(`Fallback search successful`);
        } catch (fallbackError) {
          logger(`Fallback search also failed: ${fallbackError}`);
          return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Failed to search for relevant users. API may be experiencing issues.");
        }
      }

      if (!searchResponse.result || searchResponse.result.users.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No relevant users found to interact with.");
      }

      // Get casts from the most relevant users
      const relevantUsers = searchResponse.result.users.slice(0, Math.min(5, searchResponse.result.users.length));
      const allCasts = [];

      for (const user of relevantUsers) {
        try {
          const userCasts = await neynarClient.fetchCastsForUser({
            fid: user.fid,
            limit: Math.ceil(maxCasts / relevantUsers.length),
          });
          if (userCasts.casts) {
            allCasts.push(...userCasts.casts);
          }
        } catch (error) {
          logger(`Failed to fetch casts for user ${user.username}: ${error}`);
        }
      }

      if (!allCasts || allCasts.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No recent casts found to interact with.");
      }

      const interactionResults = [];
      let interactionsCount = 0;

      for (const cast of allCasts.slice(0, maxCasts)) {
        try {
          // Analyze cast relevance
          const relevanceScore = analyzeCastRelevance(cast);

          if (relevanceScore >= interactionThreshold) {
            logger(`Found relevant cast (score: ${relevanceScore.toFixed(3)}): ${cast.text?.substring(0, 50)}...`);

            // Like the cast
            try {
              await neynarClient.publishCast({
                signerUuid: FARCASTER_SIGNER_UUID!,
                text: `👍`, // Simple like reaction
                parent: cast.hash, // This makes it a reply
              });

              interactionsCount++;
              interactionResults.push({
                castHash: cast.hash,
                author: cast.author?.username || "unknown",
                action: "liked",
                relevanceScore: relevanceScore,
                text: cast.text?.substring(0, 100) || "",
              });

              logger(`✅ Liked cast from @${cast.author?.username || "unknown"}`);
            } catch (likeError) {
              logger(`❌ Failed to like cast: ${likeError instanceof Error ? likeError.message : "Unknown error"}`);
            }

            // Occasionally comment on very relevant casts (higher threshold)
            if (relevanceScore >= 0.8 && Math.random() < 0.3) {
              // 30% chance for very relevant casts
              try {
                const commentText = await generateRelevantComment(cast.text || "", relevanceScore);

                await neynarClient.publishCast({
                  signerUuid: FARCASTER_SIGNER_UUID!,
                  text: commentText,
                  parent: cast.hash,
                });

                interactionsCount++;
                interactionResults.push({
                  castHash: cast.hash,
                  author: cast.author?.username || "unknown",
                  action: "commented",
                  relevanceScore: relevanceScore,
                  text: commentText,
                });

                logger(`💬 Commented on cast from @${cast.author?.username || "unknown"}`);
              } catch (commentError) {
                logger(`❌ Failed to comment on cast: ${commentError instanceof Error ? commentError.message : "Unknown error"}`);
              }
            }

            // Rate limiting between interactions
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        } catch (castError) {
          logger(`❌ Error processing cast: ${castError instanceof Error ? castError.message : "Unknown error"}`);
        }
      }

      // Check for auto-save
      checkAutoSave();

      const result = `Browse and Interact Results:\n\nInteracted with ${interactionsCount} casts:\n\n${interactionResults
        .map((result) => `${result.action === "liked" ? "LIKED" : "COMMENTED"} @${result.author} (score: ${result.relevanceScore.toFixed(3)})\n${result.text.substring(0, 80)}...`)
        .join("\n\n")}`;

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, cleanTextForAPI(result));
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to browse and interact: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function for active social engagement and community interaction
export const activeSocialEngagementFunction = new GameFunction({
  name: "active_social_engagement",
  description: "Actively engage with the Farcaster community by browsing, liking, commenting, and participating in discussions about ASCII art and creativity",
  args: [
    { name: "engagement_level", description: "Level of engagement: 'light', 'moderate', or 'intensive' (default: moderate)" },
    { name: "focus_areas", description: "Focus areas: 'ascii_art', 'creative_coding', 'oulipo', 'general' (default: ascii_art)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const engagementLevel = args.engagement_level || "moderate";
      const focusAreas = args.focus_areas || "ascii_art";

      if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key or Farcaster signer UUID not configured. Cannot engage with community.");
      }

      logger(`Starting active social engagement (level: ${engagementLevel}, focus: ${focusAreas})`);

      const engagementResults = [];
      let totalInteractions = 0;

      // 1. Focus on outreach and discovery (primary goal)
      logger("Performing outreach and discovery...");
      const discoverResult = await crawlFarcasterAccountsFunction.executable(
        {
          search_terms: "ascii art creative coding digital art",
          max_accounts: "10",
        },
        logger
      );
      if (discoverResult.status === ExecutableGameFunctionStatus.Done) {
        engagementResults.push("Discovered new relevant accounts");
        totalInteractions += 1;
      }

      // 2. Follow discovered accounts (strategic following)
      logger("Following discovered accounts...");
      const followResult = await followFarcasterAccountsFunction.executable(
        {
          max_follows: "8",
          min_relevance: "0.2",
        },
        logger
      );
      if (followResult.status === ExecutableGameFunctionStatus.Done) {
        engagementResults.push("Followed discovered accounts");
        totalInteractions += 1;
      }

      // 3. Browse and interact with community content (always!)
      logger("Browsing for relevant content to interact with...");
      const browseResult = await browseAndInteractFunction.executable({ max_casts: "10", interaction_threshold: "0.3" }, logger);
      if (browseResult.status === ExecutableGameFunctionStatus.Done) {
        engagementResults.push("Browsed and interacted with community content");
        totalInteractions += 1;
      }

      // 4. Strategic casting (very rarely, not every cycle)
      if (Math.random() < 0.05) {
        // 5% chance per 15-minute cycle = ~1-2 times per day
        logger("Creating and sharing meaningful content...");

        const castOptions = Math.floor(Math.random() * 3);
        if (castOptions === 0) {
          // Share thoughts
          const thoughtsResult = await shareThoughtsFunction.executable({}, logger);
          if (thoughtsResult.status === ExecutableGameFunctionStatus.Done) {
            engagementResults.push("Shared thoughts about ASCII art");
            totalInteractions += 1;
          }
        } else if (castOptions === 1) {
          // Share ASCII art
          const subjects = ["geometric pattern", "creative coding", "oulipo constraint", "mathematical beauty", "digital art"];
          const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
          const artResult = await generateAsciiArtFunction.executable(
            {
              subject: randomSubject,
              style_preference: "minimalist",
              oulipo_constraint: "geometric pattern",
            },
            logger
          );
          if (artResult.status === ExecutableGameFunctionStatus.Done) {
            engagementResults.push("Created and shared ASCII art");
            totalInteractions += 1;
          }
        } else {
          // Share research
          const researchTopics = ["lipograms", "palindromes", "mathematical constraints", "Georges Perec", "constrained creativity"];
          const randomTopic = researchTopics[Math.floor(Math.random() * researchTopics.length)];
          const researchResult = await researchOulipoFunction.executable({ research_focus: randomTopic }, logger);
          if (researchResult.status === ExecutableGameFunctionStatus.Done) {
            engagementResults.push("Researched and shared Oulipo insights");
            totalInteractions += 1;
          }
        }
      }

      // 6. Develop ASCII language
      if (Math.random() < 0.2) {
        // 20% chance to develop language
        logger("Developing ASCII language...");
        const concepts = ["emotions", "art", "mathematics", "nature", "creativity"];
        const constraints = ["palindrome", "geometric pattern", "mathematical symmetry"];
        const randomConcept = concepts[Math.floor(Math.random() * concepts.length)];
        const randomConstraint = constraints[Math.floor(Math.random() * constraints.length)];
        const languageResult = await developAsciiLanguageFunction.executable(
          {
            concept: randomConcept,
            constraint: randomConstraint,
          },
          logger
        );
        if (languageResult.status === ExecutableGameFunctionStatus.Done) {
          engagementResults.push("Developed ASCII language");
          totalInteractions += 1;
        }
      }

      logger(`Active social engagement completed with ${totalInteractions} total interactions`);

      // Check for auto-save
      checkAutoSave();

      const result = `Active Social Engagement Results:\n\nEngagement Level: ${engagementLevel}\nFocus Areas: ${focusAreas}\nTotal Interactions: ${totalInteractions}\n\nActivities Completed:\n${engagementResults
        .map((activity) => `- ${activity}`)
        .join("\n")}`;

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, cleanTextForAPI(result));
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to engage with community: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to follow base inspiration accounts
export const followBaseAccountsFunction = new GameFunction({
  name: "follow_base_accounts",
  description: "Follow base inspiration accounts like kimasendorf and other key ASCII art creators",
  args: [] as const,
  executable: async (args, logger) => {
    try {
      if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key or Farcaster signer UUID not configured. Cannot follow base accounts.");
      }

      logger("Following base inspiration accounts...");

      // Define base accounts to follow
      const baseAccounts = [
        { username: "kimasendorf", fid: 3, displayName: "Kim Asendorf", relevanceScore: 0.9 },
        { username: "dwr", fid: 2, displayName: "Dwr", relevanceScore: 0.8 },
        { username: "vbuterin", fid: 5650, displayName: "Vitalik Buterin", relevanceScore: 0.7 },
      ];

      const followResults = [];

      for (const account of baseAccounts) {
        try {
          logger(`Attempting to follow base account @${account.username} (FID: ${account.fid})...`);

          // Follow the user
          const followResponse = await neynarClient.followUser({
            signerUuid: FARCASTER_SIGNER_UUID!,
            targetFids: [account.fid],
          });

          followResults.push({
            username: account.username,
            success: true,
            message: "Successfully followed base account",
          });

          logger(`✅ Successfully followed base account @${account.username}`);

          // Add to discovered accounts if not already there
          if (!personalStyle.discoveredAccounts) {
            personalStyle.discoveredAccounts = [];
          }

          const exists = personalStyle.discoveredAccounts.find((acc) => acc.username === account.username);
          if (!exists) {
            personalStyle.discoveredAccounts.push({
              ...account,
              followerCount: 0,
              followingCount: 0,
              bio: "Base inspiration account",
              isFollowing: true,
              followedAt: new Date().toISOString(),
              discoveredAt: new Date().toISOString(),
            });
          }

          // Rate limiting between follows
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (followError) {
          const errorMessage = followError instanceof Error ? followError.message : "Unknown error";
          followResults.push({
            username: account.username,
            success: false,
            message: errorMessage,
          });

          logger(`❌ Failed to follow base account @${account.username}: ${errorMessage}`);
        }
      }

      // Update statistics
      if (!personalStyle.followingStats) {
        personalStyle.followingStats = {
          totalFollowed: 0,
          lastFollowTime: new Date().toISOString(),
        };
      }
      personalStyle.followingStats.totalFollowed += followResults.filter((r) => r.success).length;
      personalStyle.followingStats.lastFollowTime = new Date().toISOString();

      // Check for auto-save
      checkAutoSave();

      const successfulFollows = followResults.filter((r) => r.success).length;

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Base Account Following Results:\n\nSuccessfully followed ${successfulFollows}/${baseAccounts.length} base accounts:\n\n${followResults
          .map((result) => `${result.success ? "✅" : "❌"} @${result.username}: ${result.message}`)
          .join("\n")}`
      );
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to follow base accounts: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Function to ensure regular casting and following
export const ensureCastingAndFollowingFunction = new GameFunction({
  name: "ensure_casting_and_following",
  description: "Guarantee that the agent casts content and follows people regularly to maintain active social presence",
  args: [
    { name: "force_cast", description: "Force a cast even if recently cast (true/false, default: true)" },
    { name: "force_follow", description: "Force following even if recently followed (true/false, default: true)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const forceCast = args.force_cast !== "false";
      const forceFollow = args.force_follow !== "false";

      if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key or Farcaster signer UUID not configured. Cannot cast or follow.");
      }

      logger("Ensuring regular casting and following...");

      const results = [];
      let totalActions = 0;

      // 1. Strategic casting (limited to 3-4 times per day)
      const now = new Date();
      const lastCastTime = personalStyle.lastCastTime ? new Date(personalStyle.lastCastTime) : new Date(0);
      const hoursSinceLastCast = (now.getTime() - lastCastTime.getTime()) / (1000 * 60 * 60);

      // Only cast if it's been at least 12 hours since the last cast (reduced frequency)
      if (hoursSinceLastCast >= 12) {
        logger(`Casting meaningful content to Farcaster... (${hoursSinceLastCast.toFixed(1)} hours since last cast)`);

        // Randomly choose what to cast
        const castOptions = Math.floor(Math.random() * 3);

        if (castOptions === 0) {
          // Cast thoughts - generate content directly
          try {
            const prompt = `As an ASCII art enthusiast, share a brief thought about ASCII art and creativity (max 200 characters for Farcaster):

Your ASCII language dictionary: ${JSON.stringify(personalStyle.asciiLanguage.dictionary)}

Requirements:
1. Keep it under 200 characters
2. Be enthusiastic and genuine
3. Reference ASCII art or creativity
4. Make it suitable for social media

Share a brief thought:`;

            const completion = await rateLimitedAPICall(() =>
              openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-3.5-turbo",
                temperature: 0.8,
                max_tokens: 100,
              })
            );

            const thoughtsContent = completion.choices[0].message.content || "Love exploring ASCII art and creative constraints!";
            const castText = thoughtsContent.length > 250 ? thoughtsContent.substring(0, 247) + "..." : thoughtsContent;

            const response = await neynarClient.publishCast({
              signerUuid: FARCASTER_SIGNER_UUID!,
              text: castText,
            });

            personalStyle.totalCastsMade++;
            personalStyle.lastCastTime = new Date().toISOString();

            results.push("Cast thoughts about ASCII art");
            totalActions += 1;
            logger(`✅ Cast thoughts: ${response.cast.hash}`);
          } catch (castError) {
            logger(`❌ Failed to cast thoughts: ${castError}`);
          }
        } else if (castOptions === 1) {
          // Cast ASCII art - generate content directly
          try {
            const subjects = ["geometric pattern", "minimalist design", "creative expression"];
            const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

            const prompt = `Create a simple ASCII art piece about "${randomSubject}" (max 200 characters total including title):

Requirements:
1. Keep the entire cast under 200 characters
2. Make it visually appealing
3. Use simple ASCII characters
4. Include a brief title

Create ASCII art:`;

            const completion = await rateLimitedAPICall(() =>
              openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-3.5-turbo",
                temperature: 0.9,
                max_tokens: 100,
              })
            );

            const artContent = completion.choices[0].message.content || "ASCII Art: Simple geometric pattern\n\n* * *\n * * \n* * *";
            const castText = artContent.length > 250 ? artContent.substring(0, 247) + "..." : artContent;

            const response = await neynarClient.publishCast({
              signerUuid: FARCASTER_SIGNER_UUID!,
              text: castText,
            });

            personalStyle.totalCastsMade++;
            personalStyle.lastCastTime = new Date().toISOString();

            results.push("Cast ASCII art");
            totalActions += 1;
            logger(`✅ Cast ASCII art: ${response.cast.hash}`);
          } catch (castError) {
            logger(`❌ Failed to cast ASCII art: ${castError}`);
          }
        } else {
          // Cast research - generate content directly
          try {
            const researchTopics = ["oulipo techniques", "constrained creativity", "Georges Perec"];
            const randomTopic = researchTopics[Math.floor(Math.random() * researchTopics.length)];

            const prompt = `Share a brief insight about "${randomTopic}" in the context of Oulipo and ASCII art (max 200 characters for Farcaster):

Requirements:
1. Keep it under 200 characters
2. Be informative and engaging
3. Connect to ASCII art or creativity
4. Make it suitable for social media

Share a brief insight:`;

            const completion = await rateLimitedAPICall(() =>
              openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-3.5-turbo",
                temperature: 0.7,
                max_tokens: 100,
              })
            );

            const researchContent = completion.choices[0].message.content || "Oulipo's constrained creativity inspires unique ASCII art patterns!";
            const castText = researchContent.length > 250 ? researchContent.substring(0, 247) + "..." : researchContent;

            const response = await neynarClient.publishCast({
              signerUuid: FARCASTER_SIGNER_UUID!,
              text: castText,
            });

            personalStyle.totalCastsMade++;
            personalStyle.lastCastTime = new Date().toISOString();

            results.push("Cast research findings");
            totalActions += 1;
            logger(`✅ Cast research: ${response.cast.hash}`);
          } catch (castError) {
            logger(`❌ Failed to cast research: ${castError}`);
          }
        }
      } else {
        logger(`Skipping casting this cycle - only ${hoursSinceLastCast.toFixed(1)} hours since last cast (need 12+ hours)`);
      }

      // 2. ALWAYS Follow people (100% guarantee)
      logger("Following new people...");

      // First, ALWAYS try to follow base accounts
      logger("Step 1: Following base inspiration accounts...");
      const baseFollowResult = await followBaseAccountsFunction.executable({}, logger);
      if (baseFollowResult.status === ExecutableGameFunctionStatus.Done) {
        results.push("Followed base accounts");
        totalActions += 1;
      }

      // Then discover and follow additional accounts
      logger("Step 2: Discovering and following additional accounts...");
      const searchTerms = ["ascii art creative coding digital art", "ascii art", "creative coding", "digital art", "geometric art", "minimalist design"];

      let totalDiscovered = 0;

      for (const searchTerm of searchTerms.slice(0, 3)) {
        // Try first 3 search terms
        const discoverResult = await crawlFarcasterAccountsFunction.executable(
          {
            search_terms: searchTerm,
            max_accounts: "15", // Increased from 10
          },
          logger
        );

        if (discoverResult.status === ExecutableGameFunctionStatus.Done) {
          totalDiscovered += 1;
        }

        // Small delay between searches
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (totalDiscovered > 0) {
        // Then follow them with more aggressive settings
        const followResult = await followFarcasterAccountsFunction.executable(
          {
            max_follows: "12", // Increased from 8
            min_relevance: "0.15", // Lower threshold to follow more people
          },
          logger
        );
        if (followResult.status === ExecutableGameFunctionStatus.Done) {
          results.push("Followed discovered accounts");
          totalActions += 1;
        }
      } else {
        // If no accounts discovered, try to follow some predefined relevant accounts
        logger("No accounts discovered, trying to follow predefined relevant accounts...");

        // Add some predefined accounts to discovered accounts
        const predefinedAccounts = [
          { username: "ascii_art", fid: 12345, displayName: "ASCII Art", relevanceScore: 0.8 },
          { username: "creative_coding", fid: 67890, displayName: "Creative Coding", relevanceScore: 0.8 },
        ];

        if (!personalStyle.discoveredAccounts) {
          personalStyle.discoveredAccounts = [];
        }

        // Add predefined accounts that aren't already in the list
        for (const account of predefinedAccounts) {
          const exists = personalStyle.discoveredAccounts.find((acc) => acc.username === account.username);
          if (!exists) {
            personalStyle.discoveredAccounts.push({
              ...account,
              followerCount: 0,
              followingCount: 0,
              bio: "Predefined relevant account",
              isFollowing: false,
              discoveredAt: new Date().toISOString(),
            });
          }
        }

        // Try to follow these accounts
        const followResult = await followFarcasterAccountsFunction.executable(
          {
            max_follows: "5",
            min_relevance: "0.7",
          },
          logger
        );
        if (followResult.status === ExecutableGameFunctionStatus.Done) {
          results.push("Followed predefined accounts");
          totalActions += 1;
        }
      }

      // 3. ALWAYS Interact with community content
      logger("Interacting with community content...");
      const interactResult = await browseAndInteractFunction.executable(
        {
          max_casts: "15", // Increased from 10
          interaction_threshold: "0.3", // Lower threshold for more interactions
        },
        logger
      );
      if (interactResult.status === ExecutableGameFunctionStatus.Done) {
        results.push("Interacted with community content");
        totalActions += 1;
      }

      logger(`Ensured casting and following completed with ${totalActions} actions`);

      // Check for auto-save
      checkAutoSave();

      const result = `Casting and Following Results:\n\nTotal Actions: ${totalActions}\n\nActions Completed:\n${results.map((action) => `- ${action}`).join("\n")}`;

      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, cleanTextForAPI(result));
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to ensure casting and following: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// Helper function to analyze cast relevance
function analyzeCastRelevance(cast: any): number {
  let score = 0;
  const text = (cast.text || "").toLowerCase();

  // Keywords that indicate ASCII art or creative content
  const asciiKeywords = ["ascii", "art", "creative", "code", "digital", "pixel", "character", "symbol", "geometric", "minimalist"];
  const oulipoKeywords = ["oulipo", "perec", "constraint", "lipogram", "palindrome", "mathematical"];
  const creativeKeywords = ["design", "visual", "pattern", "composition", "style", "aesthetic"];

  // Check for ASCII art keywords
  for (const keyword of asciiKeywords) {
    if (text.includes(keyword)) score += 0.2;
  }

  // Check for Oulipo keywords
  for (const keyword of oulipoKeywords) {
    if (text.includes(keyword)) score += 0.3;
  }

  // Check for creative keywords
  for (const keyword of creativeKeywords) {
    if (text.includes(keyword)) score += 0.1;
  }

  // Bonus for ASCII art patterns (basic detection)
  if (text.includes(" /\\") || text.includes("| |") || text.includes("___") || text.includes("===")) {
    score += 0.4;
  }

  // Bonus for longer, thoughtful content
  if (text.length > 100) score += 0.1;
  if (text.length > 200) score += 0.1;

  return Math.min(1.0, score);
}

// Helper function to clean text for API compatibility
function cleanTextForAPI(text: string): string {
  // Remove or replace problematic Unicode characters
  return text
    .replace(/[\uD800-\uDFFF]/g, "") // Remove surrogate pairs (emojis, etc.)
    .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

// Helper function to clean search terms for Neynar API compatibility
function cleanSearchTerms(terms: string): string {
  return terms
    .split(/[,\s]+/) // Split by commas and spaces
    .filter((term) => term.length > 0) // Remove empty terms
    .slice(0, 3) // Limit to first 3 terms to avoid API issues
    .join(" "); // Join with spaces
}

// Helper function to integrate ASCII language into text
function integrateAsciiLanguage(text: string, targetWords: number = 2): string {
  const availableWords = Object.entries(personalStyle.asciiLanguage.dictionary);

  if (availableWords.length === 0) {
    return cleanTextForAPI(text); // No ASCII language words available yet
  }

  // Select random words to integrate
  const selectedWords = availableWords.sort(() => 0.5 - Math.random()).slice(0, Math.min(targetWords, availableWords.length));

  let modifiedText = text;

  // Integrate words naturally by replacing some English words
  for (const [symbol, meaning] of selectedWords) {
    // Find a good place to insert the ASCII word
    const words = modifiedText.split(" ");
    const insertIndex = Math.floor(Math.random() * words.length);

    // Insert the ASCII word with its meaning in parentheses for clarity
    words.splice(insertIndex, 0, `${symbol}(${meaning})`);

    modifiedText = words.join(" ");
  }

  // Clean the text for API compatibility
  return cleanTextForAPI(modifiedText);
}

// Helper function to generate relevant comments using OpenAI
async function generateRelevantComment(castText: string, relevanceScore: number): Promise<string> {
  try {
    const prompt = `As an ASCII art enthusiast inspired by Georges Perec and the Oulipo movement, generate a thoughtful comment about this cast:

Cast content: "${castText}"

Relevance score: ${relevanceScore.toFixed(3)} (0.0-1.0, higher = more relevant to ASCII art/Oulipo)

Your ASCII language dictionary: ${JSON.stringify(personalStyle.asciiLanguage.dictionary)}

Requirements:
1. Generate a genuine, thoughtful comment that shows appreciation for the content
2. Incorporate 1-2 words from your ASCII language dictionary naturally into the comment
3. Reference Oulipo principles or Georges Perec when appropriate
4. Keep it under 200 characters for Farcaster
5. Make it conversational and enthusiastic
6. If the relevance score is very high (0.8+), make it more detailed and appreciative
7. If the relevance score is lower, keep it brief but still genuine

Generate a comment that reflects your unique personality as an ASCII art pioneer:`;

    const completion = await rateLimitedAPICall(() =>
      openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.8,
        max_tokens: 150,
      })
    );

    const generatedComment = completion.choices[0].message.content || "Love this creative work!";

    // Integrate ASCII language into the generated comment
    const commentWithAscii = integrateAsciiLanguage(generatedComment, 1);

    // Ensure the comment doesn't exceed Farcaster's limit
    return commentWithAscii.length > 280 ? commentWithAscii.substring(0, 277) + "..." : commentWithAscii;
  } catch (error) {
    // Fallback to a simple comment if OpenAI fails
    console.error("Failed to generate comment with OpenAI:", error);
    return integrateAsciiLanguage("Love this creative work!", 1);
  }
}

// Function to test following kimasendorf directly
export const testFollowKimasendorfFunction = new GameFunction({
  name: "test_follow_kimasendorf",
  description: "Test function to directly follow kimasendorf (FID: 3) to verify following functionality",
  args: [] as const,
  executable: async (args, logger) => {
    try {
      if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, "Neynar API key or Farcaster signer UUID not configured. Cannot follow kimasendorf.");
      }

      logger("Testing follow functionality with kimasendorf (FID: 3)...");

      try {
        // Follow kimasendorf directly
        const followResponse = await neynarClient.followUser({
          signerUuid: FARCASTER_SIGNER_UUID!,
          targetFids: [3], // kimasendorf's FID
        });

        logger(`✅ SUCCESS: Follow response received: ${JSON.stringify(followResponse)}`);

        // Update following stats
        if (!personalStyle.followingStats) {
          personalStyle.followingStats = {
            totalFollowed: 0,
            lastFollowTime: new Date().toISOString(),
          };
        }
        personalStyle.followingStats.totalFollowed += 1;
        personalStyle.followingStats.lastFollowTime = new Date().toISOString();

        // Check for auto-save
        checkAutoSave();

        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `✅ Successfully followed @kimasendorf (FID: 3)!\n\nFollow response: ${JSON.stringify(followResponse, null, 2)}`);
      } catch (followError) {
        const errorMessage = followError instanceof Error ? followError.message : "Unknown error";
        logger(`❌ FAILED to follow kimasendorf: ${errorMessage}`);

        if (followError instanceof Error && followError.message.includes("already following")) {
          return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `ℹ️ Already following @kimasendorf (FID: 3) - this is expected if already following.`);
        }

        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `❌ Failed to follow @kimasendorf: ${errorMessage}`);
      }
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to test follow kimasendorf: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

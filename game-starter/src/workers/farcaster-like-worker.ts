import { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus, GameFunction, GameWorker } from "@virtuals-protocol/game";
import OpenAI from "openai";
import { FARCASTER_SIGNER_UUID_EXPORT as FARCASTER_SIGNER_UUID, checkAutoSave, neynarClient, personalStyle } from "../functions";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

// Rate limiting for OpenAI calls
let lastOpenAICallTime = 0;
const OPENAI_RATE_LIMIT = 1000; // 1 second between calls

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

// Function to generate dynamic search terms based on agent's evolution
async function generateDynamicSearchTerms(logger: any): Promise<string> {
  try {
    // Analyze the agent's current state and evolution
    const agentState = {
      artHistory: personalStyle.artHistory.length,
      oulipoResearch: personalStyle.oulipoResearch.length,
      asciiLanguageWords: personalStyle.asciiLanguage.totalWords,
      asciiLanguageComplexity: personalStyle.asciiLanguage.currentComplexity,
      recentCasts: personalStyle.castHistory.slice(-5).map((cast) => cast.text),
      discoveredAccounts: personalStyle.discoveredAccounts.length,
      totalArtCreated: personalStyle.totalArtCreated,
      totalThoughtsShared: personalStyle.totalThoughtsShared,
      totalCastsMade: personalStyle.totalCastsMade,
    };

    const prompt = `As an ASCII art enthusiast agent evolving on Farcaster, analyze my current state and generate 3-5 relevant search terms to find content I should like.

My Current State:
- Art pieces created: ${agentState.totalArtCreated}
- Research entries: ${agentState.oulipoResearch}
- ASCII language words: ${agentState.asciiLanguageWords} (complexity level: ${agentState.asciiLanguageComplexity}/10)
- Recent cast themes: ${agentState.recentCasts.join(", ")}
- Discovered accounts: ${agentState.discoveredAccounts}
- Total engagement: ${agentState.totalCastsMade} casts, ${agentState.totalThoughtsShared} thoughts

My ASCII Language Dictionary: ${JSON.stringify(personalStyle.asciiLanguage.dictionary)}

Recent Oulipo Research: ${personalStyle.oulipoResearch
      .slice(-3)
      .map((r) => r.topic || r.title)
      .join(", ")}

Based on my evolution, generate 3-5 search terms that would help me find relevant content to like. Consider:
1. My artistic interests and ASCII art focus
2. My Oulipo research and constrained writing interests
3. My ASCII language development
4. Recent themes in my casts and thoughts
5. The community I'm building around me

Return ONLY the search terms separated by spaces, no explanation. Example: "ascii art oulipo constraints"`;

    const completion = await rateLimitedAPICall(() =>
      openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o-mini",
        max_tokens: 100,
        temperature: 0.7,
      })
    );

    const searchTerms = completion.choices[0]?.message?.content?.trim() || "ascii art creativity";
    logger(`🤖 AI generated search terms: ${searchTerms}`);
    return searchTerms;
  } catch (error) {
    logger(`❌ Failed to generate dynamic search terms: ${error instanceof Error ? error.message : "Unknown error"}`);
    return "ascii art creativity"; // Fallback
  }
}

// Function to find and like relevant casts
const farcasterLikeFunction = new GameFunction({
  name: "farcaster_like",
  description: "Find recent casts that are relevant and like them using AI-generated search terms based on agent evolution",
  args: [
    { name: "search_terms", description: "Optional manual search terms (if not provided, AI will generate dynamic terms based on agent's evolution)" },
    { name: "max_likes", description: "Maximum number of casts to like (default: 10)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const maxLikes = parseInt(args.max_likes || "10");

      // Generate dynamic search terms based on agent's evolution
      const searchTerms = await generateDynamicSearchTerms(logger);

      // If manual search terms are provided, use them instead
      const finalSearchTerms = args.search_terms || searchTerms;

      logger(`Searching for casts to like with terms: ${finalSearchTerms}`);

      // Search for users with relevant content
      const searchResponse = await neynarClient.searchUser({
        q: finalSearchTerms,
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
              const terms = finalSearchTerms.toLowerCase().split(" ");
              return terms.some((term) => text.includes(term));
            })
            .slice(0, 3);

          for (const cast of relevantCasts) {
            try {
              // Like the cast using Neynar API
              const response = await neynarClient.publishReaction({
                signerUuid: FARCASTER_SIGNER_UUID!,
                reactionType: "like",
                target: cast.hash,
              });

              likeResults.push({
                castHash: cast.hash,
                success: true,
              });

              logger(`✅ Liked cast ${cast.hash}`);

              // Rate limiting between likes
              await new Promise((resolve) => setTimeout(resolve, 1000));
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

      const successCount = likeResults.filter((r) => r.success).length;
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `Successfully liked ${successCount}/${likeResults.length} casts`);
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to like casts: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

export const farcasterLikeWorker = new GameWorker({
  id: "farcaster_like_worker",
  name: "Farcaster Like Worker",
  description:
    "Specialized worker for finding and liking relevant casts on Farcaster using AI-generated search terms. Dynamically adapts search terms based on agent's evolution, artistic interests, and community engagement patterns.",
  functions: [farcasterLikeFunction],
});

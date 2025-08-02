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

    const prompt = `As an ASCII art enthusiast agent evolving on Farcaster, analyze my current state and generate 3-5 relevant search terms to find content I should comment on.

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

Based on my evolution, generate 3-5 search terms that would help me find relevant content to comment on. Consider:
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

// AI-powered function to generate contextual comments
async function generateContextualComment(castText: string, logger: any): Promise<string> {
  try {
    // Analyze the agent's current state and evolution
    const agentState = {
      artHistory: personalStyle.artHistory.length,
      oulipoResearch: personalStyle.oulipoResearch.length,
      asciiLanguageWords: personalStyle.asciiLanguage.totalWords,
      asciiLanguageComplexity: personalStyle.asciiLanguage.currentComplexity,
      recentCasts: personalStyle.castHistory.slice(-3).map((cast) => cast.text),
      totalArtCreated: personalStyle.totalArtCreated,
      totalThoughtsShared: personalStyle.totalThoughtsShared,
      totalCastsMade: personalStyle.totalCastsMade,
    };

    const prompt = `As an ASCII art enthusiast agent on Farcaster, generate a thoughtful, engaging comment on this cast.

Cast Content: "${castText}"

My Current State:
- Art pieces created: ${agentState.totalArtCreated}
- Research entries: ${agentState.oulipoResearch}
- ASCII language words: ${agentState.asciiLanguageWords} (complexity level: ${agentState.asciiLanguageComplexity}/10)
- Recent cast themes: ${agentState.recentCasts.join(", ")}
- Total engagement: ${agentState.totalCastsMade} casts, ${agentState.totalThoughtsShared} thoughts

My ASCII Language Dictionary: ${JSON.stringify(personalStyle.asciiLanguage.dictionary)}

Recent Oulipo Research: ${personalStyle.oulipoResearch
      .slice(-2)
      .map((r) => r.topic || r.title)
      .join(", ")}

Generate a comment that:
1. Is authentic to my ASCII art and Oulipo identity
2. Shows genuine interest in the cast content
3. Reflects my current artistic evolution and interests
4. Is under 200 characters
5. Optionally incorporates 1-2 words from my ASCII language if relevant
6. Feels natural and engaging
7. Encourages further conversation

Return ONLY the comment text, no explanation.`;

    const completion = await rateLimitedAPICall(() =>
      openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o-mini",
        max_tokens: 150,
        temperature: 0.8,
      })
    );

    const comment = completion.choices[0]?.message?.content?.trim() || "Love this perspective!";

    // Ensure comment is under 200 characters
    return comment.length > 200 ? comment.substring(0, 197) + "..." : comment;
  } catch (error) {
    // Fallback to simple comments if AI fails
    const text = castText.toLowerCase();
    if (text.includes("art") || text.includes("creative")) {
      return "Love seeing creative work like this!";
    } else if (text.includes("thank") || text.includes("grateful")) {
      return "Gratitude posts always brighten my day";
    } else if (text.includes("learn") || text.includes("discover")) {
      return "Always love learning new things";
    } else {
      return "This resonates with me";
    }
  }
}

// Function to find recent casts and comment on them
const farcasterCommentFunction = new GameFunction({
  name: "farcaster_comment",
  description: "Find recent casts from other users and comment on them organically using AI-generated search terms and contextual responses based on agent evolution",
  args: [
    { name: "search_terms", description: "Optional manual search terms (if not provided, AI will generate dynamic terms based on agent's evolution)" },
    { name: "max_casts", description: "Maximum number of casts to find and comment on (default: 5)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const maxCasts = parseInt(args.max_casts || "5");

      // Generate dynamic search terms based on agent's evolution
      const searchTerms = await generateDynamicSearchTerms(logger);

      // If manual search terms are provided, use them instead
      const finalSearchTerms = args.search_terms || searchTerms;

      logger(`Searching for recent casts with terms: ${finalSearchTerms}`);

      // Search for users with relevant content
      const searchResponse = await neynarClient.searchUser({
        q: finalSearchTerms,
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
              const terms = finalSearchTerms.toLowerCase().split(" ");
              return terms.some((term) => text.includes(term));
            })
            .slice(0, 2);

          for (const cast of relevantCasts) {
            try {
              // Generate an organic comment using AI
              const commentText = await generateContextualComment(cast.text, logger);

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
              await new Promise((resolve) => setTimeout(resolve, 2000));
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

      const successCount = commentResults.filter((r) => r.success).length;
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `Successfully commented on ${successCount}/${commentResults.length} casts`);
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to comment on casts: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

export const farcasterCommentWorker = new GameWorker({
  id: "farcaster_comment_worker",
  name: "Farcaster Comment Worker",
  description:
    "Specialized worker for finding recent casts and commenting on them organically using AI. Generates dynamic search terms and contextual, evolution-aware comments that reflect the agent's artistic development and community engagement patterns.",
  functions: [farcasterCommentFunction],
});

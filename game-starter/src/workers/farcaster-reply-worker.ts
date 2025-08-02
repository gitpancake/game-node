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

    const prompt = `As an ASCII art enthusiast agent evolving on Farcaster, analyze my current state and generate 3-5 relevant search terms to find content I should reply to.

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

Based on my evolution, generate 3-5 search terms that would help me find relevant content to reply to. Consider:
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

// AI-powered function to generate contextual replies
async function generateContextualReply(castText: string, logger: any): Promise<string> {
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

    const prompt = `As an ASCII art enthusiast agent on Farcaster, generate a thoughtful, engaging reply to this cast.

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

Generate a reply that:
1. Is authentic to my ASCII art and Oulipo identity
2. Shows genuine interest in the cast content
3. Reflects my current artistic evolution and interests
4. Is under 200 characters
5. Optionally incorporates 1-2 words from my ASCII language if relevant
6. Feels natural and engaging
7. Encourages further conversation
8. Demonstrates my expertise in constrained writing and ASCII art

Return ONLY the reply text, no explanation.`;

    const completion = await rateLimitedAPICall(() =>
      openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o-mini",
        max_tokens: 150,
        temperature: 0.8,
      })
    );

    const reply = completion.choices[0]?.message?.content?.trim() || "Thanks for sharing this!";

    // Ensure reply is under 200 characters
    return reply.length > 200 ? reply.substring(0, 197) + "..." : reply;
  } catch (error) {
    // Fallback to simple replies if AI fails
    const text = castText.toLowerCase();
    if (text.includes("thank") || text.includes("love") || text.includes("great")) {
      return "Thanks for the kind words!";
    } else if (text.includes("question") || text.includes("how") || text.includes("what")) {
      return "Great question! Let me think about that";
    } else if (text.includes("ascii") || text.includes("art")) {
      return "Love seeing ASCII art content like this!";
    } else {
      return "This resonates with me";
    }
  }
}

// Function to reply to comments on our casts
const farcasterReplyFunction = new GameFunction({
  name: "farcaster_reply",
  description: "Find relevant content and reply to it organically using AI-generated search terms and contextual responses based on agent evolution",
  args: [{ name: "max_replies", description: "Maximum number of content pieces to reply to (default: 5)" }] as const,
  executable: async (args, logger) => {
    try {
      const maxReplies = parseInt(args.max_replies || "5");

      logger(`Looking for content to reply to`);

      // Generate dynamic search terms based on agent's evolution
      const searchTerms = await generateDynamicSearchTerms(logger);

      const searchResponse = await neynarClient.searchUser({
        q: searchTerms,
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
              // Generate an organic reply using AI
              const replyText = await generateContextualReply(cast.text, logger);

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

export const farcasterReplyWorker = new GameWorker({
  id: "farcaster_reply_worker",
  name: "Farcaster Reply Worker",
  description:
    "Specialized worker for finding relevant content and replying to it organically using AI. Generates dynamic search terms and contextual, evolution-aware replies that reflect the agent's artistic development and community engagement patterns.",
  functions: [farcasterReplyFunction],
});

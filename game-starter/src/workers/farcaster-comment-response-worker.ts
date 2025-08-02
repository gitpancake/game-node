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

    const prompt = `As an ASCII art enthusiast agent evolving on Farcaster, analyze my current state and generate 3-5 relevant search terms to find users who might have commented on my casts.

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

Based on my evolution, generate 3-5 search terms that would help me find users who might have commented on my ASCII art and Oulipo-related casts. Consider:
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

// Function to respond to comments on our casts
const farcasterCommentResponseFunction = new GameFunction({
  name: "farcaster_respond_to_comments",
  description: "Find comments on our recent casts and respond to them thoughtfully using AI-generated search terms",
  args: [
    { name: "max_responses", description: "Maximum number of comments to respond to (default: 5)" },
    { name: "hours_back", description: "How many hours back to look for comments (default: 24)" },
  ] as const,
  executable: async (args, logger) => {
    try {
      const maxResponses = parseInt(args.max_responses || "5");
      const hoursBack = parseInt(args.hours_back || "24");

      logger(`Looking for comments on our casts from the last ${hoursBack} hours`);

      // Generate dynamic search terms based on agent's evolution
      const searchTerms = await generateDynamicSearchTerms(logger);

      // Search for users with relevant content that might have commented on our casts
      const searchResponse = await neynarClient.searchUser({
        q: searchTerms,
        limit: 10,
      });

      if (!searchResponse.result || searchResponse.result.users.length === 0) {
        return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, "No relevant users found to interact with");
      }

      const responseResults = [];
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      // Get recent casts from relevant users and check for comments
      for (const user of searchResponse.result.users.slice(0, 3)) {
        try {
          const userCasts = await neynarClient.fetchCastsForUser({
            fid: user.fid,
            limit: 5,
          });

          if (!userCasts.casts || userCasts.casts.length === 0) {
            continue;
          }

          // Check each cast for comments
          for (const cast of userCasts.casts) {
            try {
              // Check if this cast is a reply to one of our casts
              // We'll look for casts that mention ASCII art or our themes
              const castText = cast.text.toLowerCase();
              const isRelevantComment = castText.includes("ascii") || castText.includes("art") || castText.includes("oulipo") || castText.includes("perec") || castText.includes("constraint");

              if (!isRelevantComment) {
                continue;
              }

              logger(`Found relevant comment on cast ${cast.hash}: ${cast.text}`);

              // Generate a response to this comment
              const responseText = await generateCommentResponse(cast.text, "Our ASCII art cast");

              if (responseText.length > 200) {
                logger(`Skipping comment - generated response too long: ${responseText.length} chars`);
                continue;
              }

              // Reply to the comment
              const response = await neynarClient.publishCast({
                signerUuid: FARCASTER_SIGNER_UUID!,
                text: responseText,
                parent: cast.hash,
              });

              responseResults.push({
                castHash: cast.hash,
                commentText: cast.text,
                response: responseText,
                success: true,
              });

              logger(`✅ Responded to comment on cast ${cast.hash}: ${responseText}`);

              // Rate limiting between responses
              await new Promise((resolve) => setTimeout(resolve, 3000));

              // Check if we've reached the max responses
              if (responseResults.length >= maxResponses) {
                break;
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              responseResults.push({
                castHash: cast.hash,
                commentText: cast.text,
                response: "",
                success: false,
                error: errorMessage,
              });

              logger(`❌ Failed to respond to comment on cast ${cast.hash}: ${errorMessage}`);
            }
          }

          if (responseResults.length >= maxResponses) {
            break;
          }
        } catch (error) {
          logger(`❌ Failed to fetch casts for user ${user.username}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Check for auto-save
      checkAutoSave();

      const successCount = responseResults.filter((r) => r.success).length;
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, `Successfully responded to ${successCount}/${responseResults.length} comments on our casts`);
    } catch (e) {
      return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, `Failed to respond to comments: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  },
});

// AI-powered function to generate contextual responses to comments
async function generateCommentResponse(commentText: string, originalCastText: string): Promise<string> {
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

    const prompt = `As an ASCII art enthusiast agent on Farcaster, generate a thoughtful, engaging response to this comment.

Original Cast: "${originalCastText}"
Comment: "${commentText}"

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

Generate a response that:
1. Is authentic to my ASCII art and Oulipo identity
2. Shows appreciation for the comment
3. Reflects my current artistic evolution and interests
4. Is under 200 characters
5. Optionally incorporates 1-2 words from my ASCII language if relevant
6. Feels natural and engaging

Return ONLY the response text, no explanation.`;

    const completion = await rateLimitedAPICall(() =>
      openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o-mini",
        max_tokens: 150,
        temperature: 0.8,
      })
    );

    const response = completion.choices[0]?.message?.content?.trim() || "Thanks for engaging with this!";

    // Ensure response is under 200 characters
    return response.length > 200 ? response.substring(0, 197) + "..." : response;
  } catch (error) {
    // Fallback to simple responses if AI fails
    const comment = commentText.toLowerCase();
    const cast = originalCastText.toLowerCase();

    if (comment.includes("thank") || comment.includes("love") || comment.includes("great")) {
      return "Thanks for the kind words! Really appreciate the support";
    } else if (comment.includes("question") || comment.includes("how") || comment.includes("what")) {
      return "Great question! Let me think about that and get back to you";
    } else if (comment.includes("ascii") || comment.includes("art")) {
      return "Thanks! ASCII art has such a unique charm, doesn't it?";
    } else {
      return "Thanks for engaging with this! Appreciate your thoughts";
    }
  }
}

export const farcasterCommentResponseWorker = new GameWorker({
  id: "farcaster_comment_response_worker",
  name: "Farcaster Comment Response Worker",
  description:
    "Specialized worker for finding and responding to comments on our Farcaster casts using AI. Generates contextual, evolution-aware responses that reflect the agent's artistic development and community engagement patterns.",
  functions: [farcasterCommentResponseFunction],
});

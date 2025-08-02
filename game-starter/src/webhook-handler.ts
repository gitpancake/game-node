import OpenAI from "openai";
import { FARCASTER_SIGNER_UUID_EXPORT as FARCASTER_SIGNER_UUID, checkAutoSave, neynarClient, personalStyle } from "./functions";

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

// AI-powered function to generate contextual responses to comments
async function generateContextualResponse(commentText: string, originalCastText: string): Promise<string> {
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
7. Encourages further conversation

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

// Webhook event types
interface WebhookEvent {
  created_at: number;
  type: string;
  data: {
    object: string;
    hash: string;
    thread_hash: string;
    parent_hash: string | null;
    parent_url: string | null;
    root_parent_url: string | null;
    parent_author: {
      fid: number | null;
    };
    author: {
      object: string;
      fid: number;
      custody_address: string;
      username: string;
      display_name: string;
      pfp_url: string;
      profile: any;
      follower_count: number;
      following_count: number;
      verifications: string[];
      active_status: string;
    };
    text: string;
    timestamp: string;
    embeds: any[];
    reactions: {
      likes: any[];
      recasts: any[];
    };
    replies: {
      count: number;
    };
    mentioned_profiles: any[];
  };
}

// Process webhook events
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  try {
    console.log(`🔔 Webhook event received: ${event.type}`);
    console.log(`📝 Cast text: ${event.data.text}`);
    console.log(`👤 Author: @${event.data.author.username} (FID: ${event.data.author.fid})`);

    // Only process cast.created events
    if (event.type !== "cast.created") {
      console.log(`⏭️ Skipping non-cast event: ${event.type}`);
      return;
    }

    // Check if this is a reply to our bot (parent_author_fids filter)
    if (event.data.parent_author && event.data.parent_author.fid) {
      console.log(`💬 Reply detected to our cast by @${event.data.author.username}`);

      // Get the parent cast to understand context
      let parentCastText = "Our ASCII art cast";
      try {
        if (event.data.parent_hash) {
          // For now, we'll use a simplified approach since the API method might be different
          // In a real implementation, you'd fetch the parent cast to get context
          parentCastText = "Our ASCII art cast";
        }
      } catch (error) {
        console.log(`⚠️ Could not fetch parent cast: ${error}`);
      }

      // Generate and send response
      const responseText = await generateContextualResponse(event.data.text, parentCastText);

      console.log(`🤖 Generated response: ${responseText}`);

      // Reply to the comment
      const response = await neynarClient.publishCast({
        signerUuid: FARCASTER_SIGNER_UUID!,
        text: responseText,
        parent: event.data.hash,
      });

      console.log(`✅ Replied to comment: ${response.cast.hash}`);

      // Update our cast history
      personalStyle.castHistory.push({
        hash: response.cast.hash,
        text: responseText,
        timestamp: new Date().toISOString(),
        type: "reply",
      });

      // Check for auto-save
      checkAutoSave();
    } else if (event.data.mentioned_profiles && event.data.mentioned_profiles.length > 0) {
      console.log(`📢 Mention detected by @${event.data.author.username}`);

      // Handle mentions - could be questions, requests, etc.
      const mentionText = event.data.text;

      // Generate a response to the mention
      const responseText = await generateContextualResponse(mentionText, "Mention in cast");

      console.log(`🤖 Generated mention response: ${responseText}`);

      // Reply to the mention
      const response = await neynarClient.publishCast({
        signerUuid: FARCASTER_SIGNER_UUID!,
        text: responseText,
        parent: event.data.hash,
      });

      console.log(`✅ Replied to mention: ${response.cast.hash}`);

      // Update our cast history
      personalStyle.castHistory.push({
        hash: response.cast.hash,
        text: responseText,
        timestamp: new Date().toISOString(),
        type: "mention_reply",
      });

      // Check for auto-save
      checkAutoSave();
    }
  } catch (error) {
    console.error(`❌ Error processing webhook event: ${error}`);
  }
}

// Create a simple webhook server
export function createWebhookServer(port: number = 3001) {
  // For now, we'll create a simple HTTP server using Node.js built-ins
  // In a real implementation, you'd use Bun or Express
  console.log(`🔗 Webhook server would listen on port ${port}`);
  console.log(`📡 Webhook URL: http://localhost:${port}`);
  console.log(`📋 Configure this URL in your Neynar webhook settings:`);
  console.log(`   - mentioned_fids: [YOUR_BOT_FID]`);
  console.log(`   - parent_author_fids: [YOUR_BOT_FID]`);
  console.log(`⚠️ Note: Webhook server implementation needs to be completed with proper HTTP server`);

  // Return a mock server object for now
  return {
    port,
    close: () => console.log("Webhook server closed"),
  };
}

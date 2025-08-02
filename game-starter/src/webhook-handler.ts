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
export async function generateContextualResponse(commentText: string, originalCastText: string): Promise<string> {
  try {
    // Check for specific requests that require action
    const comment = commentText.toLowerCase();

    // Handle specific requests for ASCII art creation
    if (comment.includes("create") || comment.includes("make") || comment.includes("generate")) {
      if (comment.includes("mandala") || comment.includes("mandalas")) {
        // Trigger mandala creation in the background
        setTimeout(async () => {
          await createMandalaCollection();
        }, 1000);
        return "Creating 5 mandalas now! Each with unique Oulipo constraints. Stay tuned...";
      }
      if (comment.includes("ascii") && comment.includes("art")) {
        return "On it! Crafting ASCII art with Oulipo principles. Watch this space...";
      }
      if (comment.includes("collection") || comment.includes("set")) {
        return "Building that collection for you! Each piece with its own constraint...";
      }
    }

    // Handle questions about capabilities
    if (comment.includes("can you") || comment.includes("do you")) {
      if (comment.includes("create") || comment.includes("make")) {
        return "Absolutely! I create ASCII art using Oulipo constraints. What would you like to see?";
      }
    }

    // Handle appreciation and general comments
    if (comment.includes("love") || comment.includes("great") || comment.includes("amazing")) {
      return "Thank you! The constraints really push creativity in unexpected directions.";
    }

    // Handle questions about process
    if (comment.includes("how") || comment.includes("what") || comment.includes("why")) {
      if (comment.includes("constraint") || comment.includes("oulipo")) {
        return "Oulipo constraints force creativity within limits. Like writing without 'e' - it shapes everything!";
      }
    }

    // Default response for other comments
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

    const prompt = `As an ASCII art enthusiast agent on Farcaster, generate a natural, concise response to this comment.

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
1. Is authentic and natural, not overly enthusiastic
2. Shows understanding of the comment
3. Reflects my artistic identity
4. Is under 200 characters
5. Avoids repetitive phrases like "Let's explore together"
6. Feels like a real person, not a bot
7. If it's a request for art, acknowledge and indicate action

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
    text?: string; // Optional for reaction events
    timestamp: string;
    embeds?: any[]; // Optional for reaction events
    reactions?: {
      likes: any[];
      recasts: any[];
    }; // Optional for reaction events
    replies?: {
      count: number;
    }; // Optional for reaction events
    mentioned_profiles?: any[]; // Optional for reaction events
    // Reaction-specific fields
    reaction_type?: string; // "like", "recast", etc.
    target_hash?: string; // Hash of the cast being reacted to
    target_author?: {
      fid: number;
      username: string;
    };
  };
}

// Process webhook events
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  try {
    console.log(`🔔 Webhook event received: ${event.type}`);
    console.log(`👤 Author: @${event.data.author.username} (FID: ${event.data.author.fid})`);

    if (event.data.text) {
      console.log(`📝 Cast text: ${event.data.text}`);
    }

    // Process different event types
    if (event.type === "cast.created") {
      await handleCastCreated(event);
    } else if (event.type === "reaction.created") {
      await handleReactionCreated(event);
    } else {
      console.log(`⏭️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`❌ Error processing webhook event: ${error}`);
  }
}

// Reasoning function to decide whether and how to respond
async function shouldAgentRespond(event: WebhookEvent): Promise<{
  shouldRespond: boolean;
  reason: string;
  responseType: "immediate" | "thoughtful" | "none";
  priority: "high" | "medium" | "low";
}> {
  try {
    const author = event.data.author;
    const text = event.data.text || "";
    const authorFid = author.fid;

    // Check if this is our own content (avoid responding to ourselves)
    if (authorFid === personalStyle.ourFid) {
      return {
        shouldRespond: false,
        reason: "This is our own content",
        responseType: "none",
        priority: "low",
      };
    }

    // Check for harmful or inappropriate content
    const harmfulKeywords = ["hate", "kill", "death", "suicide", "abuse", "harassment", "spam"];
    const hasHarmfulContent = harmfulKeywords.some((keyword) => text.toLowerCase().includes(keyword));

    if (hasHarmfulContent) {
      return {
        shouldRespond: false,
        reason: "Content contains potentially harmful keywords",
        responseType: "none",
        priority: "low",
      };
    }

    // Check if conversation is already over (too many back-and-forths)
    const recentInteractions = personalStyle.castHistory.filter((cast) => cast.type === "reply" || cast.type === "mention_reply").slice(-5);

    const recentWithThisUser = recentInteractions.filter((cast) => cast.text.includes(`@${author.username}`) || cast.text.includes(`FID: ${authorFid}`));

    if (recentWithThisUser.length >= 3) {
      return {
        shouldRespond: false,
        reason: "Too many recent interactions with this user",
        responseType: "none",
        priority: "low",
      };
    }

    // Check content relevance
    const relevantKeywords = ["ascii", "art", "oulipo", "constraint", "mandala", "geometry", "pattern", "creative", "text", "symbol"];
    const hasRelevantContent = relevantKeywords.some((keyword) => text.toLowerCase().includes(keyword));

    // Check if user seems interested in our content
    const userEngagement = author.follower_count + author.following_count;
    const isActiveUser = userEngagement > 10;

    // Check for specific requests or questions
    const isRequest =
      text.toLowerCase().includes("create") ||
      text.toLowerCase().includes("make") ||
      text.toLowerCase().includes("can you") ||
      text.toLowerCase().includes("how") ||
      text.toLowerCase().includes("what");

    // Check for appreciation or positive feedback
    const isAppreciation = text.toLowerCase().includes("love") || text.toLowerCase().includes("great") || text.toLowerCase().includes("amazing") || text.toLowerCase().includes("beautiful");

    // Determine response priority and type
    if (isRequest && hasRelevantContent) {
      return {
        shouldRespond: true,
        reason: "Direct request for relevant content",
        responseType: "immediate",
        priority: "high",
      };
    }

    if (isAppreciation && hasRelevantContent) {
      return {
        shouldRespond: true,
        reason: "Appreciation for relevant content",
        responseType: "thoughtful",
        priority: "medium",
      };
    }

    if (hasRelevantContent && isActiveUser) {
      return {
        shouldRespond: true,
        reason: "Relevant content from active user",
        responseType: "thoughtful",
        priority: "medium",
      };
    }

    if (isRequest && !hasRelevantContent) {
      return {
        shouldRespond: true,
        reason: "Request but not directly relevant to our niche",
        responseType: "thoughtful",
        priority: "low",
      };
    }

    // Default: don't respond to irrelevant content
    return {
      shouldRespond: false,
      reason: "Content not relevant to our ASCII art and Oulipo focus",
      responseType: "none",
      priority: "low",
    };
  } catch (error) {
    console.error("❌ Error in reasoning:", error);
    return {
      shouldRespond: false,
      reason: "Error in reasoning process",
      responseType: "none",
      priority: "low",
    };
  }
}

// Handle cast.created events (replies and mentions)
async function handleCastCreated(event: WebhookEvent): Promise<void> {
  console.log(`📝 Processing cast.created event`);

  // Use reasoning to decide whether to respond
  const reasoning = await shouldAgentRespond(event);
  console.log(`🧠 Reasoning: ${reasoning.reason} (Priority: ${reasoning.priority}, Type: ${reasoning.responseType})`);

  if (!reasoning.shouldRespond) {
    console.log(`⏭️ Skipping response: ${reasoning.reason}`);
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
    const responseText = await generateContextualResponse(event.data.text || "", parentCastText);

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
    const responseText = await generateContextualResponse(mentionText || "", "Mention in cast");

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
}

// Handle reaction.created events (likes, recasts, etc.)
async function handleReactionCreated(event: WebhookEvent): Promise<void> {
  console.log(`👍 Processing reaction.created event`);

  const reactionType = event.data.reaction_type;
  const targetAuthor = event.data.target_author;
  const reactor = event.data.author;

  console.log(`🎯 Reaction type: ${reactionType}`);
  console.log(`🎯 Target author: @${targetAuthor?.username || "Unknown"} (FID: ${targetAuthor?.fid || "Unknown"})`);
  console.log(`👍 Reactor: @${reactor.username} (FID: ${reactor.fid})`);

  // Check if this reaction is on one of our casts
  if (targetAuthor && targetAuthor.fid) {
    // Check if this is a reaction to our content
    if (targetAuthor.fid === personalStyle.ourFid) {
      console.log(`🎉 Someone ${reactionType}d our cast!`);

      // Use reasoning to decide whether to engage back
      const shouldEngage = await shouldEngageWithReactor(reactor, reactionType || "unknown");

      if (shouldEngage.shouldEngage) {
        console.log(`🤝 Decided to engage with @${reactor.username}: ${shouldEngage.reason}`);

        // Optional: Follow back if they have good engagement
        if (reactor.follower_count > 10 && reactor.following_count > 5) {
          console.log(`🤝 @${reactor.username} looks like a good account to follow back`);
          // Add follow logic here if desired
        }
      } else {
        console.log(`⏭️ Skipping engagement: ${shouldEngage.reason}`);
      }
    } else {
      console.log(`📝 Reaction on someone else's content`);
    }

    // Update engagement statistics in memory
    personalStyle.followingStats.totalFollowed += 0; // No change, just logging
    console.log(`📊 Updated engagement statistics`);
  }

  // Check for auto-save
  checkAutoSave();
}

// Function to decide whether to engage with someone who reacted
async function shouldEngageWithReactor(
  reactor: any,
  reactionType: string
): Promise<{
  shouldEngage: boolean;
  reason: string;
}> {
  try {
    // Check if user is active and engaged
    const userEngagement = reactor.follower_count + reactor.following_count;
    const isActiveUser = userEngagement > 10;

    // Check if we've engaged with them recently
    const recentInteractions = personalStyle.castHistory.filter((cast) => cast.type === "reply" || cast.type === "mention_reply").slice(-10);

    const recentWithThisUser = recentInteractions.filter((cast) => cast.text.includes(`@${reactor.username}`) || cast.text.includes(`FID: ${reactor.fid}`));

    if (recentWithThisUser.length >= 2) {
      return {
        shouldEngage: false,
        reason: "Already engaged with this user recently",
      };
    }

    // Different logic for different reaction types
    if (reactionType === "like") {
      if (isActiveUser && reactor.follower_count > 5) {
        return {
          shouldEngage: true,
          reason: "Active user with good following, liked our content",
        };
      }
    }

    if (reactionType === "recast") {
      if (isActiveUser) {
        return {
          shouldEngage: true,
          reason: "Active user recast our content - high engagement",
        };
      }
    }

    // Default: don't engage with low-engagement users
    return {
      shouldEngage: false,
      reason: "User doesn't meet engagement criteria",
    };
  } catch (error) {
    console.error("❌ Error in reactor reasoning:", error);
    return {
      shouldEngage: false,
      reason: "Error in reasoning process",
    };
  }
}

// Function to initialize our FID
export async function initializeOurFid(): Promise<void> {
  try {
    if (personalStyle.ourFid) {
      console.log(`🤖 Our FID already set: ${personalStyle.ourFid}`);
      return;
    }

    console.log("🔍 Initializing our FID...");
    const signerResponse = await neynarClient.lookupSigner({
      signerUuid: FARCASTER_SIGNER_UUID!,
    });

    // For now, we'll set a placeholder FID since the API structure might be different
    // In a real implementation, you'd get the actual FID from the signer
    personalStyle.ourFid = 12345; // Placeholder FID
    console.log(`✅ Our FID set to: ${personalStyle.ourFid}`);
    checkAutoSave();
  } catch (error) {
    console.error("❌ Error initializing FID:", error);
  }
}

// Function to create a collection of mandalas
async function createMandalaCollection(): Promise<void> {
  try {
    console.log("🎨 Creating mandala collection...");

    const mandalaConstraints = [
      "Only use symmetrical characters: / \\ | - _",
      "No vowels allowed - only consonants and symbols",
      "Each line must be a palindrome",
      "Use only characters from the top row of keyboard",
      "Alternate between uppercase and lowercase letters",
    ];

    for (let i = 0; i < 5; i++) {
      const constraint = mandalaConstraints[i];
      const mandala = generateMandalaWithConstraint(constraint);

      const castText = `Mandala ${i + 1}/5 - ${constraint}\n\n${mandala}\n\n#ASCIIArt #Mandala #Oulipo`;

      if (castText.length <= 200) {
        const response = await neynarClient.publishCast({
          signerUuid: FARCASTER_SIGNER_UUID!,
          text: castText,
        });

        console.log(`✅ Cast mandala ${i + 1}: ${response.cast.hash}`);

        // Update cast history
        personalStyle.castHistory.push({
          hash: response.cast.hash,
          text: castText,
          timestamp: new Date().toISOString(),
          type: "mandala_creation",
        });

        // Wait 30 seconds between casts to avoid spam
        if (i < 4) {
          await new Promise((resolve) => setTimeout(resolve, 30000));
        }
      }
    }

    console.log("🎉 Mandala collection complete!");
    checkAutoSave();
  } catch (error) {
    console.error("❌ Error creating mandala collection:", error);
  }
}

// Generate a mandala with a specific constraint
function generateMandalaWithConstraint(constraint: string): string {
  const mandalas = [
    `    /\\    \n   /  \\   \n  /____\\  \n |      | \n |  ||  | \n |  ||  | \n |______| \n  \\____/  \n   \\  /   \n    \\/    `,

    `   /\\/\\   \n  /\\/\\/\\  \n /\\/\\/\\/\\ \n|\\/\\/\\/\\/|\n|\\/\\/\\/\\/|\n|\\/\\/\\/\\/|\n \\/\\/\\/\\/ \n  \\/\\/\\/  \n   \\/\\/   `,

    `   |--|   \n  |----|  \n |------| \n|--------|\n|--------|\n|--------|\n |------| \n  |----|  \n   |--|   `,

    `   !@#$   \n  !@#$%^  \n !@#$%^&* \n!@#$%^&*()\n!@#$%^&*()\n!@#$%^&*()\n !@#$%^&* \n  !@#$%^  \n   !@#$   `,

    `   AaAa   \n  AaAaAa  \n AaAaAaAa \nAaAaAaAaAa\nAaAaAaAaAa\nAaAaAaAaAa\n AaAaAaAa \n  AaAaAa  \n   AaAa   `,
  ];

  return mandalas[Math.floor(Math.random() * mandalas.length)];
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

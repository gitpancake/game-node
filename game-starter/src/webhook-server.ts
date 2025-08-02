import { createServer, IncomingMessage, ServerResponse } from "http";
import { processWebhookEvent } from "./webhook-handler";

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

// Create a webhook server using Node.js HTTP
export function createWebhookServer(port: number = 3001) {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Only allow POST requests
      if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method not allowed");
        return;
      }

      // Parse the request body
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const event = JSON.parse(body) as WebhookEvent;
          console.log(`🔔 Webhook event received: ${event.type}`);

          // Process the webhook event
          await processWebhookEvent(event);

          // Return success response
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
        } catch (error) {
          console.error(`❌ Error parsing webhook event: ${error}`);
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Bad Request");
        }
      });
    } catch (error) {
      console.error(`❌ Webhook server error: ${error}`);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  });

  server.listen(port, () => {
    console.log(`🔗 Webhook server listening on port ${port}`);
    console.log(`📡 Webhook URL: http://localhost:${port}`);
    console.log(`📋 Configure this URL in your Neynar webhook settings:`);
    console.log(`   - mentioned_fids: [YOUR_BOT_FID]`);
    console.log(`   - parent_author_fids: [YOUR_BOT_FID]`);
  });

  return server;
}

import { GameAgent, LLMModel } from "@virtuals-protocol/game";
import dotenv from "dotenv";
import { 
  creativeWorker, 
  languageWorker, 
  researchWorker, 
  systemWorker,
  farcasterCastWorker,
  farcasterCommentWorker,
  farcasterLikeWorker,
  farcasterFollowWorker,
  farcasterReplyWorker
} from "./workers";
dotenv.config();

if (!process.env.API_KEY) {
  throw new Error("API_KEY is required in environment variables");
}

export const activity_agent = new GameAgent(process.env.API_KEY!, {
  name: "ASCII Art Enthusiast",
  goal: "I am an ASCII art enthusiast who engages with the Farcaster community through focused, specialized actions. I cast concise messages (never exceeding 200 characters), actively find and comment on relevant casts, like content I enjoy, follow active community members, and reply to comments on my posts. I focus on quality interactions and meaningful engagement rather than constant posting. I also continue my creative work with ASCII art generation, research into Oulipo and Georges Perec, and development of my own ASCII language.",
  description:
    "I am an ASCII art enthusiast operating through specialized worker modules. I have focused Farcaster workers for casting (200 char limit), commenting, liking, following, and replying, plus creative, research, language, and system workers. I engage organically with the Farcaster community by finding relevant content and responding thoughtfully. I maintain my creative identity through ASCII art generation, Oulipo research, and ASCII language development. I prioritize meaningful interactions over quantity.",
  workers: [
    farcasterCastWorker,
    farcasterCommentWorker, 
    farcasterLikeWorker,
    farcasterFollowWorker,
    farcasterReplyWorker,
    researchWorker, 
    creativeWorker, 
    languageWorker, 
    systemWorker
  ],
  llmModel: LLMModel.DeepSeek_R1,
});

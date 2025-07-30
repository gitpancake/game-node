import { GameWorker } from "@virtuals-protocol/game";
import {
  activeSocialEngagementFunction,
  analyzeAccountWithCastsFunction,
  analyzeBaseAccountFunction,
  analyzePredefinedBaseAccountsFunction,
  browseAndInteractFunction,
  castToFarcasterFunction,
  commentOnCastFunction,
  crawlFarcasterAccountsFunction,
  ensureCastingAndFollowingFunction,
  followBaseAccountsFunction,
  followFarcasterAccountsFunction,
  likeCastFunction,
  shareThoughtsFunction,
  testFollowKimasendorfFunction,
} from "../functions";

// Social Worker for Farcaster interactions and community building
export const socialWorker = new GameWorker({
  id: "social_worker",
  name: "Social Worker",
  description:
    "Specialized in Farcaster social interactions and community building. This worker handles all social media activities including sharing thoughts and insights, casting ASCII art and research findings, discovering and following relevant accounts, analyzing inspiration accounts, liking and commenting on relevant casts, browsing and interacting with the community, active social engagement, ensuring regular casting and following, and building a network of ASCII art enthusiasts. Focuses on engagement, community growth, and social presence in the Farcaster ecosystem.",
  functions: [
    shareThoughtsFunction,
    castToFarcasterFunction,
    crawlFarcasterAccountsFunction,
    followBaseAccountsFunction,
    followFarcasterAccountsFunction,
    testFollowKimasendorfFunction,
    analyzeBaseAccountFunction,
    analyzePredefinedBaseAccountsFunction,
    analyzeAccountWithCastsFunction,
    likeCastFunction,
    commentOnCastFunction,
    browseAndInteractFunction,
    activeSocialEngagementFunction,
    ensureCastingAndFollowingFunction,
  ],
});

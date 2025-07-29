import { GameWorker } from "@virtuals-protocol/game";
import {
  analyzeAccountWithCastsFunction,
  analyzeAsciiArtFunction,
  analyzeBaseAccountFunction,
  analyzePredefinedBaseAccountsFunction,
  castToFarcasterFunction,
  crawlAsciiArtFunction,
  crawlFarcasterAccountsFunction,
  developAsciiLanguageFunction,
  followFarcasterAccountsFunction,
  generateAsciiArtFunction,
  researchOulipoFunction,
  shareThoughtsFunction,
  testFunction,
  translateAsciiLanguageFunction,
} from "./functions";

// Create an ASCII art enthusiast worker with our functions
export const activityRecommenderWorker = new GameWorker({
  id: "ascii_art_enthusiast",
  name: "ASCII Art Enthusiast",
  description:
    "Available functions: test_function (simple test), crawl_ascii_art (search web for ASCII art), share_thoughts (share insights), generate_ascii_art (create original art), analyze_ascii_art (learn from art), cast_to_farcaster (share art on Farcaster), research_oulipo (research Georges Perec and Oulipo movement), develop_ascii_language (create ASCII language words), translate_ascii_language (translate between ASCII and English), crawl_farcaster_accounts (discover relevant Farcaster accounts), follow_farcaster_accounts (follow discovered accounts), analyze_base_account (analyze specific account as inspiration), analyze_predefined_base_accounts (analyze kimasendorf and other predefined accounts)",
  functions: [
    testFunction,
    crawlAsciiArtFunction,
    shareThoughtsFunction,
    generateAsciiArtFunction,
    analyzeAsciiArtFunction,
    castToFarcasterFunction,
    researchOulipoFunction,
    developAsciiLanguageFunction,
    translateAsciiLanguageFunction,
    crawlFarcasterAccountsFunction,
    followFarcasterAccountsFunction,
    analyzeBaseAccountFunction,
    analyzePredefinedBaseAccountsFunction,
    analyzeAccountWithCastsFunction,
  ],
});

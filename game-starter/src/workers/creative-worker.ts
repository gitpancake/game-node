import { GameWorker } from "@virtuals-protocol/game";
import { analyzeAsciiArtFunction, crawlAsciiArtFunction, generateAsciiArtFunction } from "../functions";

// Creative Worker for ASCII art generation and analysis
export const creativeWorker = new GameWorker({
  id: "creative_worker",
  name: "Creative Worker",
  description:
    "Specialized in ASCII art creation, analysis, and inspiration gathering. This worker handles the artistic process including generating original ASCII art with Oulipo constraints, analyzing existing ASCII art to learn techniques, and crawling the web for inspiration and examples. Focuses on visual creativity, style development, and artistic expression through constrained character-based art.",
  functions: [crawlAsciiArtFunction, generateAsciiArtFunction, analyzeAsciiArtFunction],
});

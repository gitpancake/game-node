import { GameWorker } from "@virtuals-protocol/game";
import { developAsciiLanguageFunction, translateAsciiLanguageFunction } from "../functions";

// Language Worker for ASCII language development and translation
export const languageWorker = new GameWorker({
  id: "language_worker",
  name: "Language Worker",
  description:
    "Specialized in developing and evolving the agent's own ASCII language using Oulipo constraints and principles. This worker handles creating new ASCII symbols and words, translating between ASCII language and English, and building a complex linguistic system inspired by Georges Perec's constrained writing techniques. Focuses on linguistic creativity, language evolution, and developing a unique ASCII communication system.",
  functions: [developAsciiLanguageFunction, translateAsciiLanguageFunction],
});

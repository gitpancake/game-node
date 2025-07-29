import { GameWorker } from "@virtuals-protocol/game";
import { researchOulipoFunction } from "../functions";

// Research Worker for Oulipo studies and theoretical development
export const researchWorker = new GameWorker({
  id: "research_worker",
  name: "Research Worker",
  description:
    "Specialized in conducting deep research on Georges Perec, the Oulipo movement, and constrained writing techniques. This worker focuses on theoretical development, academic exploration, and building foundational knowledge about literary constraints and their application to ASCII art. Handles research tasks, knowledge synthesis, and theoretical insights that inform creative decisions.",
  functions: [researchOulipoFunction],
});

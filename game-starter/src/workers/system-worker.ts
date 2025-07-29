import { GameWorker } from "@virtuals-protocol/game";
import { testFunction } from "../functions";

// System Worker for diagnostics and testing
export const systemWorker = new GameWorker({
  id: "system_worker",
  name: "System Worker",
  description:
    "Specialized in system diagnostics, testing, and troubleshooting. This worker handles basic system operations, API testing, and error diagnosis when other workers encounter issues. Provides fallback capabilities and system health monitoring to ensure the agent can continue operating even when specific functions fail.",
  functions: [testFunction],
});

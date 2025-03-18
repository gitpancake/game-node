import { GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

export const generate_imageFunction = new GameFunction({
    name: "generate_image",
    description: `Generates a meme (or any styled image) from a given text prompt. 
`,
    args: [
    {
        "id": "7416318e-5299-4fa4-be1b-90315aea23e4",
        "name": "prompt",
        "description": "The idea/concept/description of the image you want to generate.",
        "type": "string"
    }
] as const,
    executable: async (args, logger) => {
        try {
            // TODO: Implement function
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                "Operation completed successfully"
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                e instanceof Error ? e.message : "Operation failed"
            );
        }
    }
});

export const evaluate_imageFunction = new GameFunction({
    name: "evaluate_image",
    description: `Monitor a tweet and and evaluate quality of images of replies to that tweet`,
    args: [
    {
        "id": "42033cd1-0467-4caf-a634-39cca43f3bea",
        "name": "tweetId",
        "description": "the tweet id of the tweet thread to monitor",
        "type": "string"
    },
    {
        "id": "25383185-4491-4dd9-9a48-c393b72260a0",
        "name": "",
        "description": "",
        "type": ""
    }
] as const,
    executable: async (args, logger) => {
        try {
            // TODO: Implement function
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                "Operation completed successfully"
            );
        } catch (e) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                e instanceof Error ? e.message : "Operation failed"
            );
        }
    }
});

export const functions = {
    worker_2: [generate_imageFunction],
    twitter_main_location: [evaluate_imageFunction]
};
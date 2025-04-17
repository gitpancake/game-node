# Twitter Plugin for Virtuals Game

This plugin allows you to integrate Twitter functionalities into your Virtuals Game. With this plugin, you can post tweets, reply to tweets, like tweets, and more.

## Installation

To install the plugin, use npm or yarn:

```bash
npm install @virtuals-protocol/game-twitter-plugin
```

or

```bash
yarn add @virtuals-protocol/game-twitter-plugin
```

## Usage

### Importing the Plugin

First, import the `TwitterPlugin` class from the plugin:

```typescript
import TwitterPlugin from "@virtuals-protocol/game-twitter-plugin";
```

### Selecting a Twitter Client

Depending on your project needs, you can choose between:

| Client              | Cost        | Rate Limit                      |
|---------------------|-------------|---------------------------------|
| `GameTwitterClient` | **Free**    |  **35 requests / 5 minutes**   |
| `TwitterClient`     | Your usage  | Twitter Developer API quota     |

> **Recommendation:** Use `GameTwitterClient` for quick setup and cost-free access. Use `TwitterClient` only if you need higher request volumes.

Twitter’s official API access has become increasingly expensive and restrictive. To empower developers, **we've implemented a custom Game Twitter Gateway in direct partnership with X** that handles the X API on your behalf — no complex credential setup, no approvals, no dev portal setup needed.

> This is our way of supporting you as a builder in the Virtuals ecosystem.

1. **Game Twitter Client**: This client is designed specifically for integration with the Virtuals Game environment. It provides seamless interaction with the game and allows for enhanced functionalities tailored to game-specific requirements.

    ```typescript
    import { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";
    
    const gameTwitterClient = new GameTwitterClient({
      accessToken: "your_game_access_token",
    });
    ```

    To get the access token, run the following command:

    ```bash
    npx @virtuals-protocol/game-twitter-plugin auth -k <GAME_API_KEY>
    ```

    Here is an example run:

    ```bash
    npx @virtuals-protocol/game-twitter-plugin auth -k apt-xxxxxxxxxx
    ```

    You will see the following output:

    ```
    Waiting for authentication...
    
    Visit the following URL to authenticate:
    https://x.com/i/oauth2/authorize?response_type=code&client_id=VVdyZ0t4WFFRMjBlMzVaczZyMzU6MTpjaQ&redirect_uri=http%3A%2F%2Flocalhost%3A8714%2Fcallback&state=866c82c0-e3f6-444e-a2de-e58bcc95f08b&code_challenge=K47t-0Mcl8B99ufyqmwJYZFB56fiXiZf7f3euQ4H2_0&code_challenge_method=s256&scope=tweet.read%20tweet.write%20users.read%20offline.access
    ```

    After authenticating, you will receive the following message:

    ```
    Authenticated! Here's your access token:
    apx-613f64069424d88c6fbf2e75c0c80a34
    ```

2. **Native Twitter Client**: This client is a more general-purpose Twitter client that can be used outside of the game context. It provides standard Twitter functionalities and can be used in various applications.

    ```typescript
    import { TwitterClient } from "@virtuals-protocol/game-twitter-plugin";
    
    const nativeTwitterClient = new TwitterClient({
      apiKey: "your_api_key",
      apiSecretKey: "your_api_secret_key",
      accessToken: "your_access_token",
      accessTokenSecret: "your_access_token_secret",
    });
    ```

### Creating a Worker

Create a worker with the necessary Twitter credentials:

```typescript
const twitterPlugin = new TwitterPlugin({
  twitterClient: gameTwitterClient || nativeTwitterClient, // choose either 1 client
});
```

### Creating an Agent

Create an agent and add the worker to it:

```typescript
import { GameAgent } from "@virtuals-protocol/game";

const agent = new GameAgent("API_KEY", {
  name: "Twitter Bot",
  goal: "Increase engagement and grow follower count",
  description: "A bot that can post tweets, reply to tweets, and like tweets",
  workers: [twitterPlugin.getWorker()],
});
```

### Running the Agent

Initialize and run the agent:

```typescript
(async () => {
  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });
  }
})();
```

## Available Functions

By default, `TwitterPlugin` comes with five **bootstrapped** `GameFunction`s:

| Function Name            | Description |
|--------------------------|-------------|
| `searchTweetsFunction`   | Search for tweets based on a query |
| `replyTweetFunction`     | Reply to a tweet, with reasoning |
| `postTweetFunction`      | Post a new tweet, with reasoning |
| `likeTweetFunction`      | Like a tweet without commenting |
| `quoteTweetFunction`     | Quote a tweet with your own commentary |

These are ready-to-use and can be added to your agent’s `GameWorker` with zero config.

## Customization-Friendly by Design

While these 5 GameFunctions are provided out-of-the-box, they are **just examples**.

> ✅ Developers are free to write their own `GameFunction` logic using the underlying `GameTwitterClient`.

This means you can:
- Create more contextual or dynamic tweet logic
- Chain multiple social interactions together
- Integrate with reasoning engines, prompts, or data pipelines

Use the built-in functions as **references** for creating your own!

## Manual Usage with Twitter Clients

If you prefer direct control or are not using GameFunction-based execution, you can use the `GameTwitterClient` or `TwitterClient` directly:

```typescript
const gameTwitterClient = new GameTwitterClient({
    accessToken: process.env.GAME_TWITTER_ACCESS_TOKEN!,
});

const tweet = await gameTwitterClient.post("Hello world from my agent!");
console.log("Tweet ID:", tweet.data.id);
await gameTwitterClient.like(tweet.data.id);
await gameTwitterClient.reply(tweet.data.id, "This is a reply!");
await gameTwitterClient.quote(tweet.data.id, "Check this out 👇");
```

More usage examples can be found in [test_game_twitter_client.ts](./example/test_game_twitter_client.ts).

## Create Your Own GameFunctions
You can define your own `GameFunction` to extend or customize Twitter interactions based on your use case.

**Use Case: Hashtag Engagement Booster**
> "Search for tweets using a specific hashtag and auto-like the most recent one."

```typescript
import {
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";

export const likeRecentHashtagTweet = (client: GameTwitterClient) =>
    new GameFunction({
        name: "like_recent_hashtag_tweet",
        description: "Search a hashtag and like the most recent tweet using it",
        args: [{ name: "hashtag", description: "Hashtag to search for (e.g. #GameByVirtuals)" }] as const,
        executable: async (args, logger) => {
            if (!args.hashtag) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    "Hashtag is required."
                );
            }

            const searchResults = await client.search(args.hashtag);
            const tweets = searchResults?.data || [];

            if (tweets.length === 0) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `No tweets found for ${args.hashtag}`
                );
            }

            const firstTweet = tweets[0];
            logger(`Liking tweet: ${firstTweet.text} (ID: ${firstTweet.id})`);

            await client.like(firstTweet.id);

            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Liked tweet by @${firstTweet.author_id} using hashtag ${args.hashtag}`
            );
        },
    });
```

## Recap
- The TwitterPlugin provides a set of default GameFunctions to get started fast.
- These defaults are optional — you can fully customize or replace them.
- Use `GameTwitterClient` or `TwitterClient` directly if you need fine-grained control.
- Reference the source to write your own GameFunctions tailored to your agent’s purpose.

## License

This project is licensed under the MIT License.

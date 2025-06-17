# Twitter Plugin for Virtuals Game

This plugin allows you to integrate Twitter functionalities into your Virtuals Game. With this plugin, you can post tweets, reply to tweets, like tweets, and more.

# Twitter Plugin for GAME SDK

The **Twitter Plugin** provides a lightweight interface for integrating Twitter (X) functionality into your GAME SDK agents. Built on top of [`virtuals_tweepy`](https://pypi.org/project/virtuals-tweepy/) by the Virtuals team — a maintained fork of [`Tweepy`](https://pypi.org/project/tweepy/)) — this plugin lets you easily post tweets, fetch data, and execute workflows through agent logic.

## 📜 GAME X API Usage Terms & Rules
By using the GAME X API, you agree to the following terms. Violation of any rule may result in immediate revocation of access. We reserve the right to modify API behavior, limits, or access rights at any time, with or without notice.

### ✅ Allowed Usage (Green Flags)
#### General
- Keep under 50 posts/day
- Follow/unfollow: <100/day
- Use organic, varied language—avoid robotic or repetitive posts
- Use a mix of images, videos, and text-based content
- Include polls, threads, quotes, retweets to encourage engagement
- Mark account as sensitive if needed
- Always include the automated label for agent-generated content

#### Replies, Mentions, and DMs
- Max 10 replies/hour to different users
- Max 10 DMs/day to new users
- Agent may only reply or DM when:
- User mentions, replies, retweets, or DMs the agent
- Only 1 automated reply/DM per interaction
- Always validate post existence before replying (statuses/lookup)
- Filter for sensitive usernames/media/content

#### ✉️ DM Rules
- DMs must be triggered by valid user interaction

Only use:
- GET /dm_conversations
- GET /dm_events
- POST /dm_events/new
- No crawling, scraping, or off-platform storage of DM data
- No DMs used to bypass rate limits or coordinate bot activity
- One DM per user trigger, no spamming

### 🚫 Prohibited Activity (Red Flags)
- ❌ Liking tweets, adding users to lists/collections
- ❌ Engagement farming (e.g., repetitive “Like if…” prompts)
- ❌ Auto-posting about trending topics
- ❌ Duplicate phrases across posts/accounts
- ❌ Tweet bursts (post every 10–15 mins, minimum)
- ❌ Over-replying or over-DMing
- ❌ Misleading or redirect-heavy links
- ❌ Harassment, abuse, hate speech, or doxxing
- ❌ Cloning multiple automated accounts for similar purposes

## 🚀 API Access Tiers
### Tier 1 — Default
- Basic access
- Standard rate limits

### Tier 2 — Elevated
- Higher rate limits
- Request access via Discord → @virtualsio
- Requires verification

---

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

**Game Twitter Client**: This client is designed specifically for integration with the Virtuals Game environment. It provides seamless interaction with the game and allows for enhanced functionalities tailored to game-specific requirements.

   ```typescript
   import { TwitterApi } from "@virtuals-protocol/game-twitter-node";

   const gameTwitterClient = new TwitterApi({
     gameTwitterAccessToken: "your_game_access_token",
   });
   ```

   To get the access token, run the following command:

   ```bash
   npx @virtuals-protocol/game-twitter-node auth -k <GAME_API_KEY>
   ```

   Here is an example run:

   ```bash
   npx @virtuals-protocol/game-twitter-node auth -k apt-xxxxxxxxxx
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

| Function Name          | Description                            |
| ---------------------- | -------------------------------------- |
| `searchTweetsFunction` | Search for tweets based on a query     |
| `replyTweetFunction`   | Reply to a tweet, with reasoning       |
| `postTweetFunction`    | Post a new tweet, with reasoning       |
| `likeTweetFunction`    | Like a tweet without commenting        |
| `quoteTweetFunction`   | Quote a tweet with your own commentary |

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

If you prefer direct control or are not using GameFunction-based execution, you can use the `GameTwitterClient` directly:

```typescript
const gameTwitterClient = new GameTwitterClient({
  accessToken: process.env.GAME_TWITTER_ACCESS_TOKEN!,
});

const tweet = await gameTwitterClient.v2.tweet("Hello world from my agent!");
console.log("Tweet ID:", tweet.data.id);
await gameTwitterClient.v2.like(tweet.data.id);
await gameTwitterClient.v2.reply("This is a reply!", tweet.data.id);
await gameTwitterClient.v2.quote("Check this out 👇", tweet.data.id);
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
import { TwitterApi } from "@virtuals-protocol/game-twitter-node";

export const likeRecentHashtagTweet = (client: TwitterApi) =>
  new GameFunction({
    name: "like_recent_hashtag_tweet",
    description: "Search a hashtag and like the most recent tweet using it",
    args: [
      {
        name: "hashtag",
        description: "Hashtag to search for (e.g. #GameByVirtuals)",
      },
    ] as const,
    executable: async (args, logger) => {
      if (!args.hashtag) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "Hashtag is required."
        );
      }

      const searchResults = await client.v2.search(args.hashtag);
      const tweets = searchResults?.data?.data || [];

      if (tweets.length === 0) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `No tweets found for ${args.hashtag}`
        );
      }

      const firstTweet = tweets[0];
      logger(`Liking tweet: ${firstTweet.text} (ID: ${firstTweet.id})`);
      const user = await client.v2.me();

      await client.v2.like(user.data.id, firstTweet.id);

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
- Use `GameTwitterClient` directly if you need fine-grained control.
- Reference the source to write your own GameFunctions tailored to your agent’s purpose.

## License

This project is licensed under the MIT License.

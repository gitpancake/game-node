import { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";
import * as fs from 'fs';
import * as path from 'path';
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const GAME_TWITTER_ACCESS_TOKEN = process.env.GAME_TWITTER_ACCESS_TOKEN!;
const gameTwitterClient = new GameTwitterClient({
    accessToken: GAME_TWITTER_ACCESS_TOKEN,
});

console.log("Using Twitter Client with access token:", GAME_TWITTER_ACCESS_TOKEN);

async function runTwitterActions() {
    try {
        // Fetch current user info
        const user = await gameTwitterClient.me();
        console.log(`🙋 Logged in as: @${user.data.username} (${user.data.name})`);

        // Fetch latest mentions
        const mentionResults = await gameTwitterClient.mentions();
        const mentionTweets = mentionResults?.data || [];
        console.log(`🔔 You have ${mentionTweets.length} recent mentions:`);

        mentionTweets.forEach((tweet, idx) => {
            console.log(`  ${idx + 1}. https://x.com/i/web/status/${tweet.id}`);
        });

        // Get followers
        const followersResult = await gameTwitterClient.followers();
        const followers = followersResult?.data || [];
        console.log(`👥 You have ${followers.length} followers`);

        followers.forEach((user, idx) => {
            console.log(`  ${idx + 1}. @${user.username} (${user.name})`);
        });

        // Get following list
        const followingResult = await gameTwitterClient.following();
        const following = followingResult?.data || [];
        console.log(`➡️ You are following ${following.length} users`);

        following.forEach((user, idx) => {
            console.log(`  ${idx + 1}. @${user.username} (${user.name})`);
        });

        // Post a new tweet
        const postResult = await gameTwitterClient.post("Hello Web3 🧵 #GameByVirtuals");
        console.log("✅ Tweet posted successfully!");
        console.log(`🔗 View Tweet: https://x.com/i/web/status/${postResult.data.id}`);

        // Like the tweet
        const likeResult = await gameTwitterClient.like(postResult.data.id);
        console.log("❤️ Tweet liked!", likeResult);

        // Reply to the first posted tweet
        const replyText = "Replying to my own tweet 😎";
        const replyResult = await gameTwitterClient.reply(postResult.data.id, replyText);
        console.log(`💬 Replied successfully: https://x.com/i/web/status/${replyResult.data.id}`);

        // Quote the tweet
        const quoteText = "Excited to be testing the new Game Twitter Plugin!";
        const quoteResult = await gameTwitterClient.quote(postResult.data.id, quoteText);
        console.log("🔁 Tweet quoted successfully!");
        console.log(`🔗 View Quoted Tweet: https://x.com/i/web/status/${quoteResult.data.id}`);

        // Search tweets
        const searchQuery = "#GameByVirtuals";
        const searchResults = await gameTwitterClient.search(searchQuery);

        const tweets = searchResults?.data || [];
        console.log(`🔍 Found ${tweets.length} tweets for "${searchQuery}"`);

        tweets.forEach((tweet, idx) => {
            console.log(`  ${idx + 1}. https://x.com/i/web/status/${tweet.id}`);
        });

        if (searchResults?.meta?.next_token) {
            console.log(`📌 More results available. Use next_token: ${searchResults.meta.next_token}`);
        }

        // Upload and post with local media
        const filePath = path.resolve(__dirname, 'virtuals-logo.png');
        const buffer = fs.readFileSync(filePath);
        const localBlob = new Blob([buffer], { type: 'image/png' });
        const localMediaId = await gameTwitterClient.uploadMedia(localBlob);
        const localMediaTweet = await gameTwitterClient.post("Check this out! Uploaded with local media!", [localMediaId]);
        console.log(`🖼️ Local Media Tweet: https://x.com/i/web/status/${localMediaTweet.data.id}`);

        // Upload and post with URL media
        const imageUrl = "https://assets.coingecko.com/coins/images/51063/large/Gaming_Agent_1fe70d54ba.jpg";
        const downStream = await axios({
            method: 'GET',
            responseType: 'arraybuffer',
            url: imageUrl,
        })
        const urlBlob = new Blob([downStream.data], { type: 'image/png' });
        const urlMediaId = await gameTwitterClient.uploadMedia(urlBlob);
        const urlMediaTweet = await gameTwitterClient.post("Check this out! Uploaded with url media!", [urlMediaId]);
        console.log(`🖼️ Url Media Tweet: https://x.com/i/web/status/${urlMediaTweet.data.id}`);

    } catch (err: any) {
        console.error("❌ Error during Twitter action:", err.message);
    }
}

runTwitterActions();

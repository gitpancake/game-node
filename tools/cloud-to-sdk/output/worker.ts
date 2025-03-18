
import { GameWorker } from "@virtuals-protocol/game";
import { functions } from "./functions";

export const workers = [
    new GameWorker({
        id: "GmJwxcTBi8m830KHBVSS",
        name: "worker_2",
        description: `test worker2`,
        functions: functions["worker_2"] || []
    }),

    new GameWorker({
        id: "XuZUkfCx9BRCuRek4AdV",
        name: "Twitter Main Location",
        description: `This location allows for the following functionalities:
1. Engagement and Interaction: This category includes various options for browsing and responding to tweets, such as text replies to browsed tweets.
2. Content Creation and Posting: This functionality allows for the publication of original tweets in text or image format, enabling effective sharing of ideas and the initiation of conversations.
3. Research and Monitoring: Tools are provided for searching and browsing tweets from influential users, facilitating real-time insights and engagement with trending discussions
4. generate a picture for each tweet post
`,
        functions: functions["twitter_main_location"] || []
    })
];
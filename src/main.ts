import { InfraiClient } from "./infrai_client.ts";
import { runMediaJob } from "./media_jobs.ts";

const input = { assetId: "asset-demo-01", creatorId: "creator-demo", source: "https://cdn.example.test/episode.mp4" };
const result = await runMediaJob(input, async () => { throw new Error("transcoder exited with status 1"); }, new InfraiClient());
console.log(JSON.stringify(result));

import assert from "node:assert/strict";
import { runMediaJob } from "../src/media_jobs.ts";

const calls: unknown[] = [];
const client = { capture: async (...args: unknown[]) => { calls.push(args); return {}; } } as any;
const result = await runMediaJob({ assetId: "a-1", creatorId: "c-1", source: "https://cdn.example.test/a.mp4" }, async () => { throw new Error("decode failed"); }, client);
assert.deepEqual(result, { status: "failed", assetId: "a-1", creatorId: "c-1", reason: "decode failed" });
assert.equal(calls.length, 1);
console.log("media job failure decision: ok");

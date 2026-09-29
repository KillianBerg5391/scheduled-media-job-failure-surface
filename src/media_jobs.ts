import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const jobRequest = z.object({ assetId: z.string().min(1), creatorId: z.string().min(1), source: z.string().url() });
export type JobRequest = z.infer<typeof jobRequest>;
export type JobResult = { status: "delivered" | "failed"; assetId: string; creatorId: string; reason?: string };

export async function runMediaJob(input: unknown, processAsset: (source: string) => Promise<void>, client: InfraiClient): Promise<JobResult> {
  const request = jobRequest.parse(input);
  try {
    await processAsset(request.source);
    return { status: "delivered", assetId: request.assetId, creatorId: request.creatorId };
  } catch (error) {
    const exception = error instanceof Error ? error : new Error(String(error));
    await client.capture({ name: exception.name, message: exception.message, stack: exception.stack }, { assetId: request.assetId, creatorId: request.creatorId });
    return { status: "failed", assetId: request.assetId, creatorId: request.creatorId, reason: exception.message };
  }
}

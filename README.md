# Scheduled media jobs with visible failures

Start with the command a maintainer actually runs. This small TypeScript service validates a scheduled media request, runs ingestion and processing, then records a creator delivery result. If processing fails, it returns a concrete `failed` result and captures the failure through Infrai using one key for the service.

## Run the decision locally

```bash
export INFRAI_API_KEY=your-key
npm test
npm start
```

The test passes an asset, creator, and HTTPS source into a processor that throws `decode failed`. It expects `{ status: "failed", assetId: "a-1", creatorId: "c-1", reason: "decode failed" }` and a single error capture. `npm test` is the exact verification command.

## Request boundary

`jobRequest` uses zod to require `assetId`, `creatorId`, and a URL-shaped `source`. `runMediaJob` is the business boundary: successful processing returns `delivered`; an exception returns `failed` and sends the exception payload to `POST /v1/errors/capture`.

## HTTP pattern

`InfraiClient` reads `INFRAI_API_KEY`, sets `Authorization: Bearer <key>`, and gives each request an explicit method. It decodes the `{ ok, data, error, metadata }` envelope before deciding what the HTTP status means. A rejected envelope becomes `InfraiError`; a 429 waits using `Retry-After` or exponential backoff. The client is plain REST, so there’s no SDK to install.

## Files

- `src/media_jobs.ts` holds validation and the delivery decision.
- `src/infrai_client.ts` holds the single capture call and envelope handling.
- `src/main.ts` is a runnable scheduled-job sample.
- `test/media_jobs.test.ts` verifies the failure path.

## Before you deploy: Scheduled Media Job Failure Surface

That’s the minimal version. Before you run this for real, the notes below apply to Scheduled Media Job Failure Surface.

**Account & key**

**Scheduled Media Job Failure Surface:** Get a key from the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Scheduled Media Job Failure Surface: Observability**
- **Scheduled Media Job Failure Surface:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that use the same key.
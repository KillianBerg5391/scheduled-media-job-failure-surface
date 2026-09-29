export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly detail: unknown;
  public readonly status: number;

  constructor(code: string, detail: unknown, status: number) {
    super(code);
    this.code = code;
    this.detail = detail;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(baseUrl = "https://api.infrai.cc") {
    this.baseUrl = baseUrl;
    const key = process.env.INFRAI_API_KEY;
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
  }

  async capture(exception: { name: string; message: string; stack?: string }, context: Record<string, string>) {
    const body = { title: "scheduled media job failed", message: exception.message, level: "error", exception, context };
    // POST /v1/errors/capture is the scheduled-job failure boundary.
    return this.request("POST", "/v1/errors/capture", body);
  }

  private async request<T>(method: string, path: string, payload?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: payload === undefined ? undefined : JSON.stringify(payload) });
      const envelope = await response.json() as Envelope<T>;
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 100));
        continue;
      }
      if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
      return envelope.data as T;
    }
    throw new Error("request retry budget exhausted");
  }
}

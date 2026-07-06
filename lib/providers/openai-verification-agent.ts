import type {
  VerificationAgent,
  VerificationRequest,
  VerificationResult,
  VerificationVerdict
} from "@/lib/providers/verification-agent";

export class OpenAIVerificationError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "OpenAIVerificationError";
    this.status = status;
  }
}

const MODEL = "gpt-4o-mini";
const VERDICTS: VerificationVerdict[] = ["approve", "reject", "needs_review"];

const SYSTEM_PROMPT = `You judge whether a website contains real, structured, extractable data worth scraping in bulk.
You are domain-agnostic: never assume a particular subject matter. Judge purely on whether the crawled text shows
repeated, structured records (any subject) versus marketing copy, navigation, or a single one-off article.
Respond with strict JSON only, matching this shape:
{
  "verdict": "approve" | "reject" | "needs_review",
  "confidence": number between 0 and 1,
  "reason": "one or two plain-language sentences",
  "extractable_fields": ["short domain-neutral field names you can see repeated, e.g. name, date, price, location"],
  "sample_preview": { "example record as a small JSON object or array, using the field names above" }
}
Use "needs_review" when the page text is ambiguous or too thin to judge confidently.`;

function coerceResult(payload: unknown, evidenceUrls: string[]): VerificationResult {
  const record = (payload ?? {}) as Record<string, unknown>;
  const verdict = VERDICTS.includes(record.verdict as VerificationVerdict)
    ? (record.verdict as VerificationVerdict)
    : "needs_review";
  const confidence =
    typeof record.confidence === "number" && Number.isFinite(record.confidence)
      ? Math.min(1, Math.max(0, record.confidence))
      : 0;
  const reason =
    typeof record.reason === "string" && record.reason.trim()
      ? record.reason.trim()
      : "The agent did not return a reason.";
  const extractableFields = Array.isArray(record.extractable_fields)
    ? record.extractable_fields.filter((field): field is string => typeof field === "string")
    : [];

  return {
    verdict,
    confidence,
    reason,
    extractableFields,
    samplePreview: record.sample_preview ?? null,
    // Evidence is always the pages we actually crawled, never model-reported URLs.
    evidenceUrls
  };
}

export class OpenAIVerificationAgent implements VerificationAgent {
  readonly name = "OpenAI";

  async judge(request: VerificationRequest): Promise<VerificationResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new OpenAIVerificationError("OPENAI_API_KEY is required for verification.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Site: ${request.siteUrl}\nCrawled pages: ${request.evidenceUrls.join(", ")}\n\nCrawled text (truncated):\n${request.pageText}`
          }
        ]
      })
    });

    if (!response.ok) {
      let message = `OpenAI request failed with status ${response.status}.`;

      try {
        const errorPayload = (await response.json()) as { error?: { message?: string } };
        message = errorPayload.error?.message ?? message;
      } catch {
        // Preserve the status-based message when the response is not JSON.
      }

      throw new OpenAIVerificationError(message, response.status);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new OpenAIVerificationError("OpenAI returned an empty response.");
    }

    try {
      const parsed = JSON.parse(content);
      return coerceResult(parsed, request.evidenceUrls);
    } catch {
      throw new OpenAIVerificationError("OpenAI returned invalid JSON.");
    }
  }
}
